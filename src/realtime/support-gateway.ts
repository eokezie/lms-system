import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import type { JwtPayload } from "@/middleware/auth.middleware";

let io: SocketIOServer | null = null;

const CONVERSATION_ROOM = (conversationId: string) =>
  `support:conversation:${conversationId}`;
const AGENT_INBOX_ROOM = "support:agents";

export function initSupportGateway(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin:
        env.NODE_ENV === "production"
          ? process.env.ALLOWED_ORIGINS?.split(",") ?? false
          : true,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        (socket.handshake.headers.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.split(" ")[1]
          : undefined);
      if (!token) return next(new Error("Missing auth token"));
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      (socket.data as { user: JwtPayload }).user = payload;
      next();
    } catch (err) {
      logger.warn({ err }, "[support-gateway] socket auth failed");
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket.data as { user: JwtPayload }).user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    if (user.role === "admin" || user.role === "super_admin") {
      socket.join(AGENT_INBOX_ROOM);
    }

    socket.on(
      "support:join-conversation",
      ({ conversationId }: { conversationId: string }) => {
        if (typeof conversationId !== "string" || !conversationId) return;
        socket.join(CONVERSATION_ROOM(conversationId));
      },
    );

    socket.on(
      "support:leave-conversation",
      ({ conversationId }: { conversationId: string }) => {
        if (typeof conversationId !== "string" || !conversationId) return;
        socket.leave(CONVERSATION_ROOM(conversationId));
      },
    );

    socket.on(
      "support:typing",
      ({
        conversationId,
        isTyping,
      }: {
        conversationId: string;
        isTyping: boolean;
      }) => {
        if (typeof conversationId !== "string" || !conversationId) return;
        socket
          .to(CONVERSATION_ROOM(conversationId))
          .emit("support:typing", {
            conversationId,
            userId: user.userId,
            role: user.role,
            isTyping: !!isTyping,
          });
      },
    );
  });

  logger.info("[support-gateway] Socket.IO ready on /socket.io");
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToConversation(
  conversationId: string,
  event: string,
  payload: unknown,
) {
  io?.to(CONVERSATION_ROOM(conversationId)).emit(event, payload);
  // also broadcast to agents inbox so the list refreshes regardless of who's viewing
  io?.to(AGENT_INBOX_ROOM).emit(event, payload);
}

export function emitToAgents(event: string, payload: unknown) {
  io?.to(AGENT_INBOX_ROOM).emit(event, payload);
}

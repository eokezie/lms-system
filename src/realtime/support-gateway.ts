import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import type { JwtPayload } from "@/middleware/auth.middleware";

const GLOBAL_IO_KEY = "__spl_support_io";
const GLOBAL_PRESENCE_KEY = "__spl_presence";

function getIO(): SocketIOServer | null {
  return (globalThis as any)[GLOBAL_IO_KEY] ?? null;
}

function setIO(instance: SocketIOServer) {
  (globalThis as any)[GLOBAL_IO_KEY] = instance;
}

function getPresenceMap(): Map<string, Set<string>> {
  if (!(globalThis as any)[GLOBAL_PRESENCE_KEY]) {
    (globalThis as any)[GLOBAL_PRESENCE_KEY] = new Map<string, Set<string>>();
  }
  return (globalThis as any)[GLOBAL_PRESENCE_KEY];
}

const CONVERSATION_ROOM = (conversationId: string) =>
  `support:conversation:${conversationId}`;
const AGENT_INBOX_ROOM = "support:agents";

function addPresence(userId: string, socketId: string) {
  const map = getPresenceMap();
  if (!map.has(userId)) map.set(userId, new Set());
  map.get(userId)!.add(socketId);
}

function removePresence(userId: string, socketId: string) {
  const map = getPresenceMap();
  const sockets = map.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) map.delete(userId);
}

export function isUserOnline(userId: string): boolean {
  return getPresenceMap().has(userId);
}

export function getOnlineUserIds(): string[] {
  return Array.from(getPresenceMap().keys());
}

export function initSupportGateway(httpServer: HttpServer): SocketIOServer {
  if (getIO()) return getIO()!;

  const io = new SocketIOServer(httpServer, {
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

    addPresence(user.userId, socket.id);

    if (user.role === "admin" || user.role === "super_admin") {
      socket.join(AGENT_INBOX_ROOM);
    }

    // Broadcast presence to agents so they see online status
    io.to(AGENT_INBOX_ROOM).emit("support:presence", {
      userId: user.userId,
      isOnline: true,
    });

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

    socket.on("disconnect", () => {
      removePresence(user.userId, socket.id);
      if (!isUserOnline(user.userId)) {
        io.to(AGENT_INBOX_ROOM).emit("support:presence", {
          userId: user.userId,
          isOnline: false,
        });
      }
    });
  });

  setIO(io);
  logger.info(
    "[support-gateway] Socket.IO ready on /socket.io (stored on globalThis)",
  );
  return io;
}

export { getIO };

export function emitToConversation(
  conversationId: string,
  event: string,
  payload: unknown,
) {
  const ioInstance = getIO();
  if (!ioInstance) {
    logger.warn(
      "[support-gateway] emitToConversation called but io is null — gateway not initialized",
    );
    return;
  }
  ioInstance.to(CONVERSATION_ROOM(conversationId)).emit(event, payload);
  ioInstance.to(AGENT_INBOX_ROOM).emit(event, payload);
}

export function emitToAgents(event: string, payload: unknown) {
  const ioInstance = getIO();
  ioInstance?.to(AGENT_INBOX_ROOM).emit(event, payload);
}

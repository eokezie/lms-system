import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";

import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { errorMiddleware } from "@/middleware/error.middleware";
import { stripeWebhookHandler } from "@/modules/payments/payment.controller";
import authRoutes from "@/modules/auth/auth.routes";
import userRoutes from "@/modules/users/user.routes";
import passport from "@/modules/auth/passport.strategies";
import categoryRoutes from "@/modules/category/category.routes";
import courseRoutes from "@/modules/courses/course.routes";
import lessonRoutes from "@/modules/lessons/lesson.routes";
import ratingRoutes from "@/modules/ratings/rating.routes";
import muxRoutes from "@/modules/lessons/mux.routes";
import paymentRoutes from "@/modules/payments/payment.routes";
import enrollmentRoutes from "@/modules/enrollments/enrollment.routes";
import discountRoutes from "@/modules/discounts/discount.routes";
import progressRoutes from "@/modules/progress/progress.routes";
import careerPathRoutes from "@/modules/career-paths/career-path.routes";
import adminDashboardRoutes from "@/modules/admin-dashboard/admin-dashboard.routes";
import lessonFlagRoutes from "@/modules/lesson-flags/lesson-flag.routes";
import studentDashboardRoutes from "@/modules/student-dashboard/student-dashboard.routes";
import adminSettingsRoutes from "@/modules/admin-settings/admin-settings.routes";
import courseAdvisoryRoutes from "@/modules/course-advisory/course-advisory.routes";
import topicsRoutes from "@/modules/topics/topics.routes";
import postsRoutes from "@/modules/posts/posts.routes";
import forumRoutes from "@/modules/forum/forum.routes";
import bookmarkRoutes from "@/modules/bookmarks/bookmark.routes";
import notificationRoutes from "@/modules/notifications/notification.routes";
import supportConversationRoutes from "@/modules/support-conversations/support-conversation.routes";
import feedbackRoutes from "@/modules/feedback/feedback.routes";

const app = express();

// --- Security ---
app.use(helmet());
app.use(
  cors({
    origin:
      env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",")
        : "*",
    credentials: true,
  }),
);

// --- Rate limiting ---
const globalLimiter = rateLimit({
	windowMs: env.RATE_LIMIT_WINDOW_MS,
	max: env.RATE_LIMIT_MAX,
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		const path = req.path || req.url || "";
		return (
			path.startsWith("/api/v1/support/") ||
			path.startsWith("/api/v1/notifications") ||
			path.startsWith("/socket.io")
		);
	},
	message: {
		success: false,
		message: "Too many requests, please try again later.",
	},
});
app.use(globalLimiter);

app.use("/api/v1/mux", muxRoutes); // Placed before Express body parser for Mux webhook signature

// Stripe webhook needs raw body for signature verification (before express.json)
const stripeWebhookRouter = express.Router();
const rawJson = (express as any).raw({ type: "application/json" });
stripeWebhookRouter.post("/webhook", rawJson, stripeWebhookHandler);
app.use("/api/v1/payments", stripeWebhookRouter);

// --- Body parsing ---
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Passport (for OAuth) ---
app.use(passport.initialize() as any);

// --- HTTP request logging via pino-http ---
// Outputs structured JSON in production, pretty-printed in dev
// Each request automatically gets a unique reqId for tracing
app.use(
  pinoHttp({
    logger,
    // Don't log health checks — too noisy
    autoLogging: {
      ignore: (req) => req.url === "/health",
    },
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} — ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} — ${res.statusCode} — ${err.message}`,
  }),
);

// --- Health check ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/lessons", lessonRoutes);
app.use("/api/v1/ratings", ratingRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/discounts", discountRoutes);
app.use("/api/v1/enrollments", enrollmentRoutes);
app.use("/api/v1/career-paths", careerPathRoutes);
app.use("/api/v1/admin", adminSettingsRoutes);
app.use("/api/v1/admin/dashboard", adminDashboardRoutes);
app.use("/api/v1/lesson-flags", lessonFlagRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/student/dashboard", studentDashboardRoutes);
app.use("/api/v1/course-advisory", courseAdvisoryRoutes);
app.use("/api/v1/topics", topicsRoutes);
app.use("/api/v1/posts", postsRoutes);
app.use("/api/v1/forum", forumRoutes);
app.use("/api/v1/bookmarks", bookmarkRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/support/conversations", supportConversationRoutes);
app.use("/api/v1/feedback", feedbackRoutes);

// --- 404 ---
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// --- Global error handler (must be last) ---
app.use(errorMiddleware);

export default app;

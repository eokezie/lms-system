import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
  verifyEmailHandler,
  forgotPasswordHandler,
  verifyVerificationCodeHandler,
  changePasswordHandler,
} from "./auth.controller";
import { validate } from "@/middleware/validate";
import { authenticate } from "@/middleware/auth.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  otpSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  changePasswordSchema,
} from "./auth.validation";
import { env } from "@/config/env";
import passport from "./passport.strategies";
import { createOAuthCallback } from "./oauth.callback";

const router = Router();

router.post("/register", validate(registerSchema), registerHandler);
router.post("/login", validate(loginSchema), loginHandler);
router.post("/refresh", validate(refreshTokenSchema), refreshHandler);
router.post(
  "/logout",
  authenticate,
  validate(refreshTokenSchema),
  logoutHandler,
);
router.post("/logout-all", authenticate, logoutAllHandler);
router.post(
  "/verify-email",
  authenticate,
  validate(otpSchema),
  verifyEmailHandler,
);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPasswordHandler,
);
router.post(
  "/verify-code",
  validate(verifyCodeSchema),
  verifyVerificationCodeHandler,
);
router.post(
  "/change-password",
  validate(changePasswordSchema),
  changePasswordHandler,
);

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );
  router.get("/google/callback", createOAuthCallback("google"));
}

if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
  router.get(
    "/facebook",
    passport.authenticate("facebook", { scope: ["email"] }),
  );
  router.get("/facebook/callback", createOAuthCallback("facebook"));
}

export default router;

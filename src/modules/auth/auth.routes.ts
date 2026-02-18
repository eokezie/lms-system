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

export default router;

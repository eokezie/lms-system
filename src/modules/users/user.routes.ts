import { Router } from "express";
import {
	getMe,
	updateMe,
	changePassword,
	createUserHandler,
} from "./user.controller";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
	updateProfileSchema,
	changePasswordSchema,
	registerSchema,
} from "./user.validation";
import { USER_ROLES } from "./user.model";

const router = Router();

router.use(authenticate);

router.post(
	"/",
	authorize(USER_ROLES[2]),
	validate(registerSchema),
	createUserHandler,
);
router.get("/me", getMe);
router.patch("/me", validate(updateProfileSchema), updateMe);
router.patch("/me/password", validate(changePasswordSchema), changePassword);

export default router;

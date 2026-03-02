import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "../users/user.model";
import { createCourseHandler } from "./course.controller";
import { createCourseSchema } from "./course.validation";

const router = Router();

router.use(authenticate);

router.post(
	"/",
	authorize(USER_ROLES[1], USER_ROLES[2]),
	validate(createCourseSchema),
	createCourseHandler,
);

export default router;

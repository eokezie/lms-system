import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "../users/user.model";
import { createCategorySchema } from "./category.validation";
import {
	createCategoryHandler,
	getCategoriesAndCourseCountHandler,
} from "./category.controller";

const router = Router();

router.use(authenticate);

router.post(
	"/",
	authorize(USER_ROLES[2]),
	validate(createCategorySchema),
	createCategoryHandler,
);
router.get("/", getCategoriesAndCourseCountHandler);

export default router;

import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "../users/user.model";
import {
	createCourseHandler,
	getExploreCoursesHandler,
	getRelatedCoursesHandler,
	getSingleCourseHandler,
	updateCoursePriceHandler,
} from "./course.controller";
import {
	createCourseSchema,
	getExploreCoursesQuerySchema,
	courseIdParamSchema,
	courseIdOrSlugParamSchema,
	getRelatedCoursesQuerySchema,
	updateCoursePriceSchema,
} from "./course.validation";
import ratingRoutes from "../ratings/rating.routes";
import { processFiles } from "@/middleware/multer.middleware";

const router = Router();

router.use(authenticate);

router.get(
	"/",
	authorize(USER_ROLES[0]),
	validate(getExploreCoursesQuerySchema, "query"),
	getExploreCoursesHandler,
);
router.get(
	"/:id/related",
	validate(courseIdOrSlugParamSchema, "params"),
	validate(getRelatedCoursesQuerySchema, "query"),
	getRelatedCoursesHandler,
);
router.get(
	"/:id",
	validate(courseIdOrSlugParamSchema, "params"),
	getSingleCourseHandler,
);
router.use("/:id/ratings", ratingRoutes);
router.post(
	"/",
	authorize(USER_ROLES[1], USER_ROLES[2]),
	processFiles,
	validate(createCourseSchema),
	createCourseHandler,
);
router.patch(
	"/:id/price",
	authorize(USER_ROLES[2], USER_ROLES[3]),
	validate(courseIdParamSchema, "params"),
	validate(updateCoursePriceSchema),
	updateCoursePriceHandler,
);

export default router;

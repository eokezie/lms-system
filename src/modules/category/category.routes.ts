import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "../users/user.model";
import {
  createCategorySchema,
  getCategoriesQuerySchema,
} from "./category.validation";
import {
  createCategoryHandler,
  getCategoriesAndCourseCountHandler,
} from "./category.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(createCategorySchema),
  createCategoryHandler,
);
router.get(
  "/",
  validate(getCategoriesQuerySchema, "query"),
  getCategoriesAndCourseCountHandler,
);

export default router;

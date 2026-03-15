import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  createDiscountHandler,
  listDiscountsHandler,
  getDiscountByIdHandler,
  updateDiscountHandler,
  deleteDiscountHandler,
  getActiveDiscountForCourseHandler,
} from "./discount.controller";
import {
  createDiscountSchema,
  updateDiscountSchema,
  discountIdParamSchema,
  listDiscountsQuerySchema,
  forCourseParamSchema,
} from "./discount.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/for-course/:courseId",
  validate(forCourseParamSchema, "params"),
  getActiveDiscountForCourseHandler,
);

router.use(authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]));

router.get(
  "/",
  validate(listDiscountsQuerySchema, "query"),
  listDiscountsHandler,
);
router.get(
  "/:id",
  validate(discountIdParamSchema, "params"),
  getDiscountByIdHandler,
);
router.post("/", validate(createDiscountSchema), createDiscountHandler);
router.patch(
  "/:id",
  validate(discountIdParamSchema, "params"),
  validate(updateDiscountSchema),
  updateDiscountHandler,
);
router.delete(
  "/:id",
  validate(discountIdParamSchema, "params"),
  deleteDiscountHandler,
);

export default router;

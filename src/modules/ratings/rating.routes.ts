import { Router } from "express";
import { validate } from "@/middleware/validate";
import {
  createRatingHandler,
  getRatingsForCourseHandler,
  updateRatingHandler,
  deleteRatingHandler,
} from "./rating.controller";
import {
  createRatingSchema,
  updateRatingSchema,
  courseIdOrSlugParamSchema,
  ratingIdParamSchema,
  getRatingsQuerySchema,
} from "./rating.validation";

const router = Router({ mergeParams: true });

router.get(
  "/",
  validate(courseIdOrSlugParamSchema, "params"),
  validate(getRatingsQuerySchema, "query"),
  getRatingsForCourseHandler,
);
router.post(
  "/",
  validate(courseIdOrSlugParamSchema, "params"),
  validate(createRatingSchema),
  createRatingHandler,
);
router.patch(
  "/:ratingId",
  validate(courseIdOrSlugParamSchema, "params"),
  validate(ratingIdParamSchema, "params"),
  validate(updateRatingSchema),
  updateRatingHandler,
);
router.delete(
  "/:ratingId",
  validate(courseIdOrSlugParamSchema, "params"),
  validate(ratingIdParamSchema, "params"),
  deleteRatingHandler,
);

export default router;

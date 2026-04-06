import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "../users/user.model";
import {
  createTopicsSchema,
  topicIdOrSlugParamSchema,
  updateTopicsSchema,
} from "./topics.validation";
import {
  createTopicHandler,
  deleteTopicHandler,
  updateTopicHandler,
} from "./topics.controller";
import { getTopicsAndCountPerPost } from "./topics.service";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(createTopicsSchema),
  createTopicHandler,
);
router.get("/", getTopicsAndCountPerPost);
router.put(
  "/:topicId",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(topicIdOrSlugParamSchema, "params"),
  validate(updateTopicsSchema),
  updateTopicHandler,
);
router.delete(
  "/:topicId",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(topicIdOrSlugParamSchema, "params"),
  deleteTopicHandler,
);

export default router;

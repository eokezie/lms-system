import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  createPostSchema,
  getPaginatedPostsQuerySchema,
} from "./posts.validation";
import {
  createPostHandler,
  getPaginatedPostsHandler,
} from "./posts.controller";

const router = Router();

router.use(authenticate);

router.post("/", validate(createPostSchema), createPostHandler);
router.get(
  "/",
  validate(getPaginatedPostsQuerySchema, "query"),
  getPaginatedPostsHandler,
);

export default router;

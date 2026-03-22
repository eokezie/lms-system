import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { getDashboardHandler } from "./student-dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/", getDashboardHandler);

export default router;

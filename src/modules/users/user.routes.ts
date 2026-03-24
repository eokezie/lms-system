import { Router } from "express";
import {
  getMe,
  updateMe,
  changePassword,
  createUserHandler,
  userOnboardingHandler,
  submitInstructorVerificationHandler,
  getInstructorReviewQueueHandler,
  getInstructorVerificationDetailsHandler,
  reviewInstructorVerificationHandler,
  getMyInstructorVerificationHandler,
  getInstructorManagementStatsHandler,
  getApprovedInstructorsListHandler,
  updateApprovedInstructorAccountStatusHandler,
  getStudentManagementStatsHandler,
  getStudentsManagementListHandler,
  updateStudentAccountStatusHandler,
} from "./user.controller";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  updateProfileSchema,
  changePasswordSchema,
  registerSchema,
  submitInstructorVerificationSchema,
  instructorReviewQueueQuerySchema,
  instructorDecisionSchema,
  approvedInstructorsQuerySchema,
  updateInstructorAccountStatusSchema,
  studentsManagementQuerySchema,
  updateStudentAccountStatusSchema,
} from "./user.validation";
import { USER_ROLES } from "./user.model";
import { processInstructorVerificationFiles } from "@/middleware/instructor-verification-upload.middleware";

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
router.patch("/onboarding", authorize(USER_ROLES[0]), userOnboardingHandler);
router.patch("/me/password", validate(changePasswordSchema), changePassword);
router.post(
  "/instructor/verification",
  authorize(USER_ROLES[1]),
  processInstructorVerificationFiles,
  validate(submitInstructorVerificationSchema),
  submitInstructorVerificationHandler,
);
router.get(
  "/instructor/verification",
  authorize(USER_ROLES[1]),
  getMyInstructorVerificationHandler,
);
router.get(
  "/instructor/review-queue",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(instructorReviewQueueQuerySchema, "query"),
  getInstructorReviewQueueHandler,
);
router.get(
  "/instructor/review-queue/:instructorId",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  getInstructorVerificationDetailsHandler,
);
router.patch(
  "/instructor/review-queue/:instructorId/status",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(instructorDecisionSchema),
  reviewInstructorVerificationHandler,
);
router.get(
  "/instructor/management/stats",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  getInstructorManagementStatsHandler,
);
router.get(
  "/instructor/management/approved",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(approvedInstructorsQuerySchema, "query"),
  getApprovedInstructorsListHandler,
);
router.patch(
  "/instructor/management/approved/:instructorId/status",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(updateInstructorAccountStatusSchema),
  updateApprovedInstructorAccountStatusHandler,
);
router.get(
  "/student/management/stats",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  getStudentManagementStatsHandler,
);
router.get(
  "/student/management/list",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(studentsManagementQuerySchema, "query"),
  getStudentsManagementListHandler,
);
router.patch(
  "/student/management/:studentId/status",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(updateStudentAccountStatusSchema),
  updateStudentAccountStatusHandler,
);

export default router;

import { Request, Response } from "express";
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  createUserService,
  updateUserForOnboarding,
  submitInstructorVerificationService,
  getInstructorReviewQueueService,
  getInstructorVerificationDetailsService,
  reviewInstructorVerificationService,
  getMyInstructorVerificationService,
  getInstructorManagementStatsService,
  getApprovedInstructorsListService,
  updateApprovedInstructorAccountStatusService,
} from "./user.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import { uploadFile, isSpacesConfigured } from "@/libs/spacesFileUpload";
import { ApiError } from "@/utils/apiError";

type MulterFiles = { [fieldname: string]: Express.Multer.File[] };

async function buildInstructorVerificationPayload(req: Request) {
  const files = (req.files as MulterFiles | undefined) ?? {};
  const profilePhoto = files["profilePhoto"]?.[0];
  const governmentIdFile = files["governmentIdFile"]?.[0];
  const relevantCertificateFile = files["relevantCertificateFile"]?.[0];
  const sampleLessonFile = files["sampleLessonFile"]?.[0];

  const hasAnyUpload =
    Boolean(profilePhoto) ||
    Boolean(governmentIdFile) ||
    Boolean(relevantCertificateFile) ||
    Boolean(sampleLessonFile);
  if (hasAnyUpload && !isSpacesConfigured()) {
    throw ApiError.badRequest(
      "File uploads are not configured. Provide file URLs or configure Spaces keys.",
    );
  }

  const [
    profilePhotoMeta,
    governmentIdMeta,
    certificateMeta,
    sampleLessonMeta,
  ] = await Promise.all([
    profilePhoto ? uploadFile(profilePhoto, "instructor-verification") : null,
    governmentIdFile
      ? uploadFile(governmentIdFile, "instructor-verification")
      : null,
    relevantCertificateFile
      ? uploadFile(relevantCertificateFile, "instructor-verification")
      : null,
    sampleLessonFile
      ? uploadFile(sampleLessonFile, "instructor-verification")
      : null,
  ]);

  const cleanOptional = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  return {
    ...req.body,
    profilePhotoUrl:
      profilePhotoMeta?.fileUrl ?? cleanOptional(req.body.profilePhotoUrl),
    governmentIdFileUrl:
      governmentIdMeta?.fileUrl ??
      cleanOptional(req.body.governmentIdFileUrl),
    relevantCertificateFileUrl:
      certificateMeta?.fileUrl ??
      cleanOptional(req.body.relevantCertificateFileUrl),
    sampleLessonFileUrl:
      sampleLessonMeta?.fileUrl ?? cleanOptional(req.body.sampleLessonFileUrl),
  };
}

export const createUserHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = await createUserService(req.body);
    sendCreated({
      res,
      message: "Account created successfully",
      data: user,
    });
  },
);

export const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = await getUserProfile(req.user!.userId);
	sendSuccess({ res, data: { user } });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
	const user = await updateUserProfile(req.user!.userId, req.body);
	sendSuccess({ res, message: "Profile updated", data: { user } });
});

export const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await changeUserPassword(req.user!.userId, currentPassword, newPassword);
    sendSuccess({ res, message: "Password changed successfully" });
  },
);

export const userOnboardingHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = await updateUserForOnboarding(req.user!.userId, req.body);
    sendSuccess({ res, message: "Onboarding info recorded", data: { user } });
  },
);

export const submitInstructorVerificationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const payload = await buildInstructorVerificationPayload(req);
    const user = await submitInstructorVerificationService(req.user!.userId, payload);
    sendSuccess({
      res,
      message: "Instructor verification submitted successfully",
      data: { user },
    });
  },
);

export const getInstructorReviewQueueHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await getInstructorReviewQueueService({
      status: req.query.status as "in_review" | "declined" | undefined,
      search: req.query.search as string | undefined,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess({
      res,
      message: "Instructor review queue fetched successfully",
      data,
    });
  },
);

export const getInstructorVerificationDetailsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = await getInstructorVerificationDetailsService(req.params.instructorId);
    sendSuccess({
      res,
      message: "Instructor verification details fetched successfully",
      data: { user },
    });
  },
);

export const getMyInstructorVerificationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = await getMyInstructorVerificationService(req.user!.userId);
    sendSuccess({
      res,
      message: "Instructor verification fetched successfully",
      data: { user },
    });
  },
);

export const reviewInstructorVerificationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = await reviewInstructorVerificationService(
      req.user!.userId,
      req.params.instructorId,
      req.body,
    );
    sendSuccess({
      res,
      message: `Instructor application ${req.body.status} successfully`,
      data: { user },
    });
  },
);

export const getInstructorManagementStatsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const stats = await getInstructorManagementStatsService();
    sendSuccess({
      res,
      message: "Instructor statistics fetched successfully",
      data: stats,
    });
  },
);

export const getApprovedInstructorsListHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await getApprovedInstructorsListService({
      search: req.query.search as string | undefined,
      sort: req.query.sort as "most_recent" | "oldest",
      status: req.query.status as "verified" | "suspended" | undefined,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess({
      res,
      message: "Approved instructors fetched successfully",
      data,
    });
  },
);

export const updateApprovedInstructorAccountStatusHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = await updateApprovedInstructorAccountStatusService(
      req.params.instructorId,
      req.body,
    );
    sendSuccess({
      res,
      message: "Instructor account status updated successfully",
      data: { user },
    });
  },
);

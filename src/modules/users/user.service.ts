import { logger } from "@/utils/logger";
import { IPreferences, IUser, USER_ROLES } from "./user.model";
import {
  findUserById,
  findUserByEmailWithPassword,
  updateUserById,
  updateUserOnboarding,
  clearAllRefreshTokens,
  userExists,
  createUser,
  getInstructorReviewQueue,
  submitInstructorVerificationApplication,
  updateInstructorVerificationStatus,
  getInstructorManagementStats,
  getApprovedInstructorsList,
  updateApprovedInstructorAccountStatus,
  getStudentManagementStats,
  getStudentsManagementList,
  updateStudentAccountStatus,
} from "./user.repository";
import {
  CreateUserDto,
  SubmitInstructorVerificationDto,
  UpdateInstructorAccountStatusDto,
  UpdateStudentAccountStatusDto,
  UpdateInstructorVerificationStatusDto,
  UpdateUserDto,
} from "./user.types";
import { ApiError } from "@/utils/apiError";

export async function createUserService(dto: CreateUserDto): Promise<IUser> {
  if (dto.role) {
    if (!USER_ROLES.includes(dto.role))
      throw ApiError.badRequest("Invalid user role provided!");
  }
  const exists = await userExists({ email: dto.email.toLowerCase() });
  if (exists)
    throw ApiError.conflict("An account with this email already exists");

  const user = await createUser({
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    password: dto.password,
    role: dto.role || USER_ROLES[0],
  });

  logger.info({ userId: user._id }, "User registered");
  return user;
}

export async function getUserProfile(userId: string): Promise<IUser> {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

export async function updateUserProfile(
  userId: string,
  dto: UpdateUserDto,
): Promise<IUser> {
  const user = await updateUserById(userId, dto);
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

export async function updateUserForOnboarding(
  userId: string,
  dto: { preferences: IPreferences },
): Promise<IUser> {
  const { preferences } = dto;

  const user = await updateUserOnboarding(userId, { preferences });
  if (!user) throw ApiError.notFound("User not found");

  return user;
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const userWithPw = await findUserByEmailWithPassword(user.email);
  if (!userWithPw) throw ApiError.notFound("User not found");

  const isMatch = await userWithPw.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

  userWithPw.passwordHash = newPassword; // pre-save hook re-hashes
  await userWithPw.save();

  // Invalidate all sessions on password change
  await clearAllRefreshTokens(userId);
}

export async function submitInstructorVerificationService(
  userId: string,
  dto: SubmitInstructorVerificationDto,
): Promise<IUser> {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");
  if (user.role !== "instructor") {
    throw ApiError.forbidden(
      "Only instructors can submit verification details",
    );
  }

  const updated = await submitInstructorVerificationApplication(userId, dto);
  if (!updated) throw ApiError.notFound("User not found");
  return updated;
}

export async function getInstructorReviewQueueService(query: {
  status?: "in_review" | "declined";
  search?: string;
  page: number;
  limit: number;
}) {
  const result = await getInstructorReviewQueue(query);
  return result;
}

export async function getInstructorVerificationDetailsService(
  instructorId: string,
): Promise<IUser> {
  const user = await findUserById(instructorId);
  if (!user) throw ApiError.notFound("Instructor not found");
  if (user.role !== "instructor")
    throw ApiError.badRequest("User is not an instructor");
  return user;
}

export async function getMyInstructorVerificationService(
  userId: string,
): Promise<IUser> {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");
  if (user.role !== "instructor") {
    throw ApiError.forbidden(
      "Only instructors can access verification details",
    );
  }
  return user;
}

export async function reviewInstructorVerificationService(
  reviewerId: string,
  instructorId: string,
  dto: UpdateInstructorVerificationStatusDto,
): Promise<IUser> {
  const instructor = await findUserById(instructorId);
  if (!instructor) throw ApiError.notFound("Instructor not found");
  if (instructor.role !== "instructor") {
    throw ApiError.badRequest("User is not an instructor");
  }
  if (!instructor.instructorVerificationApplication?.submittedAt) {
    throw ApiError.badRequest(
      "Instructor has not submitted verification details",
    );
  }

  const updated = await updateInstructorVerificationStatus(instructorId, {
    status: dto.status,
    reviewNote: dto.reviewNote,
    reviewedBy: reviewerId,
  });
  if (!updated) throw ApiError.notFound("Instructor not found");
  return updated;
}

export async function getInstructorManagementStatsService() {
  return getInstructorManagementStats();
}

export async function getApprovedInstructorsListService(query: {
  search?: string;
  sort: "most_recent" | "oldest";
  status?: "verified" | "suspended";
  page: number;
  limit: number;
}) {
  const result = await getApprovedInstructorsList(query);
  return {
    ...result,
    items: result.items.map((item) => {
      if (!item.instructorAccountStatus) {
        item.instructorAccountStatus = "verified";
      }
      return item;
    }),
  };
}

export async function updateApprovedInstructorAccountStatusService(
  instructorId: string,
  dto: UpdateInstructorAccountStatusDto,
): Promise<IUser> {
  const updated = await updateApprovedInstructorAccountStatus(
    instructorId,
    dto.status,
  );
  if (!updated) {
    throw ApiError.notFound("Approved instructor not found for status update");
  }
  return updated;
}

export async function getStudentManagementStatsService() {
  return getStudentManagementStats();
}

export async function getStudentsManagementListService(query: {
  search?: string;
  sort: "most_recent" | "oldest";
  status?: "active" | "suspended";
  page: number;
  limit: number;
}) {
  return getStudentsManagementList(query);
}

export async function updateStudentAccountStatusService(
  studentId: string,
  dto: UpdateStudentAccountStatusDto,
): Promise<IUser> {
  const updated = await updateStudentAccountStatus(studentId, dto.status);
  if (!updated) {
    throw ApiError.notFound("Student not found for status update");
  }
  return updated;
}

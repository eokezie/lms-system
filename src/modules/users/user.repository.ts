import mongoose, { FilterQuery } from "mongoose";
import { User, IUser } from "./user.model";
import { Course } from "@/modules/courses/course.model";
import {
  CreateUserDto,
  CreateUserFromOAuthDto,
  SubmitInstructorVerificationDto,
  UpdateUserDto,
} from "./user.types";

export function findUserById(id: string): Promise<IUser | null> {
  return User.findById(id).exec();
}

export function findUserByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email: email.toLowerCase() }).exec();
}

// passwordHash is excluded by default — use this when you need to compare passwords
export function findUserByEmailWithPassword(
  email: string,
): Promise<IUser | null> {
  return User.findOne({ email: email.toLowerCase() })
    .select("+passwordHash")
    .exec();
}

export function findUserByIdWithRefreshTokens(
  id: string,
): Promise<IUser | null> {
  return User.findById(id).select("+refreshTokens").exec();
}

export async function userExists(filter: FilterQuery<IUser>): Promise<boolean> {
  const doc = await User.exists(filter);
  return !!doc;
}

export function createUser(data: CreateUserDto): Promise<IUser> {
  return User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
    passwordHash: data.password,
    role: data.role ?? "student",
  });
}

export function findUserByGoogleId(googleId: string): Promise<IUser | null> {
  return User.findOne({ googleId }).exec();
}

export function findUserByFacebookId(
  facebookId: string,
): Promise<IUser | null> {
  return User.findOne({ facebookId }).exec();
}

/** Used for course explore filter: instructorType = "infinix" | "external". */
export function findInstructorIdsByIsInfinix(
  isInfinix: boolean,
): Promise<mongoose.Types.ObjectId[]> {
  const filter: FilterQuery<IUser> = { role: "instructor" };
  if (isInfinix) {
    filter.isInfinixInstructor = true;
  } else {
    filter.$or = [
      { isInfinixInstructor: false },
      { isInfinixInstructor: { $exists: false } },
    ];
  }
  return User.find(filter).distinct("_id").exec();
}

export function createUserFromOAuth(
  data: CreateUserFromOAuthDto,
): Promise<IUser> {
  return User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
    role: data.role ?? "student",
    avatar: data.avatar,
    googleId: data.googleId,
    facebookId: data.facebookId,
    isEmailVerified: data.isEmailVerified ?? true,
  });
}

export function linkGoogleId(
  userId: string,
  googleId: string,
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { $set: { googleId, isEmailVerified: true } },
    { new: true },
  ).exec();
}

export function linkFacebookId(
  userId: string,
  facebookId: string,
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { $set: { facebookId, isEmailVerified: true } },
    { new: true },
  ).exec();
}

export function updateUserById(
  id: string,
  data: UpdateUserDto,
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  ).exec();
}

export function addRefreshToken(
  userId: string,
  token: string,
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { $push: { refreshTokens: { token, createdAt: new Date() } } },
    { new: true },
  ).exec();
}

export function removeRefreshToken(
  userId: string,
  token: string,
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { $pull: { refreshTokens: { token } } },
    { new: true },
  ).exec();
}

export function clearAllRefreshTokens(userId: string): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { $set: { refreshTokens: [] } },
    { new: true },
  ).exec();
}

export function pruneRefreshTokens(
  userId: string,
  keepLast = 5,
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    [{ $set: { refreshTokens: { $slice: ["$refreshTokens", -keepLast] } } }],
    { new: true },
  ).exec();
}

export function markEmailVerified(userId: string): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { $set: { isEmailVerified: true } },
    { new: true },
  ).exec();
}

export function updateUserOnboarding(
  userId: string,
  data: { preferences: IUser["preferences"] },
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { $set: { preferences: data.preferences, hasOnboarded: true } },
    { new: true, runValidators: true },
  ).exec();
}

export function updateUserPassword(
  userId: string,
  newPasswordHash: string,
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { $set: { passwordHash: newPasswordHash } },
    { new: true },
  ).exec();
}

export function submitInstructorVerificationApplication(
  userId: string,
  data: SubmitInstructorVerificationDto,
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        instructorVerificationStatus: "in_review",
        instructorVerificationApplication: {
          ...data,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
          reviewNote: undefined,
        },
      },
    },
    { new: true, runValidators: true },
  ).exec();
}

export async function getInstructorReviewQueue(
  filters: {
    status?: "in_review" | "declined";
    search?: string;
    page: number;
    limit: number;
  },
): Promise<{
  items: IUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query: FilterQuery<IUser> = { role: "instructor" };

  if (filters.status) {
    query.instructorVerificationStatus = filters.status;
  } else {
    query.instructorVerificationStatus = { $in: ["in_review", "declined"] };
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, "i");
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { "instructorVerificationApplication.firstName": searchRegex },
      { "instructorVerificationApplication.lastName": searchRegex },
      { "instructorVerificationApplication.email": searchRegex },
    ];
  }

  const skip = (filters.page - 1) * filters.limit;
  const [items, total] = await Promise.all([
    User.find(query)
      .sort({
        "instructorVerificationApplication.submittedAt": -1,
        updatedAt: -1,
      })
      .skip(skip)
      .limit(filters.limit)
      .exec(),
    User.countDocuments(query).exec(),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
  };
}

export function updateInstructorVerificationStatus(
  instructorId: string,
  payload: {
    status: "approved" | "declined";
    reviewedBy: string;
    reviewNote?: string;
  },
): Promise<IUser | null> {
  const isApproved = payload.status === "approved";
  return User.findByIdAndUpdate(
    instructorId,
    {
      $set: {
        instructorVerificationStatus: payload.status,
        isInfinixInstructor: isApproved,
        instructorAccountStatus: isApproved ? "verified" : "suspended",
        "instructorVerificationApplication.reviewedAt": new Date(),
        "instructorVerificationApplication.reviewedBy":
          new mongoose.Types.ObjectId(payload.reviewedBy),
        "instructorVerificationApplication.reviewNote": payload.reviewNote,
      },
    },
    { new: true, runValidators: true },
  ).exec();
}

export async function getInstructorManagementStats(): Promise<{
  totalApprovedInstructors: number;
  verifiedInstructors: number;
  suspendedInstructors: number;
  activeInstructorsThisWeek: number;
}> {
  const [totalApprovedInstructors, verifiedInstructors, suspendedInstructors] =
    await Promise.all([
      User.countDocuments({
        role: "instructor",
        instructorVerificationStatus: "approved",
      }).exec(),
      User.countDocuments({
        role: "instructor",
        instructorVerificationStatus: "approved",
        $or: [
          { instructorAccountStatus: "verified" },
          { instructorAccountStatus: { $exists: false } },
        ],
      }).exec(),
      User.countDocuments({
        role: "instructor",
        instructorVerificationStatus: "approved",
        instructorAccountStatus: "suspended",
      }).exec(),
    ]);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeInstructorIds = await Course.distinct("instructor", {
    status: "published",
    updatedAt: { $gte: sevenDaysAgo },
  });

  const activeInstructorsThisWeek = await User.countDocuments({
    _id: { $in: activeInstructorIds },
    role: "instructor",
    instructorVerificationStatus: "approved",
    instructorAccountStatus: "verified",
  }).exec();

  return {
    totalApprovedInstructors,
    verifiedInstructors,
    suspendedInstructors,
    activeInstructorsThisWeek,
  };
}

export async function getApprovedInstructorsList(filters: {
  search?: string;
  sort: "most_recent" | "oldest";
  status?: "verified" | "suspended";
  page: number;
  limit: number;
}): Promise<{
  items: IUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query: FilterQuery<IUser> = {
    role: "instructor",
    instructorVerificationStatus: "approved",
  };

  if (filters.status) {
    if (filters.status === "verified") {
      query.$and = [
        {
          $or: [
            { instructorAccountStatus: "verified" },
            { instructorAccountStatus: { $exists: false } },
          ],
        },
      ];
    } else {
      query.instructorAccountStatus = filters.status;
    }
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, "i");
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { "instructorVerificationApplication.firstName": searchRegex },
      { "instructorVerificationApplication.lastName": searchRegex },
      { "instructorVerificationApplication.email": searchRegex },
    ];
  }

  const skip = (filters.page - 1) * filters.limit;
  const sortOrder = filters.sort === "oldest" ? 1 : -1;

  const [items, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(filters.limit)
      .exec(),
    User.countDocuments(query).exec(),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
  };
}

export function updateApprovedInstructorAccountStatus(
  instructorId: string,
  status: "verified" | "suspended",
): Promise<IUser | null> {
  return User.findOneAndUpdate(
    {
      _id: instructorId,
      role: "instructor",
      instructorVerificationStatus: "approved",
    },
    {
      $set: { instructorAccountStatus: status },
    },
    { new: true, runValidators: true },
  ).exec();
}

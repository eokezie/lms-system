import mongoose, { FilterQuery } from "mongoose";
import { User, IUser } from "./user.model";
import { Course } from "@/modules/courses/course.model";
import { DailyActivity } from "@/modules/dailyActivity/dailyActivity.model";
import { Enrollment } from "@/modules/enrollments/enrollment.model";
import { LearnerProgress } from "@/modules/learnerProgress/learnerProgress.model";
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
  mostActiveDays: {
    rangeStart: string;
    rangeEnd: string;
    days: Array<{ day: string; activityCount: number }>;
  };
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
  const verifiedInstructorIds = await User.distinct("_id", {
    role: "instructor",
    instructorVerificationStatus: "approved",
    $or: [
      { instructorAccountStatus: "verified" },
      { instructorAccountStatus: { $exists: false } },
    ],
  });

  const activeInstructorIds = await Course.distinct("instructor", {
    status: "published",
    instructor: { $in: verifiedInstructorIds },
    updatedAt: { $gte: sevenDaysAgo },
  });

  const activeInstructorsThisWeek = await User.countDocuments({
    _id: { $in: activeInstructorIds },
    role: "instructor",
    instructorVerificationStatus: "approved",
    $or: [
      { instructorAccountStatus: "verified" },
      { instructorAccountStatus: { $exists: false } },
    ],
  }).exec();

  // Last 7 days activity grouped by weekday from course updates.
  const weekdayAgg = await Course.aggregate<
    { dayOfWeek: number; activityCount: number }
  >([
    {
      $match: {
        status: "published",
        instructor: { $in: verifiedInstructorIds },
        updatedAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: { date: "$updatedAt", timezone: "UTC" } }, // 1=Sun..7=Sat
        activityCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        dayOfWeek: "$_id",
        activityCount: 1,
      },
    },
  ]).exec();

  const dayMap = new Map<number, number>();
  for (const row of weekdayAgg) {
    dayMap.set(row.dayOfWeek, row.activityCount);
  }
  const dayOrder: Array<{ name: string; dayOfWeek: number }> = [
    { name: "Monday", dayOfWeek: 2 },
    { name: "Tuesday", dayOfWeek: 3 },
    { name: "Wednesday", dayOfWeek: 4 },
    { name: "Thursday", dayOfWeek: 5 },
    { name: "Friday", dayOfWeek: 6 },
    { name: "Saturday", dayOfWeek: 7 },
    { name: "Sunday", dayOfWeek: 1 },
  ];
  const mostActiveDays = {
    rangeStart: sevenDaysAgo.toISOString(),
    rangeEnd: new Date().toISOString(),
    days: dayOrder.map((day) => ({
      day: day.name,
      activityCount: dayMap.get(day.dayOfWeek) ?? 0,
    })),
  };

  return {
    totalApprovedInstructors,
    verifiedInstructors,
    suspendedInstructors,
    activeInstructorsThisWeek,
    mostActiveDays,
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

export async function getStudentManagementStats(): Promise<{
  totalStudents: number;
  activeStudents: number;
  suspendedStudents: number;
  activeStudentsThisWeek: number;
  mostActiveDays: {
    rangeStart: string;
    rangeEnd: string;
    days: Array<{ day: string; activityCount: number }>;
  };
}> {
  const [totalStudents, activeStudents, suspendedStudents] = await Promise.all([
    User.countDocuments({ role: "student" }).exec(),
    User.countDocuments({
      role: "student",
      $or: [
        { studentAccountStatus: "active" },
        { studentAccountStatus: { $exists: false } },
      ],
    }).exec(),
    User.countDocuments({
      role: "student",
      studentAccountStatus: "suspended",
    }).exec(),
  ]);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeStudentIds = await User.distinct("_id", {
    role: "student",
    $or: [
      { studentAccountStatus: "active" },
      { studentAccountStatus: { $exists: false } },
    ],
  });

  const weeklyActiveStudentIds = await DailyActivity.distinct("student", {
    student: { $in: activeStudentIds },
    date: { $gte: sevenDaysAgo },
  });

  const activeStudentsThisWeek = weeklyActiveStudentIds.length;

  const weekdayAgg = await DailyActivity.aggregate<
    { dayOfWeek: number; activityCount: number }
  >([
    {
      $match: {
        student: { $in: activeStudentIds },
        date: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: { date: "$date", timezone: "UTC" } }, // 1=Sun..7=Sat
        activityCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        dayOfWeek: "$_id",
        activityCount: 1,
      },
    },
  ]).exec();

  const dayMap = new Map<number, number>();
  for (const row of weekdayAgg) {
    dayMap.set(row.dayOfWeek, row.activityCount);
  }
  const dayOrder: Array<{ name: string; dayOfWeek: number }> = [
    { name: "Monday", dayOfWeek: 2 },
    { name: "Tuesday", dayOfWeek: 3 },
    { name: "Wednesday", dayOfWeek: 4 },
    { name: "Thursday", dayOfWeek: 5 },
    { name: "Friday", dayOfWeek: 6 },
    { name: "Saturday", dayOfWeek: 7 },
    { name: "Sunday", dayOfWeek: 1 },
  ];

  return {
    totalStudents,
    activeStudents,
    suspendedStudents,
    activeStudentsThisWeek,
    mostActiveDays: {
      rangeStart: sevenDaysAgo.toISOString(),
      rangeEnd: new Date().toISOString(),
      days: dayOrder.map((day) => ({
        day: day.name,
        activityCount: dayMap.get(day.dayOfWeek) ?? 0,
      })),
    },
  };
}

export type StudentManagementListRow = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  studentAccountStatus: "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;
  xpPoints: number;
  coursesCount: number;
  lastActivityAt: Date | null;
};

export async function getStudentsManagementList(filters: {
  search?: string;
  sort: "most_recent" | "oldest";
  status?: "active" | "suspended";
  page: number;
  limit: number;
}): Promise<{
  items: StudentManagementListRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query: FilterQuery<IUser> = { role: "student" };

  if (filters.status) {
    if (filters.status === "active") {
      query.$or = [
        { studentAccountStatus: "active" },
        { studentAccountStatus: { $exists: false } },
      ];
    } else {
      query.studentAccountStatus = filters.status;
    }
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, "i");
    const searchQuery: FilterQuery<IUser> = {
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    };
    if (query.$and) {
      query.$and.push(searchQuery);
    } else if (query.$or) {
      const prevOr = query.$or;
      delete query.$or;
      query.$and = [{ $or: prevOr as any[] }, searchQuery];
    } else {
      Object.assign(query, searchQuery);
    }
  }

  const skip = (filters.page - 1) * filters.limit;
  const sortOrder = filters.sort === "oldest" ? 1 : -1;

  const [students, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(filters.limit)
      .lean()
      .exec(),
    User.countDocuments(query).exec(),
  ]);

  const studentIds = students.map((s) => s._id);
  const [enrollmentAgg, learnerProgressRows, dailyActivityAgg] = await Promise.all([
    Enrollment.aggregate<{ _id: mongoose.Types.ObjectId; coursesCount: number }>([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: "$student", coursesCount: { $sum: 1 } } },
    ]).exec(),
    LearnerProgress.find({ student: { $in: studentIds } })
      .select("student experience")
      .lean()
      .exec(),
    DailyActivity.aggregate<{ _id: mongoose.Types.ObjectId; lastActivityAt: Date }>([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: "$student", lastActivityAt: { $max: "$date" } } },
    ]).exec(),
  ]);

  const enrollmentMap = new Map(
    enrollmentAgg.map((row) => [row._id.toString(), row.coursesCount] as const),
  );
  const xpMap = new Map(
    learnerProgressRows.map((row) => [row.student.toString(), row.experience] as const),
  );
  const activityMap = new Map(
    dailyActivityAgg.map((row) => [row._id.toString(), row.lastActivityAt] as const),
  );

  const items: StudentManagementListRow[] = students.map((student) => ({
    _id: student._id.toString(),
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    avatar: student.avatar,
    studentAccountStatus: (student.studentAccountStatus ?? "active") as
      | "active"
      | "suspended",
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    xpPoints: xpMap.get(student._id.toString()) ?? 0,
    coursesCount: enrollmentMap.get(student._id.toString()) ?? 0,
    lastActivityAt: activityMap.get(student._id.toString()) ?? null,
  }));

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

export function updateStudentAccountStatus(
  studentId: string,
  status: "active" | "suspended",
): Promise<IUser | null> {
  return User.findOneAndUpdate(
    {
      _id: studentId,
      role: "student",
    },
    {
      $set: { studentAccountStatus: status },
    },
    { new: true, runValidators: true },
  ).exec();
}

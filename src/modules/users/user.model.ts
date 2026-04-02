import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export const USER_ROLES = [
  "student",
  "instructor",
  "admin",
  "super_admin",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

type TOtp = {
  code: string;
  expiresIn: Date;
};

interface IMeta {
  otp: TOtp;
}

export interface IPreferences {
  description: string;
  interestedField: string;
  achievementGoal: string;
  daysPerWeekCommittedToLearning: number;
  discovery: string;
}

export interface IInstructorProfile {
  payoutEmail?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  totalRevenue: number;
  totalStudents: number;
}

export const INSTRUCTOR_VERIFICATION_STATUSES = [
  "not_submitted",
  "in_review",
  "approved",
  "declined",
] as const;
export type InstructorVerificationStatus =
  (typeof INSTRUCTOR_VERIFICATION_STATUSES)[number];

export const INSTRUCTOR_ACCOUNT_STATUSES = ["verified", "suspended"] as const;
export type InstructorAccountStatus = (typeof INSTRUCTOR_ACCOUNT_STATUSES)[number];
export const STUDENT_ACCOUNT_STATUSES = ["active", "suspended"] as const;
export type StudentAccountStatus = (typeof STUDENT_ACCOUNT_STATUSES)[number];

export const ADMIN_ACCOUNT_STATUSES = ["active", "suspended"] as const;
export type AdminAccountStatus = (typeof ADMIN_ACCOUNT_STATUSES)[number];

export interface INotificationChannelPrefs {
  email: boolean;
  app: boolean;
}

export interface INotificationPreferences {
  courseUpdates: INotificationChannelPrefs;
  replies: INotificationChannelPrefs;
  accountUpdates: INotificationChannelPrefs;
  systemAlerts: INotificationChannelPrefs;
}

export interface IInstructorVerificationApplication {
  profilePhotoUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  countryOfResidence?: string;
  governmentIssuedIdType?: string;
  governmentIdFileUrl?: string;
  primarySkill?: string;
  skillLevel?: string;
  yearsOfExperience?: number;
  linkedinUrl?: string;
  portfolioUrl?: string;
  relevantCertificateFileUrl?: string;
  courseTitle?: string;
  courseDescription?: string;
  sampleLessonFileUrl?: string;
  acceptedTerms?: boolean;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNote?: string;
}

export interface IStudyGoal {
  daysPerWeek: number;
  preferredDays: ("Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat")[];
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
  googleId?: string; // set when user signs in with Google
  facebookId?: string; // set when user signs in with Facebook
  meta?: IMeta;
  refreshTokens: Array<{ token: string; createdAt: Date }>;
  preferences: IPreferences;
  hasOnboarded: boolean;
  // Study goal — used for weekly progress tracker
  studyGoal: IStudyGoal;
  // Instructor-only extended profile
  instructorProfile?: IInstructorProfile;
  instructorVerificationStatus: InstructorVerificationStatus;
  instructorAccountStatus: InstructorAccountStatus;
  studentAccountStatus: StudentAccountStatus;
  /** Admin / super_admin access (settings UI). */
  adminAccountStatus: AdminAccountStatus;
  /** Optional custom role document for permissions matrix. */
  adminRoleId?: mongoose.Types.ObjectId;
  notificationPreferences?: INotificationPreferences;
  instructorVerificationApplication?: IInstructorVerificationApplication;
  // When true, instructor is "Infinix tech"; when false/undefined, "External only"
  isInfinixInstructor?: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  comparePassword(password: string): Promise<boolean>;
  fullName(): string;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: false, select: false }, // never returned by default
    googleId: { type: String, sparse: true, unique: true },
    facebookId: { type: String, sparse: true, unique: true },
    role: {
      type: String,
      enum: ["student", "instructor", "admin", "super_admin"],
      default: "student",
    },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    isEmailVerified: { type: Boolean, default: false },
    refreshTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    preferences: {
      description: {
        type: String,
      },
      interestedField: {
        type: String,
      },
      achievementGoal: {
        type: String,
      },
      daysPerWeekCommittedToLearning: {
        type: Number,
      },
      discovery: {
        type: String,
      },
    },
    hasOnboarded: {
      type: Boolean,
      default: false,
    },
    // Weekly study goal
    studyGoal: {
      daysPerWeek: { type: Number, default: 3, min: 1, max: 7 },
      preferredDays: {
        type: [String],
        enum: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        default: ["Mon", "Wed", "Fri"],
      },
    },
    isInfinixInstructor: { type: Boolean, default: false },
    instructorVerificationStatus: {
      type: String,
      enum: INSTRUCTOR_VERIFICATION_STATUSES,
      default: "not_submitted",
      index: true,
    },
    instructorAccountStatus: {
      type: String,
      enum: INSTRUCTOR_ACCOUNT_STATUSES,
      default: "verified",
      index: true,
    },
    studentAccountStatus: {
      type: String,
      enum: STUDENT_ACCOUNT_STATUSES,
      default: "active",
      index: true,
    },
    adminAccountStatus: {
      type: String,
      enum: ADMIN_ACCOUNT_STATUSES,
      default: "active",
      index: true,
    },
    adminRoleId: {
      type: Schema.Types.ObjectId,
      ref: "AdminRole",
    },
    notificationPreferences: {
      courseUpdates: {
        email: { type: Boolean, default: true },
        app: { type: Boolean, default: true },
      },
      replies: {
        email: { type: Boolean, default: true },
        app: { type: Boolean, default: true },
      },
      accountUpdates: {
        email: { type: Boolean, default: true },
        app: { type: Boolean, default: true },
      },
      systemAlerts: {
        email: { type: Boolean, default: true },
        app: { type: Boolean, default: true },
      },
    },
    instructorVerificationApplication: {
      profilePhotoUrl: { type: String },
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      countryOfResidence: { type: String },
      governmentIssuedIdType: { type: String },
      governmentIdFileUrl: { type: String },
      primarySkill: { type: String },
      skillLevel: { type: String },
      yearsOfExperience: { type: Number, min: 0 },
      linkedinUrl: { type: String },
      portfolioUrl: { type: String },
      relevantCertificateFileUrl: { type: String },
      courseTitle: { type: String },
      courseDescription: { type: String },
      sampleLessonFileUrl: { type: String },
      acceptedTerms: { type: Boolean },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reviewNote: { type: String, maxlength: 500 },
    },
    instructorProfile: {
      payoutEmail: { type: String },
      bio: { type: String, maxlength: 1000 },
      socialLinks: {
        twitter: { type: String },
        linkedin: { type: String },
        website: { type: String },
      },
      totalRevenue: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
    },
    meta: {
      otp: {
        code: {
          type: String,
        },
        expiresIn: {
          type: Date,
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Partial<IUser> & { __v?: number }) {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Hash password before saving if it was modified (only when present)
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash") || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.fullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

// Clean up old refresh tokens (keep last 5)
userSchema.methods.pruneRefreshTokens = function () {
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

export const User = mongoose.model<IUser>("User", userSchema);

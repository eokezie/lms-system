import { z } from "zod";

const userRoleSchema = z.enum(["instructor", "admin"]);

export const updateProfileSchema = z.object({
	firstName: z.string().min(1).max(50).trim().optional(),
	lastName: z.string().min(1).max(50).trim().optional(),
	bio: z.string().max(500).trim().optional(),
	avatar: z.string().url("Avatar must be a valid URL").optional(),
});

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Must contain at least one uppercase letter")
		.regex(/[0-9]/, "Must contain at least one number"),
});

export const registerSchema = z.object({
	firstName: z.string().min(1).max(50).trim(),
	lastName: z.string().min(1).max(50).trim(),
	email: z.string().email().toLowerCase(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
	role: userRoleSchema.default("instructor"),
});

export const submitInstructorVerificationSchema = z.object({
  profilePhotoUrl: z.string().url().optional().or(z.literal("")),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  email: z.string().email().toLowerCase(),
  countryOfResidence: z.string().min(1).max(80).trim(),
  governmentIssuedIdType: z.string().min(1).max(80).trim(),
  governmentIdFileUrl: z.string().url().optional().or(z.literal("")),
  primarySkill: z.string().min(1).max(120).trim(),
  skillLevel: z.string().min(1).max(80).trim(),
  yearsOfExperience: z.coerce.number().min(0).max(70),
  linkedinUrl: z
    .string()
    .url("LinkedIn URL must be valid")
    .optional()
    .or(z.literal("")),
  portfolioUrl: z
    .string()
    .url("Portfolio URL must be valid")
    .optional()
    .or(z.literal("")),
  relevantCertificateFileUrl: z.string().url().optional().or(z.literal("")),
  courseTitle: z.string().min(1).max(120).trim(),
  courseDescription: z.string().min(1).max(2000).trim(),
  sampleLessonFileUrl: z.string().url().optional().or(z.literal("")),
  acceptedTerms: z
    .boolean()
    .refine((value) => value === true, "You must accept terms before submitting"),
});

export const instructorReviewQueueQuerySchema = z.object({
  status: z.enum(["in_review", "declined"]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const instructorDecisionSchema = z.object({
  status: z.enum(["approved", "declined"]),
  reviewNote: z.string().trim().max(500).optional(),
});

export const approvedInstructorsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  sort: z.enum(["most_recent", "oldest"]).optional().default("most_recent"),
  status: z.enum(["verified", "suspended"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateInstructorAccountStatusSchema = z.object({
  status: z.enum(["verified", "suspended"]),
});

export const studentsManagementQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  sort: z.enum(["most_recent", "oldest"]).optional().default("most_recent"),
  status: z.enum(["active", "suspended"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateStudentAccountStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

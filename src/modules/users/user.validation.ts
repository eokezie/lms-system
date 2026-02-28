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

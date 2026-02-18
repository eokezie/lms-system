import { z } from "zod";

const userRoleSchema = z.enum(["student", "instructor"]);

export const registerSchema = z.object({
	firstName: z.string().min(1).max(50).trim(),
	lastName: z.string().min(1).max(50).trim(),
	email: z.string().email().toLowerCase(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
	role: userRoleSchema.default("student"),
});

export const loginSchema = z.object({
	email: z.string().email().toLowerCase(),
	password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, "Refresh token is required"),
});

export const otpSchema = z.object({
	otp: z
		.string()
		.min(4, "OTP should be 4 digits")
		.max(4, "OTP should be 4 digits"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
	email: z.string().email().toLowerCase(),
});

export const verifyCodeSchema = z.object({
	email: z.string().email().toLowerCase(),
	otp: z
		.string()
		.min(4, "OTP should be 4 digits")
		.max(4, "OTP should be 4 digits"),
});

export const changePasswordSchema = z.object({
	email: z.string().email().toLowerCase(),
	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
	newPasswordConfirmation: z
		.string()
		.min(8, "Password confirmation must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
});

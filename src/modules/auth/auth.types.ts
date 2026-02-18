import { UserRole } from "../users/user.model";

export interface RegisterDto {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	role?: UserRole;
}

export interface LoginDto {
	email: string;
	password: string;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface OtpDto {
	userId: string;
	otp: string;
}

export interface ForgotPasswordDto {
	email: string;
	otp: string;
}

export interface ChangePasswordDTO {
	email: string;
	newPassword: string;
	newPasswordConfirmation: string;
}

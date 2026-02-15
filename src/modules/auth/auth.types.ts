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

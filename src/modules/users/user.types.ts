import { IPreferences, UserRole } from "./user.model";

export interface CreateUserDto {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	role?: UserRole;
}

export interface CreateUserFromOAuthDto {
	firstName: string;
	lastName: string;
	email: string;
	role?: UserRole;
	avatar?: string;
	googleId?: string;
	facebookId?: string;
	isEmailVerified?: boolean;
}

export interface GoogleProfile {
	id: string;
	displayName?: string;
	name?: { givenName?: string; familyName?: string };
	emails?: Array<{ value: string; verified?: boolean }>;
	photos?: Array<{ value: string }>;
}

export interface FacebookProfile {
	id: string;
	displayName?: string;
	name?: { givenName?: string; familyName?: string };
	emails?: Array<{ value: string }>;
	photos?: Array<{ value: string }>;
}

export interface UpdateUserDto {
	firstName?: string;
	lastName?: string;
	bio?: string;
	avatar?: string;
	preferences?: IPreferences;
	hasOnboarded?: boolean;
}

export interface UserResponse {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: UserRole;
	avatar?: string;
	bio?: string;
	isEmailVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
}

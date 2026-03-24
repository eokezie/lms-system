import {
  IPreferences,
  InstructorAccountStatus,
  InstructorVerificationStatus,
  StudentAccountStatus,
  UserRole,
} from "./user.model";

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

export interface SubmitInstructorVerificationDto {
  profilePhotoUrl?: string;
  firstName: string;
  lastName: string;
  email: string;
  countryOfResidence: string;
  governmentIssuedIdType: string;
  governmentIdFileUrl?: string;
  primarySkill: string;
  skillLevel: string;
  yearsOfExperience: number;
  linkedinUrl?: string;
  portfolioUrl?: string;
  relevantCertificateFileUrl?: string;
  courseTitle: string;
  courseDescription: string;
  sampleLessonFileUrl?: string;
  acceptedTerms: boolean;
}

export interface UpdateInstructorVerificationStatusDto {
  status: Extract<InstructorVerificationStatus, "approved" | "declined">;
  reviewNote?: string;
}

export interface UpdateInstructorAccountStatusDto {
  status: InstructorAccountStatus;
}

export interface UpdateStudentAccountStatusDto {
  status: StudentAccountStatus;
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

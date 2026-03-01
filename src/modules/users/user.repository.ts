import { FilterQuery } from "mongoose";
import { User, IUser } from "./user.model";
import {
	CreateUserDto,
	CreateUserFromOAuthDto,
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

export function updateUserById(id: string, data: any): Promise<IUser | null> {
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

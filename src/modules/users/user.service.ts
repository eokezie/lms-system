import { logger } from "@/utils/logger";
import { IUser, USER_ROLES } from "./user.model";
import {
	findUserById,
	findUserByEmailWithPassword,
	updateUserById,
	clearAllRefreshTokens,
	userExists,
	createUser,
} from "./user.repository";
import { CreateUserDto, UpdateUserDto } from "./user.types";
import { ApiError } from "@/utils/apiError";

export async function createUserService(dto: CreateUserDto): Promise<IUser> {
	if (dto.role) {
		if (!USER_ROLES.includes(dto.role))
			throw ApiError.badRequest("Invalid user role provided!");
	}
	const exists = await userExists({ email: dto.email.toLowerCase() });
	if (exists)
		throw ApiError.conflict("An account with this email already exists");

	const user = await createUser({
		firstName: dto.firstName,
		lastName: dto.lastName,
		email: dto.email,
		password: dto.password,
		role: dto.role || USER_ROLES[0],
	});

	logger.info({ userId: user._id }, "User registered");
	return user;
}

export async function getUserProfile(userId: string): Promise<IUser> {
	const user = await findUserById(userId);
	if (!user) throw ApiError.notFound("User not found");
	return user;
}

export async function updateUserProfile(
	userId: string,
	dto: UpdateUserDto,
): Promise<IUser> {
	const user = await updateUserById(userId, dto);
	if (!user) throw ApiError.notFound("User not found");
	return user;
}

export async function changeUserPassword(
	userId: string,
	currentPassword: string,
	newPassword: string,
): Promise<void> {
	const user = await findUserById(userId);
	if (!user) throw ApiError.notFound("User not found");

	const userWithPw = await findUserByEmailWithPassword(user.email);
	if (!userWithPw) throw ApiError.notFound("User not found");

	const isMatch = await userWithPw.comparePassword(currentPassword);
	if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

	userWithPw.passwordHash = newPassword; // pre-save hook re-hashes
	await userWithPw.save();

	// Invalidate all sessions on password change
	await clearAllRefreshTokens(userId);
}

import jwt from "jsonwebtoken";
import { IUser, USER_ROLES } from "@/modules/users/user.model";
import {
	userExists,
	createUser,
	findUserByEmailWithPassword,
	findUserByIdWithRefreshTokens,
	addRefreshToken,
	removeRefreshToken,
	clearAllRefreshTokens,
	pruneRefreshTokens,
} from "@/modules/users/user.repository";
import { ApiError } from "@/utils/apiError";
import { eventBus } from "@/events/eventBus";
import { env } from "@/config/env";
import { JwtPayload } from "@/middleware/auth.middleware";
import { RegisterDto, LoginDto, AuthTokens } from "./auth.types";

function generateTokens(user: IUser): AuthTokens {
	const payload: any = {
		userId: user._id.toString(),
		email: user.email,
		role: user.role,
	};

	// const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET as string, {
	//   expiresIn: env.JWT_ACCESS_EXPIRES_IN,
	// });
	const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
		expiresIn: "1d",
	});

	// const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET as string, {
	//   expiresIn: env.JWT_REFRESH_EXPIRES_IN,
	// });
	const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
		expiresIn: "7d",
	});

	return { accessToken, refreshToken };
}

export async function register(
	dto: RegisterDto,
): Promise<{ user: IUser; tokens: AuthTokens }> {
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

	const tokens = generateTokens(user);
	await addRefreshToken(user._id.toString(), tokens.refreshToken);
	await pruneRefreshTokens(user._id.toString());

	eventBus.emit("user.registered", {
		userId: user._id.toString(),
		email: user.email,
	});

	return { user, tokens };
}

export async function login(
	dto: LoginDto,
): Promise<{ user: IUser; tokens: AuthTokens }> {
	const user = await findUserByEmailWithPassword(dto.email);
	if (!user) throw ApiError.unauthorized("Invalid email or password");

	const isMatch = await user.comparePassword(dto.password);
	if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

	const tokens = generateTokens(user);
	await addRefreshToken(user._id.toString(), tokens.refreshToken);
	await pruneRefreshTokens(user._id.toString());

	return { user, tokens };
}

export async function refreshTokens(
	incomingRefreshToken: string,
): Promise<AuthTokens> {
	let payload: JwtPayload;
	try {
		payload = jwt.verify(
			incomingRefreshToken,
			env.JWT_REFRESH_SECRET,
		) as JwtPayload;
	} catch {
		throw ApiError.unauthorized("Invalid or expired refresh token");
	}

	const user = await findUserByIdWithRefreshTokens(payload.userId);
	if (!user) throw ApiError.unauthorized("User no longer exists");

	const tokenExists = user.refreshTokens.some(
		(rt) => rt.token === incomingRefreshToken,
	);
	if (!tokenExists) {
		// Token reuse detected — wipe all sessions
		await clearAllRefreshTokens(payload.userId);
		throw ApiError.unauthorized(
			"Refresh token reuse detected. Please login again.",
		);
	}

	await removeRefreshToken(payload.userId, incomingRefreshToken);
	const tokens = generateTokens(user);
	await addRefreshToken(payload.userId, tokens.refreshToken);

	return tokens;
}

export async function logout(
	userId: string,
	refreshToken: string,
): Promise<void> {
	await removeRefreshToken(userId, refreshToken);
}

export async function logoutAll(userId: string): Promise<void> {
	await clearAllRefreshTokens(userId);
}

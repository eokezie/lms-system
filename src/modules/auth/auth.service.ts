import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { IUser, USER_ROLES } from "@/modules/users/user.model";
import {
  userExists,
  createUser,
  findUserByEmail,
  findUserByEmailWithPassword,
  findUserByIdWithRefreshTokens,
  findUserByGoogleId,
  findUserByFacebookId,
  createUserFromOAuth,
  linkGoogleId,
  linkFacebookId,
  addRefreshToken,
  removeRefreshToken,
  clearAllRefreshTokens,
  pruneRefreshTokens,
  markEmailVerified,
  updateUserPassword,
  findUserById,
} from "@/modules/users/user.repository";
import {
  RegisterDto,
  LoginDto,
  AuthTokens,
  OtpDto,
  ForgotPasswordDto,
  ChangePasswordDTO,
} from "./auth.types";
import { ApiError } from "@/utils/apiError";
import { eventBus } from "@/events/eventBus";
import { env } from "@/config/env";
import { JwtPayload } from "@/middleware/auth.middleware";
import { generateOTP, saveOTP, verifyOTP } from "./otp.service";
import { logger } from "@/utils/logger";
import { getVerificationCodeExpiryDate } from "@/helpers/verificationCode";
import {
  sendWelcomeEmail,
  sendOtpEmail,
  sendForgotPasswordOtpEmail,
  sendPasswordChangedEmail,
} from "./auth-email.service";
import { FacebookProfile, GoogleProfile } from "../users/user.types";
import { redisConnection } from "@/config/redis";
import { createEmailQueue } from "@/queues/email.queue";

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

  // 2. Generate OTP and save to Redis (expires in 10 mins)
  const otp = generateOTP();
  await saveOTP(user._id.toString(), otp);

  // 3. Issue tokens and persist
  const tokens = generateTokens(user);
  await Promise.all([
    addRefreshToken(user._id.toString(), tokens.refreshToken),
    pruneRefreshTokens(user._id.toString()),
  ]);

  // 4. Send welcome + OTP emails via Resend (fire-and-forget; don't fail registration)
  Promise.all([
    sendOtpEmail({
      email: user.email,
      firstName: user.firstName,
      otp,
    }),
  ]).catch((err) => {
    logger.error({ err, userId: user._id }, "Auth emails failed to send");
  });

  eventBus.emit("user.registered", {
    userId: user._id.toString(),
    email: user.email,
  });

  logger.info({ userId: user._id }, "User registered, auth emails sent");
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

export async function forgotPassword(email: string): Promise<void> {
  const user = await findUserByEmailWithPassword(email);
  if (!user) throw ApiError.unauthorized("Invalid email provided!");

  const code = generateOTP();
  const expiresIn = getVerificationCodeExpiryDate();

  if (!user.meta) user.meta = { otp: { code: "", expiresIn: new Date(0) } };
  user.meta.otp = { code, expiresIn };

  await user.save();

  sendForgotPasswordOtpEmail({
    email: user.email,
    firstName: user.firstName,
    otp: code,
  }).catch((err) => {
    logger.error(
      { err, email: user.email },
      "Forgot password email failed to send",
    );
  });
}

export async function verifyEmail(dto: OtpDto): Promise<void> {
  const { userId, otp } = dto;

  const user = await findUserById(userId);
  if (!user) throw ApiError.unauthorized("User not found!");

  const isValid = await verifyOTP(userId, otp);
  if (!isValid) throw ApiError.badRequest("Invalid or expired OTP!");

  await markEmailVerified(userId);
  await sendWelcomeEmail({ email: user.email, firstName: user.firstName });
}

export async function verifyVerificationCode(
  dto: ForgotPasswordDto,
): Promise<void> {
  const { email, otp } = dto;

  const user = await findUserByEmailWithPassword(email);
  if (!user) throw ApiError.unauthorized("Invalid email provided!");

  if (user.meta && user.meta.otp && user.meta.otp.code !== otp) {
    throw ApiError.badRequest("Invalid OTP!");
  }

  const currentDateInMilliseconds = new Date().getTime();
  const offset = new Date().getTimezoneOffset() * 60 * 1000;

  const currentDateInMillisecondsWithoutOffset =
    currentDateInMilliseconds - offset;

  if (
    user.meta &&
    user.meta.otp &&
    new Date(currentDateInMillisecondsWithoutOffset).toISOString() >
      new Date(user.meta.otp.expiresIn).toISOString()
  ) {
    throw ApiError.badRequest("The OTP provided has expired!");
  }
}

export async function changePassword(dto: ChangePasswordDTO): Promise<void> {
  if (dto.newPassword !== dto.newPasswordConfirmation)
    throw ApiError.unauthorized("New Password fields do not match!");

  const user = await findUserByEmailWithPassword(dto.email);
  if (!user) throw ApiError.unauthorized("Invalid email provided");

  const passwordHash = await bcrypt.hash(dto.newPassword, 12);
  await updateUserPassword(user.id, passwordHash);

  sendPasswordChangedEmail({
    email: user.email,
    firstName: user.firstName,
  }).catch((err) => {
    logger.error(
      { err, email: user.email },
      "Password changed email failed to send",
    );
  });
}

export async function findOrCreateUserFromGoogle(
  profile: GoogleProfile,
): Promise<IUser> {
  const googleId = profile.id;
  const email =
    profile.emails?.[0]?.value?.toLowerCase()?.trim() ||
    `${googleId}@google.oauth.local`;
  const firstName =
    profile.name?.givenName || profile.displayName?.split(" ")[0] || "User";
  const lastName =
    profile.name?.familyName ||
    profile.displayName?.split(" ").slice(1).join(" ") ||
    "OAuth";
  const avatar = profile.photos?.[0]?.value;

  let user = await findUserByGoogleId(googleId);
  if (user) return user;

  user = await findUserByEmail(email);
  if (user) {
    await linkGoogleId(user._id.toString(), googleId);
    return (await findUserByGoogleId(googleId))!;
  }

  return createUserFromOAuth({
    firstName,
    lastName,
    email,
    googleId,
    avatar,
    isEmailVerified: true,
  });
}

export async function findOrCreateUserFromFacebook(
  profile: FacebookProfile,
): Promise<IUser> {
  const facebookId = profile.id;
  const email =
    profile.emails?.[0]?.value?.toLowerCase()?.trim() ||
    `${facebookId}@facebook.oauth.local`;
  const firstName =
    profile.name?.givenName || profile.displayName?.split(" ")[0] || "User";
  const lastName =
    profile.name?.familyName ||
    profile.displayName?.split(" ").slice(1).join(" ") ||
    "OAuth";
  const avatar = profile.photos?.[0]?.value;

  let user = await findUserByFacebookId(facebookId);
  if (user) return user;

  user = await findUserByEmail(email);
  if (user) {
    await linkFacebookId(user._id.toString(), facebookId);
    return (await findUserByFacebookId(facebookId))!;
  }

  return createUserFromOAuth({
    firstName,
    lastName,
    email,
    facebookId,
    avatar,
    isEmailVerified: true,
  });
}

export async function issueTokensForUser(
  user: IUser,
): Promise<{ user: IUser; tokens: AuthTokens }> {
  const tokens = generateTokens(user);
  await addRefreshToken(user._id.toString(), tokens.refreshToken);
  await pruneRefreshTokens(user._id.toString());
  return { user, tokens };
}

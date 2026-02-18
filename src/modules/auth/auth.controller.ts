import { Request, Response } from "express";
import {
	register,
	login,
	refreshTokens,
	logout,
	logoutAll,
	verifyEmail,
	forgotPassword,
	verifyVerificationCode,
	changePassword,
} from "./auth.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess, sendCreated } from "@/utils/apiResponse";

export const registerHandler = catchAsync(
	async (req: Request, res: Response) => {
		const { user, tokens } = await register(req.body);
		sendCreated({
			res,
			message: "Account created successfully",
			data: { user, tokens },
		});
	},
);

export const loginHandler = catchAsync(async (req: Request, res: Response) => {
	const { user, tokens } = await login(req.body);
	sendSuccess({
		res,
		message: "Logged in successfully",
		data: { user, tokens },
	});
});

export const refreshHandler = catchAsync(
	async (req: Request, res: Response) => {
		const tokens = await refreshTokens(req.body.refreshToken);
		sendSuccess({ res, data: { tokens } });
	},
);

export const logoutHandler = catchAsync(async (req: Request, res: Response) => {
	await logout(req.user!.userId, req.body.refreshToken);
	sendSuccess({ res, message: "Logged out successfully" });
});

export const logoutAllHandler = catchAsync(
	async (req: Request, res: Response) => {
		await logoutAll(req.user!.userId);
		sendSuccess({ res, message: "Logged out from all devices" });
	},
);

export const verifyEmailHandler = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user!.userId;
		const otp = req.body.otp;
		await verifyEmail({ userId, otp });
		sendSuccess({ res, message: "Email verified successfully" });
	},
);

export const forgotPasswordHandler = catchAsync(
	async (req: Request, res: Response) => {
		const { email } = req.body;
		await forgotPassword(email);
		sendSuccess({ res, message: "Verifiction code was sent successfully" });
	},
);

export const verifyVerificationCodeHandler = catchAsync(
	async (
		req: Request<{}, {}, { email: string; otp: string }>,
		res: Response,
	) => {
		const { otp, email } = req.body;
		await verifyVerificationCode({ email, otp });
		sendSuccess({ res, message: "OTP was verified successfully" });
	},
);

export const changePasswordHandler = catchAsync(
	async (
		req: Request<
			{},
			{},
			{ email: string; newPassword: string; newPasswordConfirmation: string }
		>,
		res: Response,
	) => {
		const { email, newPassword, newPasswordConfirmation } = req.body;
		await changePassword({ email, newPassword, newPasswordConfirmation });
		sendSuccess({ res, message: "Password was updated successfully" });
	},
);

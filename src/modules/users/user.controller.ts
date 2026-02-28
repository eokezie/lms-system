import { Request, Response } from "express";
import {
	getUserProfile,
	updateUserProfile,
	changeUserPassword,
	createUserService,
	updateUserForOnboarding,
} from "./user.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";

export const createUserHandler = catchAsync(
	async (req: Request, res: Response) => {
		const user = await createUserService(req.body);
		sendCreated({
			res,
			message: "Account created successfully",
			data: user,
		});
	},
);

export const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = await getUserProfile(req.user!.userId);
	sendSuccess({ res, data: { user } });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
	const user = await updateUserProfile(req.user!.userId, req.body);
	sendSuccess({ res, message: "Profile updated", data: { user } });
});

export const changePassword = catchAsync(
	async (req: Request, res: Response) => {
		const { currentPassword, newPassword } = req.body;
		await changeUserPassword(req.user!.userId, currentPassword, newPassword);
		sendSuccess({ res, message: "Password changed successfully" });
	},
);

export const userOnboardingHandler = catchAsync(
	async (req: Request, res: Response) => {
		req.body.hasOnboarded = true;
		const user = await updateUserForOnboarding(req.user!.userId, req.body);
		sendSuccess({ res, message: "Onboarding info recorded", data: { user } });
	},
);

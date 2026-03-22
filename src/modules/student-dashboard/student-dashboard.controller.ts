import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { User } from "@/modules/users/user.model";
import { ApiError } from "@/utils/apiError";
import { getDashboardData } from "./student-dashboard.service";

export const getDashboardHandler = catchAsync(
	async (req: Request, res: Response) => {
		const user = await User.findById(req.user!.userId).select(
			"firstName lastName avatar preferences studyGoal",
		);
		if (!user) throw ApiError.notFound("User not found");

		const data = await getDashboardData(user);

		sendSuccess({ res, message: "Dashboard data fetched", data });
	},
);

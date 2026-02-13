import { Request, Response } from 'express';
import { getUserProfile, updateUserProfile, changeUserPassword } from './user.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendSuccess } from '@/utils/apiResponse';

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await getUserProfile(req.user!.userId);
  sendSuccess({ res, data: { user } });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const user = await updateUserProfile(req.user!.userId, req.body);
  sendSuccess({ res, message: 'Profile updated', data: { user } });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await changeUserPassword(req.user!.userId, currentPassword, newPassword);
  sendSuccess({ res, message: 'Password changed successfully' });
});

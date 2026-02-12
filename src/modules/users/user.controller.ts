import { Request, Response } from 'express';
import { userService } from './user.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendSuccess } from '@/utils/apiResponse';

export const userController = {
  getMe: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.user!.userId);
    sendSuccess({ res, data: { user } });
  }),

  updateMe: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    sendSuccess({ res, message: 'Profile updated', data: { user } });
  }),

  changePassword: catchAsync(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user!.userId, currentPassword, newPassword);
    sendSuccess({ res, message: 'Password changed successfully' });
  }),
};

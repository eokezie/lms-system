import { Request, Response } from 'express';
import { register, login, refreshTokens, logout, logoutAll } from './auth.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendSuccess, sendCreated } from '@/utils/apiResponse';

export const registerHandler = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await register(req.body);
  sendCreated({ res, message: 'Account created successfully', data: { user, tokens } });
});

export const loginHandler = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await login(req.body);
  sendSuccess({ res, message: 'Logged in successfully', data: { user, tokens } });
});

export const refreshHandler = catchAsync(async (req: Request, res: Response) => {
  const tokens = await refreshTokens(req.body.refreshToken);
  sendSuccess({ res, data: { tokens } });
});

export const logoutHandler = catchAsync(async (req: Request, res: Response) => {
  await logout(req.user!.userId, req.body.refreshToken);
  sendSuccess({ res, message: 'Logged out successfully' });
});

export const logoutAllHandler = catchAsync(async (req: Request, res: Response) => {
  await logoutAll(req.user!.userId);
  sendSuccess({ res, message: 'Logged out from all devices' });
});

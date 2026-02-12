import { Request, Response } from 'express';
import { authService } from './auth.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendSuccess, sendCreated } from '@/utils/apiResponse';

export const authController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.register(req.body);
    sendCreated({
      res,
      message: 'Account created successfully',
      data: { user, tokens },
    });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.login(req.body);
    sendSuccess({
      res,
      message: 'Logged in successfully',
      data: { user, tokens },
    });
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    sendSuccess({ res, data: { tokens } });
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await authService.logout(req.user!.userId, refreshToken);
    sendSuccess({ res, message: 'Logged out successfully' });
  }),

  logoutAll: catchAsync(async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!.userId);
    sendSuccess({ res, message: 'Logged out from all devices' });
  }),
};

import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/middleware/auth.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

// These require a valid access token
router.post('/logout', authenticate, validate(refreshTokenSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;

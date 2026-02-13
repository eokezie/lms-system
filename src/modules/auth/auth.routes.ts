import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
} from './auth.controller';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/middleware/auth.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh', validate(refreshTokenSchema), refreshHandler);
router.post('/logout', authenticate, validate(refreshTokenSchema), logoutHandler);
router.post('/logout-all', authenticate, logoutAllHandler);

export default router;

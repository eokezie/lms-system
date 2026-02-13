import { Router } from 'express';
import { getMe, updateMe, changePassword } from './user.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate';
import { updateProfileSchema, changePasswordSchema } from './user.validation';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', validate(updateProfileSchema), updateMe);
router.patch('/me/password', validate(changePasswordSchema), changePassword);

export default router;

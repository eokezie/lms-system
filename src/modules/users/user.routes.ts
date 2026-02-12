import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate';
import { updateProfileSchema, changePasswordSchema } from './user.validation';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.patch('/me/password', validate(changePasswordSchema), userController.changePassword);

export default router;

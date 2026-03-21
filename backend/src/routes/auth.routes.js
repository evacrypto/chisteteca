import express from 'express';
import { register, login, getMe, logout, verifyEmail, resendVerification } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { registerValidator, loginValidator, resendVerificationValidator } from '../validators/auth.validator.js';

const router = express.Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationValidator, resendVerification);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;

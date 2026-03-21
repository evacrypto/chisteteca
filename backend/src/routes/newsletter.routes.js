import express from 'express';
import { subscribe, confirm, sendDigest, subscribeValidators } from '../controllers/newsletter.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/subscribe', subscribeValidators, subscribe);
router.get('/confirm', confirm);
router.post('/send-digest', protect, admin, sendDigest);

export default router;

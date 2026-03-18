import express from 'express';
import { 
  getAllUsers, 
  getUserProfile, 
  updateProfile, 
  updateAvatar,
  addToFavorites, 
  removeFromFavorites, 
  getFavorites,
  getPublicFavorites,
  followUser,
  unfollowUser,
  getNotifications,
  markNotificationRead
} from '../controllers/user.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', protect, admin, getAllUsers);
router.get('/me', protect, getUserProfile);
router.get('/favorites', protect, getFavorites);
router.get('/notifications', protect, getNotifications);

router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, uploadAvatar.single('avatar'), updateAvatar);

router.put('/notifications/:id/read', protect, markNotificationRead);

router.post('/favorites/:contentId', protect, addToFavorites);
router.delete('/favorites/:contentId', protect, removeFromFavorites);

router.post('/follow/:userId', protect, followUser);
router.delete('/unfollow/:userId', protect, unfollowUser);

router.get('/:id/favorites', getPublicFavorites);
router.get('/:id', getUserProfile);

export default router;

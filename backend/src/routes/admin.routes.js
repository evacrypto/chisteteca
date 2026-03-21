import express from 'express';
import {
  getDashboardStats,
  getPendingContent,
  getAllContentForAdmin,
  approveAllPendingContent,
  approveContent,
  rejectContent,
  deleteContent,
  suspendUser,
  unsuspendUser,
  toggleUserVip,
  deleteUser,
  getReportedContent,
  getAnalytics,
  getAdminCategories,
  getPendingCategories,
  approveCategory,
  rejectCategory,
  approveAllPendingCategories,
  getDuplicateContent,
  getDuplicateCategories,
  mergeCategories,
  getNewsletterSubscribers,
  deleteNewsletterSubscriber
} from '../controllers/admin.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

router.get('/content/pending', getPendingContent);
router.get('/content/all', getAllContentForAdmin);
router.get('/content/reported', getReportedContent);
router.get('/content/duplicates', getDuplicateContent);
router.put('/content/approve-all', approveAllPendingContent);
router.put('/content/:id/approve', approveContent);
router.put('/content/:id/reject', rejectContent);
router.delete('/content/:id', deleteContent);

router.get('/categories/all', getAdminCategories);
router.get('/categories/pending', getPendingCategories);
router.get('/categories/duplicates', getDuplicateCategories);
router.post('/categories/merge', mergeCategories);
router.put('/categories/approve-all', approveAllPendingCategories);
router.put('/categories/:id/approve', approveCategory);
router.put('/categories/:id/reject', rejectCategory);

router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);
router.put('/users/:id/vip', toggleUserVip);
router.delete('/users/:id', deleteUser);

router.get('/newsletter/subscribers', getNewsletterSubscribers);
router.delete('/newsletter/subscribers/:id', deleteNewsletterSubscriber);

export default router;

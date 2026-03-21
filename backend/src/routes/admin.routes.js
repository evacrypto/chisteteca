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
  deleteUser,
  getReportedContent,
  getAnalytics,
  getPendingCategories,
  approveCategory,
  rejectCategory,
  approveAllPendingCategories,
  getDuplicateContent,
  getDuplicateCategories,
  mergeCategories
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

router.get('/categories/pending', getPendingCategories);
router.get('/categories/duplicates', getDuplicateCategories);
router.post('/categories/merge', mergeCategories);
router.put('/categories/approve-all', approveAllPendingCategories);
router.put('/categories/:id/approve', approveCategory);
router.put('/categories/:id/reject', rejectCategory);

router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);
router.delete('/users/:id', deleteUser);

export default router;

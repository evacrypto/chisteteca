import express from 'express';
import { 
  getAllContent, 
  getContent, 
  getAdjacentContent,
  registerView,
  createContent, 
  updateContent, 
  deleteContent,
  getTrendingContent,
  getRandomContent,
  reportContent,
  shareContent
} from '../controllers/content.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import { uploadContent, validateFileSize } from '../middleware/upload.middleware.js';
import { body } from 'express-validator';

const router = express.Router();

const contentValidators = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('type')
    .isIn(['chiste', 'image', 'video'])
    .withMessage('Invalid content type')
];

router.get('/', getAllContent);
router.get('/popular', getTrendingContent);
router.get('/trending', getTrendingContent);
router.get('/random', getRandomContent);
router.get('/:id/adjacent', getAdjacentContent);
router.post('/:id/view', registerView);
router.get('/:id', getContent);

router.post('/', 
  protect, 
  uploadContent.single('media'), 
  validateFileSize,
  contentValidators,
  createContent
);

router.put('/:id', protect, updateContent);
router.delete('/:id', protect, deleteContent);

router.post('/:id/report', protect, reportContent);
router.post('/:id/share', shareContent);

export default router;

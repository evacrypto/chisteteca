import express from 'express';
import { 
  getAllCategories, 
  getCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getCategoryContentCount
} from '../controllers/category.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';
import { body } from 'express-validator';

const router = express.Router();

const createCategoryValidators = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters')
];

const updateCategoryValidators = [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Category name must be between 1 and 50 characters'),
  body('emoji').optional().trim(),
  body('color').optional().trim()
];

router.get('/', getAllCategories);
router.get('/:id', getCategory);
router.get('/:id/count', getCategoryContentCount);

router.post('/', protect, admin, createCategoryValidators, createCategory);
router.put('/:id', protect, admin, updateCategoryValidators, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

export default router;

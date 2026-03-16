import express from 'express';
import { 
  likeContent,
  createComment,
  getContentComments,
  likeComment,
  updateComment,
  deleteComment
} from '../controllers/interaction.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { body } from 'express-validator';

const router = express.Router();

const commentValidator = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

router.post('/like/:contentId', protect, likeContent);

router.post('/comment/:contentId', protect, commentValidator, createComment);
router.get('/comment/:contentId', getContentComments);
router.put('/comment/:commentId', protect, updateComment);
router.delete('/comment/:commentId', protect, deleteComment);

router.post('/comment/:commentId/like', protect, likeComment);

export default router;

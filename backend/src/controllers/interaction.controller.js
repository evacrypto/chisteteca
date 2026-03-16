import Content from '../models/Content.model.js';
import Comment from '../models/Comment.model.js';
import User from '../models/User.model.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

// @desc    Like content
// @route   POST /api/interactions/like/:contentId
// @access  Private
export const likeContent = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.contentId)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const content = await Content.findById(req.params.contentId);

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    const alreadyLiked = content.likes.some(id => id.toString() === req.user.id);

    if (alreadyLiked) {
      content.likes = content.likes.filter(id => id.toString() !== req.user.id);
    } else {
      content.likes.push(req.user.id);

      // Create notification for content owner
      if (content.author && content.author.toString() !== req.user.id) {
        const currentUser = await User.findById(req.user.id);
        await User.findByIdAndUpdate(content.author, {
          $push: {
            notifications: {
              type: 'like',
              fromUser: req.user.id,
              content: content._id,
              message: `${currentUser.username} liked your content`,
              isRead: false
            }
          }
        });
      }
    }

    await content.save();

    res.json({
      success: true,
      data: {
        liked: !alreadyLiked,
        likesCount: content.likes.length
      }
    });
  } catch (error) {
    console.error('Like content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create comment
// @route   POST /api/interactions/comment/:contentId
// @access  Private
export const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.contentId)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const { text, parentCommentId } = req.body;
    const content = await Content.findById(req.params.contentId);

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    const user = await User.findById(req.user.id);

    const commentData = {
      text: text,
      content: content._id,
      user: user._id,
      username: user.username,
      userAvatar: user.avatar
    };

    if (parentCommentId) {
      commentData.parentComment = parentCommentId;
      // Increment replies count on parent
      await Comment.findByIdAndUpdate(parentCommentId, { $inc: { replies: 1 } });
    }

    const comment = await Comment.create(commentData);

    // Increment comments count on content
    await Content.findByIdAndUpdate(content._id, { $inc: { commentsCount: 1 } });

    // Create notification for content owner
    if (content.author && content.author.toString() !== req.user.id) {
      await User.findByIdAndUpdate(content.author, {
        $push: {
          notifications: {
            type: 'comment',
            fromUser: req.user.id,
            content: content._id,
            message: `${user.username} commented on your content`,
            isRead: false
          }
        }
      });
    }

    // Update user stats
    await user.updateStats();

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar');

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get comments for content
// @route   GET /api/interactions/comment/:contentId
// @access  Public
export const getContentComments = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.contentId)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      content: req.params.contentId,
      parentComment: null
    })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Comment.countDocuments({
      content: req.params.contentId,
      parentComment: null
    });

    res.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Like comment
// @route   POST /api/interactions/comment/:commentId/like
// @access  Private
export const likeComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const alreadyLiked = comment.likes.some(id => id.toString() === req.user.id);
    
    if (alreadyLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
    } else {
      comment.likes.push(req.user.id);
    }

    await comment.save();

    res.json({
      success: true,
      data: { 
        liked: !alreadyLiked,
        likesCount: comment.likes.length 
      }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update comment
// @route   PUT /api/interactions/comment/:commentId
// @access  Private
export const updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.text = req.body.text || req.body.content;
    comment.isEdited = true;
    await comment.save();

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/interactions/comment/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete replies if parent
    if (comment.parentComment === null) {
      await Comment.deleteMany({ parentComment: comment._id });
      // Decrement comments count on content
      await Content.findByIdAndUpdate(comment.content, { $inc: { commentsCount: -1 } });
    }

    await comment.deleteOne();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

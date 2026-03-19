import Content from '../models/Content.model.js';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { containsProfanity } from '../utils/commentModeration.js';

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all content
// @route   GET /api/content
// @access  Public
export const getAllContent = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const query = {};
    // isApproved: true (default), false (solo pendientes), all (todos)
    const isApprovedParam = req.query.isApproved;
    if (isApprovedParam === 'false') {
      query.isApproved = false;
    } else if (isApprovedParam !== 'all') {
      query.isApproved = true; // default: solo aprobados
    }

    if (req.query.type) query.type = req.query.type;
    if (req.query.category) {
      if (!isValidObjectId(req.query.category)) {
        return res.status(400).json({ success: false, message: 'Invalid category ID' });
      }
      query.categories = req.query.category;
    }
    if (req.query.author) {
      if (!isValidObjectId(req.query.author)) {
        return res.status(400).json({ success: false, message: 'Invalid author ID' });
      }
      query.author = req.query.author;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { text: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const content = await Content.find(query)
      .populate('author', 'username avatar')
      .populate('categories', 'name slug emoji color')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Content.countDocuments(query);

    res.json({
      success: true,
      data: content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single content
// @route   GET /api/content/:id
// @access  Public
export const getContent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const content = await Content.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate('categories', 'name slug emoji color')
      .populate('likes', 'username avatar');

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Increment views
    await content.incrementViews();

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create content
// @route   POST /api/content
// @access  Private
export const createContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, text, type, categories } = req.body;

    if (containsProfanity(text) || containsProfanity(title) || containsProfanity(description)) {
      return res.status(400).json({
        success: false,
        message: 'El contenido contiene lenguaje inapropiado. Por favor, evita insultos y palabrotas.'
      });
    }

    // Get user data
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const contentData = {
      title,
      description,
      type,
      author: user._id,
      authorName: user.username,
      authorAvatar: user.avatar || ''
    };

    if (type === 'chiste') {
      contentData.text = text;
    } else if (type === 'image' || type === 'video') {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Media file is required' });
      }
      contentData.mediaUrl = `/uploads/${type === 'image' ? 'images' : 'videos'}/${req.file.filename}`;
      if (type === 'video') {
        contentData.mediaThumbnail = `/uploads/${type === 'image' ? 'images' : 'videos'}/${req.file.filename}`;
      }
    }

    if (description) contentData.description = description;
    if (text) contentData.text = text;
    if (categories) contentData.categories = categories;

    // Auto-approve if admin, otherwise pending
    if (user.role === 'admin') {
      contentData.isApproved = true;
    }

    const content = await Content.create(contentData);

    // Handle new category suggestion AFTER content creation
    if (req.body.newCategory) {
      try {
        const suggestedByAdmin = user.role === 'admin';
        const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        await Category.create({
          name: req.body.newCategory,
          emoji: req.body.newCategoryEmoji || '😂',
          color: req.body.newCategoryColor || randomColor(),
          createdBy: user._id,
          isPending: !suggestedByAdmin,
          isActive: suggestedByAdmin,
          rejectionReason: ''
        });
      } catch (catError) {
        console.error('Error creating category:', catError);
      }
    }

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalPosts': 1 }
    });

    const populatedContent = await Content.findById(content._id)
      .populate('author', 'username avatar')
      .populate('categories', 'name slug emoji color');

    res.status(201).json({
      success: true,
      data: populatedContent
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private
export const updateContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    let content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check ownership
    const isOwner = content.author?.toString() === req.user.id || req.user.role === 'admin';
    
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, description, text, categories } = req.body;

    if (title) content.title = title;
    if (description) content.description = description;
    if (text) content.text = text;
    if (categories) content.categories = categories;

    await content.save();

    content = await Content.findById(content._id)
      .populate('author', 'username avatar bio')
      .populate('categories', 'name slug emoji color');

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private
export const deleteContent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check ownership
    const isOwner = content.author?.toString() === req.user.id || req.user.role === 'admin';
    
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await content.deleteOne();

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get trending content
// @route   GET /api/content/trending
// @access  Public
const POPULAR_MAX_LIMIT = 50;
const POPULAR_PAGE_SIZE = 15;

export const getTrendingContent = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, POPULAR_PAGE_SIZE), POPULAR_PAGE_SIZE);
    const skip = Math.min((page - 1) * limit, POPULAR_MAX_LIMIT); // No saltar más allá de 50

    // Weekly popularity is determined by number of likes.
    const sevenDaysAgo = new Date(Date.now() - WEEK_IN_MS);

    const matchStage = {
      $match: {
        isApproved: true,
        createdAt: { $gte: sevenDaysAgo }
      }
    };

    const [countResult, content] = await Promise.all([
      Content.aggregate([
        matchStage,
        { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
        { $count: 'total' }
      ]).then(r => [{ total: Math.min((r[0]?.total ?? 0), POPULAR_MAX_LIMIT) }]),
      Content.aggregate([
        matchStage,
        { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $limit: POPULAR_MAX_LIMIT },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categories'
          }
        },
        {
          $unwind: {
            path: '$author',
            preserveNullAndEmptyArrays: true
          }
        }
      ])
    ]);

    const total = countResult[0]?.total ?? 0;

    res.json({
      success: true,
      data: content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Get trending content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get random content
// @route   GET /api/content/random
// @access  Public
export const getRandomContent = async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 5);

    const content = await Content.aggregate([
      { $match: { isApproved: true } },
      { $sample: { size: limit } },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories'
        }
      },
      { $unwind: '$author' }
    ]);

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get random content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Report content
// @route   POST /api/content/:id/report
// @access  Private
export const reportContent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const { reason } = req.body;
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check if already reported by this user
    const alreadyReported = content.reportedBy.some(r => r.user.toString() === req.user.id);
    if (alreadyReported) {
      return res.status(400).json({ success: false, message: 'Already reported' });
    }

    content.reportedBy.push({
      user: req.user.id,
      reason: reason || 'Inappropriate content'
    });

    await content.save();

    res.json({
      success: true,
      message: 'Content reported successfully'
    });
  } catch (error) {
    console.error('Report content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Share content
// @route   POST /api/content/:id/share
// @access  Public
export const shareContent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    await content.incrementShares();

    res.json({
      success: true,
      data: { shares: content.shares }
    });
  } catch (error) {
    console.error('Share content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

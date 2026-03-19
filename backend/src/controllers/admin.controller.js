import User from '../models/User.model.js';
import Content from '../models/Content.model.js';
import Category from '../models/Category.model.js';
import mongoose from 'mongoose';
import { toAccentInsensitiveRegex } from '../utils/searchUtils.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalContent = await Content.countDocuments();
    const pendingContent = await Content.countDocuments({ isApproved: false, isRejected: { $ne: true } });
    const totalCategories = await Category.countDocuments();

    // Recent activity
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt');
    const recentContent = await Content.find().sort({ createdAt: -1 }).limit(5).select('title type createdAt');

    // Top content by views (most viewed first)
    const topContent = await Content.find({ isApproved: true })
      .sort({ views: -1 })
      .limit(30)
      .select('title text type likes views')
      .populate('author', 'username avatar');

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalContent,
          pendingContent,
          totalCategories
        },
        recentActivity: {
          users: recentUsers,
          content: recentContent
        },
        topContent
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get pending content for moderation
// @route   GET /api/admin/content/pending
// @access  Private/Admin
export const getPendingContent = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const content = await Content.find({ isApproved: false, isRejected: { $ne: true } })
      .populate('author', 'username avatar')
      .populate('categories', 'name slug emoji')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Content.countDocuments({ isApproved: false, isRejected: { $ne: true } });

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
    console.error('Get pending content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all content for admin management
// @route   GET /api/admin/content/all
// @access  Private/Admin
export const getAllContentForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { isRejected: { $ne: true } };
    if (req.query.search) {
      const searchPattern = toAccentInsensitiveRegex(req.query.search);
      query.$or = [
        { title: { $regex: searchPattern, $options: 'i' } },
        { text: { $regex: searchPattern, $options: 'i' } },
        { description: { $regex: searchPattern, $options: 'i' } }
      ];
    }
    if (req.query.type) query.type = req.query.type;
    if (req.query.approved === 'true') query.isApproved = true;
    if (req.query.approved === 'false') query.isApproved = false;

    const sortByMap = {
      author: 'authorName',
      createdAt: 'createdAt',
      likes: 'likesCount',
      views: 'views',
      comments: 'commentsCount'
    };
    const sortBy = sortByMap[req.query.sortBy] || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const needsAggregation = sortBy === 'likesCount';

    let content;
    if (needsAggregation) {
      const pipeline = [
        { $match: query },
        { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [{ $project: { username: 1, avatar: 1 } }]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categories',
            pipeline: [{ $project: { name: 1, slug: 1, emoji: 1, color: 1 } }]
          }
        }
      ];
      content = await Content.aggregate(pipeline);
    } else {
      content = await Content.find(query)
        .populate('author', 'username avatar')
        .populate('categories', 'name slug emoji color')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();
    }

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
    console.error('Get all content for admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve all pending content
// @route   PUT /api/admin/content/approve-all
// @access  Private/Admin
export const approveAllPendingContent = async (req, res) => {
  try {
    const pending = await Content.find(
      { isApproved: false, isRejected: { $ne: true } },
      'author'
    ).lean();
    const authorIds = [...new Set(pending.map((c) => c.author?.toString()).filter(Boolean))];

    const result = await Content.updateMany(
      { isApproved: false, isRejected: { $ne: true } },
      { $set: { isApproved: true, isRejected: false, approvalReason: '' } }
    );

    for (const authorId of authorIds) {
      const creator = await User.findById(authorId);
      if (creator) await creator.updateStats();
    }

    res.json({
      success: true,
      data: { approved: result.modifiedCount }
    });
  } catch (error) {
    console.error('Approve all content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve content
// @route   PUT /api/admin/content/:id/approve
// @access  Private/Admin
export const approveContent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    content.isApproved = true;
    content.isRejected = false;
    content.approvalReason = '';
    await content.save();

    // Update creator stats
    const creator = await User.findById(content.author);
    if (creator) {
      await creator.updateStats();
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Approve content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject content
// @route   PUT /api/admin/content/:id/reject
// @access  Private/Admin
export const rejectContent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const { reason } = req.body;

    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    content.isApproved = false;
    content.isRejected = true;
    content.approvalReason = reason || 'No cumple con las normas de la comunidad';
    await content.save();

    // Create notification for content author
    await User.findByIdAndUpdate(content.author, {
      $push: {
        notifications: {
          type: 'rejection',
          fromUser: req.user.id,
          content: content._id,
          message: `Tu contenido "${content.title}" ha sido rechazado: ${reason}`,
          isRead: false,
          createdAt: new Date()
        }
      }
    });

    // Update user stats
    await User.findByIdAndUpdate(content.author, {
      $inc: { 'stats.totalPosts': -1 }
    });

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Reject content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete content (admin)
// @route   DELETE /api/admin/content/:id
// @access  Private/Admin
export const deleteContent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
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

// @desc    Suspend user
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
export const suspendUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const { reason } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend admin user' });
    }

    user.isSuspended = true;
    user.suspendReason = reason || 'Violation of community guidelines';
    await user.save();

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        isSuspended: true,
        suspendReason: user.suspendReason
      }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Unsuspend user
// @route   PUT /api/admin/users/:id/unsuspend
// @access  Private/Admin
export const unsuspendUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isSuspended = false;
    user.suspendReason = '';
    await user.save();

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        isSuspended: false
      }
    });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin user' });
    }

    // Delete user's content
    await Content.deleteMany({ author: user._id });

    // Delete user's comments
    await (await import('../models/Comment.model.js')).default.deleteMany({ user: user._id });

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get reported content
// @route   GET /api/admin/content/reported
// @access  Private/Admin
export const getReportedContent = async (req, res) => {
  try {
    const content = await Content.find({ 'reportedBy.0': { $exists: true } })
      .populate('author', 'username avatar')
      .populate('reportedBy.user', 'username')
      .sort({ 'reportedBy.createdAt': -1 });

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get reported content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // New users per day
    const newUsers = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Content created per day
    const newContent = await Content.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Content type distribution
    const contentTypeDistribution = await Content.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        newUsers,
        newContent,
        contentTypeDistribution
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get pending categories
// @route   GET /api/admin/categories/pending
// @access  Private/Admin
export const getPendingCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isPending: true })
      .populate('createdBy', 'username avatar');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get pending categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve category
// @route   PUT /api/admin/categories/:id/approve
// @access  Private/Admin
export const approveCategory = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isPending = false;
    category.isActive = true;
    await category.save();

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Approve category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject category
// @route   PUT /api/admin/categories/:id/reject
// @access  Private/Admin
export const rejectCategory = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const { reason } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isPending = false;
    category.rejectionReason = reason || 'No cumple con los criterios';
    await category.save();

    // Notify user
    await User.findByIdAndUpdate(category.createdBy, {
      $push: {
        notifications: {
          type: 'category_rejection',
          fromUser: req.user.id,
          message: `Tu categoría "${category.name}" fue rechazada: ${reason}`,
          isRead: false,
          createdAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Reject category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

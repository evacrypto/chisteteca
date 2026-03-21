import User from '../models/User.model.js';
import Content from '../models/Content.model.js';
import Category from '../models/Category.model.js';
import mongoose from 'mongoose';
import { toAccentInsensitiveRegex } from '../utils/searchUtils.js';
import stringSimilarity from 'string-similarity';

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
      .populate('author', 'username avatar isVip');

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
      .populate('author', 'username avatar isVip')
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
            pipeline: [{ $project: { username: 1, avatar: 1, isVip: 1 } }]
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
      const q = Content.find(query)
        .populate('author', 'username avatar isVip')
        .populate('categories', 'name slug emoji color')
        .sort(sort)
        .limit(limit)
        .skip(skip);
      if (sortBy === 'authorName') {
        q.collation({ locale: 'es', strength: 1 });
      }
      content = await q.lean();
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

// @desc    Toggle VIP status
// @route   PUT /api/admin/users/:id/vip
// @access  Private/Admin
export const toggleUserVip = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVip = !user.isVip;
    await user.save();

    if (user.isVip && user.email) {
      setImmediate(async () => {
        try {
          const { sendVipNotification } = await import('../services/email.service.js');
          await sendVipNotification(user.email, user.username);
        } catch (err) {
          console.error('[Admin] VIP email notification failed:', err);
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        isVip: user.isVip
      }
    });
  } catch (error) {
    console.error('Toggle VIP error:', error);
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
      .populate('author', 'username avatar isVip')
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

// @desc    Get all categories for admin (active, inactive, pending)
// @route   GET /api/admin/categories/all
// @access  Private/Admin
export const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ name: 1 })
      .lean();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get admin categories error:', error);
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

// @desc    Approve all pending categories
// @route   PUT /api/admin/categories/approve-all
// @access  Private/Admin
export const approveAllPendingCategories = async (req, res) => {
  try {
    const result = await Category.updateMany(
      { isPending: true },
      { $set: { isPending: false, isActive: true, rejectionReason: '' } }
    );

    res.json({
      success: true,
      data: { approved: result.modifiedCount }
    });
  } catch (error) {
    console.error('Approve all categories error:', error);
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

// Normaliza texto para comparación (minúsculas, sin espacios extra, sin puntuación)
const normalizeForCompare = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^\p{L}\p{N}\s]/gu, '') // quitar puntuación
    .replace(/\s+/g, ' ')
    .trim();
};

// @desc    Get potential duplicate jokes (fuzzy similarity)
// @route   GET /api/admin/content/duplicates
// @access  Private/Admin
export const getDuplicateContent = async (req, res) => {
  try {
    const threshold = Math.min(1, Math.max(0.5, parseFloat(req.query.threshold) || 0.85));
    const limit = Math.min(500, Math.max(50, parseInt(req.query.limit) || 200));

    const chistes = await Content.find({ type: 'chiste', text: { $exists: true, $ne: '' } })
      .select('_id title text author authorName createdAt likes views isApproved')
      .populate('author', 'username avatar isVip')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const normalized = chistes.map((c) => ({
      ...c,
      normalized: normalizeForCompare(c.text || c.title || '')
    })).filter((c) => c.normalized.length >= 10);

    const pairs = [];
    const seen = new Set();

    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < normalized.length; j++) {
        const a = normalized[i];
        const b = normalized[j];
        const lenRatio = Math.min(a.normalized.length, b.normalized.length) / Math.max(a.normalized.length, b.normalized.length);
        if (lenRatio < 0.5) continue;

        const sim = stringSimilarity.compareTwoStrings(a.normalized, b.normalized);
        if (sim >= threshold) {
          const key = [a._id.toString(), b._id.toString()].sort().join('-');
          if (!seen.has(key)) {
            seen.add(key);
            pairs.push({ a, b, similarity: Math.round(sim * 100) });
          }
        }
      }
    }

    const groups = [];
    const idToGroup = new Map();

    for (const { a, b, similarity } of pairs) {
      const idA = a._id.toString();
      const idB = b._id.toString();
      let groupA = idToGroup.get(idA);
      let groupB = idToGroup.get(idB);

      if (!groupA && !groupB) {
        const group = { items: [a, b], similarities: [similarity] };
        groups.push(group);
        idToGroup.set(idA, group);
        idToGroup.set(idB, group);
      } else if (groupA && !groupB) {
        const idx = groupA.items.findIndex((x) => x._id.toString() === idB);
        if (idx === -1) {
          groupA.items.push(b);
          groupA.similarities.push(similarity);
          idToGroup.set(idB, groupA);
        }
      } else if (!groupA && groupB) {
        const idx = groupB.items.findIndex((x) => x._id.toString() === idA);
        if (idx === -1) {
          groupB.items.push(a);
          groupB.similarities.push(similarity);
          idToGroup.set(idA, groupB);
        }
      } else if (groupA !== groupB) {
        for (const item of groupB.items) {
          idToGroup.set(item._id.toString(), groupA);
          if (!groupA.items.some((x) => x._id.toString() === item._id.toString())) {
            groupA.items.push(item);
          }
        }
        groupA.similarities.push(...groupB.similarities);
        const idx = groups.indexOf(groupB);
        if (idx !== -1) groups.splice(idx, 1);
      }
    }

    const result = groups.map((g) => ({
      items: g.items.map(({ _id, title, text, author, authorName, createdAt, likes, views, isApproved }) => ({
        _id,
        title,
        text: (text || '').substring(0, 200),
        author,
        authorName,
        createdAt,
        likesCount: Array.isArray(likes) ? likes.length : 0,
        views,
        isApproved
      })),
      avgSimilarity: Math.round(g.similarities.reduce((s, v) => s + v, 0) / g.similarities.length)
    }));

    res.json({
      success: true,
      data: {
        groups: result,
        total: result.length,
        scanned: normalized.length,
        threshold: threshold * 100
      }
    });
  } catch (error) {
    console.error('Get duplicates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get potential duplicate categories (by name similarity)
// @route   GET /api/admin/categories/duplicates
// @access  Private/Admin
export const getDuplicateCategories = async (req, res) => {
  try {
    const threshold = Math.min(1, Math.max(0.5, parseFloat(req.query.threshold) || 0.85));

    const categories = await Category.find()
      .select('_id name slug emoji color contentCount isActive isPending')
      .lean();

    const normalized = categories.map((c) => ({
      ...c,
      normalized: normalizeForCompare(c.name || '')
    })).filter((c) => c.normalized.length >= 2);

    const pairs = [];
    const seen = new Set();

    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < normalized.length; j++) {
        const a = normalized[i];
        const b = normalized[j];
        const sim = stringSimilarity.compareTwoStrings(a.normalized, b.normalized);
        if (sim >= threshold) {
          const key = [a._id.toString(), b._id.toString()].sort().join('-');
          if (!seen.has(key)) {
            seen.add(key);
            pairs.push({ a, b, similarity: Math.round(sim * 100) });
          }
        }
      }
    }

    const groups = [];
    const idToGroup = new Map();

    for (const { a, b, similarity } of pairs) {
      const idA = a._id.toString();
      const idB = b._id.toString();
      let groupA = idToGroup.get(idA);
      let groupB = idToGroup.get(idB);

      if (!groupA && !groupB) {
        const group = { items: [a, b], similarities: [similarity] };
        groups.push(group);
        idToGroup.set(idA, group);
        idToGroup.set(idB, group);
      } else if (groupA && !groupB) {
        const idx = groupA.items.findIndex((x) => x._id.toString() === idB);
        if (idx === -1) {
          groupA.items.push(b);
          groupA.similarities.push(similarity);
          idToGroup.set(idB, groupA);
        }
      } else if (!groupA && groupB) {
        const idx = groupB.items.findIndex((x) => x._id.toString() === idA);
        if (idx === -1) {
          groupB.items.push(a);
          groupB.similarities.push(similarity);
          idToGroup.set(idA, groupB);
        }
      } else if (groupA !== groupB) {
        for (const item of groupB.items) {
          idToGroup.set(item._id.toString(), groupA);
          if (!groupA.items.some((x) => x._id.toString() === item._id.toString())) {
            groupA.items.push(item);
          }
        }
        groupA.similarities.push(...groupB.similarities);
        const idx = groups.indexOf(groupB);
        if (idx !== -1) groups.splice(idx, 1);
      }
    }

    const result = groups.map((g) => ({
      items: g.items.map(({ _id, name, slug, emoji, color, contentCount, isActive, isPending }) => ({
        _id,
        name,
        slug,
        emoji,
        color,
        contentCount,
        isActive,
        isPending
      })),
      avgSimilarity: Math.round(g.similarities.reduce((s, v) => s + v, 0) / g.similarities.length)
    }));

    res.json({
      success: true,
      data: {
        groups: result,
        total: result.length,
        scanned: normalized.length,
        threshold: threshold * 100
      }
    });
  } catch (error) {
    console.error('Get category duplicates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Merge categories into one (targetId = keep, sourceIds = merge and delete)
// @route   POST /api/admin/categories/merge
// @access  Private/Admin
export const mergeCategories = async (req, res) => {
  try {
    const { targetId, sourceIds } = req.body;
    if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'targetId y sourceIds (array) son requeridos' });
    }

    if (!isValidId(targetId)) {
      return res.status(400).json({ success: false, message: 'targetId inválido' });
    }

    const target = await Category.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Categoría destino no encontrada' });
    }

    const targetObjId = new mongoose.Types.ObjectId(targetId);
    const toMerge = sourceIds
      .filter((id) => id && String(id) !== String(targetId) && mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (toMerge.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay categorías distintas para fusionar' });
    }

    const sources = await Category.find({ _id: { $in: toMerge } });
    if (sources.length !== toMerge.length) {
      return res.status(404).json({ success: false, message: 'Alguna categoría origen no existe' });
    }

    for (const src of sources) {
      await Content.updateMany(
        { categories: src._id },
        { $addToSet: { categories: targetObjId }, $pull: { categories: src._id } }
      );
      await src.deleteOne();
    }

    const newCount = await Content.countDocuments({ categories: targetObjId });
    await Category.findByIdAndUpdate(targetObjId, { contentCount: newCount });

    res.json({
      success: true,
      message: `Fusionadas ${sources.length} categorías en "${target.name}"`,
      data: { merged: sources.length, targetId }
    });
  } catch (error) {
    console.error('Merge categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

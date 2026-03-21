import fs from 'fs';
import path from 'path';
import User from '../models/User.model.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { uploadToR2, isR2Configured } from '../services/storage.service.js';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req, res) => {
  try {
    const requestedId = req.params.id;
    const targetUserId = requestedId || req.user?.id;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(targetUserId)
      .select('-password')
      .populate('favorites', 'title type mediaUrl')
      .populate('following', 'username avatar bio');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          stats: user.stats,
          joinedAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { bio } = req.body;

    const user = await User.findById(req.user.id);

    if (bio) user.bio = bio;
    if (req.body.username) {
      const existing = await User.findOne({ username: req.body.username });
      if (existing && existing._id.toString() !== req.user.id) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
      user.username = req.body.username;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
export const updateAvatar = async (req, res, next) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ success: false, message: req.fileValidationError });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha seleccionado ninguna imagen' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    let avatarUrl;

    if (isR2Configured()) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const key = `avatars/avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      avatarUrl = await uploadToR2(req.file.buffer, key, req.file.mimetype);
    } else {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
      const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname) || '.jpg'}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      avatarUrl = `/uploads/avatars/${filename}`;
    }

    user.avatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      data: { avatar: user.avatar }
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al subir avatar' });
  }
};

// @desc    Add to favorites
// @route   POST /api/users/favorites/:contentId
// @access  Private
export const addToFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.favorites.includes(req.params.contentId)) {
      return res.status(400).json({ success: false, message: 'Already in favorites' });
    }

    user.favorites.push(req.params.contentId);
    await user.save();

    res.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove from favorites
// @route   DELETE /api/users/favorites/:contentId
// @access  Private
export const removeFromFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter((id) => id.toString() !== req.params.contentId);
    await user.save();

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get a user's public favorites (for viewing their profile)
// @route   GET /api/users/:id/favorites
// @access  Public
export const getPublicFavorites = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(userId)
      .populate({
        path: 'favorites',
        match: { isApproved: true },
        select: 'title text type mediaUrl author categories',
        populate: [
          { path: 'author', select: 'username avatar' },
          { path: 'categories', select: 'name slug emoji color' }
        ]
      })
      .select('favorites');

    const validFavorites = (user?.favorites || []).filter(Boolean);

    res.json({
      success: true,
      data: validFavorites
    });
  } catch (error) {
    console.error('Get public favorites error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's favorites
// @route   GET /api/users/favorites
// @access  Private
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favorites',
        populate: [
          { path: 'author', select: 'username avatar bio' },
          { path: 'categories', select: 'name slug emoji color' }
        ]
      })
      .select('favorites');

    // Filtrar contenidos eliminados (populate devuelve null)
    const validFavorites = (user.favorites || []).filter(Boolean);

    res.json({
      success: true,
      data: validFavorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Follow user
// @route   POST /api/users/follow/:userId
// @access  Private
export const followUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    if (user.following.includes(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Already following' });
    }

    user.following.push(req.params.userId);
    await user.save();

    await Promise.all([user.updateStats(), targetUser.updateStats()]);

    await User.findByIdAndUpdate(targetUser._id, {
      $push: {
        notifications: {
          type: 'follow',
          fromUser: req.user.id,
          message: `${user.username} started following you`,
          isRead: false
        }
      }
    });

    res.json({ success: true, message: 'Following user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Unfollow user
// @route   DELETE /api/users/unfollow/:userId
// @access  Private
export const unfollowUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.following = user.following.filter((id) => id.toString() !== req.params.userId);
    await user.save();

    await Promise.all([user.updateStats(), targetUser.updateStats()]);

    res.json({ success: true, message: 'Unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('notifications.fromUser', 'username avatar')
      .populate('notifications.content', 'title type')
      .select('notifications');

    res.json({
      success: true,
      data: user.notifications.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'notifications.$[elem].isRead': true
        }
      },
      {
        arrayFilters: [{ 'elem._id': req.params.id }]
      }
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortBy = req.query.sortBy || 'date';
    let sort = { createdAt: sortOrder };
    if (sortBy === 'posts') {
      sort = { 'stats.totalPosts': sortOrder };
    } else if (sortBy === 'username') {
      sort = { username: sortOrder };
    }

    const query = User.find().select('-password').sort(sort);
    if (sortBy === 'username') {
      query.collation({ locale: 'es', strength: 1 });
    }
    const users = await query
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

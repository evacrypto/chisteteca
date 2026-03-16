import Category from '../models/Category.model.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req, res) => {
  try {
    const lookup = req.params.id;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(lookup);

    const categoryQuery = isValidObjectId
      ? {
          $or: [{ _id: lookup }, { slug: lookup }],
          isActive: true
        }
      : {
          slug: lookup,
          isActive: true
        };

    const category = await Category.findOne(categoryQuery);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, emoji, color } = req.body;

    const category = await Category.create({
      name,
      description,
      emoji: emoji || '😂',
      color: color || '#ffc107',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, emoji, color, isActive } = req.body;

    if (name) category.name = name;
    if (description) category.description = description;
    if (emoji) category.emoji = emoji;
    if (color) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const Content = (await import('../models/Content.model.js')).default;

    // Remove the category from existing content to avoid dangling references.
    await Content.updateMany(
      { categories: category._id },
      { $pull: { categories: category._id } }
    );

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get category content count
// @route   GET /api/categories/:id/count
// @access  Public
export const getCategoryContentCount = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const Content = (await import('../models/Content.model.js')).default;
    
    const count = await Content.countDocuments({ 
      categories: req.params.id,
      isApproved: true 
    });

    await Category.findByIdAndUpdate(req.params.id, { contentCount: count });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get category content count error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

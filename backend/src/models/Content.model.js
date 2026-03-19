import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['chiste', 'image', 'video'],
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  mediaUrl: {
    type: String
  },
  mediaThumbnail: {
    type: String
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorAvatar: {
    type: String,
    default: ''
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isRejected: {
    type: Boolean,
    default: false
  },
  approvalReason: {
    type: String,
    default: ''
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Index for better query performance
contentSchema.index({ type: 1, createdAt: -1 });
contentSchema.index({ author: 1, createdAt: -1 });
contentSchema.index({ categories: 1 });
contentSchema.index({ tags: 1 });

// Virtual for likes count
contentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Increment views method
contentSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Increment shares method
contentSchema.methods.incrementShares = function() {
  this.shares += 1;
  return this.save();
};

const Content = mongoose.model('Content', contentSchema);

export default Content;

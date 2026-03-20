import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 150
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guest'],
    default: 'user'
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspendReason: {
    type: String,
    default: ''
  },
  stats: {
    totalPosts: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 }
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['like', 'comment', 'follow', 'mention', 'rejection', 'category_rejection']
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update stats method
userSchema.methods.updateStats = async function() {
  const Content = mongoose.model('Content');
  const Comment = mongoose.model('Comment');
  
  this.stats.totalPosts = await Content.countDocuments({ author: this._id });
  this.stats.totalComments = await Comment.countDocuments({ user: this._id });
  this.stats.followers = await mongoose.model('User').countDocuments({ following: this._id });
  this.stats.following = this.following.length;
  
  await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;

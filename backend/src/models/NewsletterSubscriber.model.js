import mongoose from 'mongoose';

const newsletterSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifyToken: {
    type: String,
    default: null
  },
  verifyExpire: {
    type: Date,
    default: null
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

newsletterSubscriberSchema.index({ email: 1 });
newsletterSubscriberSchema.index({ verifyToken: 1 }, { sparse: true });

const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);

export default NewsletterSubscriber;

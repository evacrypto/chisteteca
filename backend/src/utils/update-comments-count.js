import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Content from '../models/Content.model.js';
import Comment from '../models/Comment.model.js';

dotenv.config();

const updateCommentsCount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all content
    const contents = await Content.find({});
    let updated = 0;

    for (const content of contents) {
      // Count comments for this content
      const commentsCount = await Comment.countDocuments({ content: content._id, parentComment: null });
      
      // Update if different
      if (content.commentsCount !== commentsCount) {
        await Content.findByIdAndUpdate(content._id, { commentsCount });
        console.log(`📝 Updated "${content.title}": ${content.commentsCount} → ${commentsCount} comments`);
        updated++;
      }
    }

    console.log(`\n✅ Updated ${updated} content items with correct comments count`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateCommentsCount();

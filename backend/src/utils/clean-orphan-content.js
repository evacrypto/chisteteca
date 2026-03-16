import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Content from '../models/Content.model.js';
import Comment from '../models/Comment.model.js';
import User from '../models/User.model.js';

dotenv.config();

const cleanOrphanContent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const orphanContent = await Content.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorUser'
        }
      },
      {
        $match: {
          authorUser: { $size: 0 }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1
        }
      }
    ]);

    if (orphanContent.length === 0) {
      console.log('No orphan content found');
      await mongoose.connection.close();
      process.exit(0);
    }

    const orphanIds = orphanContent.map((item) => item._id);

    console.log(`Found orphan content: ${orphanIds.length}`);
    orphanContent.forEach((item) => {
      console.log(`- ${item._id} | ${item.title || 'Untitled'}`);
    });

    const deletedComments = await Comment.deleteMany({ content: { $in: orphanIds } });
    const contentDelete = await Content.deleteMany({ _id: { $in: orphanIds } });

    const favoritesCleanup = await User.updateMany(
      {},
      { $pull: { favorites: { $in: orphanIds } } }
    );

    const notificationsCleanup = await User.updateMany(
      {},
      { $pull: { notifications: { content: { $in: orphanIds } } } }
    );

    console.log('');
    console.log(`Deleted content: ${contentDelete.deletedCount}`);
    console.log(`Deleted comments: ${deletedComments.deletedCount}`);
    console.log(`Users favorites cleaned (matched): ${favoritesCleanup.matchedCount}`);
    console.log(`Users notifications cleaned (matched): ${notificationsCleanup.matchedCount}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    try {
      await mongoose.connection.close();
    } catch (_) {
      // ignore
    }
    process.exit(1);
  }
};

cleanOrphanContent();

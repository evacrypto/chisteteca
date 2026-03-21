/**
 * Migración: borra usuarios existentes (excepto admin) preservando el contenido.
 * Reasigna Content y Comment a un usuario "sistema" antes de borrar.
 *
 * Uso: node src/utils/migrate-email-verification.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Content from '../models/Content.model.js';
import Comment from '../models/Comment.model.js';

dotenv.config();

const SISTEMA_EMAIL = 'sistema@chisteteca.com';
const SISTEMA_USERNAME = 'sistema';

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let sistema = await User.findOne({ email: SISTEMA_EMAIL });
    if (!sistema) {
      sistema = await User.create({
        email: SISTEMA_EMAIL,
        username: SISTEMA_USERNAME,
        password: 'sistema-' + Date.now(),
        role: 'user',
        isEmailVerified: true,
        bio: 'Cuenta del sistema para contenido de usuarios eliminados'
      });
      console.log('Created sistema user');
    }

    const admin = await User.findOne({ role: 'admin' });
    const usersToDelete = await User.find({
      _id: { $nin: [sistema._id, admin?._id].filter(Boolean) }
    });

    console.log(`Found ${usersToDelete.length} users to delete`);

    for (const user of usersToDelete) {
      const contentCount = await Content.countDocuments({ author: user._id });
      const commentCount = await Comment.countDocuments({ user: user._id });

      if (contentCount > 0) {
        await Content.updateMany(
          { author: user._id },
          {
            $set: {
              author: sistema._id,
              authorName: 'Usuario eliminado',
              authorAvatar: ''
            }
          }
        );
        console.log(`  Reassigned ${contentCount} content from ${user.username}`);
      }

      if (commentCount > 0) {
        await Comment.updateMany(
          { user: user._id },
          {
            $set: {
              user: sistema._id,
              username: 'Usuario eliminado',
              userAvatar: ''
            }
          }
        );
        console.log(`  Reassigned ${commentCount} comments from ${user.username}`);
      }

      await User.deleteOne({ _id: user._id });
      console.log(`  Deleted user ${user.username}`);
    }

    await User.updateMany(
      { _id: { $in: [sistema._id, admin?._id].filter(Boolean) } },
      { $set: { isEmailVerified: true } }
    );
    console.log('Marked admin and sistema as verified');

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();

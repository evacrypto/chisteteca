import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Content from '../models/Content.model.js';
import User from '../models/User.model.js';

dotenv.config();

const normalizeText = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const backfillContentCreators = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const contents = await Content.find({});
    let updated = 0;
    let unresolved = 0;

    for (const content of contents) {
      const user = await User.findById(content.author).select('username avatar');

      const nextAuthorName = user
        ? normalizeText(user.username, 'Usuario desconocido')
        : normalizeText(content.authorName, 'Usuario desconocido');

      const nextAuthorAvatar = user
        ? normalizeText(user.avatar, '')
        : normalizeText(content.authorAvatar, '');

      const shouldUpdateName = normalizeText(content.authorName, '') !== nextAuthorName;
      const shouldUpdateAvatar = normalizeText(content.authorAvatar, '') !== nextAuthorAvatar;

      if (shouldUpdateName || shouldUpdateAvatar) {
        content.authorName = nextAuthorName;
        content.authorAvatar = nextAuthorAvatar;
        await content.save();
        updated += 1;
      }

      if (!user) {
        unresolved += 1;
      }
    }

    console.log('');
    console.log(`Backfill completed. Updated: ${updated}`);
    console.log(`Content with missing linked user: ${unresolved}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    try {
      await mongoose.connection.close();
    } catch (_) {
      // ignore close errors
    }
    process.exit(1);
  }
};

backfillContentCreators();

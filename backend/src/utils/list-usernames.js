/**
 * Lista todos los usernames en User y Content.authorName para identificar
 * cuáles necesitan espacios (ej. borisjohnson → boris johnson).
 *
 * Ejecutar: node src/utils/list-usernames.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Content from '../models/Content.model.js';

dotenv.config();

async function listUsernames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB\n');
  } catch (err) {
    console.error('Error conectando:', err.message);
    process.exit(1);
  }

  const users = await User.find({}, 'username').lean();
  const userNames = [...new Set(users.map((u) => u.username).filter(Boolean))];

  const contents = await Content.aggregate([{ $group: { _id: '$authorName' } }]);
  const contentNames = contents.map((c) => c._id).filter(Boolean);

  const allNames = [...new Set([...userNames, ...contentNames])].sort();

  console.log('Usernames en la BD (sin espacios = candidatos a corregir):\n');
  for (const name of allNames) {
    const hasSpaces = name.includes(' ');
    const marker = hasSpaces ? '' : '  ← sin espacios';
    console.log(`  "${name}"${marker}`);
  }

  const noSpaces = allNames.filter((n) => !n.includes(' '));
  if (noSpaces.length > 0) {
    console.log('\n--- Para corregir, añade a backend/data/username-fixes.json ---');
    console.log('Ejemplo (edita con los nombres correctos):');
    const example = {};
    noSpaces.slice(0, 5).forEach((n) => {
      example[n] = n; // placeholder, user must edit
    });
    console.log(JSON.stringify(example, null, 2));
    console.log('\nLuego ejecuta: npm run fix:usernames');
  }

  await mongoose.disconnect();
  process.exit(0);
}

listUsernames().catch((err) => {
  console.error(err);
  process.exit(1);
});

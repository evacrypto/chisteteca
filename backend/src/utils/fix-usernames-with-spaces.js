/**
 * Script para corregir usernames que deberían tener espacios.
 * 
 * Crea backend/data/username-fixes.json con el mapeo:
 * { "borisjohnson": "boris johnson", "pepeperez": "pepe perez" }
 * 
 * Luego ejecuta: node src/utils/fix-usernames-with-spaces.js
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Content from '../models/Content.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const FIXES_FILE = path.join(__dirname, '../../data/username-fixes.json');

async function fixUsernames() {
  if (!fs.existsSync(FIXES_FILE)) {
    console.log('Creando archivo de ejemplo: backend/data/username-fixes.json');
    const example = {
      borisjohnson: 'boris johnson',
      pepeperez: 'pepe perez'
    };
    fs.mkdirSync(path.dirname(FIXES_FILE), { recursive: true });
    fs.writeFileSync(FIXES_FILE, JSON.stringify(example, null, 2), 'utf-8');
    console.log('Edita ese archivo con tus correcciones y vuelve a ejecutar este script.');
    process.exit(0);
    return;
  }

  let fixes;
  try {
    fixes = JSON.parse(fs.readFileSync(FIXES_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error leyendo username-fixes.json:', err.message);
    process.exit(1);
  }

  const entries = Object.entries(fixes);
  if (entries.length === 0) {
    console.log('No hay correcciones en username-fixes.json');
    process.exit(0);
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB\n');
  } catch (err) {
    console.error('Error conectando:', err.message);
    process.exit(1);
  }

  let usersUpdated = 0;
  let contentsUpdated = 0;

  for (const [oldUsername, newUsername] of entries) {
    const user = await User.findOne({ username: oldUsername });
    if (!user) {
      console.log(`  ⏭️  Usuario "${oldUsername}" no encontrado`);
      continue;
    }

    const trimmedNew = newUsername.trim();
    const existing = await User.findOne({ username: trimmedNew, _id: { $ne: user._id } });
    if (existing) {
      console.log(`  ⚠️  "${trimmedNew}" ya existe como otro usuario, saltando`);
      continue;
    }

    user.username = trimmedNew;
    await user.save();
    usersUpdated++;
    console.log(`  ✅ User: "${oldUsername}" → "${newUsername}"`);

    const result = await Content.updateMany(
      { author: user._id },
      { $set: { authorName: trimmedNew } }
    );
    if (result.modifiedCount > 0) {
      contentsUpdated += result.modifiedCount;
      console.log(`     → ${result.modifiedCount} contenidos actualizados`);
    }
  }

  console.log(`\n📊 Resumen: ${usersUpdated} usuarios, ${contentsUpdated} contenidos actualizados`);
  await mongoose.disconnect();
  process.exit(0);
}

fixUsernames().catch((err) => {
  console.error(err);
  process.exit(1);
});

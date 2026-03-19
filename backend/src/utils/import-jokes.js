/**
 * Script para importar chistes desde un archivo JSON.
 * Uso: node src/utils/import-jokes.js [ruta/al/archivo.json]
 *
 * Formato esperado del JSON (array de objetos):
 * - text (requerido): texto del chiste
 * - categoryName (opcional): nombre de una categoría
 * - categoryNames (opcional): array de nombres de categorías
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Content from '../models/Content.model.js';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const DEFAULT_IMPORT_FILE = path.join(__dirname, '../../data/jokes-import.json');

async function importJokes() {
  const filePath = process.argv[2] || DEFAULT_IMPORT_FILE;

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`);
    console.log('\nUso: node src/utils/import-jokes.js [ruta/al/archivo.json]');
    console.log('Formato esperado: ver backend/docs/IMPORT_JOKES_FORMAT.md');
    process.exit(1);
  }

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error('❌ Error leyendo archivo:', err.message);
    process.exit(1);
  }

  let jokes;
  try {
    jokes = JSON.parse(raw);
  } catch (err) {
    console.error('❌ JSON inválido:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(jokes)) {
    console.error('❌ El JSON debe ser un array de objetos.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  }

  let author = await User.findOne({ role: 'admin' });
  if (!author) {
    author = await User.findOne({});
  }
  if (!author) {
    console.error('❌ No hay usuarios en la base de datos. Ejecuta el seed primero.');
    process.exit(1);
  }
  console.log(`📝 Autor asignado: ${author.username} (${author._id})\n`);

  const categoryCache = {};
  const getOrCreateCategory = async (name) => {
    const key = name.trim().toLowerCase();
    if (categoryCache[key]) return categoryCache[key];
    const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let cat = await Category.findOne({ name: new RegExp(`^${escaped}$`, 'i') });
    if (!cat) {
      cat = await Category.create({
        name: name.trim(),
        emoji: '😂',
        color: '#ffc107',
        isActive: true,
        isPending: false,
        createdBy: author._id
      });
      console.log(`   📁 Categoría creada: ${cat.name}`);
    }
    categoryCache[key] = cat;
    return cat;
  };

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < jokes.length; i++) {
    const item = jokes[i];
    const text = (item.text || '').trim();

    if (!text) {
      console.log(`⏭️  [${i + 1}] Saltado: sin texto`);
      skipped++;
      continue;
    }

    const title = (item.title || text.substring(0, 50)).trim().substring(0, 200);
    const categoryNames = item.categoryNames || (item.categoryName ? [item.categoryName] : []);

    const categoryIds = [];
    for (const name of categoryNames) {
      if (name && typeof name === 'string') {
        const cat = await getOrCreateCategory(name);
        categoryIds.push(cat._id);
      }
    }

    try {
      await Content.create({
        title,
        text,
        type: 'chiste',
        author: author._id,
        authorName: author.username,
        authorAvatar: author.avatar || '',
        categories: categoryIds,
        isApproved: item.isApproved !== false,
        views: item.views || 0,
        likes: [],
        commentsCount: 0,
        shares: 0
      });
      imported++;
      console.log(`✅ [${i + 1}] Importado: "${text.substring(0, 50)}..."`);
    } catch (err) {
      console.error(`❌ [${i + 1}] Error:`, err.message);
      skipped++;
    }
  }

  console.log(`\n📊 Resumen: ${imported} importados, ${skipped} saltados/errores`);
  await mongoose.disconnect();
  process.exit(0);
}

importJokes().catch((err) => {
  console.error(err);
  process.exit(1);
});

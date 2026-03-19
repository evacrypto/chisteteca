/**
 * Script para recuperar categorías en contenido que las perdió.
 *
 * 1. Asigna una categoría por defecto a chistes con categories: []
 * 2. Limpia referencias a categorías eliminadas (IDs huérfanos)
 *
 * Ejecutar: npm run recover:categories
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Content from '../models/Content.model.js';
import Category from '../models/Category.model.js';

dotenv.config();

async function recoverCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chisteteca');
    console.log('Conectado a MongoDB\n');

    const defaultCategory = await Category.findOne({ isActive: true }).sort({ createdAt: 1 });
    if (!defaultCategory) {
      console.log('No hay categorías en la base de datos. Crea al menos una categoría primero.');
      process.exit(1);
    }
    console.log(`Categoría por defecto para recuperación: ${defaultCategory.emoji} ${defaultCategory.name} (${defaultCategory._id})\n`);

    // 1. Contenido con categorías vacías
    const emptyCategories = await Content.find({
      $or: [{ categories: { $size: 0 } }, { categories: { $exists: false } }]
    }).lean();

    if (emptyCategories.length > 0) {
      console.log(`Encontrados ${emptyCategories.length} chistes/contenidos sin categorías.`);
      const result = await Content.updateMany(
        { _id: { $in: emptyCategories.map((c) => c._id) } },
        { $set: { categories: [defaultCategory._id] } }
      );
      console.log(`✅ Asignada categoría por defecto a ${result.modifiedCount} items.\n`);
    } else {
      console.log('No hay contenido con categorías vacías.\n');
    }

    // 2. Limpiar referencias huérfanas (IDs que ya no existen en Category)
    const allCategories = await Category.find({}, '_id').lean();
    const validCategoryIds = new Set(allCategories.map((c) => c._id.toString()));

    const contentWithCategories = await Content.find({
      categories: { $exists: true, $ne: [] }
    }).select('_id categories title text').lean();

    let fixedOrphans = 0;
    for (const doc of contentWithCategories) {
      const validIds = (doc.categories || [])
        .map((id) => id.toString())
        .filter((id) => validCategoryIds.has(id));

      if (validIds.length !== (doc.categories || []).length) {
        const toSet = validIds.length > 0
          ? validIds.map((id) => new mongoose.Types.ObjectId(id))
          : [defaultCategory._id];
        await Content.updateOne({ _id: doc._id }, { $set: { categories: toSet } });
        fixedOrphans++;
      }
    }

    if (fixedOrphans > 0) {
      console.log(`✅ Corregidas ${fixedOrphans} referencias huérfanas a categorías eliminadas.\n`);
    } else {
      console.log('No hay referencias huérfanas.\n');
    }

    console.log('Listo. Las categorías se muestran con su emoji y color actual al hacer populate.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
    process.exit(0);
  }
}

recoverCategories();

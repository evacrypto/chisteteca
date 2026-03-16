import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      email: 'admin@chisteteca.com',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      bio: 'Administrador de Chisteteca'
    });
    console.log('👤 Created admin user');

    // Create default categories
    const categoriesData = [
      { name: 'Chistes de programadores', emoji: '💻', description: 'Para los que saben de código' },
      { name: 'Chistes de Jaimito', emoji: '👦', description: 'El clásico niño travieso' },
      { name: 'Chistes malos', emoji: '😅', description: 'Dad jokes que hacen gemir' },
      { name: 'Humor absurdo', emoji: '🤪', description: 'No tiene sentido, pero da risa' },
      { name: 'Memes', emoji: '🖼️', description: 'Los mejores memes' },
      { name: 'Videos graciosos', emoji: '🎬', description: 'Para morir de risa' },
      { name: 'Animales', emoji: '🐶', description: 'Nuestros amigos peludos' },
      { name: 'Trabajo', emoji: '💼', description: 'Para sobrevivir la oficina' },
      { name: 'Escuela', emoji: '📚', description: 'Del kinder a la uni' },
      { name: 'Tecnología', emoji: '📱', description: 'Gadgets y apps' }
    ];

    const categories = [];
    for (const cat of categoriesData) {
      const category = await Category.create({
        ...cat,
        createdBy: admin._id,
        isPending: false,
        isActive: true
      });
      categories.push(category);
    }
    console.log(`📁 Created ${categories.length} categories`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - 1 Admin user (admin@chisteteca.com / admin123)`);
    console.log(`   - ${categories.length} Categories`);
    console.log('\n🎉 ¡Ahora puedes login como admin y publicar chistes!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

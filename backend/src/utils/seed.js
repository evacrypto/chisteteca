import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';
import Content from '../models/Content.model.js';
import Comment from '../models/Comment.model.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Content.deleteMany({});
    await Comment.deleteMany({});
    console.log('Cleared existing data');

    const admin = await User.create({
      email: 'admin@chisteteca.es',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      bio: 'Administrador de Chisteteca',
      isEmailVerified: true
    });

    const demoUsers = await User.insertMany([
      {
        email: 'sofia@chisteteca.com',
        username: 'sofia',
        password: 'demo1234',
        bio: 'Fan del humor cotidiano.',
        isEmailVerified: true
      },
      {
        email: 'diego@chisteteca.com',
        username: 'diego',
        password: 'demo1234',
        bio: 'Coleccionista de chistes malos.',
        isEmailVerified: true
      },
      {
        email: 'marta@chisteteca.com',
        username: 'marta',
        password: 'demo1234',
        bio: 'Memes y cafe en ese orden.',
        isEmailVerified: true
      }
    ]);

    console.log('Created users');

    const categoriesData = [
      { name: 'Chistes de programadores', emoji: '💻', color: '#6f42c1', description: 'Para los que saben de codigo y de humor' },
      { name: 'Chistes de Jaimito', emoji: '👦', color: '#fd7e14', description: 'El clasico nino travieso' },
      { name: 'Chistes malos', emoji: '👨‍👧', color: '#20c997', description: 'Dad jokes que hacen gemir' },
      { name: 'Humor absurdo', emoji: '🤪', color: '#e83e8c', description: 'No tiene sentido, pero da risa' },
      { name: 'Actualidad politica', emoji: '🌍', color: '#dc3545', description: 'Reirnos para no llorar' },
      { name: 'Memes', emoji: '🖼️', color: '#ffc107', description: 'Los mejores memes de internet' }
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

    console.log('Created categories');

    const jokes = [
      {
        title: 'Error de produccion',
        text: '-Por que los programadores confunden Halloween con Navidad?\n-Porque 31 OCT = 25 DEC',
        type: 'chiste',
        isApproved: true
      },
      {
        title: 'El clasico de Jaimito',
        text: 'La maestra le dice a Jaimito: si en una mano tengo 5 naranjas y en la otra 6, que tengo?\nUnas manos enormes, maestra.',
        type: 'chiste',
        isApproved: true
      },
      {
        title: 'Debugging eterno',
        text: 'Mis commits son: init, fix, fix real, fix final, fix final ahora si.',
        type: 'chiste',
        isApproved: true
      },
      {
        title: 'Stack Overflow',
        text: 'Como llamas a un programador que no usa Stack Overflow?\nDesempleado.',
        type: 'chiste',
        isApproved: false
      }
    ];

    const creators = [admin, ...demoUsers];

    const contents = [];
    for (let i = 0; i < jokes.length; i += 1) {
      const joke = jokes[i];
      const creator = creators[i % creators.length];
      const category = categories[i % categories.length];

      const content = await Content.create({
        ...joke,
        author: creator._id,
        authorName: creator.username,
        authorAvatar: creator.avatar || '',
        categories: [category._id],
        views: Math.floor(Math.random() * 1000)
      });
      contents.push(content);
    }

    await Promise.all(creators.map((u) => u.updateStats()));

    console.log('Database seeded successfully');
    console.log('Summary:');
    console.log(' - 1 Admin user (admin@chisteteca.es / admin123)');
    console.log(` - ${demoUsers.length} Demo users (password: demo1234)`);
    console.log(` - ${categories.length} Categories`);
    console.log(` - ${contents.length} Content items`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

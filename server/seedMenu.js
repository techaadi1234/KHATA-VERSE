import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MenuItem from './models/MenuItem.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const sampleMenuItems = [
  { itemName: 'Chai', price: 10, category: 'Beverages' },
  { itemName: 'Cold Coffee', price: 30, category: 'Beverages' },
  { itemName: 'Samosa', price: 15, category: 'Snacks' },
  { itemName: 'Maggi', price: 35, category: 'Snacks' },
  { itemName: 'Cheese Maggi', price: 50, category: 'Snacks' },
  { itemName: 'Egg Roll', price: 45, category: 'Meals' },
  { itemName: 'Paneer Roll', price: 60, category: 'Meals' },
  { itemName: 'Veg Fried Rice', price: 70, category: 'Meals' },
  { itemName: 'Chicken Manchurian', price: 90, category: 'Meals' },
];

const seedMenu = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI is missing from your .env file!');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB...');

    await MenuItem.deleteMany({});
    await MenuItem.insertMany(sampleMenuItems);

    console.log('✅ Canteen menu items successfully populated into MongoDB!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedMenu();
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const loadVendorsFromEnv = () => {
  const vendors = [];
  const seenEmails = new Set();

  const pushVendor = (name, email, password, label) => {
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const trimmedPassword = String(password || '');
    const trimmedName = String(name || '').trim() || `Vendor ${label}`;

    if (!trimmedEmail && !trimmedPassword) return;

    if (!trimmedEmail || !trimmedPassword) {
      throw new Error(
        `Incomplete vendor ${label}: set both email and password (name is optional).`
      );
    }

    if (seenEmails.has(trimmedEmail)) {
      throw new Error(`Duplicate vendor email in .env: ${trimmedEmail}`);
    }

    seenEmails.add(trimmedEmail);
    vendors.push({ name: trimmedName, email: trimmedEmail, password: trimmedPassword });
  };

  // Back-compat: single VENDOR_NAME / VENDOR_EMAIL / VENDOR_PASSWORD
  if (process.env.VENDOR_EMAIL || process.env.VENDOR_PASSWORD) {
    pushVendor(
      process.env.VENDOR_NAME,
      process.env.VENDOR_EMAIL,
      process.env.VENDOR_PASSWORD,
      'VENDOR'
    );
  }

  // Numbered vendors: VENDOR_1_*, VENDOR_2_*, ...
  const indexes = new Set();
  for (const key of Object.keys(process.env)) {
    const match = key.match(/^VENDOR_(\d+)_(NAME|EMAIL|PASSWORD)$/);
    if (match) indexes.add(Number(match[1]));
  }

  for (const index of [...indexes].sort((a, b) => a - b)) {
    pushVendor(
      process.env[`VENDOR_${index}_NAME`],
      process.env[`VENDOR_${index}_EMAIL`],
      process.env[`VENDOR_${index}_PASSWORD`],
      `VENDOR_${index}`
    );
  }

  return vendors;
};

const seedVendors = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      console.error('MONGO_URI is missing from server/.env');
      process.exit(1);
    }

    const vendors = loadVendorsFromEnv();
    if (vendors.length === 0) {
      console.error(
        'No vendors found. Add VENDOR_1_EMAIL / VENDOR_1_PASSWORD (and VENDOR_2_*, …) in server/.env'
      );
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB...');

    for (const vendor of vendors) {
      const existing = await User.findOne({ email: vendor.email });

      if (existing) {
        if (existing.role !== 'vendor') {
          console.error(`Skipped ${vendor.email}: already exists as a ${existing.role}`);
          continue;
        }
        existing.name = vendor.name;
        existing.password = vendor.password;
        await existing.save();
        console.log(`Updated vendor: ${vendor.email}`);
      } else {
        await User.create({
          name: vendor.name,
          email: vendor.email,
          password: vendor.password,
          role: 'vendor',
        });
        console.log(`Created vendor: ${vendor.email}`);
      }
    }

    const allowedEmails = vendors.map((vendor) => vendor.email);
    const staleVendors = await User.find({
      role: 'vendor',
      email: { $nin: allowedEmails },
    }).select('email name');

    if (staleVendors.length > 0) {
      const staleEmails = staleVendors.map((vendor) => vendor.email);
      await User.deleteMany({ role: 'vendor', email: { $nin: allowedEmails } });
      console.log(
        `Removed ${staleVendors.length} vendor(s) no longer in .env: ${staleEmails.join(', ')}`
      );
    }

    console.log(`Vendor seed complete (${vendors.length}). Login only — signup is disabled.`);
    process.exit(0);
  } catch (error) {
    console.error('Vendor seeding failed:', error.message || error);
    process.exit(1);
  }
};

seedVendors();

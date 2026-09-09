import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { ensureDefaultContent } from './ensureContent.js';

await connectDB();

const email = (process.env.ADMIN_EMAIL || 'info@graciouscarenc.com').toLowerCase();
if (!await User.findOne({ email })) {
  await User.create({
    name: process.env.ADMIN_NAME || 'Gracious Administrator',
    email,
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!'
  });
}

const content = await ensureDefaultContent();
console.log(`Seed complete: ${content.photographs} photographs, ${content.videos} videos and ${content.heroes} hero slides are ready.`);
await mongoose.disconnect();

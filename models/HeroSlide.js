import mongoose from 'mongoose';

export const HERO_PAGES = [
  'home',
  'about',
  'care',
  'living',
  'gallery',
  'video-gallery',
  'reviews',
  'contact',
  'application'
];

const heroSlideSchema = new mongoose.Schema({
  page: { type: String, enum: HERO_PAGES, required: true, index: true },
  seedKey: { type: String, trim: true },
  eyebrow: { type: String, trim: true, maxlength: 120 },
  icon: { type: String, trim: true, maxlength: 80 },
  title: { type: String, required: true, trim: true, maxlength: 220 },
  text: { type: String, trim: true, maxlength: 700 },
  imageUrl: { type: String, required: true, trim: true },
  imageAlt: { type: String, trim: true, maxlength: 220 },
  backgroundPosition: { type: String, trim: true, maxlength: 80, default: 'center center' },
  primaryLabel: { type: String, trim: true, maxlength: 80 },
  primaryHref: { type: String, trim: true, maxlength: 300 },
  secondaryLabel: { type: String, trim: true, maxlength: 80 },
  secondaryHref: { type: String, trim: true, maxlength: 300 },
  sortOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

heroSlideSchema.index({ page: 1, active: 1, sortOrder: 1, createdAt: 1 });
heroSlideSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

export default mongoose.model('HeroSlide', heroSlideSchema);

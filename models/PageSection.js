import mongoose from 'mongoose';

const sectionItemSchema = new mongoose.Schema({
  icon: { type: String, trim: true, default: '' },
  title: { type: String, trim: true, default: '' },
  text: { type: String, trim: true, default: '' }
}, { _id: false });

const sectionImageSchema = new mongoose.Schema({
  label: { type: String, trim: true, default: 'Section image' },
  url: { type: String, trim: true, required: true },
  alt: { type: String, trim: true, default: '' },
  visible: { type: Boolean, default: true },
  captionTitle: { type: String, trim: true, default: '' },
  captionText: { type: String, trim: true, default: '' },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const pageSectionSchema = new mongoose.Schema({
  seedKey: { type: String, trim: true, unique: true, sparse: true, index: true },
  page: { type: String, required: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  template: { type: String, required: true, trim: true, default: 'split-left' },
  eyebrow: { type: String, trim: true, default: '' },
  title: { type: String, trim: true, default: '' },
  lead: { type: String, trim: true, default: '' },
  body: { type: String, trim: true, default: '' },
  secondaryBody: { type: String, trim: true, default: '' },
  noteTitle: { type: String, trim: true, default: '' },
  noteText: { type: String, trim: true, default: '' },
  badgeText: { type: String, trim: true, default: '' },
  buttonLabel: { type: String, trim: true, default: '' },
  buttonHref: { type: String, trim: true, default: '' },
  items: { type: [sectionItemSchema], default: [] },
  images: { type: [sectionImageSchema], default: [] },
  active: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
  system: { type: Boolean, default: false },
  custom: { type: Boolean, default: false }
}, { timestamps: true });

pageSectionSchema.index({ page: 1, sortOrder: 1, createdAt: 1 });

export default mongoose.model('PageSection', pageSectionSchema);

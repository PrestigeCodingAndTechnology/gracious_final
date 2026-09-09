import mongoose from 'mongoose';
const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image','video'], required: true },
  title: { type: String, trim: true, maxlength: 120 },
  caption: { type: String, trim: true, maxlength: 300 },
  url: { type: String, required: true, trim: true },
  posterUrl: { type: String, trim: true },
  alt: { type: String, trim: true, maxlength: 180 },
  sortOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });
mediaSchema.index({ type: 1, active: 1, sortOrder: 1 });
export default mongoose.model('Media', mediaSchema);

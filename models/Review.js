import mongoose from 'mongoose';
const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  relationship: { type: String, trim: true, maxlength: 100 },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  message: { type: String, required: true, trim: true, maxlength: 1200 },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  featured: { type: Boolean, default: false },
  approvedAt: Date
}, { timestamps: true });
reviewSchema.index({ status: 1, approvedAt: -1, createdAt: -1 });
export default mongoose.model('Review', reviewSchema);

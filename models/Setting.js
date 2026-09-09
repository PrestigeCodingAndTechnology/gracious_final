import mongoose from 'mongoose';
const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true, trim: true },
  value: { type: String, default: '' },
  label: { type: String, trim: true }
}, { timestamps: true });
export default mongoose.model('Setting', settingSchema);

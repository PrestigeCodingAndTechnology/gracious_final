import mongoose from 'mongoose';
const inquirySchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, trim: true, maxlength: 60 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 30 },
  interest: { type: String, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 2500 },
  status: { type: String, enum: ['new','contacted','closed'], default: 'new' },
  notes: { type: String, trim: true, maxlength: 2500 }
}, { timestamps: true });
export default mongoose.model('Inquiry', inquirySchema);

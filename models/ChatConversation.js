import mongoose from 'mongoose';

const chatConversationSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, index: true },
  name: { type: String, trim: true, maxlength: 80, default: 'Website Visitor' },
  email: { type: String, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40 },
  status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  lastMessage: { type: String, trim: true, maxlength: 500, default: '' },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  unreadAdmin: { type: Number, default: 0, min: 0 },
  unreadVisitor: { type: Number, default: 0, min: 0 },
  visitorOnline: { type: Boolean, default: false },
  adminOnline: { type: Boolean, default: false },
  closedAt: Date
}, { timestamps: true });

chatConversationSchema.index({ visitorId: 1, status: 1 });
chatConversationSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.model('ChatConversation', chatConversationSchema);

import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', required: true, index: true },
  sender: { type: String, enum: ['visitor', 'admin'], required: true },
  senderName: { type: String, trim: true, maxlength: 80 },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  readAt: Date
}, { timestamps: true });

chatMessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);

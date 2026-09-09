import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';

const router = express.Router();

const clean = (value, max = 2000) => String(value || '').trim().slice(0, max);

router.post('/start', async (req, res, next) => {
  try {
    const visitorId = clean(req.body.visitorId, 120) || crypto.randomUUID();
    let conversation = await ChatConversation.findOne({ visitorId, status: 'open' }).sort({ updatedAt: -1 });
    if (!conversation) {
      conversation = await ChatConversation.create({
        visitorId,
        name: clean(req.body.name, 80) || 'Website Visitor',
        email: clean(req.body.email, 160).toLowerCase(),
        phone: clean(req.body.phone, 40)
      });
    } else {
      conversation.name = clean(req.body.name, 80) || conversation.name;
      conversation.email = clean(req.body.email, 160).toLowerCase() || conversation.email;
      conversation.phone = clean(req.body.phone, 40) || conversation.phone;
      await conversation.save();
    }
    req.app.get('io')?.to('admins').emit('admin:conversation-started', {
      conversationId: conversation.id,
      name: conversation.name,
      email: conversation.email || '',
      phone: conversation.phone || '',
      status: conversation.status,
      lastMessage: conversation.lastMessage || 'Conversation started',
      lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
      unreadAdmin: conversation.unreadAdmin || 0
    });
    res.json({ ok: true, visitorId, conversationId: conversation.id, status: conversation.status });
  } catch (error) { next(error); }
});

router.get('/:id/messages', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ ok: false });
    const visitorId = clean(req.query.visitorId, 120);
    const conversation = await ChatConversation.findOne({ _id: req.params.id, visitorId });
    if (!conversation) return res.status(403).json({ ok: false, error: 'Conversation not available.' });
    const messages = await ChatMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 }).limit(300).lean();
    await Promise.all([
      ChatMessage.updateMany({ conversation: conversation._id, sender: 'admin', readAt: null }, { $set: { readAt: new Date() } }),
      ChatConversation.updateOne({ _id: conversation._id }, { $set: { unreadVisitor: 0 } })
    ]);
    res.json({ ok: true, conversation, messages });
  } catch (error) { next(error); }
});

export default router;

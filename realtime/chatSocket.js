import mongoose from 'mongoose';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';

const clean = (value, max = 2000) => String(value || '').trim().slice(0, max);
const room = (id) => `conversation:${id}`;

export function registerChatSocket(io, dependencies = {}) {
  const Conversation = dependencies.ChatConversation || ChatConversation;
  const Message = dependencies.ChatMessage || ChatMessage;
  io.on('connection', (socket) => {
    const isAdmin = socket.request.session?.user?.role === 'admin';
    const adminName = socket.request.session?.user?.name || 'Gracious Team';
    if (isAdmin) socket.join('admins');

    socket.on('visitor:join', async (payload = {}, ack = () => {}) => {
      try {
        const conversationId = clean(payload.conversationId, 40);
        const visitorId = clean(payload.visitorId, 120);
        if (!mongoose.isValidObjectId(conversationId)) return ack({ ok: false });
        const conversation = await Conversation.findOne({ _id: conversationId, visitorId });
        if (!conversation) return ack({ ok: false });
        socket.data.chatRole = 'visitor';
        socket.data.conversationId = conversationId;
        socket.data.visitorId = visitorId;
        socket.join(room(conversationId));
        await Conversation.updateOne({ _id: conversationId }, { $set: { visitorOnline: true, unreadVisitor: 0 } });
        await Message.updateMany({ conversation: conversationId, sender: 'admin', readAt: null }, { $set: { readAt: new Date() } });
        io.to(room(conversationId)).emit('presence:update', { visitorOnline: true });
        ack({ ok: true, status: conversation.status, adminOnline: conversation.adminOnline });
      } catch { ack({ ok: false }); }
    });

    socket.on('admin:join', async (payload = {}, ack = () => {}) => {
      try {
        if (!isAdmin) return ack({ ok: false, error: 'Unauthorized' });
        const conversationId = clean(payload.conversationId, 40);
        if (!mongoose.isValidObjectId(conversationId)) return ack({ ok: false });
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return ack({ ok: false });
        socket.data.chatRole = 'admin';
        socket.data.conversationId = conversationId;
        socket.join(room(conversationId));
        await Conversation.updateOne({ _id: conversationId }, { $set: { adminOnline: true, unreadAdmin: 0 } });
        await Message.updateMany({ conversation: conversationId, sender: 'visitor', readAt: null }, { $set: { readAt: new Date() } });
        io.to(room(conversationId)).emit('presence:update', { adminOnline: true });
        ack({ ok: true, status: conversation.status, visitorOnline: conversation.visitorOnline });
      } catch { ack({ ok: false }); }
    });

    socket.on('chat:message', async (payload = {}, ack = () => {}) => {
      try {
        const conversationId = clean(payload.conversationId, 40);
        const body = clean(payload.body, 2000);
        if (!body || !mongoose.isValidObjectId(conversationId)) return ack({ ok: false, error: 'Invalid message.' });
        if (conversationId !== socket.data.conversationId) return ack({ ok: false, error: 'Join this conversation before sending a message.' });
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return ack({ ok: false, error: 'Conversation not found.' });
        let sender;
        let senderName;
        if (isAdmin && socket.data.chatRole === 'admin') {
          sender = 'admin'; senderName = adminName;
        } else if (socket.data.chatRole === 'visitor' && socket.data.visitorId === conversation.visitorId) {
          sender = 'visitor'; senderName = conversation.name || 'Website Visitor';
        } else return ack({ ok: false, error: 'Unauthorized.' });
        if (conversation.status === 'closed' && sender === 'visitor') {
          conversation.status = 'open'; conversation.closedAt = undefined;
        }
        const message = await Message.create({ conversation: conversation._id, sender, senderName, body });
        conversation.lastMessage = body.slice(0, 500);
        conversation.lastMessageAt = new Date();
        if (sender === 'visitor') conversation.unreadAdmin += 1; else conversation.unreadVisitor += 1;
        await conversation.save();
        const data = { _id: message.id, conversationId, sender, senderName, body, createdAt: message.createdAt, readAt: message.readAt || null };
        io.to(room(conversationId)).emit('chat:message', data);
        io.to('admins').emit('admin:conversation-update', { conversationId, name: conversation.name, email: conversation.email || '', phone: conversation.phone || '', status: conversation.status, visitorOnline: conversation.visitorOnline, lastMessage: conversation.lastMessage, lastMessageAt: conversation.lastMessageAt, unreadAdmin: conversation.unreadAdmin, sender });
        ack({ ok: true, message: data });
      } catch { ack({ ok: false, error: 'Message could not be sent.' }); }
    });

    socket.on('chat:typing', (payload = {}) => {
      const conversationId = clean(payload.conversationId, 40);
      if (!mongoose.isValidObjectId(conversationId)) return;
      if (conversationId !== socket.data.conversationId) return;
      const role = isAdmin && socket.data.chatRole === 'admin' ? 'admin' : socket.data.chatRole === 'visitor' ? 'visitor' : null;
      if (role) socket.to(room(conversationId)).emit('chat:typing', { role, typing: Boolean(payload.typing) });
    });

    socket.on('chat:read', async (payload = {}) => {
      const conversationId = clean(payload.conversationId, 40);
      if (!mongoose.isValidObjectId(conversationId)) return;
      if (conversationId !== socket.data.conversationId) return;
      const role = isAdmin && socket.data.chatRole === 'admin' ? 'admin' : socket.data.chatRole === 'visitor' ? 'visitor' : null;
      if (!role) return;
      const senderToMark = role === 'admin' ? 'visitor' : 'admin';
      const unreadField = role === 'admin' ? 'unreadAdmin' : 'unreadVisitor';
      await Promise.all([
        Message.updateMany({ conversation: conversationId, sender: senderToMark, readAt: null }, { $set: { readAt: new Date() } }),
        Conversation.updateOne({ _id: conversationId }, { $set: { [unreadField]: 0 } })
      ]);
      io.to(room(conversationId)).emit('chat:read', { reader: role, readAt: new Date() });
    });

    socket.on('disconnect', async () => {
      try {
        const conversationId = socket.data.conversationId;
        if (!conversationId || !mongoose.isValidObjectId(conversationId)) return;
        const field = socket.data.chatRole === 'visitor' ? 'visitorOnline' : socket.data.chatRole === 'admin' ? 'adminOnline' : null;
        if (!field) return;
        await Conversation.updateOne({ _id: conversationId }, { $set: { [field]: false } });
        io.to(room(conversationId)).emit('presence:update', { [field]: false });
      } catch {}
    });
  });
}

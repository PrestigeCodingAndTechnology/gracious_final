import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerChatSocket } from '../realtime/chatSocket.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const conversationId = '64b64b64b64b64b64b64b64b';
const conversation = {
  _id: conversationId,
  id: conversationId,
  visitorId: 'visitor-123',
  name: 'Jordan Taylor',
  email: 'jordan@example.com',
  phone: '704-555-0100',
  status: 'open',
  lastMessage: '',
  lastMessageAt: new Date(),
  unreadAdmin: 0,
  unreadVisitor: 0,
  visitorOnline: false,
  adminOnline: false,
  async save() {}
};

const conversationUpdates = [];
const Conversation = {
  async findOne(query) { return query._id === conversationId && query.visitorId === conversation.visitorId ? conversation : null; },
  async findById(id) { return id === conversationId ? conversation : null; },
  async updateOne(query, update) {
    conversationUpdates.push({ query, update });
    if (update.$set) Object.assign(conversation, update.$set);
  }
};

let messageNumber = 0;
const Message = {
  async create(data) { messageNumber += 1; return { ...data, id: 'message-' + messageNumber, createdAt: new Date(), readAt: null }; },
  async updateMany() {}
};

class FakeSocket {
  constructor(session = {}) {
    this.request = { session };
    this.data = {};
    this.handlers = new Map();
    this.rooms = new Set();
    this.outbound = [];
  }
  on(event, handler) { this.handlers.set(event, handler); }
  join(room) { this.rooms.add(room); }
  to(room) { return { emit: (event, payload) => this.outbound.push({ room, event, payload }) }; }
  async trigger(event, payload = {}) {
    const handler = this.handlers.get(event);
    assert.ok(handler, 'Missing socket handler: ' + event);
    return new Promise((resolve, reject) => {
      try {
        const result = handler(payload, resolve);
        if (event === 'chat:typing' || event === 'chat:read' || event === 'disconnect') Promise.resolve(result).then(() => resolve({ ok: true }), reject);
      } catch (error) { reject(error); }
    });
  }
}

class FakeIO {
  constructor() { this.connectionHandler = null; this.broadcasts = []; }
  on(event, handler) { if (event === 'connection') this.connectionHandler = handler; }
  to(room) { return { emit: (event, payload) => this.broadcasts.push({ room, event, payload }) }; }
  connect(socket) { this.connectionHandler(socket); }
}

const io = new FakeIO();
registerChatSocket(io, { ChatConversation: Conversation, ChatMessage: Message });

const visitor = new FakeSocket();
io.connect(visitor);
const visitorJoin = await visitor.trigger('visitor:join', { conversationId, visitorId: conversation.visitorId });
assert.equal(visitorJoin.ok, true);
assert.equal(visitor.data.chatRole, 'visitor');
assert.ok(visitor.rooms.has('conversation:' + conversationId));

const admin = new FakeSocket({ user: { role: 'admin', name: 'Gracious Administrator' } });
io.connect(admin);
const adminJoin = await admin.trigger('admin:join', { conversationId });
assert.equal(adminJoin.ok, true);
assert.equal(admin.data.chatRole, 'admin');
assert.ok(admin.rooms.has('admins'));

const visitorMessage = await visitor.trigger('chat:message', { conversationId, body: 'Is a room available?' });
assert.equal(visitorMessage.ok, true);
assert.equal(visitorMessage.message.sender, 'visitor');
assert.equal(visitorMessage.message.conversationId, conversationId);

const adminMessage = await admin.trigger('chat:message', { conversationId, body: 'Thank you. Let us help with that.' });
assert.equal(adminMessage.ok, true);
assert.equal(adminMessage.message.sender, 'admin');
assert.equal(adminMessage.message.conversationId, conversationId);

const realtimeMessages = io.broadcasts.filter(item => item.event === 'chat:message');
assert.equal(realtimeMessages.length, 2);
assert.deepEqual(realtimeMessages.map(item => item.payload.sender), ['visitor', 'admin']);
assert.equal(io.broadcasts.filter(item => item.event === 'admin:conversation-update').length, 2);
assert.ok(conversationUpdates.length >= 2);

const adminClient = await fs.readFile(path.join(root, 'public', 'js', 'admin-chat.js'), 'utf8');
const visitorClient = await fs.readFile(path.join(root, 'public', 'js', 'chat.js'), 'utf8');
const chatRoute = await fs.readFile(path.join(root, 'routes', 'chat.js'), 'utf8');
assert.equal(adminClient.includes('location.reload'), false, 'Admin chat must never force a browser refresh');
assert.ok(adminClient.includes("socket.on('admin:conversation-started'"));
assert.ok(adminClient.includes("socket.on('admin:conversation-update'"));
assert.ok(visitorClient.includes("socket.on('chat:message'"));
assert.ok(chatRoute.includes("emit('admin:conversation-started'"));

console.log('Real-time validation passed: visitor join, admin join, two-way messaging and refresh-free inbox updates verified.');

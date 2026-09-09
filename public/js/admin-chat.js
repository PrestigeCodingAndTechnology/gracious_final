(() => {
  'use strict';
  const root = document.querySelector('.chat-admin');
  if (!root || typeof io === 'undefined') return;

  const selectedId = root.dataset.selectedId || '';
  const currentStatus = root.dataset.status || 'open';
  const socket = window.graciousAdminSocket || io({ transports: ['websocket', 'polling'] });
  const list = document.getElementById('conversationList');
  const countLabel = document.getElementById('conversationCount');
  const search = document.getElementById('conversationSearch');
  const messages = document.getElementById('adminMessages');
  const form = document.getElementById('adminChatForm');
  const input = document.getElementById('adminChatInput');
  const typing = document.getElementById('adminTyping');
  const presence = document.getElementById('visitorPresence');
  const presenceText = document.getElementById('visitorPresenceText');
  const connection = document.getElementById('adminSocketStatus');
  let typingTimer;
  let sendPending = false;

  function setConnection(state, label) {
    if (!connection) return;
    connection.classList.remove('connected', 'offline');
    if (state) connection.classList.add(state);
    const text = connection.querySelector('em');
    if (text) text.textContent = label;
  }

  function formatTime(value) {
    const date = new Date(value || Date.now());
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function updateCount() {
    if (!countLabel || !list) return;
    const total = list.querySelectorAll('.conversation-row').length;
    countLabel.textContent = total + ' ' + currentStatus;
  }

  function findRow(id) {
    return list?.querySelector('[data-conversation-id="' + id + '"]') || null;
  }

  function rowMatchesSearch(row) {
    const term = search?.value.trim().toLowerCase() || '';
    if (!term) return true;
    return ((row.dataset.name || '') + ' ' + (row.dataset.email || '') + ' ' + (row.dataset.phone || '') + ' ' + (row.querySelector('.conversation-preview')?.textContent || '')).toLowerCase().includes(term);
  }

  function applySearch() {
    list?.querySelectorAll('.conversation-row').forEach((row) => { row.hidden = !rowMatchesSearch(row); });
  }

  function createRow(data) {
    const row = document.createElement('a');
    row.className = 'conversation-row';
    row.dataset.conversationId = data.conversationId;
    row.dataset.name = data.name || 'Website Visitor';
    row.dataset.email = data.email || '';
    row.dataset.phone = data.phone || '';
    row.dataset.status = data.status || 'open';
    row.href = '/admin/chats?status=' + encodeURIComponent(currentStatus) + '&id=' + encodeURIComponent(data.conversationId);

    const avatar = document.createElement('span');
    avatar.className = 'conversation-avatar';
    avatar.append(document.createTextNode((data.name || 'V').charAt(0).toUpperCase()));
    const online = document.createElement('i');
    online.classList.toggle('online', Boolean(data.visitorOnline));
    avatar.appendChild(online);

    const content = document.createElement('span');
    content.className = 'conversation-content';
    const top = document.createElement('span');
    top.className = 'conversation-top';
    const name = document.createElement('strong');
    name.className = 'conversation-name';
    name.textContent = data.name || 'Website Visitor';
    const time = document.createElement('time');
    time.className = 'conversation-time';
    time.dateTime = new Date(data.lastMessageAt || Date.now()).toISOString();
    time.textContent = formatTime(data.lastMessageAt);
    top.append(name, time);
    const contact = document.createElement('small');
    contact.className = 'conversation-contact';
    contact.textContent = data.email || data.phone || 'Website visitor';
    const bottom = document.createElement('span');
    bottom.className = 'conversation-bottom';
    const preview = document.createElement('em');
    preview.className = 'conversation-preview';
    preview.textContent = data.lastMessage || 'Conversation started';
    const unread = document.createElement('b');
    unread.className = 'conversation-unread';
    unread.textContent = String(data.unreadAdmin || 0);
    unread.hidden = !data.unreadAdmin;
    bottom.append(preview, unread);
    content.append(top, contact, bottom);
    row.append(avatar, content);
    return row;
  }

  function upsertConversation(data) {
    if (!list || !data?.conversationId) return;
    const status = data.status || 'open';
    if (status !== currentStatus) {
      findRow(data.conversationId)?.remove();
      updateCount();
      return;
    }
    let row = findRow(data.conversationId);
    if (!row) {
      row = createRow(data);
      list.querySelector('[data-empty-conversations]')?.remove();
    }
    row.dataset.name = data.name || row.dataset.name || 'Website Visitor';
    if (data.email !== undefined) row.dataset.email = data.email || '';
    if (data.phone !== undefined) row.dataset.phone = data.phone || '';
    const name = row.querySelector('.conversation-name');
    const contact = row.querySelector('.conversation-contact');
    const preview = row.querySelector('.conversation-preview');
    const time = row.querySelector('.conversation-time');
    const unread = row.querySelector('.conversation-unread');
    if (name) name.textContent = data.name || row.dataset.name;
    if (contact) contact.textContent = row.dataset.email || row.dataset.phone || 'Website visitor';
    if (preview) preview.textContent = data.lastMessage || preview.textContent || 'Conversation started';
    if (time) {
      time.dateTime = new Date(data.lastMessageAt || Date.now()).toISOString();
      time.textContent = formatTime(data.lastMessageAt);
    }
    if (unread) {
      const amount = data.conversationId === selectedId ? 0 : Number(data.unreadAdmin || 0);
      unread.textContent = String(amount);
      unread.hidden = amount < 1;
    }
    row.classList.toggle('selected', data.conversationId === selectedId);
    list.prepend(row);
    row.hidden = !rowMatchesSearch(row);
    updateCount();
  }

  function addMessage(message) {
    if (!messages || !message?._id || messages.querySelector('[data-id="' + message._id + '"]')) return;
    messages.querySelector('.thread-start')?.remove();
    const item = document.createElement('div');
    item.className = 'admin-message ' + message.sender;
    item.dataset.id = message._id;
    const bubble = document.createElement('div');
    bubble.textContent = message.body;
    const meta = document.createElement('small');
    meta.textContent = (message.sender === 'admin' ? 'Gracious Team' : root.dataset.selectedName || 'Visitor') + ' · ' + new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    item.append(bubble, meta);
    messages.appendChild(item);
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }

  function joinSelected() {
    if (!selectedId || !socket.connected) return;
    socket.emit('admin:join', { conversationId: selectedId }, (result) => {
      if (!result?.ok) return;
      const online = Boolean(result.visitorOnline);
      presence?.classList.toggle('online', online);
      if (presenceText) presenceText.textContent = online ? 'Online now' : 'Currently offline';
      socket.emit('chat:read', { conversationId: selectedId });
    });
  }

  socket.on('connect', () => {
    setConnection('connected', 'Live');
    joinSelected();
  });
  socket.on('disconnect', () => setConnection('offline', 'Reconnecting'));
  socket.on('connect_error', () => setConnection('offline', 'Offline'));
  socket.on('chat:message', (message) => {
    if (message.conversationId && message.conversationId !== selectedId) return;
    addMessage(message);
    if (selectedId) socket.emit('chat:read', { conversationId: selectedId });
  });
  socket.on('chat:typing', (data) => {
    if (typing && data.role === 'visitor') typing.hidden = !data.typing;
  });
  socket.on('presence:update', (data) => {
    if (typeof data.visitorOnline !== 'boolean') return;
    presence?.classList.toggle('online', data.visitorOnline);
    if (presenceText) presenceText.textContent = data.visitorOnline ? 'Online now' : 'Currently offline';
    const row = findRow(selectedId);
    row?.querySelector('.conversation-avatar i')?.classList.toggle('online', data.visitorOnline);
  });
  socket.on('admin:conversation-started', upsertConversation);
  socket.on('admin:conversation-update', upsertConversation);

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body || !selectedId || sendPending) return;
    const sendButton = form.querySelector('button[type="submit"]');
    sendPending = true;
    sendButton.disabled = true;
    input.value = '';
    input.style.height = '';
    socket.emit('chat:typing', { conversationId: selectedId, typing: false });
    socket.emit('chat:message', { conversationId: selectedId, body }, (result) => {
      sendPending = false;
      sendButton.disabled = false;
      if (result?.ok) return;
      input.value = body;
      input.dispatchEvent(new Event('input'));
      window.alert(result?.error || 'Your reply was not sent. Please try again.');
    });
  });

  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 115) + 'px';
    socket.emit('chat:typing', { conversationId: selectedId, typing: input.value.trim().length > 0 });
    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => socket.emit('chat:typing', { conversationId: selectedId, typing: false }), 900);
  });

  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  search?.addEventListener('input', applySearch);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && selectedId && socket.connected) socket.emit('chat:read', { conversationId: selectedId });
  });

  if (messages) messages.scrollTop = messages.scrollHeight;
  if (socket.connected) {
    setConnection('connected', 'Live');
    joinSelected();
  }
  updateCount();
})();

(() => {
  'use strict';
  const root = document.getElementById('liveChat');
  if (!root || typeof io === 'undefined') return;

  const launcher = document.getElementById('chatLauncher');
  const panel = document.getElementById('chatPanel');
  const close = document.getElementById('chatClose');
  const welcome = document.getElementById('chatWelcome');
  const conversation = document.getElementById('chatConversation');
  const startForm = document.getElementById('chatStartForm');
  const messageForm = document.getElementById('chatMessageForm');
  const input = document.getElementById('chatMessageInput');
  const messages = document.getElementById('chatMessages');
  const typing = document.getElementById('chatTyping');
  const presence = document.getElementById('chatPresence');
  const unreadEl = document.getElementById('chatUnread');
  const socket = io({ transports: ['websocket', 'polling'] });
  let visitorId = localStorage.getItem('gracious.chat.visitorId') || '';
  let conversationId = localStorage.getItem('gracious.chat.conversationId') || '';
  let unread = Number(sessionStorage.getItem('gracious.chat.unread') || 0);
  let typingTimer;
  let sendPending = false;

  const opened = () => panel.getAttribute('aria-hidden') === 'false';

  function setPresence(label, online) {
    if (!presence) return;
    const dot = document.createElement('i');
    dot.classList.toggle('online', Boolean(online));
    presence.replaceChildren(dot, document.createTextNode(' ' + label));
  }

  function updateUnread() {
    unreadEl.textContent = String(unread);
    unreadEl.hidden = unread < 1;
    sessionStorage.setItem('gracious.chat.unread', String(unread));
  }

  function markRead() {
    unread = 0;
    updateUnread();
    if (conversationId && socket.connected) socket.emit('chat:read', { conversationId });
  }

  function toggle(show) {
    panel.setAttribute('aria-hidden', show ? 'false' : 'true');
    panel.classList.toggle('open', show);
    launcher.setAttribute('aria-expanded', show ? 'true' : 'false');
    launcher.setAttribute('aria-label', show ? 'Close live chat' : 'Open live chat');
    if (show) {
      markRead();
      window.setTimeout(() => (conversationId ? input : startForm.querySelector('input'))?.focus(), 120);
    } else {
      launcher.focus();
    }
  }

  function showConversation() {
    welcome.hidden = true;
    conversation.hidden = false;
  }

  function showWelcome() {
    welcome.hidden = false;
    conversation.hidden = true;
  }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(message) {
    if (!message?._id || messages.querySelector('[data-id="' + CSS.escape(String(message._id)) + '"]')) return;
    const item = document.createElement('div');
    item.className = 'chat-message ' + message.sender;
    item.dataset.id = message._id;
    const bubble = document.createElement('div');
    bubble.textContent = message.body;
    const meta = document.createElement('small');
    meta.textContent = (message.sender === 'admin' ? 'Gracious Team' : 'You') + ' · ' + formatTime(message.createdAt);
    item.append(bubble, meta);
    messages.appendChild(item);
    messages.scrollTo({ top: messages.scrollHeight, behavior: messages.children.length > 1 ? 'smooth' : 'auto' });
  }

  function joinConversation() {
    if (!conversationId || !visitorId || !socket.connected) return;
    socket.emit('visitor:join', { conversationId, visitorId }, (result) => {
      if (!result?.ok) return;
      setPresence(result.adminOnline ? 'Team online' : 'Here to help', Boolean(result.adminOnline));
      if (opened()) markRead();
    });
  }

  function clearConversationIdentity() {
    localStorage.removeItem('gracious.chat.conversationId');
    conversationId = '';
    messages.replaceChildren();
    showWelcome();
  }

  async function restore() {
    if (!visitorId || !conversationId) {
      showWelcome();
      return;
    }
    try {
      const response = await fetch('/api/chat/' + encodeURIComponent(conversationId) + '/messages?visitorId=' + encodeURIComponent(visitorId), { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Conversation unavailable');
      const data = await response.json();
      showConversation();
      messages.replaceChildren();
      data.messages.forEach(addMessage);
      joinConversation();
    } catch {
      clearConversationIdentity();
    }
  }

  launcher.addEventListener('click', () => toggle(!opened()));
  close.addEventListener('click', () => toggle(false));

  startForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = startForm.querySelector('button');
    const buttonText = button.querySelector('span');
    button.disabled = true;
    if (buttonText) buttonText.textContent = 'Connecting…';
    try {
      const payload = Object.fromEntries(new FormData(startForm));
      payload.visitorId = visitorId;
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to start chat');
      visitorId = data.visitorId;
      conversationId = data.conversationId;
      localStorage.setItem('gracious.chat.visitorId', visitorId);
      localStorage.setItem('gracious.chat.conversationId', conversationId);
      showConversation();
      joinConversation();
      input.focus();
    } catch (error) {
      window.alert(error.message || 'We could not start the chat. Please try again.');
    } finally {
      button.disabled = false;
      if (buttonText) buttonText.textContent = 'Start conversation';
    }
  });

  messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body || !conversationId || sendPending) return;
    sendPending = true;
    input.value = '';
    input.style.height = '';
    socket.emit('chat:typing', { conversationId, typing: false });
    socket.emit('chat:message', { conversationId, body }, (result) => {
      sendPending = false;
      if (result?.ok) return;
      input.value = body;
      input.dispatchEvent(new Event('input'));
      window.alert(result?.error || 'Your message was not sent. Please try again.');
    });
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    if (!conversationId) return;
    socket.emit('chat:typing', { conversationId, typing: input.value.trim().length > 0 });
    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => socket.emit('chat:typing', { conversationId, typing: false }), 900);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      messageForm.requestSubmit();
    }
  });

  socket.on('connect', () => {
    setPresence('Connected — here to help', true);
    joinConversation();
  });
  socket.on('disconnect', () => setPresence('Reconnecting…', false));
  socket.on('connect_error', () => setPresence('Trying to reconnect…', false));
  socket.on('chat:message', (message) => {
    addMessage(message);
    if (message.sender === 'admin') {
      if (!opened() || document.hidden) {
        unread += 1;
        updateUnread();
      } else {
        markRead();
      }
    }
  });
  socket.on('chat:typing', (data) => {
    if (data.role === 'admin') typing.hidden = !data.typing;
  });
  socket.on('presence:update', (data) => {
    if (typeof data.adminOnline === 'boolean') setPresence(data.adminOnline ? 'Team online now' : 'Here to help', data.adminOnline);
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden && opened()) markRead(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && opened()) toggle(false); });

  updateUnread();
  restore();
})();

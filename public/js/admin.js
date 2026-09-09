(() => {
  'use strict';
  const doc = document;
  const body = doc.body;
  const sidebar = doc.getElementById('adminSidebar');
  const sidebarToggle = doc.getElementById('sidebarToggle');
  const sidebarScrim = doc.getElementById('sidebarScrim');

  function setSidebar(open) {
    if (!sidebar || !sidebarToggle || !sidebarScrim) return;
    sidebar.classList.toggle('open', open);
    sidebarToggle.setAttribute('aria-expanded', String(open));
    sidebarToggle.setAttribute('aria-label', open ? 'Close administration navigation' : 'Open administration navigation');
    sidebarScrim.hidden = !open;
    body.classList.toggle('sidebar-open', open);
  }

  sidebarToggle?.addEventListener('click', () => setSidebar(!sidebar.classList.contains('open')));
  sidebarScrim?.addEventListener('click', () => setSidebar(false));
  window.addEventListener('resize', () => { if (window.innerWidth > 1120) setSidebar(false); });
  doc.addEventListener('keydown', (event) => { if (event.key === 'Escape') setSidebar(false); });

  doc.querySelectorAll('.admin-notice button').forEach((button) => {
    button.addEventListener('click', () => button.closest('.admin-notice')?.remove());
  });

  doc.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.parentElement?.querySelector('input');
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      const icon = button.querySelector('i');
      icon?.classList.toggle('fa-eye', showing);
      icon?.classList.toggle('fa-eye-slash', !showing);
    });
  });

  doc.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const message = form.dataset.confirm || 'Are you sure?';
      if (!window.confirm(message)) event.preventDefault();
    });
  });

  function filterList(targetId) {
    const list = doc.getElementById(targetId);
    if (!list) return;
    const search = doc.querySelector('[data-list-search="' + targetId + '"]')?.value.trim().toLowerCase() || '';
    const status = doc.querySelector('[data-list-status="' + targetId + '"]')?.value || 'all';
    let visible = 0;
    list.querySelectorAll('[data-filter-item]').forEach((item) => {
      const matchesSearch = !search || (item.dataset.search || '').includes(search);
      const matchesStatus = status === 'all' || item.dataset.status === status;
      const show = matchesSearch && matchesStatus;
      item.hidden = !show;
      if (show) visible += 1;
    });
    const empty = list.querySelector('[data-filter-empty]') || list.parentElement?.querySelector('[data-filter-empty]');
    if (empty) empty.hidden = visible > 0;
  }

  doc.querySelectorAll('[data-list-search]').forEach((input) => {
    input.addEventListener('input', () => filterList(input.dataset.listSearch));
  });
  doc.querySelectorAll('[data-list-status]').forEach((select) => {
    select.addEventListener('change', () => filterList(select.dataset.listStatus));
  });

  const fileInput = doc.querySelector('[data-file-input]');
  const dropZone = doc.querySelector('[data-file-drop]');
  const filePreview = doc.querySelector('[data-file-preview]');

  function showFile(file) {
    if (!file || !filePreview) return;
    filePreview.replaceChildren();
    if (file.type.startsWith('image/')) {
      const image = doc.createElement('img');
      image.alt = 'Selected media preview';
      image.src = URL.createObjectURL(file);
      image.addEventListener('load', () => URL.revokeObjectURL(image.src), { once: true });
      filePreview.appendChild(image);
    } else {
      const icon = doc.createElement('i');
      icon.className = 'fa-solid fa-film';
      icon.style.fontSize = '2rem';
      icon.style.color = '#17473c';
      icon.style.marginBottom = '8px';
      filePreview.appendChild(icon);
    }
    const name = doc.createElement('strong');
    name.textContent = file.name;
    const size = doc.createElement('small');
    size.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB selected';
    filePreview.append(name, size);
    filePreview.hidden = false;
    dropZone?.querySelectorAll(':scope > .drop-icon, :scope > strong, :scope > small, :scope > em').forEach((item) => { item.hidden = true; });
  }

  fileInput?.addEventListener('change', () => showFile(fileInput.files?.[0]));
  if (dropZone && fileInput) {
    ['dragenter', 'dragover'].forEach((type) => dropZone.addEventListener(type, (event) => {
      event.preventDefault();
      dropZone.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach((type) => dropZone.addEventListener(type, (event) => {
      event.preventDefault();
      dropZone.classList.remove('dragging');
    }));
    dropZone.addEventListener('drop', (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.files = transfer.files;
      showFile(file);
    });
  }

  if (typeof io !== 'undefined' && body.classList.contains('admin-body')) {
    const socket = io({ transports: ['websocket', 'polling'] });
    window.graciousAdminSocket = socket;
    const badge = doc.getElementById('adminChatBadge');
    const applicationBadge = doc.getElementById('adminApplicationBadge');
    const applicationCount = doc.querySelector('[data-application-count]');
    const reviewBadge = doc.getElementById('adminReviewBadge');
    const reviewCount = doc.querySelector('[data-review-count]');
    const inquiryBadge = doc.getElementById('adminInquiryBadge');
    const inquiryCount = doc.querySelector('[data-inquiry-count]');

    function addLiveNotice(iconClass, message, href, label) {
      const main = doc.querySelector('.admin-main');
      if (!main) return;
      const notice = doc.createElement('div');
      notice.className = 'admin-notice success live-notice';
      notice.setAttribute('role', 'status');
      const content = doc.createElement('span');
      const icon = doc.createElement('i');
      icon.className = iconClass;
      const text = doc.createElement('span');
      text.textContent = message;
      content.append(icon, text);
      const link = doc.createElement('a');
      link.className = 'admin-btn subtle small';
      link.href = href;
      link.textContent = label;
      notice.append(content, link);
      main.querySelector('.admin-page-heading')?.insertAdjacentElement('afterend', notice);
    }

    function incrementUnread(data) {
      if (!badge) return;
      if (data.sender !== 'visitor') return;
      const selected = doc.querySelector('.chat-admin')?.dataset.selectedId || '';
      if (selected === data.conversationId && !doc.hidden) return;
      const next = Number(badge.textContent || 0) + 1;
      badge.textContent = String(next);
      badge.hidden = false;
    }

    socket.on('admin:conversation-update', incrementUnread);
    socket.on('admin:application-received', (data = {}) => {
      if (applicationBadge) {
        applicationBadge.textContent = String(Number(applicationBadge.textContent || 0) + 1);
        applicationBadge.hidden = false;
      }
      if (applicationCount) applicationCount.textContent = String(Number(applicationCount.textContent || 0) + 1);
      addLiveNotice('fa-solid fa-file-circle-check', `${data.fullName || 'A candidate'} submitted an application${data.position ? ` for ${data.position}` : ''}.`, '/admin/applications', 'Review now');
    });
    socket.on('admin:review-received', (data = {}) => {
      if (reviewBadge) {
        reviewBadge.textContent = String(Number(reviewBadge.textContent || 0) + 1);
        reviewBadge.hidden = false;
      }
      if (reviewCount) reviewCount.textContent = String(Number(reviewCount.textContent || 0) + 1);
      addLiveNotice('fa-regular fa-star', `${data.name || 'A visitor'} submitted a ${Number(data.rating) || 5}-star review.`, '/admin/reviews', 'Moderate now');
    });
    socket.on('admin:inquiry-received', (data = {}) => {
      if (inquiryBadge) {
        inquiryBadge.textContent = String(Number(inquiryBadge.textContent || 0) + 1);
        inquiryBadge.hidden = false;
      }
      if (inquiryCount) inquiryCount.textContent = String(Number(inquiryCount.textContent || 0) + 1);
      addLiveNotice('fa-regular fa-envelope-open', `${data.name || 'A visitor'} sent a new inquiry${data.interest ? ` about ${data.interest.toLowerCase()}` : ''}.`, '/admin/inquiries', 'Open inquiry');
    });
  }
})();

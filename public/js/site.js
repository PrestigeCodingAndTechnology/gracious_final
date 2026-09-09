(() => {
  'use strict';

  const doc = document;
  const body = doc.body;
  const header = doc.getElementById('siteHeader');
  const menuToggle = doc.getElementById('menuToggle');
  const primaryNav = doc.getElementById('primaryNav');
  const navScrim = doc.getElementById('navScrim');
  const scrollTopButton = doc.getElementById('scrollTop');

  const preloader = doc.getElementById('sitePreloader');
  const preloaderStartedAt = performance.now();
  let preloaderFinished = false;
  function finishPreloader() {
    if (preloaderFinished) return;
    preloaderFinished = true;
    let visited = false;
    try { visited = sessionStorage.getItem('gracious-preloaded') === 'true'; } catch (_) {}
    const minimum = visited ? 220 : 820;
    const delay = Math.max(0, minimum - (performance.now() - preloaderStartedAt));
    window.setTimeout(() => {
      doc.documentElement.classList.remove('is-loading');
      preloader?.classList.add('is-complete');
      try { sessionStorage.setItem('gracious-preloaded', 'true'); } catch (_) {}
      window.setTimeout(() => { if (preloader) preloader.hidden = true; }, 650);
    }, delay);
  }
  if (doc.readyState === 'complete') finishPreloader();
  else window.addEventListener('load', finishPreloader, { once: true });
  window.setTimeout(finishPreloader, 4500);

  function setMenu(open) {
    if (!menuToggle || !primaryNav || !navScrim) return;
    menuToggle.classList.toggle('is-open', open);
    primaryNav.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navScrim.hidden = !open;
    body.classList.toggle('nav-open', open);
  }

  menuToggle?.addEventListener('click', () => setMenu(!primaryNav.classList.contains('open')));
  navScrim?.addEventListener('click', () => setMenu(false));
  primaryNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });

  function handleScroll() {
    const scrolled = window.scrollY > 20;
    header?.classList.toggle('scrolled', scrolled);
    scrollTopButton?.classList.toggle('visible', window.scrollY > 520);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
  scrollTopButton?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  doc.querySelectorAll('.flash button').forEach((button) => {
    button.addEventListener('click', () => button.closest('.flash')?.remove());
  });

  const revealItems = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -45px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const slider = doc.querySelector('[data-hero-slider]');
  if (slider) {
    const slides = Array.from(slider.querySelectorAll('.hero-slide'));
    const dotsContainer = slider.querySelector('.hero-dots');
    const previous = slider.querySelector('.hero-arrow.prev');
    const next = slider.querySelector('.hero-arrow.next');
    const progress = slider.querySelector('.hero-progress i');
    const duration = 8000;
    let active = 0;
    let timer;
    let touchStartX = 0;

    const dots = slides.map((slide, index) => {
      const dot = doc.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Show slide ' + (index + 1));
      dot.addEventListener('click', () => showSlide(index, true));
      dotsContainer?.appendChild(dot);
      return dot;
    });

    function restartProgress() {
      if (!progress) return;
      progress.style.animation = 'none';
      void progress.offsetWidth;
      progress.style.animation = '';
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => showSlide(active + 1, false), duration);
    }

    function showSlide(index, userInitiated) {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === active;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
      });
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === active;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
      });
      restartProgress();
      schedule();
      if (userInitiated) slider.dataset.userNavigated = 'true';
    }

    previous?.addEventListener('click', () => showSlide(active - 1, true));
    next?.addEventListener('click', () => showSlide(active + 1, true));
    slider.addEventListener('mouseenter', () => window.clearTimeout(timer));
    slider.addEventListener('mouseleave', schedule);
    slider.addEventListener('focusin', () => window.clearTimeout(timer));
    slider.addEventListener('focusout', schedule);
    slider.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', (event) => {
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 55) showSlide(active + (distance < 0 ? 1 : -1), true);
    }, { passive: true });
    showSlide(0, false);
  }

  doc.querySelectorAll('[data-page-hero-slider]').forEach((pageSlider) => {
    const slides = Array.from(pageSlider.querySelectorAll('.page-hero-slide'));
    if (slides.length <= 1) return;
    const dotsContainer = pageSlider.querySelector('.page-hero-dots');
    const previous = pageSlider.querySelector('.page-hero-arrow.prev');
    const next = pageSlider.querySelector('.page-hero-arrow.next');
    const duration = 7000;
    let active = 0;
    let timer;
    let touchStartX = 0;
    const dots = slides.map((_, index) => {
      const dot = doc.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Show hero slide ' + (index + 1));
      dot.addEventListener('click', () => showPageSlide(index));
      dotsContainer?.appendChild(dot);
      return dot;
    });
    function schedulePageSlide() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => showPageSlide(active + 1), duration);
    }
    function showPageSlide(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === active;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
      });
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === active;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
      });
      schedulePageSlide();
    }
    previous?.addEventListener('click', () => showPageSlide(active - 1));
    next?.addEventListener('click', () => showPageSlide(active + 1));
    pageSlider.addEventListener('mouseenter', () => window.clearTimeout(timer));
    pageSlider.addEventListener('mouseleave', schedulePageSlide);
    pageSlider.addEventListener('focusin', () => window.clearTimeout(timer));
    pageSlider.addEventListener('focusout', schedulePageSlide);
    pageSlider.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    pageSlider.addEventListener('touchend', (event) => {
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 55) showPageSlide(active + (distance < 0 ? 1 : -1));
    }, { passive: true });
    showPageSlide(0);
  });

  const reviewTrack = doc.querySelector('[data-review-track]');
  function scrollReviews(direction) {
    if (!reviewTrack) return;
    reviewTrack.scrollBy({ left: direction * Math.min(reviewTrack.clientWidth * 0.82, 390), behavior: 'smooth' });
  }
  doc.querySelector('[data-review-prev]')?.addEventListener('click', () => scrollReviews(-1));
  doc.querySelector('[data-review-next]')?.addEventListener('click', () => scrollReviews(1));

  doc.querySelectorAll('[data-accordion] .accordion-item > button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.accordion-item');
      const panel = item?.querySelector('.accordion-panel');
      const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
      const group = button.closest('[data-accordion]');
      group?.querySelectorAll('.accordion-item > button').forEach((otherButton) => {
        if (otherButton === button) return;
        otherButton.setAttribute('aria-expanded', 'false');
        const otherPanel = otherButton.closest('.accordion-item')?.querySelector('.accordion-panel');
        if (otherPanel) otherPanel.hidden = true;
      });
      button.setAttribute('aria-expanded', String(shouldOpen));
      if (panel) panel.hidden = !shouldOpen;
    });
  });

  const lightbox = doc.getElementById('galleryLightbox');
  const galleryItems = Array.from(doc.querySelectorAll('[data-lightbox]'));
  if (lightbox && galleryItems.length) {
    const image = doc.getElementById('lightboxImage');
    const title = doc.getElementById('lightboxTitle');
    const caption = doc.getElementById('lightboxCaption');
    const count = doc.getElementById('lightboxCount');
    let current = 0;
    let previousFocus = null;

    function renderLightbox(index) {
      current = (index + galleryItems.length) % galleryItems.length;
      const item = galleryItems[current];
      image.src = item.dataset.src || '';
      image.alt = item.dataset.alt || '';
      title.textContent = item.dataset.title || 'Gracious Senior Living';
      caption.textContent = item.dataset.caption || '';
      caption.hidden = !item.dataset.caption;
      count.textContent = (current + 1) + ' / ' + galleryItems.length;
    }

    function openLightbox(index) {
      previousFocus = doc.activeElement;
      renderLightbox(index);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      body.classList.add('modal-open');
      lightbox.querySelector('[data-lightbox-close]:not(.lightbox-backdrop)')?.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      body.classList.remove('modal-open');
      image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      previousFocus?.focus();
    }

    galleryItems.forEach((item, index) => item.addEventListener('click', () => openLightbox(index)));
    lightbox.querySelectorAll('[data-lightbox-close]').forEach((element) => element.addEventListener('click', closeLightbox));
    lightbox.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => renderLightbox(current - 1));
    lightbox.querySelector('[data-lightbox-next]')?.addEventListener('click', () => renderLightbox(current + 1));

    doc.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') renderLightbox(current - 1);
      if (event.key === 'ArrowRight') renderLightbox(current + 1);
    });
  }

  doc.querySelectorAll('[data-video-card] video').forEach((video) => {
    video.addEventListener('error', () => {
      const errorPanel = video.closest('[data-video-card]')?.querySelector('.video-error');
      if (errorPanel) errorPanel.hidden = false;
    });
  });

  doc.querySelectorAll('textarea[maxlength]').forEach((textarea) => {
    const count = textarea.parentElement?.querySelector('[data-character-count]');
    if (!count) return;
    const updateCount = () => { count.textContent = String(textarea.value.length); };
    textarea.addEventListener('input', updateCount);
    updateCount();
  });

  const reviewForm = doc.querySelector('[data-review-form]');
  const reviewFeedback = doc.querySelector('[data-review-feedback]');
  const reviewFeedbackMessage = reviewFeedback?.querySelector('[data-review-feedback-message]');
  const reviewFeedbackTitle = reviewFeedback?.querySelector('h3');
  const reviewFeedbackIcon = reviewFeedback?.querySelector('.review-feedback-icon i');
  function showReviewFeedback(message, isError = false) {
    if (!reviewFeedback) return;
    reviewFeedback.hidden = false;
    reviewFeedback.classList.toggle('is-error', isError);
    if (reviewFeedbackMessage) reviewFeedbackMessage.textContent = message;
    if (reviewFeedbackTitle) reviewFeedbackTitle.textContent = isError ? 'We could not submit your review yet.' : 'Thank you for sharing your experience.';
    if (reviewFeedbackIcon) reviewFeedbackIcon.className = isError ? 'fa-solid fa-exclamation' : 'fa-solid fa-check';
    reviewFeedback.focus?.({ preventScroll: true });
    if (!isError) window.setTimeout(() => { if (reviewFeedback && !reviewFeedback.hidden) reviewFeedback.hidden = true; }, 9000);
  }
  reviewFeedback?.querySelector('[data-review-feedback-close]')?.addEventListener('click', () => { reviewFeedback.hidden = true; });
  if (new URLSearchParams(window.location.search).get('submitted') === 'review') {
    showReviewFeedback('Your review is safely with our team and is awaiting administrator approval before it appears publicly.');
    const cleanUrl = window.location.pathname + (window.location.hash || '');
    window.history.replaceState({}, '', cleanUrl);
  }
  reviewForm?.addEventListener('submit', async (event) => {
    if (!reviewForm.checkValidity()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const button = reviewForm.querySelector('.submit-btn');
    const buttonText = button?.querySelector('span');
    const originalText = buttonText?.textContent || 'Submit Review';
    reviewForm.classList.add('is-submitting');
    if (button) button.classList.add('loading');
    if (buttonText) buttonText.textContent = 'Submitting…';
    try {
      const bodyData = new URLSearchParams();
      new FormData(reviewForm).forEach((value, key) => bodyData.append(key, String(value)));
      const response = await fetch(reviewForm.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: bodyData.toString(),
        credentials: 'same-origin'
      });
      let data = {};
      try { data = await response.json(); } catch (_) {}
      if (!response.ok || !data.ok) throw new Error(data.message || 'Please check your information and try again.');
      reviewForm.reset();
      reviewForm.querySelectorAll('[data-character-count]').forEach((counter) => { counter.textContent = '0'; });
      showReviewFeedback(data.message || 'Your review was received and is awaiting administrator approval.');
      reviewFeedback?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      showReviewFeedback(error.message || 'Please try again in a moment.', true);
    } finally {
      reviewForm.classList.remove('is-submitting');
      if (button) button.classList.remove('loading');
      if (buttonText) buttonText.textContent = originalText;
    }
  });

  const applicationForm = doc.querySelector('[data-application-form]');
  if (applicationForm) {
    const steps = Array.from(applicationForm.querySelectorAll('[data-app-step]'));
    const stepButtons = Array.from(doc.querySelectorAll('[data-step-target]'));
    const errorSummary = doc.querySelector('[data-error-summary]');
    let activeStep = 0;
    let highestStep = 0;

    function updateConditions() {
      applicationForm.querySelectorAll('[data-condition]').forEach((container) => {
        const [name, expected] = container.dataset.condition.split(':');
        const selected = applicationForm.querySelector(`[name="${name}"]:checked`);
        const visible = selected?.value === expected;
        container.hidden = !visible;
        container.querySelectorAll('input, select, textarea').forEach((field) => { field.disabled = !visible; });
      });
    }

    function showApplicationStep(index, focusHeading = false) {
      activeStep = Math.max(0, Math.min(steps.length - 1, index));
      steps.forEach((step, stepIndex) => {
        const isActive = stepIndex === activeStep;
        step.classList.toggle('is-active', isActive);
        step.setAttribute('aria-hidden', String(!isActive));
        step.inert = !isActive;
      });
      stepButtons.forEach((button, buttonIndex) => {
        button.classList.toggle('active', buttonIndex === activeStep);
        button.classList.toggle('complete', buttonIndex < activeStep);
        button.disabled = buttonIndex > highestStep;
        button.setAttribute('aria-current', buttonIndex === activeStep ? 'step' : 'false');
      });
      updateConditions();
      if (focusHeading) {
        steps[activeStep]?.querySelector('h3')?.setAttribute('tabindex', '-1');
        steps[activeStep]?.querySelector('h3')?.focus({ preventScroll: true });
        doc.querySelector('.application-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function firstInvalidField(step = null) {
      const scope = step || applicationForm;
      return Array.from(scope.querySelectorAll('input, select, textarea')).find((field) => !field.disabled && !field.checkValidity());
    }

    applicationForm.addEventListener('change', (event) => {
      if (event.target.matches('input[type="radio"]')) updateConditions();
    });
    applicationForm.querySelectorAll('[data-step-next]').forEach((button) => button.addEventListener('click', () => {
      applicationForm.classList.add('was-validated');
      const invalid = firstInvalidField(steps[activeStep]);
      if (invalid) {
        invalid.reportValidity();
        invalid.focus();
        return;
      }
      highestStep = Math.max(highestStep, activeStep + 1);
      showApplicationStep(activeStep + 1, true);
    }));
    applicationForm.querySelectorAll('[data-step-prev]').forEach((button) => button.addEventListener('click', () => showApplicationStep(activeStep - 1, true)));
    stepButtons.forEach((button) => button.addEventListener('click', () => {
      const target = Number(button.dataset.stepTarget);
      if (target <= highestStep) showApplicationStep(target, true);
    }));

    errorSummary?.querySelectorAll('a[href^="#field-"]').forEach((link) => link.addEventListener('click', (event) => {
      const target = doc.querySelector(link.getAttribute('href'));
      const targetStep = target?.closest('[data-app-step]');
      if (!targetStep) return;
      event.preventDefault();
      const index = steps.indexOf(targetStep);
      highestStep = Math.max(highestStep, index);
      showApplicationStep(index, true);
      window.setTimeout(() => target.querySelector('input, select, textarea')?.focus(), 350);
    }));

    const firstErrorTarget = errorSummary?.querySelector('a[href^="#field-"]');
    if (firstErrorTarget) {
      const targetStep = doc.querySelector(firstErrorTarget.getAttribute('href'))?.closest('[data-app-step]');
      const index = steps.indexOf(targetStep);
      if (index >= 0) highestStep = index;
    }

    const fileInput = applicationForm.querySelector('[data-application-file]');
    const fileLabel = fileInput?.closest('.file-upload');
    const fileName = fileLabel?.querySelector('[data-file-name]');
    fileInput?.addEventListener('change', () => {
      if (fileName) fileName.textContent = fileInput.files[0]?.name || 'PDF, DOC or DOCX — maximum 5 MB';
    });
    ['dragenter', 'dragover'].forEach((eventName) => fileLabel?.addEventListener(eventName, (event) => {
      event.preventDefault();
      fileLabel.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach((eventName) => fileLabel?.addEventListener(eventName, () => fileLabel.classList.remove('dragging')));

    applicationForm.addEventListener('submit', (event) => {
      updateConditions();
      applicationForm.classList.add('was-validated');
      const invalid = firstInvalidField();
      if (invalid) {
        event.preventDefault();
        const step = invalid.closest('[data-app-step]');
        const index = steps.indexOf(step);
        highestStep = Math.max(highestStep, index);
        showApplicationStep(index, true);
        window.setTimeout(() => invalid.reportValidity(), 100);
        return;
      }
      const submit = applicationForm.querySelector('.submit-btn');
      const submitText = submit?.querySelector('span');
      if (submit) submit.classList.add('loading');
      if (submitText) submitText.textContent = 'Submitting…';
    });

    showApplicationStep(highestStep, false);
    if (errorSummary) {
      errorSummary.focus();
      errorSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  doc.querySelector('[data-copy-reference]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(button.dataset.copyReference);
      button.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
    } catch (_) {
      button.textContent = button.dataset.copyReference;
    }
  });

  doc.querySelectorAll('.public-form').forEach((form) => {
    form.addEventListener('submit', () => {
      if (!form.checkValidity()) return;
      const button = form.querySelector('.submit-btn');
      const text = button?.querySelector('span');
      if (button) button.classList.add('loading');
      if (text && !form.matches('[data-application-form]')) text.textContent = 'Sending…';
    });
  });

  doc.querySelectorAll('[data-reload]').forEach((button) => button.addEventListener('click', () => window.location.reload()));

  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && primaryNav?.classList.contains('open')) setMenu(false);
  });
})();

/**
 * FirstT — Animation Library
 * --------------------------------
 * Drop-in vanilla JS animations: scroll reveal, number count-up,
 * parallax, magnetic buttons, letter reveal, marquee, splash effect
 * on add-to-cart, back-to-top button, progress bar, smooth scroll,
 * tilt on hover, image lazy fade-in, cursor blob, scroll spy.
 *
 * Respects prefers-reduced-motion.
 */

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initScrollReveal();
    initNumberCounters();
    initParallaxBlobs();
    initMagneticButtons();
    initLetterReveal();
    initSplashOnAddToCart();
    initBackToTop();
    initSmoothAnchors();
    initTiltCards();
    initImageFadeIn();
    initCursorBlob();
    initScrollAware();
    initRippleClicks();
  });

  /* ====== 1. Top scroll-progress bar ====== */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.transform = `scaleX(${p / 100})`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ====== 2. Scroll reveal (.js-reveal or .section-padding by default) ====== */
  function initScrollReveal() {
    if (reduceMotion) {
      document.querySelectorAll('.js-reveal').forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    // Auto-mark common section landmarks unless explicit
    document
      .querySelectorAll('.section-heading, .product-card, .feature-card, .testimonial, .blog-card, .multicolumn-item, .collection-card, .pre-footer-trust__item, .footer-col')
      .forEach((el) => el.classList.add('js-reveal'));

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    document.querySelectorAll('.js-reveal').forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 30, 240)}ms`;
      obs.observe(el);
    });
  }

  /* ====== 3. Number count-up (stats bar) ====== */
  function initNumberCounters() {
    if (reduceMotion) return;
    const items = document.querySelectorAll('.stat-value');
    if (!items.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const raw = el.textContent.trim();
          // Try to parse: 50K+, 4.8/5, FREE, 60-day -> handle K/+ suffixes and decimals
          const match = raw.match(/^([+\-]?\d*\.?\d+)([KMk]?\+?)/);
          if (!match) { obs.unobserve(el); return; }
          const target = parseFloat(match[1]);
          const suffix = raw.replace(match[1], '');
          const duration = 1400;
          const start = performance.now();
          function step(now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = target * eased;
            el.textContent = (target % 1 === 0 ? Math.round(value) : value.toFixed(1)) + suffix;
            if (t < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          obs.unobserve(el);
        });
      },
      { threshold: 0.5 },
    );
    items.forEach((it) => obs.observe(it));
  }

  /* ====== 4. Hero parallax blobs ====== */
  function initParallaxBlobs() {
    if (reduceMotion) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    let raf;
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        hero.style.setProperty('--parallax-y', y * 0.3 + 'px');
        hero.style.setProperty('--parallax-y2', y * -0.15 + 'px');
        raf = null;
      });
    }, { passive: true });
    hero.classList.add('has-parallax');
  }

  /* ====== 5. Magnetic buttons (subtle pointer attraction) ====== */
  function initMagneticButtons() {
    if (reduceMotion) return;
    const buttons = document.querySelectorAll('.btn--large, .product-form__buttons .btn');
    buttons.forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ====== 6. Hero H1 letter-by-letter reveal ====== */
  function initLetterReveal() {
    if (reduceMotion) return;
    const h1 = document.querySelector('.hero h1');
    if (!h1 || h1.dataset.letterized) return;
    h1.dataset.letterized = '1';
    const text = h1.textContent;
    h1.innerHTML = '';
    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.style.animationDelay = `${i * 30}ms`;
      span.textContent = char === ' ' ? ' ' : char;
      h1.appendChild(span);
    });
  }

  /* ====== 7. Splash effect on Add-to-Cart ====== */
  function initSplashOnAddToCart() {
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!form.matches('[data-product-form]')) return;
      const btn = form.querySelector('[data-add-to-cart]');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      spawnSplash(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });

    document.addEventListener('click', (e) => {
      const stickyBtn = e.target.closest('[data-sticky-atc-btn]');
      if (!stickyBtn) return;
      const r = stickyBtn.getBoundingClientRect();
      spawnSplash(r.left + r.width / 2, r.top + r.height / 2);
    });
  }

  function spawnSplash(x, y) {
    if (reduceMotion) return;
    const colors = ['#2DD4BF', '#0F766E', '#F97316', '#ccfbf1', '#5eead4'];
    const N = 18;
    for (let i = 0; i < N; i++) {
      const d = document.createElement('span');
      d.className = 'splash-drop';
      const angle = (Math.PI * 2 * i) / N + Math.random() * 0.5;
      const dist = 60 + Math.random() * 80;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 40;
      d.style.left = `${x}px`;
      d.style.top = `${y}px`;
      d.style.background = colors[i % colors.length];
      d.style.setProperty('--dx', `${dx}px`);
      d.style.setProperty('--dy', `${dy}px`);
      d.style.animationDelay = `${Math.random() * 60}ms`;
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 1100);
    }
  }

  /* ====== 8. Back to top ====== */
  function initBackToTop() {
    const btn = document.querySelector('[data-back-to-top]');
    if (!btn) return;
    btn.hidden = false;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 480) btn.setAttribute('data-visible', '');
      else btn.removeAttribute('data-visible');
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ====== 9. Smooth scroll for #anchors ====== */
  function initSmoothAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ====== 10. Tilt on hover for cards ====== */
  function initTiltCards() {
    if (reduceMotion) return;
    const items = document.querySelectorAll('.feature-card, .testimonial, .collection-card, .pre-footer-trust__badge');
    items.forEach((el) => {
      el.style.transformStyle = 'preserve-3d';
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -6;
        const ry = (px - 0.5) * 8;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ====== 11. Image fade-in as they load ====== */
  function initImageFadeIn() {
    document.querySelectorAll('img:not([data-no-fade])').forEach((img) => {
      if (img.complete && img.naturalWidth > 0) { img.classList.add('is-loaded'); return; }
      img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('is-loaded'), { once: true });
    });
  }

  /* ====== 12. Cursor blob (desktop, non-touch) ====== */
  function initCursorBlob() {
    if (reduceMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const blob = document.createElement('div');
    blob.className = 'cursor-blob';
    document.body.appendChild(blob);
    let tx = 0, ty = 0, x = 0, y = 0;
    document.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
    function loop() {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      blob.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // Grow on interactive elements
    document.addEventListener('pointerover', (e) => {
      if (e.target.closest('a, button, input, select, [role="button"]')) blob.classList.add('is-active');
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest('a, button, input, select, [role="button"]')) blob.classList.remove('is-active');
    });
  }

  /* ====== 13. Scroll-aware header (hide on scroll down, show on up) ====== */
  function initScrollAware() {
    const header = document.querySelector('[data-site-header]');
    if (!header) return;
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 200 && y > lastY) header.setAttribute('data-hidden', '');
      else header.removeAttribute('data-hidden');
      lastY = y;
    }, { passive: true });
  }

  /* ====== 14. Ripple on click for buttons ====== */
  function initRippleClicks() {
    if (reduceMotion) return;
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.btn, .header-icon, .filter-chip');
      if (!target) return;
      const r = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(r.width, r.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - r.left - size / 2}px`;
      ripple.style.top = `${e.clientY - r.top - size / 2}px`;
      const computed = getComputedStyle(target);
      if (computed.position === 'static') target.style.position = 'relative';
      target.style.overflow = 'hidden';
      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }
})();

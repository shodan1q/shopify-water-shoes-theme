// Tidefoot Theme JS

document.addEventListener('DOMContentLoaded', () => {
  initMenuToggle();
  initQuantityInputs();
  initProductGallery();
  initVariantSelectors();
  initCartDrawer();
  initSearchDrawer();
  initCookieBanner();
  initProductFormAjax();
  initFacets();
  initProductTabs();
  initStickyAtc();
  initSizeGuide();
  initLightbox();
  initRecommendations();
  initRecentlyViewed();
  initWishlist();
  initCopyLink();
  initHeaderShrink();
  initNewsletterPopup();
  initArticleTOC();
  initScrollSpy();
});

/* ---------- Menu ---------- */
function initMenuToggle() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.header-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

/* ---------- Quantity steppers ---------- */
function initQuantityInputs() {
  document.querySelectorAll('.product-quantity').forEach((wrapper) => {
    if (wrapper.dataset.qtyInit) return;
    wrapper.dataset.qtyInit = '1';
    const input = wrapper.querySelector('input[type="number"]');
    const minus = wrapper.querySelector('[data-action="minus"]');
    const plus = wrapper.querySelector('[data-action="plus"]');
    if (!input) return;
    minus?.addEventListener('click', () => {
      const v = Math.max(0, (parseInt(input.value, 10) || 1) - 1);
      input.value = v;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    plus?.addEventListener('click', () => {
      const v = (parseInt(input.value, 10) || 1) + 1;
      input.value = v;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

/* ---------- Product gallery ---------- */
function initProductGallery() {
  const gallery = document.querySelector('[data-product-gallery]');
  if (!gallery) return;
  const main = gallery.querySelector('[data-gallery-main] img');
  const thumbs = gallery.querySelectorAll('[data-gallery-thumb]');
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.src;
      const alt = thumb.dataset.alt || '';
      if (main && src) { main.src = src; main.alt = alt; }
      thumbs.forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

/* ---------- Variant selectors ---------- */
function initVariantSelectors() {
  const form = document.querySelector('[data-product-form]');
  if (!form) return;
  const variantInput = form.querySelector('input[name="id"]');
  const priceEl = document.querySelector('[data-product-price]');
  const submitBtn = form.querySelector('[data-add-to-cart]');
  const variantsTag = document.querySelector('[data-product-variants]');
  if (!variantsTag) return;
  let variants = [];
  try { variants = JSON.parse(variantsTag.textContent); } catch (e) { return; }

  form.querySelectorAll('input[data-option-name]').forEach((input) => {
    input.addEventListener('change', () => {
      const chosen = collectChosen(form);
      const match = variants.find((v) =>
        chosen.every((c, idx) => v.options[idx] === c),
      );
      if (match) {
        if (variantInput) variantInput.value = match.id;
        if (priceEl && match.price != null) priceEl.textContent = formatMoney(match.price);
        if (submitBtn) {
          submitBtn.disabled = !match.available;
          submitBtn.textContent = match.available ? 'Add to cart' : 'Sold out';
        }
      }
    });
  });
}

function collectChosen(form) {
  const groups = {};
  form.querySelectorAll('input[type="radio"][data-option-name]').forEach((r) => {
    if (r.checked) groups[r.dataset.optionName] = r.value;
  });
  return Object.values(groups);
}

function formatMoney(cents) {
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}`;
}

/* ---------- Cart Drawer ---------- */
function initCartDrawer() {
  const drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer) return;

  const openTriggers = document.querySelectorAll('[data-cart-open]');
  const closeTriggers = drawer.querySelectorAll('[data-cart-close]');

  const open = () => {
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openTriggers.forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  closeTriggers.forEach((t) => t.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Delegate quantity & remove inside drawer
  drawer.addEventListener('click', async (e) => {
    const change = e.target.closest('[data-cart-qty-change]');
    const remove = e.target.closest('[data-cart-remove]');
    if (change) {
      const delta = parseInt(change.dataset.cartQtyChange, 10);
      const line = parseInt(change.dataset.line, 10);
      const input = drawer.querySelector(`[data-cart-qty][data-line="${line}"]`);
      const next = Math.max(0, (parseInt(input.value, 10) || 0) + delta);
      input.value = next;
      await updateCartLine(line, next);
    }
    if (remove) {
      const line = parseInt(remove.dataset.line, 10);
      await updateCartLine(line, 0);
    }
  });
  drawer.addEventListener('change', async (e) => {
    const qty = e.target.closest('[data-cart-qty]');
    if (qty) {
      const line = parseInt(qty.dataset.line, 10);
      const next = Math.max(0, parseInt(qty.value, 10) || 0);
      await updateCartLine(line, next);
    }
  });

  // Expose openCart globally
  window.tidefootCart = { open, close, refresh: refreshCart };
}

async function updateCartLine(line, quantity) {
  try {
    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line, quantity }),
    });
    await refreshCart();
  } catch (err) {
    console.error('cart change failed', err);
  }
}

async function refreshCart() {
  try {
    const res = await fetch(window.location.pathname + '?sections=cart-drawer-section', { headers: { Accept: 'application/json' } });
    if (res.ok) {
      // Re-render via section render API would require a section. Fallback: full re-fetch.
    }
    // Simpler: re-fetch the current page and swap the drawer markup.
    const html = await fetch(window.location.pathname, { headers: { Accept: 'text/html' } }).then((r) => r.text());
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newDrawer = doc.querySelector('[data-cart-drawer]');
    const oldDrawer = document.querySelector('[data-cart-drawer]');
    if (newDrawer && oldDrawer) {
      const wasOpen = oldDrawer.getAttribute('aria-hidden') === 'false';
      oldDrawer.innerHTML = newDrawer.innerHTML;
      if (wasOpen) oldDrawer.setAttribute('aria-hidden', 'false');
    }
    const newBubble = doc.querySelector('[data-cart-count-bubble]');
    const oldBubble = document.querySelector('[data-cart-count-bubble]');
    if (newBubble && oldBubble) {
      oldBubble.textContent = newBubble.textContent;
      const count = parseInt(newBubble.textContent, 10);
      if (count > 0) oldBubble.removeAttribute('hidden');
      else oldBubble.setAttribute('hidden', '');
    }
  } catch (err) {
    console.error('cart refresh failed', err);
  }
}

/* ---------- Product form AJAX (so add-to-cart opens drawer) ---------- */
function initProductFormAjax() {
  const form = document.querySelector('[data-product-form]');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    if (!window.tidefootCart) return; // fall back to default
    e.preventDefault();
    const submitBtn = form.querySelector('[data-add-to-cart]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Adding...'; }
    try {
      const formData = new FormData(form);
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      if (!res.ok) throw new Error('add failed');
      await refreshCart();
      window.tidefootCart.open();
    } catch (err) {
      console.error(err);
      form.submit();
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    }
  });
}

/* ---------- Search Drawer + Predictive ---------- */
function initSearchDrawer() {
  const drawer = document.querySelector('[data-search-drawer]');
  if (!drawer) return;
  const input = drawer.querySelector('[data-search-input]');
  const results = drawer.querySelector('[data-search-results]');
  const openTriggers = document.querySelectorAll('[data-search-open]');
  const closeTriggers = drawer.querySelectorAll('[data-search-close]');

  const open = () => {
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input?.focus(), 250);
  };
  const close = () => {
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  openTriggers.forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  closeTriggers.forEach((t) => t.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === '/' && e.target === document.body) { e.preventDefault(); open(); }
  });

  let timer;
  const initialHTML = results.innerHTML;
  input?.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = initialHTML;
      return;
    }
    results.innerHTML = '<div class="search-drawer__loading">Searching…</div>';
    timer = setTimeout(() => predictiveSearch(q, results), 220);
  });
}

async function predictiveSearch(query, container) {
  try {
    const url = `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,collection,article&resources[limit]=6`;
    const data = await fetch(url, { headers: { Accept: 'application/json' } }).then((r) => r.json());
    const products = data?.resources?.results?.products || [];
    const collections = data?.resources?.results?.collections || [];

    if (products.length === 0 && collections.length === 0) {
      container.innerHTML = '<div class="search-drawer__loading">No matches. Try another search.</div>';
      return;
    }

    let html = '';
    if (collections.length > 0) {
      html += '<div style="margin-bottom:20px"><span class="eyebrow" style="display:block;margin-bottom:10px;background:none;padding:0">Collections</span><div class="search-drawer__suggestions">';
      collections.forEach((c) => {
        html += `<a href="${c.url}">${escapeHtml(c.title)}</a>`;
      });
      html += '</div></div>';
    }
    if (products.length > 0) {
      html += '<span class="eyebrow" style="display:block;margin-bottom:10px;background:none;padding:0">Products</span>';
      html += '<div class="search-drawer__product-results">';
      products.forEach((p) => {
        const img = p.image || p.featured_image?.url || '';
        const price = formatMoney(parseFloat(p.price || 0) * 100);
        html += `
          <a class="search-drawer__product" href="${p.url}">
            <div class="search-drawer__product-image">${img ? `<img src="${img}" alt="${escapeHtml(p.title)}" loading="lazy">` : ''}</div>
            <div class="search-drawer__product-title">${escapeHtml(p.title)}</div>
            <div class="search-drawer__product-price">${price}</div>
          </a>`;
      });
      html += '</div>';
    }
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<div class="search-drawer__loading">Search unavailable. Please try again.</div>';
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/* ---------- Facets (collection page filters) ---------- */
function initFacets() {
  // Auto-submit on filter change
  const form = document.querySelector('[data-facet-form]');
  if (form) {
    let priceDebounce;
    form.addEventListener('change', (e) => {
      // Debounce price inputs (typing)
      if (e.target.type === 'number') return;
      submitFacetForm(form);
    });
    form.addEventListener('input', (e) => {
      if (e.target.type !== 'number') return;
      clearTimeout(priceDebounce);
      priceDebounce = setTimeout(() => submitFacetForm(form), 600);
    });
  }

  // Mobile drawer
  const drawer = document.querySelector('[data-facet-drawer]');
  const overlay = document.querySelector('[data-facet-overlay]');
  const openBtn = document.querySelector('[data-facet-toggle]');
  const closeBtn = document.querySelector('[data-facet-close]');
  if (!drawer) return;

  drawer.setAttribute('aria-hidden', 'true');
  const open = () => {
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.dataset.open = '';
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay) delete overlay.dataset.open;
    document.body.style.overflow = '';
  };

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // On large viewports, ensure not aria-hidden so contents are readable
  const mq = window.matchMedia('(min-width: 901px)');
  const syncDesktop = () => {
    if (mq.matches) drawer.removeAttribute('aria-hidden');
    else drawer.setAttribute('aria-hidden', 'true');
  };
  mq.addEventListener('change', syncDesktop);
  syncDesktop();
}

function submitFacetForm(form) {
  // Build URL from checked inputs + price; preserve sort_by if present
  const params = new URLSearchParams();
  form.querySelectorAll('input').forEach((input) => {
    if (input.type === 'hidden' && input.value) params.append(input.name, input.value);
    else if (input.type === 'checkbox' && input.checked) params.append(input.name, input.value);
    else if (input.type === 'number' && input.value) params.append(input.name, input.value);
  });
  const baseUrl = window.location.pathname;
  window.location.href = `${baseUrl}?${params.toString()}`;
}

/* ---------- Product tabs ---------- */
function initProductTabs() {
  const tabs = document.querySelectorAll('.product-tabs__tab');
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      document.querySelectorAll('.product-tabs__tab').forEach((t) => t.classList.toggle('is-active', t === tab));
      document.querySelectorAll('.product-tabs__panel').forEach((p) => p.classList.toggle('is-active', p.dataset.tabPanel === name));
    });
  });
}

/* ---------- Sticky add-to-cart (mobile) ---------- */
function initStickyAtc() {
  const sticky = document.querySelector('[data-sticky-atc]');
  if (!sticky) return;
  const form = document.querySelector('[data-product-form]');
  if (!form) return;
  const triggerEl = document.querySelector('[data-add-to-cart]');
  if (!triggerEl) return;

  const obs = new IntersectionObserver(
    (entries) => {
      const visible = entries[0].isIntersecting;
      if (visible) sticky.removeAttribute('data-visible');
      else sticky.setAttribute('data-visible', '');
    },
    { threshold: 0 },
  );
  obs.observe(triggerEl);

  sticky.querySelector('[data-sticky-atc-btn]')?.addEventListener('click', () => {
    // Trigger the real button so AJAX form handler kicks in
    triggerEl.click();
  });

  // Sync price when variant changes
  const priceEl = document.querySelector('[data-product-price]');
  const stickyPrice = sticky.querySelector('[data-sticky-price]');
  if (priceEl && stickyPrice) {
    new MutationObserver(() => { stickyPrice.textContent = priceEl.textContent.trim(); }).observe(priceEl, { childList: true, characterData: true, subtree: true });
  }
}

/* ---------- Size guide modal ---------- */
function initSizeGuide() {
  const modal = document.querySelector('[data-size-guide]');
  if (!modal) return;
  document.querySelectorAll('[data-size-guide-open]').forEach((b) => b.addEventListener('click', () => { modal.hidden = false; document.body.style.overflow = 'hidden'; }));
  modal.querySelectorAll('[data-size-guide-close]').forEach((b) => b.addEventListener('click', () => { modal.hidden = true; document.body.style.overflow = ''; }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) { modal.hidden = true; document.body.style.overflow = ''; } });
}

/* ---------- Lightbox (product image zoom) ---------- */
function initLightbox() {
  const trigger = document.querySelector('[data-zoom-trigger]');
  if (!trigger) return;
  const galleryMain = document.querySelector('[data-gallery-main] img');
  if (!galleryMain) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.hidden = true;
  lightbox.innerHTML = `<button class="lightbox__close" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button><img alt="">`;
  document.body.appendChild(lightbox);
  const lbImg = lightbox.querySelector('img');

  const open = () => {
    lbImg.src = galleryMain.src;
    lbImg.alt = galleryMain.alt;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const close = () => { lightbox.hidden = true; document.body.style.overflow = ''; };

  trigger.addEventListener('click', open);
  galleryMain.addEventListener('click', open);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target.closest('.lightbox__close')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lightbox.hidden) close(); });
}

/* ---------- Product Recommendations (Shopify recommendations API) ---------- */
function initRecommendations() {
  const root = document.querySelector('[data-product-recommendations]');
  if (!root) return;
  const productId = root.dataset.productId;
  const limit = root.dataset.limit || 4;
  const grid = root.querySelector('[data-recommendations-grid]');
  const url = `/recommendations/products?section_id=product-recommendations&product_id=${productId}&limit=${limit}&intent=related`;

  fetch(url)
    .then((r) => r.text())
    .then((html) => {
      // Fallback: parse out product cards from response
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const cards = doc.querySelectorAll('.product-card');
      if (cards.length > 0) {
        grid.innerHTML = '';
        cards.forEach((c) => grid.appendChild(c));
      } else {
        // Try JSON fallback
        fetchRecommendationsJson(productId, limit, grid);
      }
    })
    .catch(() => fetchRecommendationsJson(productId, limit, grid));
}

function fetchRecommendationsJson(productId, limit, grid) {
  fetch(`/recommendations/products.json?product_id=${productId}&limit=${limit}`)
    .then((r) => r.json())
    .then((data) => {
      const products = data?.products || [];
      if (products.length === 0) {
        grid.innerHTML = '<div class="product-recommendations__loading">No recommendations available yet.</div>';
        return;
      }
      grid.innerHTML = products.map((p) => renderProductCard(p)).join('');
    })
    .catch(() => {
      grid.innerHTML = '<div class="product-recommendations__loading">Recommendations unavailable.</div>';
    });
}

function renderProductCard(p) {
  const img = p.featured_image || (p.images && p.images[0]) || '';
  const priceCents = (p.price != null ? p.price : 0);
  const price = typeof priceCents === 'number' ? formatMoney(priceCents) : `$${parseFloat(priceCents).toFixed(2)}`;
  return `
    <a href="${p.url}" class="product-card">
      <div class="product-card__media">
        ${img ? `<img src="${img}" alt="${escapeHtml(p.title)}" loading="lazy">` : ''}
        <span class="product-card__quick-add">View product →</span>
        <button type="button" class="product-card__wishlist" data-wishlist-btn data-product-handle="${escapeHtml(p.handle)}" aria-label="Save"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
      </div>
      <div class="product-card__info">
        <div class="product-card__title">${escapeHtml(p.title)}</div>
        <div class="product-card__price">${price}</div>
      </div>
    </a>
  `;
}

/* ---------- Recently Viewed (localStorage) ---------- */
function initRecentlyViewed() {
  const KEY = 'tidefoot_recently_viewed';
  const meta = document.querySelector('[data-product-meta]');

  // Save current product on product page
  if (meta) {
    try {
      const data = JSON.parse(meta.textContent);
      let list = JSON.parse(localStorage.getItem(KEY) || '[]');
      list = list.filter((p) => p.id !== data.id);
      list.unshift(data);
      list = list.slice(0, 8);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}
  }

  // Render recently viewed section if present
  const root = document.querySelector('[data-recently-viewed]');
  if (!root) return;
  const grid = root.querySelector('[data-recently-grid]');
  let list = [];
  try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}

  // Exclude current product if any
  const currentId = meta ? JSON.parse(meta.textContent).id : null;
  list = list.filter((p) => p.id !== currentId);

  if (list.length === 0) { root.hidden = true; return; }
  root.hidden = false;
  grid.innerHTML = list.slice(0, 4).map((p) => `
    <a href="${p.url}" class="product-card">
      <div class="product-card__media">
        ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">` : ''}
        <span class="product-card__quick-add">View product →</span>
      </div>
      <div class="product-card__info">
        <div class="product-card__title">${escapeHtml(p.title)}</div>
      </div>
    </a>
  `).join('');
}

/* ---------- Wishlist (localStorage) ---------- */
function initWishlist() {
  const KEY = 'tidefoot_wishlist';
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const set = (list) => localStorage.setItem(KEY, JSON.stringify(list));

  function syncButtons() {
    const list = get();
    document.querySelectorAll('[data-wishlist-btn]').forEach((btn) => {
      const handle = btn.dataset.productHandle;
      btn.classList.toggle('is-saved', list.includes(handle));
    });
    const bubble = document.querySelector('[data-wishlist-count-bubble]');
    if (bubble) {
      bubble.textContent = list.length;
      if (list.length > 0) bubble.removeAttribute('hidden');
      else bubble.setAttribute('hidden', '');
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wishlist-btn]');
    if (!btn) return;
    e.preventDefault();
    const handle = btn.dataset.productHandle;
    let list = get();
    if (list.includes(handle)) list = list.filter((h) => h !== handle);
    else list.push(handle);
    set(list);
    syncButtons();
    if (document.querySelector('[data-wishlist-grid]')) renderWishlist();
  });

  syncButtons();
  renderWishlist();

  function renderWishlist() {
    const grid = document.querySelector('[data-wishlist-grid]');
    const empty = document.querySelector('[data-wishlist-empty]');
    if (!grid) return;
    const list = get();
    if (list.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.innerHTML = '<div class="product-recommendations__loading">Loading your wishlist…</div>';
    Promise.all(list.map((h) => fetch(`/products/${h}.js`).then((r) => r.ok ? r.json() : null).catch(() => null)))
      .then((products) => {
        const valid = products.filter(Boolean);
        if (valid.length === 0) { grid.innerHTML = ''; if (empty) empty.hidden = false; return; }
        grid.innerHTML = valid.map((p) => renderProductCard(p)).join('');
        syncButtons();
      });
  }
}

/* ---------- Copy link button ---------- */
function initCopyLink() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy-link]');
    if (!btn) return;
    e.preventDefault();
    const link = btn.dataset.link || window.location.href;
    navigator.clipboard?.writeText(link).then(() => {
      const feedback = btn.querySelector('[data-copy-feedback]');
      const original = feedback ? feedback.textContent : '';
      btn.classList.add('is-copied');
      if (feedback) feedback.textContent = 'Copied!';
      setTimeout(() => {
        btn.classList.remove('is-copied');
        if (feedback) feedback.textContent = original;
      }, 1500);
    }).catch(() => {});
  });
}

/* ---------- Header shrink on scroll ---------- */
function initHeaderShrink() {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 80) header.setAttribute('data-shrunk', '');
        else header.removeAttribute('data-shrunk');
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Newsletter popup ---------- */
function initNewsletterPopup() {
  const popup = document.querySelector('[data-newsletter-popup]');
  if (!popup) return;
  const KEY = 'tidefoot_newsletter_popup';
  if (localStorage.getItem(KEY)) return;

  const delaySec = parseInt(document.body.dataset.newsletterDelay || '0', 10);
  // Fallback to settings via inline if needed (best-effort): default 5s
  const delay = (delaySec > 0 ? delaySec : 5) * 1000;

  let opened = false;
  function open() {
    if (opened) return;
    opened = true;
    popup.hidden = false;
    requestAnimationFrame(() => popup.setAttribute('data-open', ''));
  }
  function close() {
    popup.removeAttribute('data-open');
    setTimeout(() => { popup.hidden = true; }, 300);
    localStorage.setItem(KEY, '1');
  }

  setTimeout(open, delay);
  // Exit intent (desktop only)
  if (window.matchMedia('(min-width: 768px)').matches) {
    document.addEventListener('mouseout', (e) => {
      if (e.clientY <= 0 && !e.relatedTarget && !opened) open();
    });
  }

  popup.querySelectorAll('[data-newsletter-close]').forEach((b) => b.addEventListener('click', close));
  popup.querySelector('form')?.addEventListener('submit', () => localStorage.setItem(KEY, '1'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !popup.hidden) close(); });
}

/* ---------- Article TOC (auto-generate from headings) ---------- */
function initArticleTOC() {
  const content = document.querySelector('[data-article-content]');
  const toc = document.querySelector('[data-article-toc]');
  const list = document.querySelector('[data-article-toc-list]');
  if (!content || !toc || !list) return;
  const headings = content.querySelectorAll('h2, h3');
  if (headings.length < 3) return;

  toc.hidden = false;
  headings.forEach((h, idx) => {
    if (!h.id) h.id = `heading-${idx}`;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = h.textContent;
    if (h.tagName === 'H3') a.style.paddingLeft = '24px';
    li.appendChild(a);
    list.appendChild(li);
  });
}

/* ---------- Scroll spy (TOC active state) ---------- */
function initScrollSpy() {
  const links = document.querySelectorAll('[data-article-toc-list] a');
  if (links.length === 0) return;
  const map = new Map();
  links.forEach((a) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) map.set(target, a);
  });
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = map.get(entry.target);
      if (link && entry.isIntersecting) {
        links.forEach((l) => l.classList.toggle('is-active', l === link));
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  map.forEach((_, el) => obs.observe(el));
}

/* ---------- Cookie Banner ---------- */
function initCookieBanner() {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;
  const stored = localStorage.getItem('tidefoot_cookie_consent');
  if (stored) return;
  banner.hidden = false;
  banner.addEventListener('click', (e) => {
    const action = e.target.closest('[data-cookie-action]');
    if (!action) return;
    localStorage.setItem('tidefoot_cookie_consent', action.dataset.cookieAction);
    banner.hidden = true;
  });
}

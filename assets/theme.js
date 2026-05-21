// AquaStep Theme JS

document.addEventListener('DOMContentLoaded', () => {
  initMenuToggle();
  initQuantityInputs();
  initProductGallery();
  initVariantSelectors();
});

function initMenuToggle() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.header-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

function initQuantityInputs() {
  document.querySelectorAll('.product-quantity').forEach((wrapper) => {
    const input = wrapper.querySelector('input[type="number"]');
    const minus = wrapper.querySelector('[data-action="minus"]');
    const plus = wrapper.querySelector('[data-action="plus"]');
    if (!input) return;

    minus?.addEventListener('click', () => {
      const v = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
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

function initProductGallery() {
  const gallery = document.querySelector('[data-product-gallery]');
  if (!gallery) return;
  const main = gallery.querySelector('[data-gallery-main] img');
  const thumbs = gallery.querySelectorAll('[data-gallery-thumb]');
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.src;
      const alt = thumb.dataset.alt || '';
      if (main && src) {
        main.src = src;
        main.alt = alt;
      }
      thumbs.forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

function initVariantSelectors() {
  const form = document.querySelector('[data-product-form]');
  if (!form) return;

  const variantInput = form.querySelector('input[name="id"]');
  const priceEl = document.querySelector('[data-product-price]');
  const submitBtn = form.querySelector('[data-add-to-cart]');

  const variantsTag = document.querySelector('[data-product-variants]');
  if (!variantsTag) return;

  let variants = [];
  try {
    variants = JSON.parse(variantsTag.textContent);
  } catch (e) {
    return;
  }

  form.querySelectorAll('input[data-option-name]').forEach((input) => {
    input.addEventListener('change', () => {
      const selectedOptions = [];
      form.querySelectorAll('[data-option-name]').forEach((group) => {
        const name = group.dataset.optionName || group.name;
        if (group.checked || group.tagName === 'SELECT') {
          selectedOptions.push({ name, value: group.value });
        }
      });

      const chosen = collectChosen(form);
      const match = variants.find((v) =>
        chosen.every((c, idx) => v.options[idx] === c),
      );

      if (match) {
        if (variantInput) variantInput.value = match.id;
        if (priceEl && match.price != null) {
          priceEl.textContent = formatMoney(match.price);
        }
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

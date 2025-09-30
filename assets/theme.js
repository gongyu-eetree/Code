const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const cartState = new Map();

const cartToggle = document.querySelector('[data-cart-toggle]');
const cartClose = document.querySelector('[data-cart-close]');
const cartBackdrop = document.querySelector('[data-cart-backdrop]');
const cartPanel = document.querySelector('.cart-panel');
const cartItems = document.querySelector('[data-cart-items]');
const cartCount = document.querySelector('[data-cart-count]');
const cartTotal = document.querySelector('[data-cart-total]');
const cartEmptyState = document.querySelector('[data-cart-empty]');
const checkoutButton = document.querySelector('[data-checkout]');

const formatCurrency = (value) => `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`;

const updateCartUI = () => {
  if (!cartItems || !cartCount || !cartTotal || !cartEmptyState) return;

  const items = Array.from(cartState.values());
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartItems.innerHTML = '';

  if (items.length === 0) {
    cartEmptyState.hidden = false;
  } else {
    cartEmptyState.hidden = true;
    items.forEach((item) => {
      const listItem = document.createElement('li');
      listItem.className = 'cart-item';

      const info = document.createElement('div');
      info.className = 'cart-item-info';
      const title = document.createElement('h3');
      title.textContent = item.title;
      const meta = document.createElement('p');
      meta.textContent = `${item.type} · ${formatCurrency(item.price)} × ${item.quantity}`;
      info.append(title, meta);

      const actions = document.createElement('div');
      actions.className = 'cart-item-actions';
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'remove';
      removeButton.textContent = '移除';
      removeButton.setAttribute('data-remove', item.id);
      actions.append(removeButton);

      listItem.append(info, actions);
      cartItems.append(listItem);
    });
  }

  cartCount.textContent = totalQuantity.toString();
  cartTotal.textContent = formatCurrency(totalPrice);

  if (cartToggle) {
    cartToggle.classList.toggle('has-items', totalQuantity > 0);
  }
};

const openCart = () => {
  if (!cartPanel || !cartToggle || !cartBackdrop) return;
  cartPanel.classList.add('open');
  cartPanel.setAttribute('aria-hidden', 'false');
  cartBackdrop.hidden = false;
  cartBackdrop.classList.add('visible');
  cartToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('no-scroll');
  cartClose?.focus();
};

const closeCart = () => {
  if (!cartPanel || !cartToggle || !cartBackdrop) return;
  cartPanel.classList.remove('open');
  cartPanel.setAttribute('aria-hidden', 'true');
  cartBackdrop.hidden = true;
  cartBackdrop.classList.remove('visible');
  cartToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('no-scroll');
};

const handleAddToCart = (event) => {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement)) return;
  const title = button.dataset.product;
  const price = Number(button.dataset.price) || 0;
  const type = button.dataset.type || '商品';
  if (!title) return;

  const id = title.toLowerCase();
  const existingItem = cartState.get(id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartState.set(id, { id, title, price, type, quantity: 1 });
  }

  updateCartUI();
  openCart();
};

document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
  button.addEventListener('click', handleAddToCart);
});

cartItems?.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const id = target.getAttribute('data-remove');
  if (!id) return;
  cartState.delete(id);
  updateCartUI();
});

cartToggle?.addEventListener('click', () => {
  if (cartPanel?.classList.contains('open')) {
    closeCart();
  } else {
    openCart();
  }
});

cartClose?.addEventListener('click', closeCart);
cartBackdrop?.addEventListener('click', closeCart);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && cartPanel?.classList.contains('open')) {
    closeCart();
  }
});

checkoutButton?.addEventListener('click', () => {
  if (cartState.size === 0) {
    alert('购物车为空，请先选择电子书或模块。');
    return;
  }

  const summary = Array.from(cartState.values())
    .map((item) => `${item.title} × ${item.quantity}`)
    .join('\n');
  alert(`订单已生成：\n${summary}\n我们会在 24 小时内联系你完成支付。`);
  cartState.clear();
  updateCartUI();
  closeCart();
});

const productSearch = document.querySelector('[data-product-search]');
const productCards = Array.from(document.querySelectorAll('[data-product-card]'));
const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
let activeFilter = 'all';

const applyProductFilters = () => {
  const query = (productSearch?.value || '').trim().toLowerCase();

  productCards.forEach((card) => {
    const tags = (card.dataset.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const title = (card.dataset.title || '').toLowerCase();
    const bodyText = card.textContent?.toLowerCase() || '';
    const matchesFilter = activeFilter === 'all' || tags.includes(activeFilter);
    const matchesQuery = !query || title.includes(query) || bodyText.includes(query);
    card.hidden = !(matchesFilter && matchesQuery);
  });
};

productSearch?.addEventListener('input', applyProductFilters);

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    filterButtons.forEach((other) => other.classList.toggle('active', other === button));
    applyProductFilters();
  });
});

const contactForm = document.querySelector('.contact-form');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const name = formData.get('name');
  const email = formData.get('email');
  alert(`感谢 ${name || '创客'} 的联系！我们会在 2 个工作日内通过 ${email || '邮箱'} 回复。`);
  contactForm.reset();
});

const magazineForm = document.querySelector('.magazine-form');
magazineForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const emailField = magazineForm.querySelector('input');
  const email = emailField?.value || '';
  alert(`已为 ${email || '你'} 订阅 EELib Creator Journal，敬请查收最新样刊！`);
  magazineForm.reset();
});

const yearPlaceholder = document.getElementById('year');
if (yearPlaceholder) {
  yearPlaceholder.textContent = String(new Date().getFullYear());
}

applyProductFilters();
updateCartUI();

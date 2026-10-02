const products = [
  {
    id: 'sticker-cafe',
    name: 'Sticker Primero café',
    category: 'stickers',
    categoryLabel: 'Sticker',
    price: 2990,
    fileType: 'SVG · 100 × 80 mm',
    description: 'Un toque de humor cafetero para tazas, regalos y proyectos creativos.',
    art: 'coffee',
    badge: 'Favorito'
  },
  {
    id: 'taza-floral',
    name: 'Florece a tu ritmo',
    category: 'tazas',
    categoryLabel: 'Diseño para taza',
    price: 3490,
    fileType: 'SVG · 200 × 85 mm',
    description: 'Flores minimalistas en tonos salvia y terracota para regalar bonito.',
    art: 'floral',
    badge: 'Nuevo'
  },
  {
    id: 'plantilla-taza',
    name: 'Base para taza 11 oz',
    category: 'plantillas',
    categoryLabel: 'Plantilla',
    price: 1990,
    fileType: 'SVG · 200 × 85 mm',
    description: 'Lienzo editable con guías de referencia para preparar tu propio diseño.',
    art: 'template',
    badge: 'Editable'
  }
];

const productGrid = document.getElementById('product-grid');
const filterButtons = [...document.querySelectorAll('.filter-chip')];
const searchInput = document.getElementById('search');
const resultsCount = document.getElementById('results-count');
const emptyResults = document.getElementById('empty-results');
const cartDrawer = document.getElementById('cart-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const cartItems = document.getElementById('cart-items');
const cartEmpty = document.getElementById('cart-empty');
const cartFooter = document.getElementById('cart-footer');
const cartTotal = document.getElementById('cart-total');
const checkoutTotal = document.getElementById('checkout-total');
const checkoutModal = document.getElementById('checkout-modal');
const cartCount = document.getElementById('cart-count');
const cartOpenButton = document.getElementById('cart-open');
const toast = document.getElementById('toast');

const state = { filter: 'todos', query: '' };
const cart = new Map();
const currency = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

function formatPrice(price) {
  return currency.format(price);
}

function getProductArt(product) {
  if (product.art === 'coffee') {
    return '<div class="mini-sticker"><span>PRIMERO</span><strong>café</strong><i aria-hidden="true">☕</i><span>DESPUÉS VEMOS</span></div>';
  }
  if (product.art === 'floral') {
    return '<div class="mini-mug" aria-hidden="true">✿</div>';
  }
  return '<div class="template-sheet"><span>Diseña aquí</span></div>';
}

function renderProducts() {
  const query = state.query.trim().toLocaleLowerCase('es');
  const visibleProducts = products.filter((product) => {
    const matchesFilter = state.filter === 'todos' || product.category === state.filter;
    const searchable = `${product.name} ${product.categoryLabel} ${product.description}`.toLocaleLowerCase('es');
    return matchesFilter && (!query || searchable.includes(query));
  });

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-art product-art--${product.art}">
        <span class="art-tag">${product.badge}</span>
        ${getProductArt(product)}
      </div>
      <div class="product-info">
        <p class="product-category">${product.categoryLabel}</p>
        <div class="product-title-row">
          <h3>${product.name}</h3>
          <span class="product-price">${formatPrice(product.price)}</span>
        </div>
        <p class="product-description">${product.description}</p>
        <div class="product-meta">
          <span class="file-type">${product.fileType}</span>
          <button class="add-button" type="button" data-add="${product.id}" aria-label="Agregar ${product.name} al carrito">Agregar +</button>
        </div>
      </div>
    </article>
  `).join('');

  resultsCount.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? 'diseño' : 'diseños'}`;
  emptyResults.hidden = visibleProducts.length > 0;
}

function cartQuantity() {
  return [...cart.values()].reduce((total, item) => total + item.quantity, 0);
}

function cartAmount() {
  return [...cart.values()].reduce((total, item) => total + item.product.price * item.quantity, 0);
}

function renderCart() {
  const items = [...cart.values()];
  const isEmpty = items.length === 0;
  cartEmpty.hidden = !isEmpty;
  cartFooter.hidden = isEmpty;
  cartItems.innerHTML = items.map(({ product, quantity }) => `
    <article class="cart-row">
      <div>
        <h3>${product.name}</h3>
        <p>${formatPrice(product.price)} · precio de muestra</p>
      </div>
      <span class="cart-row-price">${formatPrice(product.price * quantity)}</span>
      <div class="quantity-controls" aria-label="Cantidad de ${product.name}">
        <button type="button" data-quantity="-1" data-product="${product.id}" aria-label="Quitar uno de ${product.name}">−</button>
        <span>${quantity}</span>
        <button type="button" data-quantity="1" data-product="${product.id}" aria-label="Agregar uno de ${product.name}">+</button>
      </div>
    </article>
  `).join('');

  const quantity = cartQuantity();
  cartCount.textContent = String(quantity);
  cartOpenButton.setAttribute('aria-label', `Abrir carrito, ${quantity} ${quantity === 1 ? 'producto' : 'productos'}`);
  cartTotal.textContent = formatPrice(cartAmount());
  checkoutTotal.textContent = formatPrice(cartAmount());
}

function openCart() {
  cartDrawer.classList.add('is-open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  drawerBackdrop.hidden = false;
  document.body.classList.add('has-overlay');
  document.getElementById('cart-close').focus();
}

function closeCart() {
  cartDrawer.classList.remove('is-open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  drawerBackdrop.hidden = true;
  if (checkoutModal.hidden) document.body.classList.remove('has-overlay');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.remove('is-visible'), 2000);
}

productGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button) return;

  const product = products.find((item) => item.id === button.dataset.add);
  if (!product) return;

  const existing = cart.get(product.id);
  cart.set(product.id, { product, quantity: existing ? existing.quantity + 1 : 1 });
  renderCart();
  showToast(`${product.name} se agregó a tu carrito de prueba.`);
});

cartItems.addEventListener('click', (event) => {
  const button = event.target.closest('[data-quantity]');
  if (!button) return;
  const item = cart.get(button.dataset.product);
  if (!item) return;

  item.quantity += Number(button.dataset.quantity);
  if (item.quantity <= 0) cart.delete(button.dataset.product);
  renderCart();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const active = filterButton === button;
      filterButton.classList.toggle('is-active', active);
      filterButton.setAttribute('aria-pressed', String(active));
    });
    renderProducts();
  });
});

searchInput.addEventListener('input', () => {
  state.query = searchInput.value;
  renderProducts();
});

cartOpenButton.addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
document.getElementById('keep-shopping').addEventListener('click', closeCart);
drawerBackdrop.addEventListener('click', closeCart);

document.getElementById('checkout-open').addEventListener('click', () => {
  checkoutModal.hidden = false;
  document.body.classList.add('has-overlay');
  document.getElementById('checkout-close').focus();
});

function closeCheckout() {
  checkoutModal.hidden = true;
  document.body.classList.remove('has-overlay');
  document.getElementById('checkout-open').focus();
}

document.getElementById('checkout-close').addEventListener('click', closeCheckout);
document.getElementById('checkout-finish').addEventListener('click', closeCheckout);
checkoutModal.addEventListener('click', (event) => {
  if (event.target === checkoutModal) closeCheckout();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!checkoutModal.hidden) closeCheckout();
  else if (cartDrawer.classList.contains('is-open')) closeCart();
});

renderProducts();
renderCart();

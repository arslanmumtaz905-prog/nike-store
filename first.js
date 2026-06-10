// Frontend script for Nike Store
// Loads products from backend (fallback to remote placeholder data), handles cart and checkout

const FALLBACK_PRODUCTS = [
  { id: 1, name: "Nike Air Max", price: 120, img: "/images/placeholder.svg", category: "shoes", discount: 20, oldPrice: 150, badge: "Hot Deal", rating: 4.8 },
  { id: 2, name: "Nike Zoom", price: 140, img: "/images/placeholder.svg", category: "shoes", discount: 25, oldPrice: 187, badge: "Flash Sale", rating: 4.7 },
  { id: 3, name: "Nike Tech Fleece", price: 95, img: "/images/placeholder.svg", category: "shirts", discount: 0, badge: "New", rating: 4.5 },
  { id: 4, name: "Nike Dri-FIT Tee", price: 35, img: "/images/placeholder.svg", category: "shirts", discount: 0, badge: "Essential", rating: 4.3 },
  { id: 5, name: "Nike Joggers", price: 60, img: "/images/placeholder.svg", category: "trousers", discount: 0, badge: "Comfort", rating: 4.4 },
  { id: 6, name: "Nike Shorts", price: 50, img: "/images/placeholder.svg", category: "trousers", discount: 0, badge: "Summer", rating: 4.2 }
];

const PAGE_SIZE = 48;
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = new Set(JSON.parse(localStorage.getItem('wishlist') || '[]'));
let currentFiltered = [];
let visibleItemCount = PAGE_SIZE;
let maxPriceFilter = 500;

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function normalizeId(p) {
  if (!p) return p;
  p.id = p._id || p.id || (Math.random() + '').slice(2);
  return p;
}

function formatCurrency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product product-card';
  card.dataset.name = product.name.toLowerCase();

  const badge = document.createElement('span');
  badge.className = 'product-badge';
  badge.innerText = product.discount ? `${product.discount}% OFF` : (product.badge || product.category || 'Nike');
  card.appendChild(badge);

  const img = document.createElement('img');
  img.src = product.img;
  img.alt = product.name;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = 320;
  card.appendChild(img);

  const info = document.createElement('div');
  info.className = 'product-info';

  const h3 = document.createElement('h3');
  h3.innerText = product.name;
  h3.style.cursor = 'pointer';
  h3.addEventListener('click', () => showProductModal(product));
  info.appendChild(h3);

  const priceWrap = document.createElement('div');
  priceWrap.className = 'price-wrap';
  if (product.discount) {
    const oldPrice = document.createElement('span');
    oldPrice.className = 'old-price';
    oldPrice.innerText = formatCurrency(product.oldPrice || product.price * 1.2);
    priceWrap.appendChild(oldPrice);
  }
  const price = document.createElement('strong');
  price.className = 'price';
  price.innerText = formatCurrency(product.price);
  priceWrap.appendChild(price);
  info.appendChild(priceWrap);

  const meta = document.createElement('div');
  meta.className = 'product-meta';
  const stock = Math.floor(Math.random() * 50) + 5;
  const stockClass = stock < 10 ? 'low-stock' : '';
  meta.innerHTML = `<span>${product.category.toUpperCase()} • ⭐ ${product.rating || 4.5}</span><span class="stock-indicator ${stockClass}">📦 ${stock} in stock</span>`;
  info.appendChild(meta);

  const controls = document.createElement('div');
  controls.className = 'product-actions';

  const qty = document.createElement('input');
  qty.type = 'number';
  qty.min = 1;
  qty.value = 1;
  qty.className = 'product-qty';
  controls.appendChild(qty);

  const addBtn = document.createElement('button');
  addBtn.className = 'primary-btn';
  addBtn.innerText = 'Add to Cart';
  addBtn.addEventListener('click', () => addToCart(product, Number(qty.value || 1)));
  controls.appendChild(addBtn);

  const wishBtn = document.createElement('button');
  wishBtn.className = 'wish-btn';
  wishBtn.innerText = wishlist.has(String(product.id)) ? '♥' : '♡';
  wishBtn.title = 'Add to wishlist';
  wishBtn.addEventListener('click', () => { toggleWishlist(product, wishBtn); });
  controls.appendChild(wishBtn);

  const view = document.createElement('a');
  view.href = `product.html?id=${encodeURIComponent(product.id)}`;
  view.className = 'view-link';
  view.innerText = 'View details';
  controls.appendChild(view);

  info.appendChild(controls);
  card.appendChild(info);
  return card;
}

function saveWishlist() { localStorage.setItem('wishlist', JSON.stringify(Array.from(wishlist))); }

function toggleWishlist(product, btn) {
  const id = product.id || product._id || product.name;
  const sid = String(id);
  if (wishlist.has(sid)) {
    wishlist.delete(sid);
    btn.innerText = '♡';
  } else {
    wishlist.add(sid);
    btn.innerText = '♥';
  }
  saveWishlist();
}

function renderProducts(list, containerId, limit = Infinity) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  list.slice(0, limit).forEach(p => {
    normalizeId(p);
    container.appendChild(createProductCard(p));
  });
}

function updateFilterButtons(categories) {
  const buttonContainer = document.getElementById('category-buttons');
  if (!buttonContainer) return;
  buttonContainer.innerHTML = '';

  ['all', ...categories].forEach(category => {
    const btn = document.createElement('button');
    btn.className = 'category-chip';
    btn.type = 'button';
    btn.innerText = category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1);
    btn.dataset.category = category;
    btn.addEventListener('click', () => {
      document.getElementById('category-filter').value = category;
      applyFiltersAndRender();
    });
    buttonContainer.appendChild(btn);
  });
}

function addToCart(product, quantity = 1) {
  const id = product.id || product._id || product.name;
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + (quantity || 1);
  } else {
    cart.push({ id, name: product.name, price: product.price, img: product.img, quantity: quantity || 1 });
  }
  saveCart();
  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCart();
}

function decreaseQuantity(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  if (item.quantity > 1) {
    item.quantity--;
  } else {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  updateCart();
}

function updateCart() {
  const cartContainer = document.getElementById('cart-items');
  if (!cartContainer) return;
  cartContainer.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * (item.quantity || 1);
    const div = document.createElement('div');
    div.className = 'cart-item';

    const img = document.createElement('img');
    img.src = item.img;
    img.width = 50;
    img.alt = item.name;
    div.appendChild(img);

    const details = document.createElement('div');
    details.className = 'cart-item-details';
    details.innerHTML = `<strong>${item.name}</strong><span>${item.quantity} x ${formatCurrency(item.price)}</span>`;
    div.appendChild(details);

    const actions = document.createElement('div');
    actions.className = 'cart-item-actions';
    const dec = document.createElement('button');
    dec.innerText = '-';
    dec.addEventListener('click', () => decreaseQuantity(item.id));
    const rem = document.createElement('button');
    rem.innerText = 'Remove';
    rem.addEventListener('click', () => removeFromCart(item.id));
    actions.appendChild(dec);
    actions.appendChild(rem);
    div.appendChild(actions);

    cartContainer.appendChild(div);
  });

  const tax = +(subtotal * 0.08).toFixed(2);
  const shipping = subtotal > 0 ? 5 : 0;
  const total = +(subtotal + tax + shipping).toFixed(2);
  const totalElement = document.getElementById('cart-total');
  if (totalElement) totalElement.innerHTML = `Subtotal: ${formatCurrency(subtotal)}<br>Tax (8%): ${formatCurrency(tax)}<br>Shipping: ${formatCurrency(shipping)}<br><strong>Total: ${formatCurrency(total)}</strong>`;
}

function applyFiltersAndRender() {
  const cat = document.getElementById('category-filter')?.value || 'all';
  const sort = document.getElementById('sort-select')?.value || 'default';
  const q = document.getElementById('search-bar')?.value?.trim().toLowerCase() || '';
  const maxPrice = Number(document.getElementById('price-filter')?.value || 2000);
  maxPriceFilter = maxPrice;
  const saleOnly = !!document.getElementById('sale-only')?.checked;

  let filtered = products.slice();
  if (cat && cat !== 'all') filtered = filtered.filter(p => p.category === cat);
  if (q) filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
  if (maxPrice) filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
  if (saleOnly) filtered = filtered.filter(p => Number(p.discount || 0) > 0);

  if (sort === 'price-asc') filtered.sort((a,b)=>a.price-b.price);
  if (sort === 'price-desc') filtered.sort((a,b)=>b.price-a.price);
  if (sort === 'name-asc') filtered.sort((a,b)=>a.name.localeCompare(b.name));
  if (sort === 'name-desc') filtered.sort((a,b)=>b.name.localeCompare(a.name));

  currentFiltered = filtered;
  visibleItemCount = PAGE_SIZE;

  const counter = document.getElementById('product-count');
  if (counter) counter.innerText = `${filtered.length.toLocaleString()} items available`;

  const featured = filtered.filter(p => p.discount > 0).sort((a,b)=>b.discount-a.discount).slice(0, 12);
  const trending = filtered.filter(p => p.rating >= 4.7).sort((a,b)=>b.rating-a.rating).slice(0, 12);
  renderProducts(featured, 'top-deal-list');
  renderProducts(trending, 'trending-list');
  renderProducts(filtered, 'all-list', visibleItemCount);
  updateLoadMoreButton();

  const priceDisplay = document.getElementById('price-display');
  if (priceDisplay) priceDisplay.innerText = `Max: $${maxPrice}`;
}

function updateLoadMoreButton() {
  const button = document.getElementById('load-more-btn');
  if (!button) return;
  button.style.display = currentFiltered.length > visibleItemCount ? 'inline-flex' : 'none';
  button.innerText = `Load More Products (${Math.min(currentFiltered.length - visibleItemCount, PAGE_SIZE)} more)`;
}

function loadMoreProducts() {
  visibleItemCount += PAGE_SIZE;
  renderProducts(currentFiltered, 'all-list', visibleItemCount);
  updateLoadMoreButton();
}

function populateFilters() {
  const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const catSel = document.getElementById('category-filter');
  if (catSel) {
    catSel.innerHTML = '<option value="all">All categories</option>' + cats.map(c => `<option value="${c}">${c[0].toUpperCase()+c.slice(1)}</option>`).join('');
    catSel.addEventListener('change', applyFiltersAndRender);
  }
  updateFilterButtons(cats);
}

function filterProducts(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll('.product').forEach(card => {
    const name = card.dataset.name || '';
    card.style.display = name.includes(q) ? '' : 'none';
  });
}

async function handleCheckout(event) {
  event.preventDefault();

  if (cart.length === 0) {
    const orderMessage = document.getElementById('order-message');
    if (orderMessage) orderMessage.innerText = 'Your cart is empty!';
    return;
  }

  const name = document.getElementById('name')?.value || 'Customer';
  const address = document.getElementById('address')?.value || 'your address';
  const email = document.getElementById('email')?.value || 'your email';
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const order = {
    name,
    address,
    email,
    items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }))
      .filter(item => item.quantity > 0),
    total,
    date: new Date()
  };

  let message = `Thank you, ${name}! Your order has been placed and will be shipped to ${address}. A confirmation email will be sent to ${email}.`;
  let success = false;

  let orderResult = null;
  try {
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (response.ok) {
      const data = await response.json();
      message = data.message || message;
      success = true;
      orderResult = data.order || order;
    } else {
      message = 'Order submitted locally. Backend did not accept the request.';
    }
  } catch (error) {
    console.warn('Order send failed:', error.message);
    message = 'Order submitted locally. Backend is not available.';
  }

  if (success) {
    const saved = {
      id: orderResult.id || order.date.toString().slice(0,10).replace(/[^0-9]/g, '') || Date.now().toString(),
      name,
      email,
      address,
      total,
      items: order.items,
      savedAt: orderResult.savedAt || new Date().toISOString()
    };
    sessionStorage.setItem('orderSuccess', JSON.stringify(saved));
    cart = [];
    saveCart();
    updateCart();
    window.location.href = 'order-success.html';
    return;
  }

  const orderMessage = document.getElementById('order-message');
  if (orderMessage) {
    orderMessage.textContent = message;
    orderMessage.style.color = message.toLowerCase().includes('thank') || message.toLowerCase().includes('received') ? 'green' : 'crimson';
    setTimeout(() => { orderMessage.textContent = ''; }, 6000);
  }

  cart = [];
  saveCart();
  updateCart();
  document.getElementById('checkout-form')?.reset();
}

async function loadProducts() {
  try {
    const res = await fetch('/products');
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    products = Array.isArray(data) ? data.map(normalizeId) : FALLBACK_PRODUCTS;
  } catch (e) {
    console.warn('Could not load products from backend, using fallback.', e);
    products = FALLBACK_PRODUCTS.slice();
  }

  populateFilters();
  applyFiltersAndRender();
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCart();

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);

  const searchBar = document.getElementById('search-bar');
  if (searchBar) searchBar.addEventListener('input', () => applyFiltersAndRender());

  const priceFilter = document.getElementById('price-filter');
  if (priceFilter) {
    priceFilter.addEventListener('input', (e) => {
      document.getElementById('price-display').innerText = `Max: $${e.target.value}`;
      applyFiltersAndRender();
    });
  }

  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMoreProducts);

  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletter-email').value;
      localStorage.setItem('newsletterEmail', email);
      document.getElementById('newsletter-status').innerText = '✓ Thanks! Check your email for exclusive offers.';
      document.getElementById('newsletter-status').style.color = '#1a7f37';
      newsletterForm.reset();
      setTimeout(() => { document.getElementById('newsletter-status').innerText = ''; }, 5000);
    });
  }
});

// Product modal functions
function showProductModal(product) {
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  document.getElementById('modal-img').src = product.img;
  document.getElementById('modal-title').textContent = product.name;
  document.getElementById('modal-price').textContent = '$' + product.price;
  document.getElementById('modal-qty').value = 1;
  modal.setAttribute('aria-hidden', 'false');

  // modal add button
  const addBtn = document.getElementById('modal-add');
  const dec = document.getElementById('modal-dec');
  const inc = document.getElementById('modal-inc');
  const qty = document.getElementById('modal-qty');

  function onAdd() {
    const q = Number(qty.value || 1);
    addToCart(product, q);
    closeModal();
  }
  function onDec() { qty.value = Math.max(1, Number(qty.value || 1) - 1); }
  function onInc() { qty.value = Number(qty.value || 1) + 1; }

  addBtn.onclick = onAdd;
  dec.onclick = onDec;
  inc.onclick = onInc;

  // close handlers
  document.getElementById('modal-close').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

function closeModal() {
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
}
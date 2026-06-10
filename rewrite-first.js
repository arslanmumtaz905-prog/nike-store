const fs = require('fs');
const path = require('path');
const content = `// Frontend script for Nike Store
// Loads products from backend, handles cart and checkout

const FALLBACK_PRODUCTS = [
  { id: 1, name: "Nike Air Max", price: 120, img: "https://via.placeholder.com/300x240?text=Nike+Air+Max", category: "shoes" },
  { id: 2, name: "Nike Zoom", price: 140, img: "https://via.placeholder.com/300x240?text=Nike+Zoom", category: "shoes" },
  { id: 3, name: "Nike T-Shirt", price: 40, img: "https://via.placeholder.com/300x240?text=Nike+T-Shirt", category: "shirts" },
  { id: 4, name: "Nike Hoodie", price: 70, img: "https://via.placeholder.com/300x240?text=Nike+Hoodie", category: "shirts" },
  { id: 5, name: "Nike Joggers", price: 60, img: "https://via.placeholder.com/300x240?text=Nike+Joggers", category: "trousers" },
  { id: 6, name: "Nike Shorts", price: 50, img: "https://via.placeholder.com/300x240?text=Nike+Shorts", category: "trousers" }
];

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function normalizeId(p) {
  if (!p) return p;
  p.id = p._id || p.id || (Math.random() + '').slice(2);
  return p;
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product';
  card.dataset.name = product.name.toLowerCase();

  const img = document.createElement('img');
  img.src = product.img;
  img.alt = product.name;
  card.appendChild(img);

  const h3 = document.createElement('h3');
  h3.innerText = product.name;
  card.appendChild(h3);

  const p = document.createElement('p');
  p.innerText = `$${product.price}`;
  card.appendChild(p);

  const btn = document.createElement('button');
  btn.innerText = 'Add to Cart';
  btn.addEventListener('click', () => addToCart(product));
  card.appendChild(btn);

  return card;
}

function renderProducts(list, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  list.forEach(p => {
    normalizeId(p);
    container.appendChild(createProductCard(p));
  });
}

function addToCart(product) {
  const id = product.id;
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ id, name: product.name, price: product.price, img: product.img, quantity: 1 });
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
  let total = 0;

  cart.forEach(item => {
    total += item.price * (item.quantity || 1);
    const div = document.createElement('div');
    div.className = 'cart-item';

    const img = document.createElement('img');
    img.src = item.img;
    img.width = 50;
    img.alt = item.name;
    div.appendChild(img);

    const span = document.createElement('span');
    span.innerText = `${item.name} - $${item.price} x ${item.quantity || 1}`;
    div.appendChild(span);

    const dec = document.createElement('button');
    dec.innerText = '-';
    dec.addEventListener('click', () => decreaseQuantity(item.id));
    div.appendChild(dec);

    const rem = document.createElement('button');
    rem.innerText = 'Remove';
    rem.addEventListener('click', () => removeFromCart(item.id));
    div.appendChild(rem);

    cartContainer.appendChild(div);
  });

  const totalElement = document.getElementById('cart-total');
  if (totalElement) totalElement.innerText = 'Total: $' + total;
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
    items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
    total,
    date: new Date()
  };

  let message = `Thank you, ${name}! Your order has been placed and will be shipped to ${address}. A confirmation email will be sent to ${email}.`;

  try {
    const response = await fetch('http://localhost:5000/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (response.ok) {
      const data = await response.json();
      message = data.message || message;
    } else {
      message = 'Order submitted locally. Backend did not accept the request.';
    }
  } catch (error) {
    console.warn('Order send failed:', error.message);
    message = 'Order submitted locally. Backend is not available.';
  }

  const orderMessage = document.getElementById('order-message');
  if (orderMessage) orderMessage.innerText = message;

  cart = [];
  saveCart();
  updateCart();
  document.getElementById('checkout-form')?.reset();
}

async function loadProducts() {
  try {
    const res = await fetch('http://localhost:5000/products');
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    products = Array.isArray(data) ? data.map(normalizeId) : FALLBACK_PRODUCTS.slice();
  } catch (e) {
    console.warn('Could not load products from backend, using fallback.', e);
    products = FALLBACK_PRODUCTS.slice();
  }

  renderProducts(products.filter(p => p.category === 'shoes'), 'shoe-list');
  renderProducts(products.filter(p => p.category === 'shirts'), 'shirt-list');
  renderProducts(products.filter(p => p.category === 'trousers'), 'trouser-list');
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCart();

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);

  const searchBar = document.getElementById('search-bar');
  if (searchBar) searchBar.addEventListener('input', e => filterProducts(e.target.value));
});
`;
fs.writeFileSync(path.join(__dirname, 'first.js'), content, 'utf8');
console.log('first.js rewritten');

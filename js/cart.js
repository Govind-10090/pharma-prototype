// ===== KIRTI PHARMA — cart.js =====
// Cart page rendering, qty management, checkout flow

function renderCartPage() {
  renderCartItems();
  renderOrderSummary();
  renderPaymentTiles();
}

// ===== CART ITEMS =====
function renderCartItems() {
  const container = document.getElementById('cart-items-container');
  const emptyState = document.getElementById('cart-empty-state');
  const cartSection = document.getElementById('cart-section');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    if (cartSection) cartSection.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (cartSection) cartSection.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  container.innerHTML = cart.map(item => {
    const med = MEDICINES.find(m => m.id === item.id);
    const imgSrc = med?.image || CAT_IMAGES[med?.category] || 'images/med_fever_pain.png';
    return `
      <div class="cart-item" id="cart-item-${item.id}">
        <div class="cart-item-icon" style="background:#F0FAF4;overflow:hidden">
          <img src="${imgSrc}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:10px">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-brand">${item.brand}</div>
          <div class="cart-item-price">₹${item.price} per ${item.packUnit || 'strip'}</div>
        </div>
        <div class="qty-stepper">
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.qty - 1})" aria-label="Decrease quantity">−</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.qty + 1})" aria-label="Increase quantity">+</button>
        </div>
        <div class="cart-item-total">₹${(item.price * item.qty).toFixed(0)}</div>
        <button class="cart-remove" onclick="removeItem(${item.id})" aria-label="Remove item">✕</button>
      </div>
    `;
  }).join('');
}

function changeQty(id, newQty) {
  if (newQty < 1) {
    removeItem(id);
    return;
  }
  updateQty(id, newQty);
  renderCartPage();
}

function removeItem(id) {
  removeFromCart(id);
  const el = document.getElementById(`cart-item-${id}`);
  if (el) {
    el.style.transition = 'opacity 0.2s, transform 0.2s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => renderCartPage(), 220);
  } else {
    renderCartPage();
  }
  showToast('Item removed from cart', 'info');
}

// ===== ORDER SUMMARY =====
function renderOrderSummary() {
  const cart = getCart();
  const subtotal = getCartTotal();
  const delivery = subtotal >= KP.DELIVERY_THRESHOLD ? 0 : KP.DELIVERY_FEE;
  const total = subtotal + delivery;
  const minDiff = KP.MIN_ORDER - subtotal;

  // Summary values
  const subtotalEl = document.getElementById('summary-subtotal');
  const deliveryEl = document.getElementById('summary-delivery');
  const totalEl = document.getElementById('summary-total');
  const minWarnEl = document.getElementById('min-order-warning');
  const checkoutBtn = document.getElementById('checkout-btn');
  const itemCountEl = document.getElementById('summary-item-count');

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(0)}`;
  if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'FREE 🎉' : `₹${delivery}`;
  if (totalEl) totalEl.textContent = `₹${total.toFixed(0)}`;
  if (itemCountEl) {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    itemCountEl.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  }

  // Min order check
  if (minWarnEl && checkoutBtn) {
    if (cart.length === 0) {
      minWarnEl.style.display = 'none';
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add('btn-disabled');
    } else if (subtotal < KP.MIN_ORDER) {
      minWarnEl.style.display = 'flex';
      minWarnEl.innerHTML = `<span>⚠️</span> Add ₹${Math.ceil(minDiff)} more to checkout (Minimum ₹${KP.MIN_ORDER})`;
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add('btn-disabled');
    } else {
      minWarnEl.style.display = 'none';
      checkoutBtn.disabled = false;
      checkoutBtn.classList.remove('btn-disabled');
    }
  }

  // Delivery notice
  const deliveryNoteEl = document.getElementById('delivery-note');
  if (deliveryNoteEl) {
    if (subtotal > 0 && subtotal < KP.DELIVERY_THRESHOLD) {
      const needed = KP.DELIVERY_THRESHOLD - subtotal;
      deliveryNoteEl.textContent = `Add ₹${Math.ceil(needed)} more for free delivery`;
      deliveryNoteEl.style.color = 'var(--saffron)';
    } else if (subtotal >= KP.DELIVERY_THRESHOLD) {
      deliveryNoteEl.textContent = '🎉 You got free delivery!';
      deliveryNoteEl.style.color = '#10B981';
    } else {
      deliveryNoteEl.textContent = '';
    }
  }
}

// ===== PAYMENT TILES =====
const UPI_PAYMENT_METHODS = [
  { id: 'gpay',    imgSrc: 'images/pay_googlepay.png', name: 'Google Pay',  color: '#34A853' },
  { id: 'phonepe', imgSrc: 'images/pay_phonepe.png',   name: 'PhonePe',     color: '#6739B7' },
  { id: 'paytm',   imgSrc: 'images/pay_paytm.png',     name: 'Paytm',       color: '#00BAF2' },
  { id: 'bhim',    imgSrc: 'images/pay_bhim.png',      name: 'BHIM UPI',    color: '#F5A623' },
];

const PAYMENT_METHODS = [
  ...UPI_PAYMENT_METHODS,
  { id: 'cod', name: 'Cash on Delivery' },
];

let selectedPayment = 'gpay';

function renderPaymentTiles() {
  const container = document.getElementById('payment-tiles');
  if (!container) return;
  container.innerHTML = UPI_PAYMENT_METHODS.map(p => `
    <div class="payment-tile${selectedPayment === p.id ? ' selected' : ''}"
         id="pay-${p.id}"
         onclick="selectPayment('${p.id}')"
         role="radio"
         aria-checked="${selectedPayment === p.id}"
         tabindex="0">
      <img src="${p.imgSrc}" alt="${p.name}" class="payment-tile-logo">
      <span class="payment-tile-name">${p.name}</span>
    </div>
  `).join('');
}

function selectPayment(id) {
  selectedPayment = id;
  document.querySelectorAll('.payment-tile').forEach(el => {
    el.classList.remove('selected');
    el.setAttribute('aria-checked', 'false');
  });
  const selected = document.getElementById(`pay-${id}`);
  if (selected) {
    selected.classList.add('selected');
    selected.setAttribute('aria-checked', 'true');
  }
}

// ===== CHECKOUT =====
function handleCheckout() {
  const cart = getCart();
  if (!cart.length) { showToast('Your cart is empty!', 'error'); return; }
  if (getCartTotal() < KP.MIN_ORDER) { showToast(`Minimum order is ₹${KP.MIN_ORDER}`, 'error'); return; }

  const method = PAYMENT_METHODS.find(p => p.id === selectedPayment);
  const btn = document.getElementById('checkout-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Processing...';
  }

  setTimeout(() => {
    showToast(`✅ Order placed via ${method?.name || 'UPI'}! Redirecting...`, 'success', 2000);
    clearCart();
    setTimeout(() => {
      window.location.href = 'track.html';
    }, 1500);
  }, 1000);
}

// ===== ADDRESS SELECTOR =====
function selectAddress(idx) {
  document.querySelectorAll('.address-card').forEach((card, i) => {
    card.classList.toggle('selected', i === idx);
    const radio = card.querySelector('input[type="radio"]');
    if (radio) radio.checked = (i === idx);
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();

  // Checkout button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }

  // Address cards
  document.querySelectorAll('.address-card').forEach((card, i) => {
    card.addEventListener('click', () => selectAddress(i));
  });
  selectAddress(0); // default first address
});

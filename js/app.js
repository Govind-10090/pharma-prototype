// ===== KIRTI PHARMA — app.js =====
// Global State, Cart Logic, Toast System

const KP = {
  VERSION: '1.0.0',
  WA_NUMBER: '919876543210',
  WA_MSG: 'Hi%20Kirti%20Pharma%2C%20I%20want%20to%20place%20a%20medicine%20order.',
  CART_KEY: 'kp_cart',
  MIN_ORDER: 299,
  DELIVERY_THRESHOLD: 499,
  DELIVERY_FEE: 30,
};

// ===== CART FUNCTIONS =====
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(KP.CART_KEY)) || [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(KP.CART_KEY, JSON.stringify(cart));
  updateAllCartBadges();
  // Sync the home page medicine grid (if on index.html)
  if (typeof renderGrid === 'function') {
    renderGrid();
  }
}

function updateCardQty(id, newQty) {
  updateQty(id, newQty);
}

function addToCart(medicine) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === medicine.id);
  if (idx > -1) {
    cart[idx].qty = Math.min(cart[idx].qty + 1, 10);
  } else {
    cart.push({
      id: medicine.id,
      name: medicine.name,
      brand: medicine.brand,
      price: medicine.price,
      packUnit: medicine.packUnit || 'strip',
      packSize: medicine.packSize || 1,
      category: medicine.category,
      imageColor: medicine.imageColor,
      qty: 1,
    });
  }
  saveCart(cart);
  animateCartBadge();
  showToast(`${medicine.name} added to cart 🛒`, 'success');
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
}

function updateQty(id, qty) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx > -1) {
    if (qty <= 0) { cart.splice(idx, 1); }
    else { cart[idx].qty = Math.min(qty, 10); }
  }
  saveCart(cart);
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function clearCart() {
  localStorage.removeItem(KP.CART_KEY);
  updateAllCartBadges();
}

// ===== CART BADGE =====
function updateAllCartBadges() {
  const count = getCartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
  document.querySelectorAll('.tab-cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function animateCartBadge() {
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.classList.remove('badge-animate');
    void el.offsetWidth; // reflow
    el.classList.add('badge-animate');
    setTimeout(() => el.classList.remove('badge-animate'), 300);
  });
}

// ===== TOAST SYSTEM =====
const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ===== NAVBAR INIT =====
function initNavbar() {
  const hamburger = document.querySelector('.hamburger');
  const drawer = document.querySelector('.mobile-nav-drawer');
  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      drawer.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !drawer.contains(e.target)) {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
      }
    });
  }

  // Active nav link highlighting
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav-drawer a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPage === href || (currentPage === '' && href === 'index.html'))) {
      link.classList.add('active');
    }
  });

  // Active tab bar highlighting
  document.querySelectorAll('.tab-item').forEach(tab => {
    const href = tab.getAttribute('href');
    if (href && (currentPage === href || (currentPage === '' && href === 'index.html'))) {
      tab.classList.add('active');
    }
  });
}

// ===== PINCODE SELECTION =====
function updatePincodeUI() {
  const pin = localStorage.getItem('kp_pincode') || '441614';
  const display = document.getElementById('nav-pincode-display');
  if (display) {
    display.textContent = `Gondia - ${pin}`;
  }
  const input = document.getElementById('pincode-input');
  if (input) {
    input.value = pin;
  }
}

function openPincodeModal() {
  const modal = document.getElementById('pincode-modal');
  if (modal) modal.classList.add('open');
}

function closePincodeModal() {
  const modal = document.getElementById('pincode-modal');
  if (modal) modal.classList.remove('open');
}

function applyPincode() {
  const input = document.getElementById('pincode-input');
  if (!input) return;
  const pin = input.value.trim();
  if (/^\d{6}$/.test(pin)) {
    localStorage.setItem('kp_pincode', pin);
    updatePincodeUI();
    closePincodeModal();
    if (pin.startsWith('441')) {
      showToast(`📍 Delivering to Gondia - ${pin} (Express Same-Day)`, 'success', 4000);
    } else {
      showToast(`📍 Delivering to ${pin} (Standard 2-3 Days Shipping)`, 'warning', 4000);
    }
  } else {
    showToast('Please enter a valid 6-digit pin code', 'error');
  }
}

// ===== SIMULATED OTP LOGIN =====
let otpTimerInterval = null;
let dummyOTP = '1234';

function openLoginModal(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('login-modal');
  if (!modal) return;
  
  // Reset views
  document.getElementById('login-phone-screen').style.display = 'block';
  document.getElementById('login-loading-screen').style.display = 'none';
  document.getElementById('login-otp-screen').style.display = 'none';
  
  // Clear inputs
  document.getElementById('login-phone-input').value = '';
  document.querySelectorAll('.otp-digit').forEach(el => el.value = '');
  
  modal.classList.add('open');
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('open');
  clearInterval(otpTimerInterval);
}

function sendOTP() {
  const phone = document.getElementById('login-phone-input').value.trim();
  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    return;
  }
  
  document.getElementById('login-phone-screen').style.display = 'none';
  document.getElementById('login-loading-screen').style.display = 'block';
  
  setTimeout(() => {
    document.getElementById('login-loading-screen').style.display = 'none';
    document.getElementById('login-otp-screen').style.display = 'block';
    document.getElementById('otp-phone-display').textContent = `+91 ${phone.slice(0,5)} ${phone.slice(5)}`;
    
    // Auto-focus first digit
    const firstDigitInput = document.querySelector('.otp-digit');
    if (firstDigitInput) firstDigitInput.focus();
    
    startOTPTimer();
    showToast('ℹ️ Dummy OTP is 1234', 'info', 5000);
  }, 1200);
}

function startOTPTimer() {
  let seconds = 30;
  const timerText = document.getElementById('otp-timer-text');
  const resendBtn = document.getElementById('otp-resend-btn');
  if (timerText) timerText.style.display = 'block';
  if (resendBtn) resendBtn.style.display = 'none';
  
  clearInterval(otpTimerInterval);
  otpTimerInterval = setInterval(() => {
    seconds--;
    if (timerText) timerText.textContent = `Resend OTP in ${seconds}s`;
    if (seconds <= 0) {
      clearInterval(otpTimerInterval);
      if (timerText) timerText.style.display = 'none';
      if (resendBtn) resendBtn.style.display = 'block';
    }
  }, 1000);
}

function resendOTP() {
  showToast('OTP Resent! Dummy code is 1234', 'success');
  startOTPTimer();
}

function verifyOTP() {
  let otp = '';
  document.querySelectorAll('.otp-digit').forEach(el => otp += el.value.trim());
  
  if (otp.length < 4) {
    showToast('Please enter all 4 digits', 'error');
    return;
  }
  
  if (otp === dummyOTP || otp === '1234') {
    localStorage.setItem('kp_logged_in', 'true');
    localStorage.setItem('kp_user_name', 'Kirti Customer');
    showToast('Login successful! Welcome back, Kirti Customer 👤', 'success');
    closeLoginModal();
    checkLoginState();
  } else {
    showToast('Invalid OTP. Please try again.', 'error');
  }
}

function logoutUser() {
  localStorage.removeItem('kp_logged_in');
  localStorage.removeItem('kp_user_name');
  showToast('Logged out successfully', 'info');
  checkLoginState();
}

function checkLoginState() {
  const loggedIn = localStorage.getItem('kp_logged_in') === 'true';
  const loginBtn = document.getElementById('nav-login-btn');
  const userDropdown = document.getElementById('nav-user-dropdown');
  const userVal = document.getElementById('nav-user-name');
  
  if (loggedIn) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'block';
    if (userVal) userVal.textContent = '👤 Account';
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (userDropdown) userDropdown.style.display = 'none';
  }
}

function toggleUserDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('nav-user-menu');
  if (menu) menu.classList.toggle('open');
}

// ===== GLOBAL INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateAllCartBadges();
  initNavbar();
  updatePincodeUI();
  checkLoginState();
  
  // Close user dropdown on outside click
  document.addEventListener('click', () => {
    const menu = document.getElementById('nav-user-menu');
    if (menu) menu.classList.remove('open');
  });

  // Setup OTP input auto-focus flow
  const otpDigits = document.querySelectorAll('.otp-digit');
  otpDigits.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length === 1 && index < otpDigits.length - 1) {
        otpDigits[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpDigits[index - 1].focus();
      }
    });
  });

  // Modal overlays click closing
  document.getElementById('pincode-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closePincodeModal();
  });
  document.getElementById('login-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeLoginModal();
  });
});

window.addEventListener('focus', updateAllCartBadges);

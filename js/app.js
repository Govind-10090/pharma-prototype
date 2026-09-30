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
// ===== DATABASE-BACKED OTP LOGIN & ROLE-BASED ACCESS =====
let otpTimerInterval = null;
let dummyOTP = '1234';

function setLoginRole(role) {
  // Chemist role is automatically detected from database credentials
}

function openLoginModal(e) {
  if (e && e.preventDefault) e.preventDefault();
  const modal = document.getElementById('login-modal');
  if (!modal) {
    window.location.href = 'login.html';
    return;
  }

  // Reset views
  const phoneScreen = document.getElementById('login-phone-screen');
  const loadingScreen = document.getElementById('login-loading-screen');
  const otpScreen = document.getElementById('login-otp-screen');
  if (phoneScreen) phoneScreen.style.display = 'block';
  if (loadingScreen) loadingScreen.style.display = 'none';
  if (otpScreen) otpScreen.style.display = 'none';

  // Clear inputs
  const phoneInput = document.getElementById('login-phone-input');
  const nameInput = document.getElementById('login-name-input');
  if (phoneInput) phoneInput.value = '';
  if (nameInput) nameInput.value = '';
  document.querySelectorAll('.otp-digit').forEach(el => el.value = '');

  modal.classList.add('open');

  setTimeout(() => {
    if (phoneInput) phoneInput.focus();
  }, 100);

  setupOtpDigitAutoAdvance();
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('open');
  clearInterval(otpTimerInterval);
}

function setupOtpDigitAutoAdvance() {
  const digits = document.querySelectorAll('.otp-digit');
  digits.forEach((digit, idx) => {
    digit.oninput = (e) => {
      digit.value = digit.value.replace(/[^0-9]/g, '');
      if (digit.value && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }
    };
    digit.onkeydown = (e) => {
      if (e.key === 'Backspace' && !digit.value && idx > 0) {
        digits[idx - 1].focus();
      } else if (e.key === 'Enter') {
        verifyOTP();
      }
    };
  });
}

async function sendOTP() {
  const phoneInput = document.getElementById('login-phone-input');
  const nameInput = document.getElementById('login-name-input');
  const phone = phoneInput ? phoneInput.value.replace(/[^0-9]/g, '').trim() : '';

  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    if (phoneInput) phoneInput.focus();
    return;
  }

  const phoneScreen = document.getElementById('login-phone-screen');
  const loadingScreen = document.getElementById('login-loading-screen');
  const otpScreen = document.getElementById('login-otp-screen');

  if (phoneScreen) phoneScreen.style.display = 'none';
  if (loadingScreen) loadingScreen.style.display = 'block';

  try {
    // 1. Check if user exists in database
    const lookupRes = await fetch(`/api/auth/lookup?phone=${encodeURIComponent(phone)}`);
    const lookupData = await lookupRes.json();

    if (lookupData.success && lookupData.exists && lookupData.user) {
      if (nameInput && !nameInput.value) {
        nameInput.value = lookupData.user.name;
      }
      if (lookupData.user.role === 'admin') {
        showToast(`Welcome back, ${lookupData.user.name}! 🧑‍⚕️`, 'info', 3000);
      } else {
        showToast(`Welcome back, ${lookupData.user.name}! 🌿`, 'info', 3000);
      }
    } else {
      showToast('New Customer: Code sent for instant registration! 🌿', 'info', 3000);
    }

    // 2. Request OTP from backend
    await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
  } catch (err) {
    console.warn('[AUTH] Lookup warning:', err);
  }

  setTimeout(() => {
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (otpScreen) otpScreen.style.display = 'block';

    const phoneDisplay = document.getElementById('otp-phone-display');
    if (phoneDisplay) {
      phoneDisplay.textContent = `+91 ${phone.slice(0,5)} ${phone.slice(5)}`;
    }

    const firstDigit = document.querySelector('.otp-digit');
    if (firstDigit) {
      firstDigit.value = '';
      firstDigit.focus();
    }

    startOTPTimer();
    showToast('ℹ️ Demo Verification Code is 1234', 'info', 6000);
  }, 600);
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
  showToast('OTP Resent! Demo verification code is 1234', 'success');
  startOTPTimer();
}

async function verifyOTP() {
  let otp = '';
  document.querySelectorAll('.otp-digit').forEach(el => otp += el.value.trim());

  if (otp.length < 4) {
    showToast('Please enter all 4 digits', 'error');
    return;
  }

  const phoneInput = document.getElementById('login-phone-input');
  const nameInput = document.getElementById('login-name-input');
  const phone = phoneInput ? phoneInput.value.replace(/[^0-9]/g, '').trim() : (localStorage.getItem('kp_user_phone') || '9876543210');
  const name = nameInput ? nameInput.value.trim() : '';

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name })
    });
    const data = await res.json();

    if (!data.success || !data.user) {
      showToast(data.error || 'Invalid OTP. Please use demo code 1234.', 'error');
      return;
    }

    const user = data.user;

    // Save logged-in state & customer info in browser storage
    localStorage.setItem('kp_logged_in', 'true');
    localStorage.setItem('kp_user_phone', user.phone);
    localStorage.setItem('kp_user_name', user.name);
    localStorage.setItem('kp_user_role', user.role); // 'admin' | 'customer'
    if (data.token) localStorage.setItem('kp_token', data.token);
    if (user.addresses) localStorage.setItem('kp_user_addresses', JSON.stringify(user.addresses));

    closeLoginModal();
    checkLoginState();

    // STRICT ROLE-BASED ROUTING:
    // If chemist/client logged in -> Go to Chemist Dashboard
    // If ordinary customer logged in -> Stay on / go to Customer page (index.html), NEVER client dashboard!
    if (user.role === 'admin') {
      showToast(`🧑‍⚕️ Chemist verified! Welcome, ${user.name}. Opening Chemist Dashboard...`, 'success', 2500);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    } else {
      showToast(`✅ Welcome, ${user.name}! 👤`, 'success', 3000);
      // If customer was on login.html or dashboard.html, redirect them to index.html
      const curPage = window.location.pathname.split('/').pop() || 'index.html';
      if (curPage === 'dashboard.html' || curPage === 'login.html') {
        window.location.href = 'index.html';
      }
    }
  } catch (err) {
    console.error('[AUTH ERROR]:', err);
    showToast('Failed to verify OTP. Please try again.', 'error');
  }
}

function logoutUser() {
  localStorage.removeItem('kp_logged_in');
  localStorage.removeItem('kp_user_name');
  localStorage.removeItem('kp_user_phone');
  localStorage.removeItem('kp_user_role');
  localStorage.removeItem('kp_user_addresses');
  localStorage.removeItem('kp_token');
  showToast('Logged out successfully', 'info');
  checkLoginState();

  const curPage = window.location.pathname.split('/').pop() || 'index.html';
  if (curPage === 'dashboard.html') {
    window.location.href = 'index.html';
  }
}

function checkLoginState() {
  const loggedIn = localStorage.getItem('kp_logged_in') === 'true';
  const role = (localStorage.getItem('kp_user_role') || 'customer').toLowerCase();
  const isAdmin = (loggedIn && (role === 'admin' || role === 'chemist'));
  const loginBtn = document.getElementById('nav-login-btn');
  const userDropdown = document.getElementById('nav-user-dropdown');
  const userVal = document.getElementById('nav-user-name');

  if (loggedIn) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'block';
    const name = localStorage.getItem('kp_user_name') || 'Account';
    const shortName = name.split(' ')[0] || 'Account';
    if (userVal) userVal.textContent = isAdmin ? `🧑‍⚕️ ${shortName} ▾` : `👤 ${shortName} ▾`;
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (userDropdown) userDropdown.style.display = 'none';
  }

  // Access Control: Hide Chemist Dashboard from ordinary customers!
  // Whoever is tagged with admin in database gets Chemist Dashboard access!
  document.querySelectorAll('a[href="dashboard.html"]').forEach(a => {
    if (a.closest('#nav-user-menu') || a.closest('#mobile-drawer') || a.classList.contains('tab-item') || a.classList.contains('dropdown-item')) {
      a.style.display = isAdmin ? '' : 'none';
    }
  });
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

  // If redirected from restricted area (e.g. Chemist Dashboard)
  const authMsg = sessionStorage.getItem('kp_auth_msg');
  if (authMsg) {
    sessionStorage.removeItem('kp_auth_msg');
    setTimeout(() => {
      showToast(authMsg, 'warning', 5000);
    }, 400);
  }
  
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

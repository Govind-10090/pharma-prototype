// ===== KIRTI PHARMA — search.js =====
// Live search, category filter, salt-matching, voice search, medicine grid render

let activeCategory = 'All';
let searchQuery = '';
let searchDebounceTimer = null;
let visibleMedicinesCount = 15;

const CATEGORIES = ['All', 'Fever & Pain', 'Antibiotics', 'Gastro', 'Chronic Care', 'Vitamins & Supplements', 'Skincare', 'Baby Care', 'ENT'];

// Category → strip color mapping
const CAT_COLORS = {
  'Fever & Pain': '#EF4444',
  'Antibiotics': '#F59E0B',
  'Gastro': '#10B981',
  'Chronic Care': '#8B5CF6',
  'Vitamins & Supplements': '#F97316',
  'Skincare': '#EC4899',
  'Baby Care': '#06B6D4',
  'ENT': '#6366F1',
  'Cardiac': '#DC2626',
  'Diabetes': '#059669',
};

function getStripColor(medicine) {
  return CAT_COLORS[medicine.category] || '#6B7280';
}

function filterMedicines() {
  let result = [...MEDICINES];
  if (activeCategory !== 'All') {
    result = result.filter(m => m.category === activeCategory);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.salt.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  }
  return result;
}

function highlightText(text, query) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(query.trim())})`, 'gi');
  return text.replace(regex, '<mark class="highlight-match">$1</mark>');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSavingsPercent(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round((mrp - price) / mrp * 100);
}

function renderMedicineCard(med, query = '') {
  const inStock = med.stock > 0;
  const savings = getSavingsPercent(med.price, med.mrp);
  const stripColor = getStripColor(med);
  const imgSrc = med.image || CAT_IMAGES[med.category] || 'images/med_fever_pain.png';

  const cart = getCart();
  const cartItem = cart.find(item => item.id === med.id);

  let actionsHtml = '';
  if (!inStock) {
    actionsHtml = `<button class="btn-add-cart" disabled>Out of Stock</button>
                  <button class="btn-alt-link" onclick="openAlternatives(${med.id})">See Alternatives</button>`;
  } else if (cartItem) {
    actionsHtml = `
      <div class="card-stepper">
        <button class="card-stepper-btn" onclick="updateCardQty(${med.id}, ${cartItem.qty - 1})">−</button>
        <span class="card-stepper-val">${cartItem.qty}</span>
        <button class="card-stepper-btn" onclick="updateCardQty(${med.id}, ${cartItem.qty + 1})">+</button>
      </div>
    `;
  } else {
    actionsHtml = `<button class="btn-add-cart" onclick="handleAddToCart(${med.id})" id="add-btn-${med.id}">
                  + Add to Cart
                 </button>`;
  }

  return `
    <div class="medicine-card fade-up visible" data-id="${med.id}">
      <div class="medicine-card-strip" style="background:${stripColor}"></div>
      <div class="medicine-card-img-wrap">
        <img src="${imgSrc}" alt="${med.name}" class="medicine-card-img" loading="lazy">
        ${!inStock ? '<div class="medicine-card-img-overlay"><span>Out of Stock</span></div>' : ''}
      </div>
      <div class="medicine-card-body">
        <div class="medicine-name">${highlightText(med.name, query)}</div>
        <div class="medicine-salt">${highlightText(med.salt, query)}</div>
        <div class="medicine-brand">${med.brand} &middot; ${med.packSize}&nbsp;${med.packUnit}</div>
        <div class="medicine-badges">
          ${med.prescription_required ? '<span class="badge badge-rx">Rx</span>' : ''}
          ${med.chronic ? '<span class="badge badge-chronic">Chronic ♻️</span>' : ''}
          ${inStock
            ? '<span class="badge badge-instock">● In Stock</span>'
            : '<span class="badge badge-outstock">● Out of Stock</span>'}
        </div>
        <div class="medicine-price-row">
          <span class="medicine-price">₹${med.price}</span>
          ${med.mrp > med.price ? `<span class="medicine-mrp">₹${med.mrp}</span>` : ''}
          ${savings > 0 ? `<span class="medicine-savings">Save ₹${med.mrp - med.price}</span>` : ''}
        </div>
      </div>
      <div class="medicine-card-actions">
        ${actionsHtml}
      </div>
    </div>
  `;
}

function handleAddToCart(id) {
  const med = MEDICINES.find(m => m.id === id);
  if (!med) return;
  addToCart(med);
}

function renderGrid() {
  const grid = document.getElementById('medicine-grid');
  const countEl = document.getElementById('medicine-count');
  if (!grid) return;

  const filtered = filterMedicines();
  const shownCount = Math.min(visibleMedicinesCount, filtered.length);
  if (countEl) countEl.textContent = `Showing ${shownCount} of ${filtered.length} medicine${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <span class="empty-icon">🔍</span>
        <div class="empty-title">No medicines found</div>
        <div class="empty-desc">Try searching by a different name, salt, or brand — or clear the filters.</div>
        <button class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
      </div>
    `;
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) loadMoreContainer.innerHTML = '';
    return;
  }

  const pageItems = filtered.slice(0, visibleMedicinesCount);
  grid.innerHTML = pageItems.map(m => renderMedicineCard(m, searchQuery)).join('');

  // Handle Load More Button
  const loadMoreContainer = document.getElementById('load-more-container');
  if (loadMoreContainer) {
    if (filtered.length > visibleMedicinesCount) {
      loadMoreContainer.innerHTML = `
        <button onclick="loadMoreMedicines()" class="btn btn-secondary btn-lg" style="background:var(--white);color:var(--green-primary);border:2px solid var(--green-primary);padding:14px 48px;border-radius:12px;font-weight:700;font-family:'Outfit',sans-serif;box-shadow:var(--shadow-sm);transition:all 0.2s" onmouseover="this.style.background='var(--green-light)'" onmouseout="this.style.background='var(--white)'">
          Load More Medicines ↓
        </button>
      `;
    } else {
      loadMoreContainer.innerHTML = '';
    }
  }
}

function loadMoreMedicines() {
  visibleMedicinesCount += 15;
  renderGrid();
}

function clearFilters() {
  searchQuery = '';
  activeCategory = 'All';
  visibleMedicinesCount = 15;
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  updateCategoryPills();
  renderGrid();
}

function updateCategoryPills() {
  document.querySelectorAll('.pill[data-cat]').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.cat === activeCategory);
  });
}

// ===== ALTERNATIVES MODAL =====
function openAlternatives(id) {
  const med = MEDICINES.find(m => m.id === id);
  if (!med) return;

  const alts = MEDICINES.filter(m => {
    const thisSalts = med.salt.split('+').map(s => s.trim().toLowerCase());
    return m.id !== id && thisSalts.some(s => m.salt.toLowerCase().includes(s));
  }).sort((a, b) => a.price - b.price);

  const modal = document.getElementById('alt-modal');
  const titleEl = document.getElementById('alt-modal-title');
  const bodyEl = document.getElementById('alt-modal-body');
  if (!modal) return;

  titleEl.textContent = `Alternatives for ${med.name}`;

  if (alts.length === 0) {
    bodyEl.innerHTML = `<div class="empty-state" style="padding:32px 0"><span class="empty-icon">😔</span><div class="empty-title">No alternatives found</div><div class="empty-desc">We don't have alternatives with the same salt composition in stock.</div></div>`;
  } else {
    bodyEl.innerHTML = `
      <table class="alt-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Brand</th>
            <th>Price</th>
            <th>Savings</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${alts.map(a => {
            const saving = med.price - a.price;
            return `
              <tr>
                <td>
                  <div style="font-weight:600;font-size:0.85rem">${a.name}</div>
                  <div style="font-size:0.72rem;color:var(--text-light)">${a.salt}</div>
                </td>
                <td style="font-size:0.82rem;color:var(--text-muted)">${a.brand}</td>
                <td style="font-weight:700">₹${a.price}</td>
                <td>
                  ${saving > 0 ? `<span class="badge badge-instock">Save ₹${saving}</span>` : '—'}
                </td>
                <td>
                  ${a.stock > 0
                    ? `<button class="btn btn-sm btn-primary" onclick="addToCart(MEDICINES.find(m=>m.id===${a.id}));closeModal('alt-modal')">Add</button>`
                    : `<span class="badge badge-outstock">Out of Stock</span>`}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// ===== VOICE SEARCH =====
function initVoiceSearch() {
  const micBtn = document.getElementById('mic-btn');
  if (!micBtn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.title = 'Voice search not supported in this browser';
    micBtn.style.opacity = '0.4';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let isListening = false;

  micBtn.addEventListener('click', () => {
    if (isListening) { recognition.stop(); return; }
    recognition.start();
    isListening = true;
    micBtn.classList.add('listening');
    showToast('🎤 Listening...', 'info', 4000);
  });

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    const input = document.getElementById('search-input');
    if (input) {
      input.value = transcript;
      searchQuery = transcript;
      renderGrid();
      showToast(`Searching for "${transcript}"`, 'success');
    }
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
  };

  recognition.onerror = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    showToast('Voice search failed. Try again.', 'error');
  };
}

// ===== SEARCH AUTOCOMPLETE SUGGESTIONS =====
function showSuggestions() {
  const dropdown = document.getElementById('search-suggest-dropdown');
  const input = document.getElementById('search-input');
  if (!dropdown || !input) return;

  const query = input.value.trim().toLowerCase();
  
  if (!query) {
    // Show Trending and Categories Shortcuts
    dropdown.innerHTML = `
      <div class="search-suggest-section-title">Trending Searches</div>
      <div class="search-trending-pills">
        <button class="trending-pill" onclick="selectSuggestion('Dolo 650')">💊 Dolo 650</button>
        <button class="trending-pill" onclick="selectSuggestion('Crocin')">💊 Crocin</button>
        <button class="trending-pill" onclick="selectSuggestion('Becosules')">💊 Becosules</button>
        <button class="trending-pill" onclick="selectSuggestion('Shelcal 500')">💊 Shelcal 500</button>
        <button class="trending-pill" onclick="selectSuggestion('Thyronorm')">💊 Thyronorm</button>
        <button class="trending-pill" onclick="selectSuggestion('Evion 400')">💊 Evion 400</button>
      </div>
      <div class="search-suggest-section-title">Popular Categories</div>
      <div class="suggest-categories">
        <div class="suggest-cat-item" onclick="selectCategorySuggestion('Fever & Pain')">
          <span class="suggest-cat-icon">💊</span>
          <span class="suggest-cat-label">Fever & Pain</span>
        </div>
        <div class="suggest-cat-item" onclick="selectCategorySuggestion('Chronic Care')">
          <span class="suggest-cat-icon">♻️</span>
          <span class="suggest-cat-label">Chronic Care</span>
        </div>
        <div class="suggest-cat-item" onclick="selectCategorySuggestion('Vitamins & Supplements')">
          <span class="suggest-cat-icon">🍊</span>
          <span class="suggest-cat-label">Vitamins</span>
        </div>
        <div class="suggest-cat-item" onclick="selectCategorySuggestion('Skincare')">
          <span class="suggest-cat-icon">🧴</span>
          <span class="suggest-cat-label">Skincare</span>
        </div>
      </div>
    `;
  } else {
    // Filter medicines
    const matches = MEDICINES.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.salt.toLowerCase().includes(query) ||
      m.brand.toLowerCase().includes(query)
    ).slice(0, 5); // limit to 5 suggestions

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div style="padding:16px;text-align:center;font-size:0.85rem;color:var(--text-muted)">
          No matching medicines found.
        </div>
      `;
    } else {
      const cart = getCart();
      dropdown.innerHTML = `
        <div class="search-suggest-section-title">Medicines matching "${query}"</div>
        ${matches.map(m => {
          const cartItem = cart.find(i => i.id === m.id);
          const inStock = m.stock > 0;
          
          let btnHtml = '';
          if (!inStock) {
            btnHtml = `<span style="font-size:0.75rem;color:var(--danger);font-weight:700">Out of Stock</span>`;
          } else if (cartItem) {
            btnHtml = `
              <div class="suggest-stepper">
                <button class="suggest-stepper-btn" onclick="event.stopPropagation();updateCardQty(${m.id}, ${cartItem.qty - 1});showSuggestions();">−</button>
                <span class="suggest-stepper-val">${cartItem.qty}</span>
                <button class="suggest-stepper-btn" onclick="event.stopPropagation();updateCardQty(${m.id}, ${cartItem.qty + 1});showSuggestions();">+</button>
              </div>
            `;
          } else {
            btnHtml = `
              <button class="btn-suggest-add" onclick="event.stopPropagation();addToCart(MEDICINES.find(i=>i.id===${m.id}));showSuggestions();">+ Add</button>
            `;
          }
          
          return `
            <div class="search-suggest-item" onclick="selectSuggestion('${m.name}')">
              <div class="search-suggest-med-info">
                <div class="suggest-med-name">${m.name}</div>
                <div class="suggest-med-salt">${m.salt}</div>
                <div class="suggest-med-brand">${m.brand} &middot; ${m.packSize} ${m.packUnit}</div>
                <div class="suggest-med-price-row">
                  <span class="suggest-med-price">₹${m.price}</span>
                  ${m.mrp > m.price ? `<span class="suggest-med-mrp">₹${m.mrp}</span>` : ''}
                </div>
              </div>
              <div class="suggest-action-wrap">
                ${btnHtml}
              </div>
            </div>
          `;
        }).join('')}
      `;
    }
  }
  dropdown.classList.add('open');
}

function selectSuggestion(name) {
  const input = document.getElementById('search-input');
  if (input) {
    input.value = name;
    searchQuery = name;
    visibleMedicinesCount = 15;
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('kirti-pharma') || window.location.pathname.endsWith('kirti-pharma/')) {
      renderGrid();
      window.scrollTo({ top: document.getElementById('medicine-section')?.offsetTop - 80 || 0, behavior: 'smooth' });
    } else {
      // Redirect to home page with search query
      window.location.href = `index.html?search=${encodeURIComponent(name)}`;
    }
  }
  hideSuggestions();
}

function selectCategorySuggestion(cat) {
  if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('kirti-pharma') || window.location.pathname.endsWith('kirti-pharma/')) {
    setCategory(cat);
  } else {
    window.location.href = `index.html?category=${encodeURIComponent(cat)}`;
  }
  hideSuggestions();
}

function hideSuggestions() {
  const dropdown = document.getElementById('search-suggest-dropdown');
  if (dropdown) dropdown.classList.remove('open');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Category pills
  const pillsContainer = document.getElementById('category-pills');
  if (pillsContainer) {
    pillsContainer.innerHTML = CATEGORIES.map(cat => `
      <button class="pill${cat === activeCategory ? ' active' : ''}" data-cat="${cat}" onclick="setCategory('${cat}')">${cat}</button>
    `).join('');
  }

  // Search input and auto suggestions
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = e.target.value;
        if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('kirti-pharma') || window.location.pathname.endsWith('kirti-pharma/')) {
          renderGrid();
        }
        showSuggestions();
      }, 200);
    });

    searchInput.addEventListener('focus', showSuggestions);
    searchInput.addEventListener('click', (e) => e.stopPropagation());
  }

  // Suggest dropdown click prevention
  document.getElementById('search-suggest-dropdown')?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Hide suggestions click out
  document.addEventListener('click', hideSuggestions);

  // Parse URL query parameters
  const params = new URLSearchParams(window.location.search);
  const searchParam = params.get('search');
  const catParam = params.get('category');

  if (searchParam && searchInput) {
    searchInput.value = searchParam;
    searchQuery = searchParam;
  }
  if (catParam) {
    activeCategory = catParam;
    updateCategoryPills();
  }

  // Voice search
  initVoiceSearch();

  // Initial render
  renderGrid();

  // Close modal on overlay click
  document.getElementById('alt-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal('alt-modal');
  });
});

function setCategory(cat) {
  activeCategory = cat;
  updateCategoryPills();
  renderGrid();
  const sec = document.getElementById('medicine-section');
  if (sec) {
    window.scrollTo({ top: sec.offsetTop - 80 || 0, behavior: 'smooth' });
  }
}

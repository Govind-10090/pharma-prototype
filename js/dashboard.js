// ===== KIRTI PHARMA — dashboard.js =====
// Chemist Portal: Prescription Review, Bill Builder, Order Fulfillment & Inventory Management

let PRESCRIPTIONS = [];
let completedPrescriptions = [];
let currentPrescription = null;
let chemistOrders = [];
let filteredChemistOrders = [];
let activeChemistOrderFilter = 'all';
let billRows = [];
let dashTableSearch = '';
let currentPage = 1;
const PAGE_SIZE = 15;
let activeDashTab = 'prescriptions';

document.addEventListener('DOMContentLoaded', async () => {
  // Chemist Authorization Guard:
  // Whoever is tagged with admin in the database can access the Chemist Dashboard!
  const isLoggedIn = localStorage.getItem('kp_logged_in') === 'true';
  const role = (localStorage.getItem('kp_user_role') || '').toLowerCase();
  const isAdmin = (role === 'admin' || role === 'chemist');

  if (!isLoggedIn || !isAdmin) {
    sessionStorage.setItem('kp_auth_msg', '🔒 Access Restricted: Chemist Portal is reserved for accounts tagged as Admin in database. Showing customer store.');
    window.location.replace('index.html');
    return;
  }

  initClock();
  initDashboardSearch();
  initDashTabs();
  initChemistRealtimeEvents();

  // Load initial data from backend
  await Promise.all([
    loadPrescriptionsFromApi(),
    loadChemistOrdersFromApi(),
    loadMedicinesFromApi(),
    loadStatsFromApi(),
    loadCustomersFromApi()
  ]);
});

function initClock() {
  const el = document.getElementById('current-time');
  if (!el) return;
  const update = () => {
    el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  update();
  setInterval(update, 60000);
}

// ===== REAL-TIME SSE SYNC =====
function initChemistRealtimeEvents() {
  if (!window.EventSource) return;

  try {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'new_order') {
          chemistOrders.unshift(data.payload);
          applyChemistOrderFilter();
          updateDashStats();
          showToast(`🔔 New Order #${data.payload.id} received from ${data.payload.customerName}!`, 'success', 6000);
        } else if (data.type === 'prescription_uploaded') {
          PRESCRIPTIONS.unshift(data.payload);
          renderPrescriptionList();
          updateDashStats();
          showToast(`📋 New Prescription received from ${data.payload.patient}!`, 'info', 6000);
        } else if (data.type === 'order_status_updated') {
          const idx = chemistOrders.findIndex(o => o.id === data.payload.id);
          if (idx > -1) {
            chemistOrders[idx] = data.payload;
            applyChemistOrderFilter();
          }
        } else if (data.type === 'medicine_added') {
          if (!MEDICINES.some(m => m.id === data.payload.id)) {
            MEDICINES.unshift(data.payload);
            renderMedicineTable();
          }
        }
      } catch (err) {}
    };
  } catch (e) {}
}

// ===== LOAD FROM API =====
async function loadPrescriptionsFromApi() {
  try {
    const res = await fetch('/api/prescriptions');
    const json = await res.json();
    if (json.success && json.data) {
      PRESCRIPTIONS = json.data.filter(p => p.status !== 'Completed');
      completedPrescriptions = json.data.filter(p => p.status === 'Completed');
    }
  } catch (e) {
    PRESCRIPTIONS = [
      { id: 1, patient: 'Meena Deshpande', initials: 'MD', time: '3:45 PM', source: 'App', status: 'Pending', color: '#7C3AED', phone: '+919876543211', fileUrl: 'images/med_fever_pain.png' },
      { id: 2, patient: 'Suresh Bawane', initials: 'SB', time: '4:02 PM', source: 'WhatsApp', status: 'Pending', color: '#2563EB', phone: '+919876543212', fileUrl: 'images/med_chronic.png' },
      { id: 3, patient: 'Priya Nagpure', initials: 'PN', time: '4:28 PM', source: 'App', status: 'Pending', color: '#DB2777', phone: '+919876543213', fileUrl: 'images/med_antibiotics.png' },
    ];
  }
  renderPrescriptionList();
}

async function loadChemistOrdersFromApi() {
  try {
    const res = await fetch('/api/orders');
    const json = await res.json();
    if (json.success && json.data) {
      chemistOrders = json.data;
    }
  } catch (e) {
    chemistOrders = [];
  }
  applyChemistOrderFilter();
}

async function loadMedicinesFromApi() {
  try {
    const res = await fetch('/api/medicines');
    const json = await res.json();
    if (json.success && json.data) {
      MEDICINES = json.data;
      saveMedicinesToStorage();
    }
  } catch (e) {}
  renderMedicineTable();
}

async function loadStatsFromApi() {
  try {
    const res = await fetch('/api/stats');
    const json = await res.json();
    if (json.success && json.data) {
      const stats = json.data;
      const statEl = document.getElementById('pending-count');
      if (statEl) statEl.textContent = stats.prescriptions.pending;

      const stockEl = document.getElementById('total-stock-count');
      if (stockEl && stats.inventory && stats.inventory.totalStockUnits !== undefined) {
        stockEl.textContent = Number(stats.inventory.totalStockUnits).toLocaleString();
      }

      const soldEl = document.getElementById('total-sold-count');
      if (soldEl && stats.inventory && stats.inventory.totalSoldUnits !== undefined) {
        soldEl.textContent = Number(stats.inventory.totalSoldUnits).toLocaleString();
      }

      const revEl = document.getElementById('today-revenue-count');
      if (revEl && stats.orders && stats.orders.todayRevenue !== undefined) {
        revEl.textContent = '₹' + Number(stats.orders.todayRevenue).toLocaleString();
      }
    }
  } catch (e) {}
  updateDashStats();
}

// ===== STATS =====
function updateDashStats() {
  const pendingStatEl = document.getElementById('pending-count');
  const pendingBadgeEl = document.getElementById('pending-badge');
  const rxTabCount = document.getElementById('dash-rx-tab-count');
  const orderTabCount = document.getElementById('dash-orders-tab-count');
  const stockEl = document.getElementById('total-stock-count');
  const soldEl = document.getElementById('total-sold-count');

  if (pendingStatEl) pendingStatEl.textContent = PRESCRIPTIONS.length;
  if (pendingBadgeEl) pendingBadgeEl.textContent = `${PRESCRIPTIONS.length} pending`;
  if (rxTabCount) rxTabCount.textContent = PRESCRIPTIONS.length;
  if (orderTabCount) orderTabCount.textContent = chemistOrders.length;

  if (stockEl && Array.isArray(MEDICINES) && MEDICINES.length > 0) {
    const totalStock = MEDICINES.reduce((sum, m) => sum + (parseInt(m.stock) || 0), 0);
    stockEl.textContent = totalStock.toLocaleString();
  }
  if (soldEl && Array.isArray(MEDICINES) && MEDICINES.length > 0) {
    const totalSold = MEDICINES.reduce((sum, m) => sum + (parseInt(m.sold) || 0), 0);
    soldEl.textContent = totalSold.toLocaleString();
  }
}

// ===== PRESCRIPTION LIST =====
function renderPrescriptionList() {
  const container = document.getElementById('prescription-list');
  const completedContainer = document.getElementById('completed-list');
  if (!container) return;

  if (PRESCRIPTIONS.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:32px 0;text-align:center">
        <span class="empty-icon" style="font-size:32px">📋</span>
        <div class="empty-title" style="font-weight:700;margin-top:6px">All caught up!</div>
        <div class="empty-desc" style="font-size:0.85rem;color:var(--text-muted)">No pending prescriptions at this time.</div>
      </div>
    `;
  } else {
    container.innerHTML = PRESCRIPTIONS.map(p => renderPrescriptionCard(p)).join('');
  }

  if (completedContainer) {
    if (completedPrescriptions.length === 0) {
      completedContainer.innerHTML = `<p style="font-size:0.85rem;color:var(--text-light);padding:12px 0">No completed prescriptions yet.</p>`;
    } else {
      completedContainer.innerHTML = completedPrescriptions.map(p => `
        <div class="prescription-card" style="opacity:0.8;background:#f8fdf9;border-color:#D1FAE5;margin-bottom:8px">
          <div class="patient-avatar" style="background:${p.color || '#10B981'}">${p.initials || 'PT'}</div>
          <div class="prescription-info">
            <div class="patient-name">${p.patient}</div>
            <div class="prescription-meta">
              <span>${p.time || ''}</span>
              <span class="status-badge status-done">✅ Billed & Done</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

function renderPrescriptionCard(p) {
  const sourceBadgeClass = p.source === 'WhatsApp' ? 'badge-green' : 'badge-blue';
  const statusClass = p.status === 'Pending' ? 'status-pending' : 'status-review';
  return `
    <div class="prescription-card" id="rx-card-${p.id}" onclick="openBillBuilder(${p.id})">
      <div class="patient-avatar" style="background:${p.color || '#7C3AED'}">${p.initials || 'PT'}</div>
      <div class="prescription-info">
        <div class="patient-name">${p.patient}</div>
        <div class="prescription-meta">
          <span>${p.time || ''}</span>
          <span class="badge ${sourceBadgeClass}" style="font-size:0.65rem">${p.source}</span>
          <span class="status-badge ${statusClass}">${p.status}</span>
        </div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openBillBuilder(${p.id})" style="flex-shrink:0">Review & Bill →</button>
    </div>
  `;
}

// ===== CUSTOMER ORDERS MANAGEMENT (Chemist View) =====
function filterDashOrders(filter, btn) {
  activeChemistOrderFilter = filter;
  document.querySelectorAll('.order-dash-filter').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-secondary');
  });
  if (btn) {
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
  applyChemistOrderFilter();
}

function applyChemistOrderFilter() {
  if (activeChemistOrderFilter === 'all') {
    filteredChemistOrders = [...chemistOrders];
  } else if (activeChemistOrderFilter === 'active') {
    filteredChemistOrders = chemistOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  } else if (activeChemistOrderFilter === 'delivered') {
    filteredChemistOrders = chemistOrders.filter(o => o.status === 'delivered');
  }
  renderChemistOrders();
}

function renderChemistOrders() {
  const container = document.getElementById('dash-orders-table-container');
  if (!container) return;

  if (filteredChemistOrders.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.875rem">
        No orders found in this view.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
        <thead>
          <tr style="background:#F8FAFC;border-bottom:1px solid var(--border);text-align:left">
            <th style="padding:10px 12px">Order ID</th>
            <th style="padding:10px 12px">Customer</th>
            <th style="padding:10px 12px">Items</th>
            <th style="padding:10px 12px">Total</th>
            <th style="padding:10px 12px">Status</th>
            <th style="padding:10px 12px">Change Stage</th>
          </tr>
        </thead>
        <tbody>
          ${filteredChemistOrders.map(order => {
            const isDelivered = order.status === 'delivered';
            const isDelivery = order.status === 'delivery';
            const isPreparing = order.status === 'preparing' || order.status === 'confirmed';

            return `
              <tr style="border-bottom:1px solid #F1F5F9">
                <td style="padding:10px 12px;font-weight:700;color:var(--primary-green)">
                  <a href="track.html?orderId=${order.id}" style="color:var(--primary-green);text-decoration:none">${order.id}</a>
                </td>
                <td style="padding:10px 12px">
                  <div style="font-weight:600">${order.customerName}</div>
                  <div style="color:var(--text-muted);font-size:0.75rem">${order.phone}</div>
                </td>
                <td style="padding:10px 12px">
                  <span title="${(order.items || []).map(i => `${i.name} (x${i.qty})`).join(', ')}">
                    ${(order.items || []).length} items
                  </span>
                </td>
                <td style="padding:10px 12px;font-weight:700">₹${order.total || order.subtotal || 0}</td>
                <td style="padding:10px 12px">
                  <span class="badge ${isDelivered ? 'badge-green' : (isDelivery ? 'badge-blue' : 'badge-saffron')}" style="font-size:0.7rem">
                    ${order.status.toUpperCase()}
                  </span>
                </td>
                <td style="padding:10px 12px">
                  <select onchange="updateChemistOrderStatus('${order.id}', this.value)" style="padding:4px 8px;font-size:0.78rem;border-radius:6px;border:1px solid var(--border)">
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Being Prepared</option>
                    <option value="delivery" ${order.status === 'delivery' ? 'selected' : ''}>Out for Delivery 🛵</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered ✅</option>
                  </select>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function updateChemistOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (json.success) {
      const idx = chemistOrders.findIndex(o => o.id === orderId);
      if (idx > -1) {
        chemistOrders[idx] = json.data;
        applyChemistOrderFilter();
      }
      showToast(`Order #${orderId} marked as ${newStatus.toUpperCase()}`, 'success');
    }
  } catch (err) {
    showToast('Failed to update status', 'error');
  }
}

// ===== DASHBOARD SEARCH =====
function initDashboardSearch() {
  const input = document.getElementById('dash-search');
  if (!input) return;
  let timer;
  input.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      dashTableSearch = e.target.value;
      currentPage = 1;
      renderMedicineTable();
    }, 250);
  });
}

// ===== MEDICINE TABLE =====
function getFilteredMedicines() {
  if (!dashTableSearch.trim()) return MEDICINES;
  const q = dashTableSearch.toLowerCase();
  return MEDICINES.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.salt.toLowerCase().includes(q) ||
    m.brand.toLowerCase().includes(q) ||
    m.category.toLowerCase().includes(q)
  );
}

function renderMedicineTable() {
  const tbody = document.getElementById('medicine-table-body');
  const paginationEl = document.getElementById('table-pagination');
  if (!tbody) return;

  const filtered = getFilteredMedicines();
  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const countEl = document.getElementById('table-count');
  if (countEl) countEl.textContent = `${total} medicines in store`;

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted)">No medicines match your search.</td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(m => {
      const stockNum = parseInt(m.stock) || 0;
      const soldNum = parseInt(m.sold) || 0;
      const inStock = stockNum > 0;
      const isLowStock = stockNum > 0 && stockNum <= 15;
      const imgSrc = m.image || (typeof CAT_IMAGES !== 'undefined' ? CAT_IMAGES[m.category] : null) || 'images/med_fever_pain.png';
      const salesRev = soldNum * (m.price || 0);

      const statusColor = !inStock ? '#DC2626' : (isLowStock ? '#D97706' : '#166534');
      const statusBg = !inStock ? '#FEE2E2' : (isLowStock ? '#FEF3C7' : '#DCFCE7');

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <img src="${imgSrc}" alt="${m.name}" style="width:36px;height:36px;object-fit:cover;border-radius:8px;border:1px solid var(--border);flex-shrink:0">
              <div>
                <div style="font-weight:600;font-size:0.82rem">${m.name}</div>
                ${m.prescription_required ? '<span class="badge badge-rx" style="font-size:0.6rem">Rx</span>' : ''}
              </div>
            </div>
          </td>
          <td style="font-size:0.78rem;color:var(--text-muted);max-width:180px">${m.salt}</td>
          <td style="font-size:0.8rem;font-weight:500">${m.brand}</td>
          <td>
            <div style="display:flex;flex-direction:column;gap:3px">
              <span style="display:inline-flex;align-items:center;gap:5px;font-weight:700;font-size:0.82rem;color:${statusColor};background:${statusBg};padding:3px 8px;border-radius:6px;width:fit-content">
                <span style="width:6px;height:6px;border-radius:50%;background:${statusColor};display:inline-block"></span>
                ${inStock ? stockNum + ' in stock' : 'Out of stock'}
              </span>
              <span style="font-size:0.7rem;color:var(--text-muted)">
                ${!inStock ? '⚠️ Restock required' : (isLowStock ? 'Low inventory alert' : 'Healthy inventory')}
              </span>
            </div>
          </td>
          <td>
            <div style="display:flex;flex-direction:column;gap:2px">
              <span style="font-weight:700;font-size:0.82rem;color:#1E293B">
                🔥 ${soldNum} sold
              </span>
              <span style="font-size:0.72rem;color:#166534;font-weight:600">
                ₹${salesRev.toLocaleString()} sales
              </span>
            </div>
          </td>
          <td style="font-size:0.8rem;color:var(--text-muted)">${m.packSize} ${m.packUnit}</td>
          <td style="font-weight:700;font-size:0.875rem">₹${m.price}</td>
          <td>
            <div style="display:flex;gap:6px;align-items:center">
              <button class="btn btn-sm btn-secondary" onclick="addToBill(${m.id})" ${!inStock ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>
                + Bill
              </button>
              <button class="btn btn-sm" onclick="removeMedicine(${m.id})" style="color:var(--danger);background:var(--danger-light);border:none;padding:6px 8px;border-radius:6px;cursor:pointer" title="Remove from inventory">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Pagination
  if (paginationEl) {
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
    } else {
      let pagHTML = '';
      pagHTML += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
          pagHTML += `<button class="page-btn${i === currentPage ? ' active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
          pagHTML += `<span style="padding:0 4px;color:var(--text-light)">…</span>`;
        }
      }
      pagHTML += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
      paginationEl.innerHTML = pagHTML;
    }
  }
}

function goToPage(page) {
  const total = Math.ceil(getFilteredMedicines().length / PAGE_SIZE);
  if (page < 1 || page > total) return;
  currentPage = page;
  renderMedicineTable();
}

async function removeMedicine(id) {
  const idx = MEDICINES.findIndex(m => m.id === id);
  if (idx === -1) return;
  const medName = MEDICINES[idx].name;

  if (confirm(`Are you sure you want to remove ${medName} from the store inventory?`)) {
    try {
      await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
    } catch (e) {}

    MEDICINES.splice(idx, 1);
    saveMedicinesToStorage();
    renderMedicineTable();
    showToast(`🗑️ ${medName} removed from inventory`, 'success');
  }
}

// ===== BILL BUILDER =====
function addToBill(medicineId) {
  const med = MEDICINES.find(m => m.id === medicineId);
  if (!med) return;
  billRows.push({ medicineId, qty: 1, unitPrice: med.price });
  if (currentPrescription) {
    renderBillBuilder(currentPrescription);
  } else {
    showToast(`${med.name} queued for next bill`, 'info');
  }
  showToast(`${med.name} added to bill`, 'success');
}

function openBillBuilder(prescriptionId) {
  currentPrescription = PRESCRIPTIONS.find(p => p.id === prescriptionId) ||
    completedPrescriptions.find(p => p.id === prescriptionId);
  if (!currentPrescription) return;

  // Mark as In Review on server
  fetch(`/api/prescriptions/${prescriptionId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'In Review' })
  }).catch(() => {});

  const card = document.getElementById(`rx-card-${prescriptionId}`);
  if (card) {
    const statusEl = card.querySelector('.status-badge');
    if (statusEl) { statusEl.className = 'status-badge status-review'; statusEl.textContent = 'In Review'; }
  }

  const section = document.getElementById('bill-builder-section');
  if (section) {
    section.style.display = 'block';
    section.style.opacity = '1';
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderBillBuilder(currentPrescription);
}

function renderBillBuilder(prescription) {
  const headerEl = document.getElementById('bill-patient-name');
  const tbody = document.getElementById('bill-table-body');
  const grandTotalEl = document.getElementById('bill-grand-total');

  if (headerEl) headerEl.textContent = prescription.patient;

  const grandTotal = billRows.reduce((sum, row) => sum + row.qty * row.unitPrice, 0);
  if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal.toFixed(0)}`;

  if (!tbody) return;

  if (billRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.875rem">No medicines added yet. Use "+ Bill" to add medicines above.</td></tr>`;
    return;
  }

  tbody.innerHTML = billRows.map((row, idx) => {
    const med = MEDICINES.find(m => m.id === row.medicineId);
    const total = row.qty * row.unitPrice;
    return `
      <tr>
        <td>
          <select onchange="updateBillMedicine(${idx}, parseInt(this.value))" style="min-width:160px">
            ${MEDICINES.filter(m => m.stock > 0).map(m =>
              `<option value="${m.id}" ${m.id === row.medicineId ? 'selected' : ''}>${m.name}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <input type="number" min="1" max="20" value="${row.qty}"
            onchange="updateBillQty(${idx}, parseInt(this.value))"
            style="width:64px;text-align:center">
        </td>
        <td style="font-weight:600">₹${row.unitPrice}</td>
        <td style="font-weight:700">₹${total.toFixed(0)}</td>
        <td>
          <button onclick="removeBillRow(${idx})" class="btn btn-sm" style="color:var(--danger);background:var(--danger-light);padding:4px 8px">✕</button>
        </td>
      </tr>
    `;
  }).join('');
}

function addBillRow() {
  const firstAvailable = MEDICINES.find(m => m.stock > 0);
  if (!firstAvailable) return;
  billRows.push({ medicineId: firstAvailable.id, qty: 1, unitPrice: firstAvailable.price });
  if (currentPrescription) renderBillBuilder(currentPrescription);
}

function updateBillMedicine(idx, medId) {
  const med = MEDICINES.find(m => m.id === medId);
  if (!med) return;
  billRows[idx].medicineId = medId;
  billRows[idx].unitPrice = med.price;
  if (currentPrescription) renderBillBuilder(currentPrescription);
}

function updateBillQty(idx, qty) {
  if (qty < 1 || isNaN(qty)) qty = 1;
  billRows[idx].qty = Math.min(qty, 20);
  if (currentPrescription) renderBillBuilder(currentPrescription);
}

function removeBillRow(idx) {
  billRows.splice(idx, 1);
  if (currentPrescription) renderBillBuilder(currentPrescription);
}

function printInvoice() {
  if (!currentPrescription || billRows.length === 0) {
    showToast('Please add medicines to the bill before printing', 'error');
    return;
  }
  window.print();
}

async function markAsReady() {
  if (!currentPrescription) return;
  const rxId = currentPrescription.id;

  // Finalize bill on backend and automatically convert into an active order
  try {
    const res = await fetch(`/api/prescriptions/${rxId}/bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billRows,
        createOrder: true
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`✅ Order created and sent to customer!`, 'success');
    }
  } catch (err) {}

  const idx = PRESCRIPTIONS.findIndex(p => p.id === rxId);
  if (idx > -1) {
    const [done] = PRESCRIPTIONS.splice(idx, 1);
    done.status = 'Completed';
    completedPrescriptions.unshift(done);
  }

  // Reset bill
  billRows = [];
  const section = document.getElementById('bill-builder-section');
  if (section) section.style.display = 'none';
  currentPrescription = null;

  renderPrescriptionList();
  updateDashStats();
  loadChemistOrdersFromApi();
}

// ===== DASHBOARD TABS =====
function syncDashPanels() {
  const leftPanel = document.getElementById('dash-left-panel');
  const rightPanel = document.getElementById('dash-right-panel');
  const ordersSection = document.getElementById('dash-orders-section');
  const medSection = document.getElementById('medicine-table-section');
  const custSection = document.getElementById('dash-customers-section');

  if (!leftPanel || !rightPanel) return;

  if (activeDashTab === 'customers') {
    leftPanel.style.display = 'none';
    rightPanel.style.display = 'block';
    if (ordersSection) ordersSection.style.display = 'none';
    if (medSection) medSection.style.display = 'none';
    if (custSection) custSection.style.display = 'block';
    return;
  }

  if (custSection) custSection.style.display = 'none';

  if (window.innerWidth <= 1024) {
    if (activeDashTab === 'prescriptions') {
      leftPanel.style.display = 'block';
      rightPanel.style.display = 'none';
    } else {
      leftPanel.style.display = 'none';
      rightPanel.style.display = 'block';
      if (ordersSection && medSection) {
        ordersSection.style.display = activeDashTab === 'orders' ? 'block' : 'none';
        medSection.style.display = activeDashTab === 'medicines' ? 'block' : 'none';
      }
    }
  } else {
    leftPanel.style.removeProperty('display');
    rightPanel.style.removeProperty('display');
    if (ordersSection && medSection) {
      if (activeDashTab === 'prescriptions') {
        ordersSection.style.display = 'block';
        medSection.style.display = 'block';
      } else if (activeDashTab === 'orders') {
        ordersSection.style.display = 'block';
        medSection.style.display = 'none';
      } else if (activeDashTab === 'medicines') {
        ordersSection.style.display = 'none';
        medSection.style.display = 'block';
      }
    }
  }
}

function initDashTabs() {
  const tabs = document.querySelectorAll('.dash-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      activeDashTab = target;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      syncDashPanels();
    });
  });

  syncDashPanels();
  window.addEventListener('resize', syncDashPanels);
}

// ===== REGISTERED CUSTOMERS (SUPABASE CLOUD) =====
async function loadCustomersFromApi() {
  try {
    const res = await fetch('/api/auth/customers');
    const json = await res.json();
    if (json.success && json.data) {
      renderCustomersTable(json.data);
    }
  } catch (e) {
    console.warn('Failed to load customers from API:', e);
  }
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById('customers-table-body');
  const countEl = document.getElementById('dash-cust-tab-count');
  if (countEl) countEl.textContent = customers.length;
  if (!tbody) return;

  if (!customers || customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No registered customers yet in database.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(c => {
    const isUserAdmin = (c.role && String(c.role).toLowerCase() === 'admin');
    return `
      <tr>
        <td style="font-weight:700">👤 ${c.name}</td>
        <td><code>+91 ${c.phone}</code></td>
        <td><span class="badge ${isUserAdmin ? 'badge-saffron' : 'badge-green'}">${isUserAdmin ? 'ADMIN / CHEMIST' : 'CUSTOMER'}</span></td>
        <td style="font-size:0.85rem;color:var(--text-muted)">${c.addresses?.[0]?.text || 'Gondia - 441614'}</td>
        <td style="font-size:0.8rem;color:var(--text-muted)">${c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Active'}</td>
        <td>
          ${isUserAdmin
            ? `<button class="btn btn-sm btn-secondary" onclick="changeUserRole('${c.id}', 'customer')" style="font-size:0.75rem;padding:4px 8px">Remove Admin</button>`
            : `<button class="btn btn-sm btn-primary" onclick="changeUserRole('${c.id}', 'admin')" style="font-size:0.75rem;padding:4px 8px;background:#006642">Tag as Admin</button>`
          }
        </td>
      </tr>
    `;
  }).join('');
}

async function changeUserRole(userId, newRole) {
  try {
    const res = await fetch(`/api/auth/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`User successfully updated to ${newRole.toUpperCase()} in database!`, 'success');
      loadCustomersFromApi();
    } else {
      showToast(data.error || 'Failed to update user role', 'error');
    }
  } catch (err) {
    showToast('Failed to update role in database', 'error');
  }
}

// ===== ADD MEDICINE MODAL =====
let uploadedMedImageBase64 = '';

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

function openAddMedicineModal() {
  const form = document.getElementById('add-med-form');
  if (form) form.reset();
  resetMedImage();
  openModal('add-med-modal');
}

function previewMedImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 120;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxDim) {
          h = Math.round(h * maxDim / w);
          w = maxDim;
        }
      } else {
        if (h > maxDim) {
          w = Math.round(w * maxDim / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      uploadedMedImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      document.getElementById('med-preview-thumb').src = uploadedMedImageBase64;
      document.getElementById('med-preview-name').textContent = file.name;
      document.getElementById('med-dz-content').style.display = 'none';
      document.getElementById('med-img-preview').style.display = 'flex';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function resetMedImage() {
  uploadedMedImageBase64 = '';
  const fileInput = document.getElementById('add-med-file');
  if (fileInput) fileInput.value = '';
  const dzContent = document.getElementById('med-dz-content');
  if (dzContent) dzContent.style.display = 'block';
  const imgPreview = document.getElementById('med-img-preview');
  if (imgPreview) imgPreview.style.display = 'none';
}

async function saveNewMedicine(event) {
  event.preventDefault();

  const name = document.getElementById('add-med-name').value.trim();
  const salt = document.getElementById('add-med-salt').value.trim();
  const brand = document.getElementById('add-med-brand').value.trim();
  const category = document.getElementById('add-med-category').value;
  const price = parseFloat(document.getElementById('add-med-price').value);
  const mrp = parseFloat(document.getElementById('add-med-mrp').value);
  const stock = parseInt(document.getElementById('add-med-stock').value);
  const packSize = parseInt(document.getElementById('add-med-pack-size').value);
  const packUnit = document.getElementById('add-med-pack-unit').value;
  const rx = document.getElementById('add-med-rx').checked;
  const chronic = document.getElementById('add-med-chronic').checked;

  if (price > mrp) {
    showToast('Price cannot be greater than MRP', 'error');
    return;
  }

  const payload = {
    name,
    salt,
    brand,
    category,
    price,
    mrp,
    stock,
    packSize,
    packUnit,
    prescription_required: rx,
    chronic,
    imageBase64: uploadedMedImageBase64
  };

  try {
    const res = await fetch('/api/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success && json.data) {
      MEDICINES.unshift(json.data);
    }
  } catch (err) {
    // Local fallback
    const nextId = MEDICINES.reduce((max, m) => m.id > max ? m.id : max, 0) + 1;
    MEDICINES.unshift({ id: nextId, ...payload, image: uploadedMedImageBase64 });
  }

  saveMedicinesToStorage();
  closeModal('add-med-modal');
  currentPage = 1;
  renderMedicineTable();
  updateDashStats();
  loadStatsFromApi();
  const formEl = document.getElementById('add-med-form');
  if (formEl) formEl.reset();
  resetMedImage();
  showToast(`✅ ${name} added! Stock: ${stock} units`, 'success');
}

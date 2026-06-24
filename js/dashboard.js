// ===== KIRTI PHARMA — dashboard.js =====
// Prescription review, bill builder, live table filter, pagination

const PRESCRIPTIONS = [
  { id: 1, patient: 'Meena Deshpande', initials: 'MD', time: '3:45 PM', source: 'App', status: 'Pending', color: '#7C3AED', phone: '+919876543211' },
  { id: 2, patient: 'Suresh Bawane', initials: 'SB', time: '4:02 PM', source: 'WhatsApp', status: 'Pending', color: '#2563EB', phone: '+919876543212' },
  { id: 3, patient: 'Priya Nagpure', initials: 'PN', time: '4:28 PM', source: 'App', status: 'Pending', color: '#DB2777', phone: '+919876543213' },
];

let completedPrescriptions = [];
let currentPrescription = null;
let billRows = [];
let dashTableSearch = '';
let currentPage = 1;
const PAGE_SIZE = 20;
let activeDashTab = 'prescriptions';

document.addEventListener('DOMContentLoaded', () => {
  renderPrescriptionList();
  renderMedicineTable();
  initDashboardSearch();
  initDashTabs();
  updateDashStats();
});

// ===== STATS =====
function updateDashStats() {
  const statEl = document.getElementById('pending-count');
  if (statEl) statEl.textContent = PRESCRIPTIONS.length;
}

// ===== PRESCRIPTION LIST =====
function renderPrescriptionList() {
  const container = document.getElementById('prescription-list');
  const completedContainer = document.getElementById('completed-list');
  if (!container) return;

  if (PRESCRIPTIONS.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:32px 0">
        <span class="empty-icon">📋</span>
        <div class="empty-title">All caught up!</div>
        <div class="empty-desc">No pending prescriptions at this time.</div>
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
        <div class="prescription-card" style="opacity:0.7;background:#f8fdf9;border-color:#D1FAE5">
          <div class="patient-avatar" style="background:${p.color}">${p.initials}</div>
          <div class="prescription-info">
            <div class="patient-name">${p.patient}</div>
            <div class="prescription-meta">
              <span>${p.time}</span>
              <span class="status-badge status-done">✅ Completed</span>
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
      <div class="patient-avatar" style="background:${p.color}">${p.initials}</div>
      <div class="prescription-info">
        <div class="patient-name">${p.patient}</div>
        <div class="prescription-meta">
          <span>${p.time}</span>
          <span class="badge ${sourceBadgeClass}" style="font-size:0.65rem">${p.source}</span>
          <span class="status-badge ${statusClass}">${p.status}</span>
        </div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openBillBuilder(${p.id})" style="flex-shrink:0">Review →</button>
    </div>
  `;
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
  if (countEl) countEl.textContent = `${total} medicines`;

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No medicines match your search.</td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(m => {
      const inStock = m.stock > 0;
      const imgSrc = m.image || (typeof CAT_IMAGES !== 'undefined' ? CAT_IMAGES[m.category] : null) || 'images/med_fever_pain.png';
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
            <span class="stock-indicator ${inStock ? '' : 'text-danger'}">
              <span class="stock-dot ${inStock ? 'in' : 'out'}"></span>
              ${inStock ? m.stock : 'Out'}
            </span>
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
  document.getElementById('medicine-table-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function removeMedicine(id) {
  const idx = MEDICINES.findIndex(m => m.id === id);
  if (idx === -1) return;
  const medName = MEDICINES[idx].name;
  
  if (confirm(`Are you sure you want to remove ${medName} from the store inventory?`)) {
    MEDICINES.splice(idx, 1);
    saveMedicinesToStorage();
    
    const total = getFilteredMedicines().length;
    const maxPage = Math.ceil(total / PAGE_SIZE) || 1;
    if (currentPage > maxPage) {
      currentPage = maxPage;
    }
    
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

  // Mark as In Review
  const card = document.getElementById(`rx-card-${prescriptionId}`);
  if (card) {
    const statusEl = card.querySelector('.status-badge');
    if (statusEl) { statusEl.className = 'status-badge status-review'; statusEl.textContent = 'In Review'; }
  }

  const section = document.getElementById('bill-builder-section');
  if (section) {
    section.style.display = 'block';
    section.style.opacity = '0';
    setTimeout(() => {
      section.style.transition = 'opacity 0.3s ease';
      section.style.opacity = '1';
    }, 50);
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

function markAsReady() {
  if (!currentPrescription) return;
  const rxId = currentPrescription.id;
  const idx = PRESCRIPTIONS.findIndex(p => p.id === rxId);
  if (idx > -1) {
    const [done] = PRESCRIPTIONS.splice(idx, 1);
    done.status = 'Completed';
    completedPrescriptions.unshift(done);
  }

  // Reset bill
  billRows = [];
  const section = document.getElementById('bill-builder-section');
  if (section) {
    section.style.opacity = '0';
    setTimeout(() => { section.style.display = 'none'; }, 300);
  }
  currentPrescription = null;

  renderPrescriptionList();
  updateDashStats();

  showToast(`✅ Order for ${PRESCRIPTIONS.length === 0 ? 'patient' : 'patient'} marked as Ready!`, 'success');
}

// ===== DASHBOARD TABS (mobile) =====
function initDashTabs() {
  const tabs = document.querySelectorAll('.dash-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      activeDashTab = target;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const leftPanel = document.getElementById('dash-left-panel');
      const rightPanel = document.getElementById('dash-right-panel');

      if (window.innerWidth <= 1024) {
        if (target === 'prescriptions') {
          if (leftPanel) leftPanel.style.display = 'block';
          if (rightPanel) rightPanel.style.display = 'none';
        } else {
          if (leftPanel) leftPanel.style.display = 'none';
          if (rightPanel) rightPanel.style.display = 'block';
        }
      }
    });
  });
}

// ===== INVENTORY MANAGEMENT MODAL & ACTION LOGIC =====
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
      
      // Show Preview
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

function saveNewMedicine(event) {
  event.preventDefault();
  
  if (!uploadedMedImageBase64) {
    showToast('Please upload a medicine photo', 'error');
    return;
  }
  
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
  
  // Find next ID
  const nextId = MEDICINES.reduce((max, m) => m.id > max ? m.id : max, 0) + 1;
  
  // Choose generic styles/color for backgrounds
  const categoryColors = {
    'Fever & Pain': '#FEE2E2',
    'Antibiotics': '#FEF3C7',
    'Gastro': '#D1FAE5',
    'Chronic Care': '#EDE9FE',
    'Vitamins & Supplements': '#FFF7ED',
    'Skincare': '#FECDD3',
    'Baby Care': '#E0F2FE',
    'ENT': '#F0FDF4'
  };
  const bg = categoryColors[category] || '#E5E7EB';
  const icon = category === 'Gastro' || category === 'Baby Care' ? '🍶' : '💊';
  
  const newMed = {
    id: nextId,
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
    imageColor: bg,
    icon,
    image: uploadedMedImageBase64
  };
  
  MEDICINES.push(newMed);
  saveMedicinesToStorage();
  
  closeModal('add-med-modal');
  currentPage = 1;
  renderMedicineTable();
  
  showToast(`✅ ${name} added to inventory!`, 'success');
}

// Close add med modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-med-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal('add-med-modal');
  });
});

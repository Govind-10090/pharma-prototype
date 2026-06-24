// ===== KIRTI PHARMA — track.js =====
// Order tracking timeline, rider card, reorder logic

const ORDER_DATA = {
  id: 'KP-2847',
  placed: '4:12 PM',
  total: '₹347',
  date: 'Today',
  items: [
    { name: 'Crocin 650mg', qty: 2, price: 32 },
    { name: 'Becosules', qty: 1, price: 82 },
    { name: 'Pantoprazole 40mg', qty: 1, price: 58 },
  ],
  rider: {
    name: 'Rahul Kurmi',
    initials: 'RK',
    phone: '+919876543210',
    distance: '2.3 km',
    eta: '~18 mins',
  },
  stages: [
    { id: 'confirmed', label: 'Order Confirmed', time: '4:12 PM', status: 'done', icon: '✅' },
    { id: 'preparing', label: 'Being Prepared', time: '4:35 PM', status: 'done', icon: '✅' },
    { id: 'delivery', label: 'Out for Delivery', time: 'Est. 5:50 PM', status: 'active', icon: '🛵' },
    { id: 'delivered', label: 'Delivered', time: 'Pending', status: 'pending', icon: '📦' },
  ],
  estimatedDelivery: '6:30 PM',
};

document.addEventListener('DOMContentLoaded', () => {
  renderOrderHeader();
  renderTimeline();
  renderRiderCard();
  renderProgressBar();
  animateProgressBar();
});

function renderOrderHeader() {
  const el = document.getElementById('order-header');
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:space-between">
      <div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <h2 style="font-size:1.25rem;font-weight:800">Order #${ORDER_DATA.id}</h2>
          <span class="badge badge-green" style="font-size:0.75rem;padding:4px 12px">🟢 Active</span>
        </div>
        <p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px">
          Placed ${ORDER_DATA.placed} · ${ORDER_DATA.date} · ${ORDER_DATA.total}
        </p>
      </div>
      <span class="badge" style="background:#DCFCE7;color:#166534;font-size:0.85rem;padding:8px 18px;border-radius:999px;font-weight:700">
        🕕 Expected by ${ORDER_DATA.estimatedDelivery}
      </span>
    </div>
  `;
}

function renderTimeline() {
  const container = document.getElementById('order-timeline');
  if (!container) return;

  const activeIdx = ORDER_DATA.stages.findIndex(s => s.status === 'active');

  container.innerHTML = ORDER_DATA.stages.map((stage, i) => {
    const isLast = i === ORDER_DATA.stages.length - 1;
    const dotClass = stage.status;
    const lineClass = i < activeIdx ? 'done' : 'pending';

    return `
      <div class="timeline-item">
        <div class="timeline-left">
          <div class="timeline-dot ${dotClass}" aria-label="${stage.label}">
            ${stage.status === 'pending' ? '' : stage.icon}
          </div>
          ${!isLast ? `<div class="timeline-line ${lineClass}"></div>` : ''}
        </div>
        <div class="timeline-content">
          <div class="timeline-stage${stage.status === 'pending' ? ' pending-text' : ''}">
            ${stage.label}
            ${stage.status === 'active' ? '<span class="badge badge-blue" style="margin-left:8px;font-size:0.68rem">LIVE</span>' : ''}
          </div>
          <div class="timeline-time">${stage.time}</div>
          ${stage.status === 'active' ? `
            <div style="margin-top:8px;font-size:0.8rem;color:var(--green-primary);font-weight:600;display:flex;align-items:center;gap:6px">
              <span style="width:8px;height:8px;background:var(--green-primary);border-radius:50%;animation:timeline-pulse 1.5s ease-in-out infinite;display:inline-block"></span>
              On the way · ${ORDER_DATA.rider.distance} away
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderRiderCard() {
  const container = document.getElementById('rider-card-container');
  if (!container) return;

  const { rider } = ORDER_DATA;
  container.innerHTML = `
    <div class="info-card-header">🛵 Delivery Partner</div>
    <div class="rider-card">
      <div class="rider-avatar">${rider.initials}</div>
      <div class="rider-info">
        <div class="rider-name">${rider.name}</div>
        <div class="rider-role">Delivery Partner — Kirti Pharma</div>
        <div class="rider-eta">📍 ${rider.distance} away · ${rider.eta}</div>
      </div>
      <a href="tel:${rider.phone}" class="btn btn-secondary btn-sm" style="flex-shrink:0">
        📞 Call
      </a>
    </div>
  `;
}

function renderProgressBar() {
  const bar = document.getElementById('delivery-progress-fill');
  if (!bar) return;

  const stages = ORDER_DATA.stages;
  const doneCount = stages.filter(s => s.status === 'done').length;
  const activeCount = stages.filter(s => s.status === 'active').length;
  const total = stages.length;
  const progress = ((doneCount + activeCount * 0.5) / total) * 100;

  bar.dataset.target = progress;
  bar.style.width = '0%';
}

function animateProgressBar() {
  const bar = document.getElementById('delivery-progress-fill');
  if (!bar) return;
  setTimeout(() => {
    bar.style.width = `${bar.dataset.target || 0}%`;
  }, 300);
}

// ===== REORDER =====
function reorderItems() {
  ORDER_DATA.items.forEach(item => {
    const med = MEDICINES.find(m => m.name === item.name);
    if (med && med.stock > 0) {
      addToCart(med);
    }
  });
  showToast('Items added to cart! 🛒', 'success');
  setTimeout(() => window.location.href = 'cart.html', 1500);
}

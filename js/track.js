// ===== KIRTI PHARMA — track.js =====
// Real-time Order Tracking, Live Timeline, Rider Info & SSE Sync

let ORDER_DATA = {
  id: 'KP-2847',
  placed: '4:12 PM',
  total: '₹234',
  date: 'Today',
  status: 'delivery',
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

document.addEventListener('DOMContentLoaded', async () => {
  await loadOrderFromApi();
  initTrackRealtimeEvents();
});

// ===== LOAD ORDER FROM API =====
async function loadOrderFromApi() {
  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get('orderId') || localStorage.getItem('kp_last_order_id') || 'KP-2847';

  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(requestedId)}`);
    const json = await res.json();
    if (json.success && json.data) {
      const order = json.data;
      ORDER_DATA = {
        id: order.id,
        placed: order.placed || '4:12 PM',
        total: `₹${order.total || order.subtotal || 234}`,
        date: order.date || 'Today',
        status: order.status || 'delivery',
        items: order.items || [],
        rider: order.rider || {
          name: 'Rahul Kurmi',
          initials: 'RK',
          phone: '+919876543210',
          distance: '2.3 km',
          eta: '~18 mins'
        },
        stages: order.stages || ORDER_DATA.stages,
        estimatedDelivery: order.estimatedDelivery || 'Within 45 mins'
      };
    }
  } catch (err) {
    console.warn('Backend unavailable, using default order data:', err);
  }

  renderAll();
}

function renderAll() {
  renderOrderHeader();
  renderTimeline();
  renderRiderCard();
  renderOrderItems();
  renderProgressBar();
  animateProgressBar();
}

// ===== REAL-TIME SSE SYNC =====
function initTrackRealtimeEvents() {
  if (!window.EventSource) return;

  try {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'order_status_updated' && data.payload.id === ORDER_DATA.id) {
          const updated = data.payload;
          ORDER_DATA.status = updated.status;
          ORDER_DATA.stages = updated.stages;
          if (updated.rider) ORDER_DATA.rider = updated.rider;
          renderAll();
          showToast(`🔔 Order status changed to ${updated.status.toUpperCase()}!`, 'info');
        }
      } catch (err) {}
    };
  } catch (e) {}
}

function renderOrderHeader() {
  const el = document.getElementById('order-header');
  if (!el) return;

  const isDelivered = ORDER_DATA.status === 'delivered';
  const badgeClass = isDelivered ? 'badge-green' : (ORDER_DATA.status === 'delivery' ? 'badge-green' : 'badge-blue');
  const statusText = isDelivered ? '✅ Delivered' : (ORDER_DATA.status === 'delivery' ? '🟢 Out for Delivery' : '💊 In Preparation');

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:space-between">
      <div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <h2 style="font-size:1.35rem;font-weight:800;color:var(--text-main)">Order #${ORDER_DATA.id}</h2>
          <span class="badge ${badgeClass}" style="font-size:0.75rem;padding:4px 12px">${statusText}</span>
        </div>
        <p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px">
          Placed ${ORDER_DATA.placed} · ${ORDER_DATA.date} · <strong>${ORDER_DATA.total}</strong>
        </p>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="badge" style="background:#DCFCE7;color:#166534;font-size:0.85rem;padding:8px 18px;border-radius:999px;font-weight:700">
          🕕 ${isDelivered ? 'Delivered successfully' : `Expected by ${ORDER_DATA.estimatedDelivery}`}
        </span>
      </div>
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
    const lineClass = i < activeIdx || ORDER_DATA.status === 'delivered' ? 'done' : 'pending';

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
      <div class="rider-avatar">${rider.initials || 'RK'}</div>
      <div class="rider-info">
        <div class="rider-name">${rider.name}</div>
        <div class="rider-role">Delivery Partner — Kirti Pharma Gondia</div>
        <div class="rider-eta">📍 ${rider.distance || '2.3 km'} away · ${rider.eta || '~18 mins'}</div>
      </div>
      <a href="tel:${rider.phone || '+919876543210'}" class="btn btn-secondary btn-sm" style="flex-shrink:0">
        📞 Call
      </a>
    </div>
  `;
}

function renderOrderItems() {
  const container = document.getElementById('order-items-list');
  if (!container) return;

  container.innerHTML = `
    <div class="info-card-header" style="margin-top:20px">💊 Order Items (${(ORDER_DATA.items || []).length})</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
      ${(ORDER_DATA.items || []).map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px">
          <div>
            <div style="font-weight:600;font-size:0.9rem">${item.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">Qty: ${item.qty} · ${item.brand || 'Generic'}</div>
          </div>
          <div style="font-weight:700;font-size:0.95rem">₹${item.price * item.qty}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderProgressBar() {
  const bar = document.getElementById('delivery-progress-fill');
  if (!bar) return;

  if (ORDER_DATA.status === 'delivered') {
    bar.dataset.target = 100;
    bar.style.width = '100%';
    return;
  }

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
  let count = 0;
  ORDER_DATA.items.forEach(item => {
    const med = typeof MEDICINES !== 'undefined' ? MEDICINES.find(m => m.name === item.name || m.id === item.id) : null;
    if (typeof addToCart === 'function') {
      addToCart(med || { id: item.id || Date.now(), name: item.name, brand: item.brand, price: item.price, packUnit: 'strip' });
      count++;
    }
  });
  showToast(`${count} item(s) added to cart! 🛒`, 'success');
  setTimeout(() => window.location.href = 'cart.html', 1200);
}

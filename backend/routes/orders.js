// ===== KIRTI PHARMA BACKEND — orders.js (Supabase Cloud + SQLite) =====
// Handles Orders, Deducts Live Stock & Automatically Increments Medicine Sales in Cloud

const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');
const supabaseRepo = require('../supabase');
const { broadcastEvent } = require('../events');

function getCurrentTimeFormatted() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// GET /api/orders - List orders
router.get('/', async (req, res) => {
  try {
    const { phone, status } = req.query;

    if (supabaseRepo.isSupabaseActive()) {
      const list = await supabaseRepo.orders.list({ phone, status });
      return res.json({
        success: true,
        total: list.length,
        data: list
      });
    }

    let sql = `SELECT * FROM orders WHERE 1=1`;
    const params = [];
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      sql += ` AND phone LIKE ?`;
      params.push(`%${cleanPhone}%`);
    }
    if (status && status !== 'all') {
      if (status === 'active') {
        sql += ` AND status NOT IN ('delivered', 'cancelled')`;
      } else {
        sql += ` AND status = ?`;
        params.push(status);
      }
    }
    sql += ` ORDER BY createdAt DESC`;

    const rows = await query(sql, params);
    const parsed = rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : r.items,
      rider: typeof r.rider === 'string' ? JSON.parse(r.rider || '{}') : r.rider,
      stages: typeof r.stages === 'string' ? JSON.parse(r.stages || '[]') : r.stages
    }));

    res.json({
      success: true,
      total: parsed.length,
      data: parsed
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id - Single order
router.get('/:id', async (req, res) => {
  try {
    if (supabaseRepo.isSupabaseActive()) {
      const order = await supabaseRepo.orders.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, error: `Order #${req.params.id} not found` });
      }
      return res.json({ success: true, data: order });
    }

    const row = await get(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    if (!row) {
      return res.status(404).json({ success: false, error: `Order #${req.params.id} not found` });
    }

    const order = {
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items || '[]') : row.items,
      rider: typeof row.rider === 'string' ? JSON.parse(row.rider || '{}') : row.rider,
      stages: typeof row.stages === 'string' ? JSON.parse(row.stages || '[]') : row.stages
    };

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders - Place order: DEDUCTS STOCK & INCREMENTS SALES!
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      phone,
      items,
      deliveryAddress,
      paymentMethod,
      prescriptionId,
      notes
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'Cannot place an empty order' });
    }

    let nextNum = 2850;
    if (supabaseRepo.isSupabaseActive()) {
      const all = await supabaseRepo.orders.list();
      const nums = all.map(o => parseInt((o.id || '').replace('KP-', ''))).filter(n => !isNaN(n));
      if (nums.length) nextNum = Math.max(...nums) + 1;
    } else {
      const allOrders = await query(`SELECT id FROM orders`);
      const nums = allOrders
        .map(o => parseInt((o.id || '').replace('KP-', '')))
        .filter(n => !isNaN(n));
      if (nums.length) nextNum = Math.max(...nums) + 1;
    }
    const orderId = `KP-${nextNum}`;

    let subtotal = 0;
    const enrichedItems = [];

    // Loop through each item: Deduct stock, increase sales count!
    for (const item of items) {
      let med = null;
      if (supabaseRepo.isSupabaseActive()) {
        med = await supabaseRepo.medicines.getById(item.id);
      } else {
        med = await get(`SELECT * FROM medicines WHERE id = ?`, [item.id]);
      }

      const unitPrice = med ? Number(med.price) : (Number(item.price) || 0);
      const qty = item.qty || 1;
      subtotal += unitPrice * qty;

      if (med) {
        if (supabaseRepo.isSupabaseActive()) {
          // LIVE SUPABASE UPDATE: DEDUCT STOCK & INCREMENT SALES!
          const updatedMed = await supabaseRepo.medicines.decrementStockAndIncrementSales(med.id, qty);
          if (updatedMed) broadcastEvent('medicine_updated', updatedMed);
        } else {
          await run(`
            UPDATE medicines 
            SET stock = MAX(0, stock - ?), 
                sold = sold + ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [qty, qty, med.id]);

          const updatedMed = await get(`SELECT * FROM medicines WHERE id = ?`, [med.id]);
          broadcastEvent('medicine_updated', updatedMed);
        }
      }

      enrichedItems.push({
        id: item.id,
        name: item.name || (med ? med.name : 'Medicine'),
        brand: item.brand || (med ? med.brand : ''),
        packUnit: item.packUnit || (med ? med.packUnit : 'strip'),
        price: unitPrice,
        qty: qty
      });
    }

    const deliveryFee = subtotal >= 499 ? 0 : 30;
    const grandTotal = subtotal + deliveryFee;
    const currentTime = getCurrentTimeFormatted();

    const rider = {
      id: 'rider-1',
      name: 'Rahul Kurmi',
      initials: 'RK',
      phone: '+919876543210',
      distance: '2.0 km',
      eta: '~20 mins'
    };

    const stages = [
      { id: 'confirmed', label: 'Order Confirmed', time: currentTime, status: 'done', icon: '✅' },
      { id: 'preparing', label: 'Being Prepared', time: 'In Progress', status: 'active', icon: '💊' },
      { id: 'delivery', label: 'Out for Delivery', time: 'Pending', status: 'pending', icon: '🛵' },
      { id: 'delivered', label: 'Delivered', time: 'Pending', status: 'pending', icon: '📦' }
    ];

    if (supabaseRepo.isSupabaseActive()) {
      const orderPayload = {
        id: orderId,
        customerName: customerName || 'Kirti Customer',
        phone: phone || '9876543210',
        date: 'Today',
        placed: currentTime,
        status: 'preparing',
        paymentMethod: paymentMethod || 'UPI',
        paymentStatus: 'Paid',
        deliveryAddress: deliveryAddress || 'Gondia Store Delivery',
        items: enrichedItems,
        subtotal,
        deliveryFee,
        total: grandTotal,
        prescriptionId: prescriptionId || null,
        notes: notes || '',
        rider,
        stages,
        estimatedDelivery: 'Within 45 mins'
      };

      const createdOrder = await supabaseRepo.orders.create(orderPayload);
      broadcastEvent('new_order', createdOrder);

      return res.status(201).json({
        success: true,
        message: `Order #${orderId} saved in Supabase Cloud! Stock updated & sales recorded.`,
        data: createdOrder
      });
    }

    // Local fallback
    await run(`
      INSERT INTO orders (id, customerName, phone, date, placed, status, paymentMethod, paymentStatus, deliveryAddress, items, subtotal, deliveryFee, total, prescriptionId, notes, rider, stages, estimatedDelivery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId, customerName || 'Kirti Customer', phone || '9876543210', 'Today', currentTime, 'preparing',
      paymentMethod || 'UPI', 'Paid', deliveryAddress || 'Gondia Store Delivery', JSON.stringify(enrichedItems),
      subtotal, deliveryFee, grandTotal, prescriptionId || null, notes || '', JSON.stringify(rider),
      JSON.stringify(stages), 'Within 45 mins'
    ]);

    const created = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    const parsedCreated = {
      ...created,
      items: typeof created.items === 'string' ? JSON.parse(created.items) : created.items,
      rider: typeof created.rider === 'string' ? JSON.parse(created.rider) : created.rider,
      stages: typeof created.stages === 'string' ? JSON.parse(created.stages) : created.stages
    };

    broadcastEvent('new_order', parsedCreated);

    res.status(201).json({
      success: true,
      message: `Order #${orderId} created! Stock updated & sales recorded.`,
      data: parsedCreated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, stageId } = req.body;
    if (supabaseRepo.isSupabaseActive()) {
      const updated = await supabaseRepo.orders.updateStatus(req.params.id, status);
      broadcastEvent('order_status_updated', updated);
      return res.json({ success: true, data: updated });
    }

    await run(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id]);
    const updated = await get(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    broadcastEvent('order_status_updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

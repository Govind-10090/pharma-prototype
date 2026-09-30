// ===== KIRTI PHARMA BACKEND — prescriptions.js (SQLite Powered) =====
// Prescription Upload, Pharmacist Review Queue & Bill Generation with Stock Deduction

const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');
const upload = require('../middleware/upload');
const { broadcastEvent } = require('../events');

function getInitials(name) {
  if (!name) return 'PT';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRandomColor() {
  const colors = ['#7C3AED', '#2563EB', '#DB2777', '#059669', '#D97706', '#DC2626'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getCurrentTimeFormatted() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// GET /api/prescriptions - List prescriptions
router.get('/', async (req, res) => {
  try {
    const { status, phone } = req.query;
    let sql = `SELECT * FROM prescriptions WHERE 1=1`;
    const params = [];

    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      sql += ` AND phone LIKE ?`;
      params.push(`%${cleanPhone}%`);
    }

    if (status && status !== 'all') {
      sql += ` AND LOWER(status) = LOWER(?)`;
      params.push(status);
    }

    sql += ` ORDER BY id DESC`;

    const rows = await query(sql, params);
    const parsed = rows.map(r => ({
      ...r,
      bill: r.bill ? (typeof r.bill === 'string' ? JSON.parse(r.bill) : r.bill) : null
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

// GET /api/prescriptions/:id - Single prescription
router.get('/:id', async (req, res) => {
  try {
    const rx = await get(`SELECT * FROM prescriptions WHERE id = ?`, [req.params.id]);
    if (!rx) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }
    res.json({
      success: true,
      data: {
        ...rx,
        bill: rx.bill ? JSON.parse(rx.bill) : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/prescriptions - Upload prescription
router.post('/', upload.single('prescription'), async (req, res) => {
  try {
    const body = req.body;
    let fileUrl = '';
    let fileName = 'prescription.jpg';

    if (req.file) {
      fileUrl = `/uploads/prescriptions/${req.file.filename}`;
      fileName = req.file.originalname;
    } else if (body.fileDataUrl) {
      fileUrl = body.fileDataUrl;
      fileName = body.fileName || 'prescription_upload.jpg';
    } else if (body.fileUrl) {
      fileUrl = body.fileUrl;
      fileName = body.fileName || 'prescription_upload.jpg';
    } else {
      fileUrl = 'images/med_fever_pain.png';
      fileName = 'sample_rx.png';
    }

    const patientName = body.patient || body.patientName || 'Kirti Customer';
    const initials = getInitials(patientName);
    const phone = body.phone || '9876543210';
    const source = body.source || 'App';
    const color = getRandomColor();
    const time = getCurrentTimeFormatted();
    const date = 'Today';
    const notes = body.notes || '';

    const insertResult = await run(`
      INSERT INTO prescriptions (patient, initials, phone, source, status, color, time, date, fileName, fileUrl, notes)
      VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?)
    `, [patientName, initials, phone, source, color, time, date, fileName, fileUrl, notes]);

    const created = await get(`SELECT * FROM prescriptions WHERE id = ?`, [insertResult.lastID]);
    broadcastEvent('prescription_uploaded', created);

    res.status(201).json({
      success: true,
      message: 'Prescription saved in SQLite database! Pharmacist notified.',
      data: created
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/prescriptions/:id/status - Update review status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await run(`UPDATE prescriptions SET status = ? WHERE id = ?`, [status, req.params.id]);
    const updated = await get(`SELECT * FROM prescriptions WHERE id = ?`, [req.params.id]);

    broadcastEvent('prescription_updated', updated);

    res.json({
      success: true,
      message: `Prescription status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/prescriptions/:id/bill - Pharmacist prepares bill, deducts stock, increments sales!
router.post('/:id/bill', async (req, res) => {
  try {
    const { billRows, createOrder } = req.body;
    const rx = await get(`SELECT * FROM prescriptions WHERE id = ?`, [req.params.id]);
    if (!rx) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    if (!billRows || !billRows.length) {
      return res.status(400).json({ success: false, error: 'Bill must contain at least one item' });
    }

    let subtotal = 0;
    const items = [];

    for (const row of billRows) {
      const med = await get(`SELECT * FROM medicines WHERE id = ?`, [row.medicineId]);
      const unitPrice = row.unitPrice || (med ? med.price : 0);
      const qty = row.qty || 1;
      const rowTotal = unitPrice * qty;
      subtotal += rowTotal;

      // Update medicine stock and sales count in SQLite!
      if (med) {
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

      items.push({
        id: row.medicineId,
        name: med ? med.name : 'Prescription Medicine',
        brand: med ? med.brand : '',
        packUnit: med ? med.packUnit : 'strip',
        price: unitPrice,
        qty: qty,
        total: rowTotal
      });
    }

    const deliveryFee = subtotal >= 499 ? 0 : 30;
    const grandTotal = subtotal + deliveryFee;

    const bill = {
      items,
      subtotal,
      deliveryFee,
      grandTotal,
      preparedAt: new Date().toISOString()
    };

    let orderId = null;

    if (createOrder) {
      const allOrders = await query(`SELECT id FROM orders`);
      const nums = allOrders
        .map(o => parseInt((o.id || '').replace('KP-', '')))
        .filter(n => !isNaN(n));
      const nextNum = nums.length ? Math.max(...nums) + 1 : 2850;
      orderId = `KP-${nextNum}`;

      const rider = {
        name: 'Rahul Kurmi',
        initials: 'RK',
        phone: '+919876543210',
        distance: '2.0 km',
        eta: '~20 mins'
      };

      const stages = [
        { id: 'confirmed', label: 'Order Confirmed (Rx Verified)', time: getCurrentTimeFormatted(), status: 'done', icon: '✅' },
        { id: 'preparing', label: 'Medicines Packed', time: 'In Progress', status: 'active', icon: '💊' },
        { id: 'delivery', label: 'Out for Delivery', time: 'Pending', status: 'pending', icon: '🛵' },
        { id: 'delivered', label: 'Delivered', time: 'Pending', status: 'pending', icon: '📦' }
      ];

      await run(`
        INSERT INTO orders (id, customerName, phone, date, placed, status, paymentMethod, paymentStatus, deliveryAddress, items, subtotal, deliveryFee, total, prescriptionId, rider, stages, estimatedDelivery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        rx.patient,
        rx.phone,
        'Today',
        getCurrentTimeFormatted(),
        'preparing',
        'Cash on Delivery',
        'Pending on Delivery',
        'Gondia store customer',
        JSON.stringify(items),
        subtotal,
        deliveryFee,
        grandTotal,
        rx.id,
        JSON.stringify(rider),
        JSON.stringify(stages),
        'Within 45 mins'
      ]);

      const createdOrder = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
      broadcastEvent('new_order', {
        ...createdOrder,
        items,
        rider,
        stages
      });
    }

    await run(`
      UPDATE prescriptions 
      SET status = 'Completed', bill = ?, orderId = ?
      WHERE id = ?
    `, [JSON.stringify(bill), orderId, rx.id]);

    const updatedRx = await get(`SELECT * FROM prescriptions WHERE id = ?`, [rx.id]);
    broadcastEvent('prescription_updated', {
      ...updatedRx,
      bill
    });

    res.json({
      success: true,
      message: 'Prescription bill created! Stock deducted & sales updated.',
      data: {
        prescription: { ...updatedRx, bill },
        orderId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

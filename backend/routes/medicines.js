// ===== KIRTI PHARMA BACKEND — medicines.js (Supabase Cloud + SQLite) =====
// Handles Catalog, Live Stock Tracking, Sales Count, and Medicine CRUD

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { query, get, run, CAT_IMAGES } = require('../db');
const supabaseRepo = require('../supabase');
const upload = require('../middleware/upload');
const { broadcastEvent } = require('../events');

// Helper to save base64 image data URI to disk
function saveBase64Image(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return null;
  const matches = dataUri.match(/^data:image\/([A-Za-z-+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;

  try {
    const ext = matches[1].toLowerCase().includes('png') ? 'png' : 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `med-${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
    const targetDir = path.join(__dirname, '..', '..', 'uploads', 'medicines');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, filename), buffer);
    return `/uploads/medicines/${filename}`;
  } catch (err) {
    console.error('Failed to save base64 medicine image:', err);
    return null;
  }
}

// GET /api/medicines - List all medicines with live stock & sales count
router.get('/', async (req, res) => {
  try {
    const { category, q, inStock, page, limit } = req.query;

    if (supabaseRepo.isSupabaseActive()) {
      const result = await supabaseRepo.medicines.list({ category, q, inStock, page, limit });
      return res.json({
        success: true,
        ...result
      });
    }

    // Local fallback
    let sql = `SELECT * FROM medicines WHERE 1=1`;
    const params = [];
    if (category && category !== 'All') {
      sql += ` AND LOWER(category) = LOWER(?)`;
      params.push(category);
    }
    if (q && q.trim()) {
      const term = `%${q.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(salt) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(category) LIKE ?)`;
      params.push(term, term, term, term);
    }
    if (inStock === 'true') sql += ` AND stock > 0`;
    sql += ` ORDER BY id ASC`;

    const list = await query(sql, params);
    const total = list.length;
    const formatted = list.map(m => ({
      ...m,
      prescription_required: Boolean(m.prescription_required),
      chronic: Boolean(m.chronic),
      stock: Number(m.stock || 0),
      sold: Number(m.sold || 0)
    }));

    if (page && limit) {
      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 20;
      const start = (p - 1) * l;
      return res.json({
        success: true,
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
        data: formatted.slice(start, start + l)
      });
    }

    res.json({ success: true, total, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/medicines/meta/categories - Category breakdown with stock & sales count
router.get('/meta/categories', async (req, res) => {
  try {
    if (supabaseRepo.isSupabaseActive()) {
      const { data } = await supabaseRepo.medicines.list();
      const catMap = {};
      (data || []).forEach(m => {
        const c = m.category || 'General';
        if (!catMap[c]) catMap[c] = { name: c, count: 0, totalStock: 0, totalSold: 0 };
        catMap[c].count++;
        catMap[c].totalStock += (Number(m.stock) || 0);
        catMap[c].totalSold += (Number(m.sold) || 0);
      });
      const result = Object.values(catMap).map(r => ({
        ...r,
        image: CAT_IMAGES[r.name] || 'images/med_fever_pain.png'
      }));
      return res.json({ success: true, data: result });
    }

    const rows = await query(`
      SELECT category as name, COUNT(*) as count, SUM(stock) as totalStock, SUM(sold) as totalSold
      FROM medicines
      GROUP BY category
    `);
    const data = rows.map(r => ({
      ...r,
      image: CAT_IMAGES[r.name] || 'images/med_fever_pain.png'
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/medicines/:id - Single medicine + salt alternatives
router.get('/:id', async (req, res) => {
  try {
    if (supabaseRepo.isSupabaseActive()) {
      const med = await supabaseRepo.medicines.getById(req.params.id);
      if (!med) return res.status(404).json({ success: false, error: 'Medicine not found' });
      return res.json({
        success: true,
        data: med,
        alternatives: med.alternatives || []
      });
    }

    const med = await get(`SELECT * FROM medicines WHERE id = ?`, [req.params.id]);
    if (!med) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }
    const saltBase = (med.salt || '').split('+')[0].trim();
    const alternatives = await query(`
      SELECT * FROM medicines 
      WHERE id != ? AND stock > 0 AND LOWER(salt) LIKE ?
      LIMIT 4
    `, [med.id, `%${saltBase.toLowerCase()}%`]);

    res.json({
      success: true,
      data: {
        ...med,
        prescription_required: Boolean(med.prescription_required),
        chronic: Boolean(med.chronic)
      },
      alternatives
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/medicines - Add new medicine (with initial stock specified)
router.post('/', upload.single('medicineImage'), async (req, res) => {
  try {
    const body = req.body;

    let imagePath = body.image || '';
    if (req.file) {
      imagePath = `/uploads/medicines/${req.file.filename}`;
    } else if (body.imageBase64 && body.imageBase64.startsWith('data:image')) {
      const saved = saveBase64Image(body.imageBase64);
      if (saved) imagePath = saved;
    } else if (body.imageBase64) {
      imagePath = body.imageBase64;
    }

    if (!imagePath || !imagePath.trim()) {
      imagePath = CAT_IMAGES[body.category] || 'images/med_fever_pain.png';
    }

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

    const name = body.name ? body.name.trim() : '';
    const salt = body.salt ? body.salt.trim() : '';
    const brand = body.brand ? body.brand.trim() : 'Generic';
    const category = body.category || 'General';
    const price = parseFloat(body.price) || 0;
    const mrp = parseFloat(body.mrp) || price;
    const initialStock = parseInt(body.stock) || 0;
    const sold = 0;
    const packSize = parseInt(body.packSize) || 10;
    const packUnit = body.packUnit || 'tablets';
    const rx = String(body.prescription_required) === 'true' ? true : false;
    const chronic = String(body.chronic) === 'true' ? true : false;
    const imageColor = categoryColors[category] || '#E5E7EB';
    const icon = category === 'Gastro' || category === 'Baby Care' ? '🍶' : '💊';

    if (supabaseRepo.isSupabaseActive()) {
      const created = await supabaseRepo.medicines.add({
        name,
        salt,
        brand,
        category,
        price,
        mrp,
        stock: initialStock,
        sold,
        packSize,
        packUnit,
        prescription_required: rx,
        chronic,
        imageColor,
        icon,
        image: imagePath
      });

      broadcastEvent('medicine_added', created);

      return res.status(201).json({
        success: true,
        message: `✅ ${name} added to Supabase Cloud with initial stock of ${initialStock} units and image stored!`,
        data: created
      });
    }

    // Local fallback
    const insertResult = await run(`
      INSERT INTO medicines (name, salt, brand, category, price, mrp, stock, sold, packSize, packUnit, prescription_required, chronic, imageColor, icon, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, salt, brand, category, price, mrp, initialStock, sold, packSize, packUnit, rx ? 1 : 0, chronic ? 1 : 0, imageColor, icon, imagePath]);

    const created = await get(`SELECT * FROM medicines WHERE id = ?`, [insertResult.lastID]);
    const formattedCreated = {
      ...created,
      prescription_required: Boolean(created.prescription_required),
      chronic: Boolean(created.chronic),
      stock: Number(created.stock || 0),
      sold: Number(created.sold || 0)
    };

    broadcastEvent('medicine_added', formattedCreated);

    res.status(201).json({
      success: true,
      message: `✅ ${name} added with initial stock of ${initialStock} units!`,
      data: formattedCreated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/medicines/:id - Update medicine details / adjust stock / update image
router.put('/:id', upload.single('medicineImage'), async (req, res) => {
  try {
    const { name, price, mrp, stock, sold } = req.body;

    if (supabaseRepo.isSupabaseActive()) {
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (price !== undefined) updates.price = parseFloat(price);
      if (mrp !== undefined) updates.mrp = parseFloat(mrp);
      if (stock !== undefined) updates.stock = parseInt(stock);
      if (sold !== undefined) updates.sold = parseInt(sold);

      if (req.file) {
        updates.image = `/uploads/medicines/${req.file.filename}`;
      } else if (req.body.imageBase64 && req.body.imageBase64.startsWith('data:image')) {
        const saved = saveBase64Image(req.body.imageBase64);
        if (saved) updates.image = saved;
      } else if (req.body.image !== undefined) {
        updates.image = req.body.image;
      }

      const updated = await supabaseRepo.medicines.update(req.params.id, updates);
      broadcastEvent('medicine_updated', updated);

      return res.json({
        success: true,
        message: 'Medicine updated in Supabase Cloud',
        data: updated
      });
    }

    const existing = await get(`SELECT * FROM medicines WHERE id = ?`, [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }

    const updatedStock = stock !== undefined ? parseInt(stock) : existing.stock;
    const updatedSold = sold !== undefined ? parseInt(sold) : existing.sold;
    const updatedPrice = price !== undefined ? parseFloat(price) : existing.price;
    const updatedMrp = mrp !== undefined ? parseFloat(mrp) : existing.mrp;
    const updatedName = name !== undefined ? name : existing.name;

    await run(`
      UPDATE medicines 
      SET name = ?, price = ?, mrp = ?, stock = ?, sold = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [updatedName, updatedPrice, updatedMrp, updatedStock, updatedSold, req.params.id]);

    const updated = await get(`SELECT * FROM medicines WHERE id = ?`, [req.params.id]);
    broadcastEvent('medicine_updated', updated);

    res.json({
      success: true,
      message: 'Medicine updated successfully in SQLite database',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/medicines/:id - Remove medicine from inventory
router.delete('/:id', async (req, res) => {
  try {
    if (supabaseRepo.isSupabaseActive()) {
      await supabaseRepo.medicines.delete(req.params.id);
      broadcastEvent('medicine_deleted', { id: req.params.id });
      return res.json({ success: true, message: 'Deleted from Supabase Cloud' });
    }

    const existing = await get(`SELECT * FROM medicines WHERE id = ?`, [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }

    await run(`DELETE FROM medicines WHERE id = ?`, [req.params.id]);
    broadcastEvent('medicine_deleted', { id: req.params.id });

    res.json({ success: true, message: 'Medicine removed from inventory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

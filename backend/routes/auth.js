// ===== KIRTI PHARMA BACKEND — auth.js (Supabase Cloud + SQLite) =====
// Customer & Chemist Authentication with Mobile Number + Password

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { query, get, run } = require('../db');
const supabaseRepo = require('../supabase');

const JWT_SECRET   = process.env.JWT_SECRET || 'kirti-pharma-super-secret-key-2026';
const SALT_ROUNDS  = 10;

// POST /api/auth/login — Login (password check) OR Register (new user with hashed password)
router.post('/login', async (req, res) => {
  try {
    const { phone, password, name } = req.body;

    if (!phone || !/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, error: 'Please provide a valid 10-digit mobile number' });
    }
    if (!password || password.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }

    const cleanPhone = phone.trim();
    const isChemist  = cleanPhone === '9876540000';
    let user = null;

    // ── Fetch existing user ──────────────────────────────────────────────
    if (supabaseRepo.isSupabaseActive()) {
      user = await supabaseRepo.users.getByPhone(cleanPhone);
    } else {
      user = await get(`SELECT * FROM users WHERE phone = ?`, [cleanPhone]);
    }

    if (user) {
      // ── EXISTING USER: verify password ──────────────────────────────
      if (user.password_hash) {
        const match = await bcrypt.compare(password.trim(), user.password_hash);
        if (!match) {
          return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
        }
      } else {
        // Legacy user with no password yet — set it now
        const hash = await bcrypt.hash(password.trim(), SALT_ROUNDS);
        if (supabaseRepo.isSupabaseActive()) {
          user = await supabaseRepo.users.update(user.id, { password_hash: hash });
        } else {
          await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, user.id]);
          user = await get(`SELECT * FROM users WHERE id = ?`, [user.id]);
        }
        console.log(`[AUTH] Password set for existing user: ${user.phone}`);
      }
      // Optionally update name if provided and changed
      if (name && name.trim() && name.trim() !== user.name) {
        if (supabaseRepo.isSupabaseActive()) {
          user = await supabaseRepo.users.update(user.id, { name: name.trim() });
        } else {
          await run(`UPDATE users SET name = ? WHERE id = ?`, [name.trim(), user.id]);
          user = await get(`SELECT * FROM users WHERE id = ?`, [user.id]);
        }
      }
    } else {
      // ── NEW USER: register with hashed password ──────────────────────
      const hash         = await bcrypt.hash(password.trim(), SALT_ROUNDS);
      const userId       = isChemist ? 'user-chemist' : `user-${Date.now()}`;
      const customerName = (name && name.trim()) ? name.trim() : (isChemist ? 'Dr. Kirti Agrawal (Pharmacist)' : 'Customer');
      const email        = `${cleanPhone}@kirtipharma.com`;
      const role         = isChemist ? 'admin' : 'customer';
      const addresses    = [{ id: 'addr-1', tag: 'Home', text: 'Flat 302, Sai Shraddha Apts, Ring Road, Gondia - 441614', isDefault: true }];

      console.log(`[AUTH] Registering new ${role}: ${customerName} (${cleanPhone})`);

      if (supabaseRepo.isSupabaseActive()) {
        user = await supabaseRepo.users.create({
          id: userId, name: customerName, phone: cleanPhone, email, role,
          addresses, password_hash: hash
        });
      } else {
        await run(
          `INSERT INTO users (id, name, phone, email, role, addresses, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, customerName, cleanPhone, email, role, JSON.stringify(addresses), hash]
        );
        user = await get(`SELECT * FROM users WHERE id = ?`, [userId]);
      }
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userObj = {
      ...user,
      password_hash: undefined,   // never expose hash to client
      addresses: typeof user.addresses === 'string' ? JSON.parse(user.addresses || '[]') : (user.addresses || [])
    };

    console.log(`[AUTH] Login OK: ${user.name} (${user.phone}) — Role: ${user.role}`);
    res.json({ success: true, message: `Welcome, ${user.name}!`, token, user: userObj });

  } catch (err) {
    console.error('[AUTH ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/send-otp  — kept for backward compatibility (no-op)
router.post('/send-otp', (req, res) => {
  res.json({ success: true, message: 'OTP flow removed. Please use /api/auth/login with mobile + password.' });
});

// POST /api/auth/verify-otp — kept for backward compatibility (no-op)
router.post('/verify-otp', (req, res) => {
  res.status(410).json({ success: false, error: 'OTP verification is no longer supported. Please use mobile + password login.' });
});


// GET /api/auth/lookup - Check if customer/chemist is registered in DB
router.get('/lookup', async (req, res) => {
  try {
    const phone = req.query.phone;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone parameter is required' });
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let user = null;

    if (supabaseRepo.isSupabaseActive()) {
      user = await supabaseRepo.users.getByPhone(cleanPhone);
    } else {
      user = await get(`SELECT * FROM users WHERE phone LIKE ?`, [`%${cleanPhone}%`]);
    }

    if (user) {
      return res.json({
        success: true,
        exists: true,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          email: user.email
        }
      });
    }

    return res.json({
      success: true,
      exists: false,
      isChemist: cleanPhone === '9876540000'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/customers - Get list of registered customers (for chemist dashboard)
router.get('/customers', async (req, res) => {
  try {
    let customerList = [];
    if (supabaseRepo.isSupabaseActive()) {
      customerList = await supabaseRepo.users.list();
    } else {
      customerList = await query(`SELECT * FROM users ORDER BY created_at DESC`);
    }

    const customers = customerList.map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: (u.role && String(u.role).toLowerCase() === 'admin') ? 'admin' : 'customer',
      addresses: typeof u.addresses === 'string' ? JSON.parse(u.addresses || '[]') : (u.addresses || []),
      created_at: u.created_at
    }));

    res.json({
      success: true,
      data: customers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/users/:id/role - Update user role (tag as admin or customer in database)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, error: 'Role is required' });
    }

    const cleanRole = String(role).toLowerCase() === 'admin' ? 'admin' : 'customer';
    let updatedUser = null;

    if (supabaseRepo.isSupabaseActive()) {
      updatedUser = await supabaseRepo.users.update(id, { role: cleanRole });
    } else {
      await run(`UPDATE users SET role = ? WHERE id = ?`, [cleanRole, id]);
      updatedUser = await get(`SELECT * FROM users WHERE id = ?`, [id]);
    }

    console.log(`[AUTH] User #${id} role changed in database to: ${cleanRole}`);

    res.json({
      success: true,
      message: `User role successfully updated to ${cleanRole}`,
      data: updatedUser
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// GET /api/auth/me - Get logged-in user profile & stats
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let phone = req.query.phone;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        phone = decoded.phone;
      } catch (e) {}
    }

    if (!phone) {
      phone = '9876543210';
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let user = null;

    if (supabaseRepo.isSupabaseActive()) {
      user = await supabaseRepo.users.getByPhone(cleanPhone);
      if (!user) {
        const all = await supabaseRepo.users.getByPhone('9876543210');
        user = all;
      }
    } else {
      user = await get(`SELECT * FROM users WHERE phone LIKE ?`, [`%${cleanPhone}%`]);
      if (!user) user = await get(`SELECT * FROM users LIMIT 1`);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let ordersCount = 0;
    let activeOrdersCount = 0;
    let rxCount = 0;

    if (supabaseRepo.isSupabaseActive()) {
      const orders = await supabaseRepo.orders.list({ phone: cleanPhone });
      ordersCount = orders.length;
      activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    } else {
      const orders = await query(`SELECT * FROM orders WHERE phone LIKE ?`, [`%${cleanPhone}%`]);
      const prescriptions = await query(`SELECT * FROM prescriptions WHERE phone LIKE ?`, [`%${cleanPhone}%`]);
      ordersCount = orders.length;
      activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
      rxCount = prescriptions.length;
    }

    const userObj = {
      ...user,
      addresses: typeof user.addresses === 'string' ? JSON.parse(user.addresses || '[]') : user.addresses,
      stats: {
        totalOrders: ordersCount,
        activeOrders: activeOrdersCount,
        prescriptionsCount: rxCount
      }
    };

    res.json({
      success: true,
      data: userObj
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/addresses - Add or update customer address
router.post('/addresses', async (req, res) => {
  try {
    const { phone, address } = req.body;
    const cleanPhone = (phone || '9876543210').replace(/[^0-9]/g, '');

    let user = null;
    if (supabaseRepo.isSupabaseActive()) {
      user = await supabaseRepo.users.getByPhone(cleanPhone);
    } else {
      user = await get(`SELECT * FROM users WHERE phone LIKE ?`, [`%${cleanPhone}%`]);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let addresses = typeof user.addresses === 'string' ? JSON.parse(user.addresses || '[]') : (user.addresses || []);
    const newAddr = {
      id: `addr-${Date.now()}`,
      tag: address.tag || 'Home',
      text: address.text,
      isDefault: Boolean(address.isDefault)
    };

    if (newAddr.isDefault) {
      addresses.forEach(a => (a.isDefault = false));
    }

    addresses.push(newAddr);

    if (supabaseRepo.isSupabaseActive()) {
      await supabaseRepo.users.updateAddresses(user.id, addresses);
    } else {
      await run(`UPDATE users SET addresses = ? WHERE id = ?`, [JSON.stringify(addresses), user.id]);
    }

    res.json({
      success: true,
      message: 'Address added successfully',
      data: addresses
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

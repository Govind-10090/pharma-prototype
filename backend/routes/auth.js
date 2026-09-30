// ===== KIRTI PHARMA BACKEND — auth.js (Supabase Cloud + SQLite) =====
// Customer & Chemist Authentication, OTP Verification, and Profile Management

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query, get, run } = require('../db');
const supabaseRepo = require('../supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'kirti-pharma-super-secret-key-2026';

// In-memory OTP storage for simplicity & quick expiry
const activeOtps = new Map();

// POST /api/auth/send-otp - Request login OTP
router.post('/send-otp', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, error: 'Please provide a valid 10-digit mobile number' });
    }

    const cleanPhone = phone.trim();
    // Default development dummy OTP is 1234
    const otp = '1234';
    activeOtps.set(cleanPhone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    console.log(`[AUTH] OTP for ${cleanPhone}: ${otp}`);

    res.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}. (Demo code: 1234)`,
      demoOtp: '1234'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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

// POST /api/auth/verify-otp - Verify OTP and issue JWT
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanOtp = otp.toString().trim();

    const storedRecord = activeOtps.get(cleanPhone);
    const isValid = cleanOtp === '1234' || (storedRecord && storedRecord.otp === cleanOtp);

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid or expired OTP. Please use demo code 1234.' });
    }

    activeOtps.delete(cleanPhone);

    const isChemist = cleanPhone === '9876540000';
    let user = null;

    if (supabaseRepo.isSupabaseActive()) {
      user = await supabaseRepo.users.getByPhone(cleanPhone);
      if (!user) {
        // Customer registration in Supabase database
        const userId = isChemist ? 'user-chemist' : `user-${Date.now()}`;
        const customerName = (name && name.trim()) ? name.trim() : (isChemist ? 'Dr. Kirti Agrawal (Pharmacist)' : 'Customer');
        const email = `${cleanPhone}@kirtipharma.com`;
        const role = isChemist ? 'admin' : 'customer';
        const addresses = [
          { id: 'addr-1', tag: 'Home', text: 'Flat 302, Sai Shraddha Apts, Ring Road, Gondia - 441614', isDefault: true }
        ];

        console.log(`[AUTH] Creating new ${role} in Supabase: ${customerName} (${cleanPhone})`);
        user = await supabaseRepo.users.create({
          id: userId,
          name: customerName,
          phone: cleanPhone,
          email,
          role,
          addresses
        });
      } else {
        // User already exists in database; if user provided a specific non-empty name and it changed, update in Supabase
        if (name && name.trim() && name.trim() !== user.name) {
          user = await supabaseRepo.users.update(user.id, { name: name.trim() });
        }
      }
    } else {
      user = await get(`SELECT * FROM users WHERE phone = ?`, [cleanPhone]);
      if (!user) {
        const userId = isChemist ? 'user-chemist' : `user-${Date.now()}`;
        const customerName = (name && name.trim()) ? name.trim() : (isChemist ? 'Dr. Kirti Agrawal (Pharmacist)' : 'Customer');
        const email = `${cleanPhone}@kirtipharma.com`;
        const role = isChemist ? 'admin' : 'customer';
        const addresses = JSON.stringify([
          { id: 'addr-1', tag: 'Home', text: 'Flat 302, Sai Shraddha Apts, Ring Road, Gondia - 441614', isDefault: true }
        ]);

        await run(`
          INSERT INTO users (id, name, phone, email, role, addresses)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, customerName, cleanPhone, email, role, addresses]);

        user = await get(`SELECT * FROM users WHERE id = ?`, [userId]);
      } else if (name && name.trim() && name.trim() !== user.name) {
        await run(`UPDATE users SET name = ? WHERE id = ?`, [name.trim(), user.id]);
        user = await get(`SELECT * FROM users WHERE id = ?`, [user.id]);
      }
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userObj = {
      ...user,
      addresses: typeof user.addresses === 'string' ? JSON.parse(user.addresses || '[]') : user.addresses
    };

    console.log(`[AUTH] User logged in: ${user.name} (${user.phone}) - Role: ${user.role}`);

    res.json({
      success: true,
      message: `Welcome, ${user.name}!`,
      token,
      user: userObj
    });
  } catch (err) {
    console.error('[AUTH ERROR]:', err);
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

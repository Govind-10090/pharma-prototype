// ===== KIRTI PHARMA — SUPABASE DATA LAYER (supabase.js) =====
// Official Supabase Cloud PostgreSQL Database Client
// Tracks Live Medicine Inventory, Deducts Stock, Records Sales & Manages Orders in Cloud

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://fbbxjlvwejpqgkpngdam.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_SsDTP0Nb5QWiUBJd6nWCKQ_BJcDwgbc';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('[SUPABASE] ⚡ Connected to Live Supabase Cloud Database:', supabaseUrl);

// Category image mappings fallback
const CAT_IMAGES = {
  'Fever & Pain': 'images/med_fever_pain.png',
  'Antibiotics': 'images/med_antibiotics.png',
  'Gastro': 'images/med_gastro.png',
  'Chronic Care': 'images/med_chronic.png',
  'Vitamins & Supplements': 'images/med_vitamins.png',
  'Skincare': 'images/med_skincare.png',
  'Baby Care': 'images/med_baby_care.png',
  'ENT': 'images/med_ent.png',
  'Cardiac': 'images/med_chronic.png',
  'Diabetes': 'images/med_chronic.png'
};

function formatMedicine(m) {
  if (!m) return null;
  const cat = m.category || 'General';
  const defaultImg = CAT_IMAGES[cat] || 'images/med_fever_pain.png';
  return {
    ...m,
    packSize: m.packsize ?? m.packSize ?? 10,
    packUnit: m.packunit ?? m.packUnit ?? 'tablets',
    imageColor: m.imagecolor ?? m.imageColor ?? '#FEE2E2',
    image: (m.image && m.image.trim()) ? m.image : defaultImg,
    stock: Number(m.stock || 0),
    sold: Number(m.sold || 0),
    price: Number(m.price || 0),
    mrp: Number(m.mrp || 0),
    prescription_required: Boolean(m.prescription_required),
    chronic: Boolean(m.chronic)
  };
}

// ===== MEDICINES REPOSITORY =====
const medicines = {
  async list({ category, q, inStock, page, limit } = {}) {
    let query = supabase.from('medicines').select('*').order('id', { ascending: true });

    if (category && category !== 'All') {
      query = query.ilike('category', category);
    }

    if (inStock === 'true') {
      query = query.gt('stock', 0);
    }

    const { data, error } = await query;
    if (error) throw error;

    let results = (data || []).map(formatMedicine);
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      results = results.filter(m =>
        (m.name || '').toLowerCase().includes(term) ||
        (m.salt || '').toLowerCase().includes(term) ||
        (m.brand || '').toLowerCase().includes(term) ||
        (m.category || '').toLowerCase().includes(term)
      );
    }

    const total = results.length;
    if (page && limit) {
      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 20;
      const start = (p - 1) * l;
      return {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
        data: results.slice(start, start + l)
      };
    }

    return { total, data: results };
  },

  async getById(id) {
    const { data, error } = await supabase.from('medicines').select('*').eq('id', id).single();
    if (error || !data) return null;

    const formatted = formatMedicine(data);

    // Get alternatives
    let alternatives = [];
    if (formatted.salt) {
      const saltBase = formatted.salt.split('+')[0].trim();
      const { data: alts } = await supabase
        .from('medicines')
        .select('*')
        .neq('id', formatted.id)
        .gt('stock', 0)
        .ilike('salt', `%${saltBase}%`)
        .limit(4);
      alternatives = (alts || []).map(formatMedicine);
    }

    return { ...formatted, alternatives };
  },

  async add(medData) {
    const category = medData.category || 'General';
    const fallbackImage = CAT_IMAGES[category] || 'images/med_fever_pain.png';
    const imageToStore = (medData.image && String(medData.image).trim().length > 0)
      ? String(medData.image).trim()
      : fallbackImage;

    // PostgreSQL columns are strictly lowercase
    const row = {
      name: medData.name,
      salt: medData.salt || null,
      brand: medData.brand || 'Generic',
      category: category,
      price: parseFloat(medData.price) || 0,
      mrp: parseFloat(medData.mrp) || parseFloat(medData.price) || 0,
      stock: parseInt(medData.stock) || 0,
      sold: parseInt(medData.sold) || 0,
      packsize: parseInt(medData.packsize ?? medData.packSize) || 10,
      packunit: medData.packunit || medData.packUnit || 'tablets',
      prescription_required: Boolean(medData.prescription_required),
      chronic: Boolean(medData.chronic),
      imagecolor: medData.imagecolor || medData.imageColor || '#FEE2E2',
      icon: medData.icon || '💊',
      image: imageToStore
    };

    const { data, error } = await supabase.from('medicines').insert(row).select().single();
    if (error) throw error;
    return formatMedicine(data);
  },

  async update(id, updates) {
    const row = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.salt !== undefined) row.salt = updates.salt;
    if (updates.brand !== undefined) row.brand = updates.brand;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.price !== undefined) row.price = parseFloat(updates.price);
    if (updates.mrp !== undefined) row.mrp = parseFloat(updates.mrp);
    if (updates.stock !== undefined) row.stock = parseInt(updates.stock);
    if (updates.sold !== undefined) row.sold = parseInt(updates.sold);
    if (updates.packSize !== undefined || updates.packsize !== undefined) {
      row.packsize = parseInt(updates.packsize ?? updates.packSize);
    }
    if (updates.packUnit !== undefined || updates.packunit !== undefined) {
      row.packunit = updates.packunit ?? updates.packUnit;
    }
    if (updates.prescription_required !== undefined) {
      row.prescription_required = Boolean(updates.prescription_required);
    }
    if (updates.chronic !== undefined) row.chronic = Boolean(updates.chronic);
    if (updates.imageColor !== undefined || updates.imagecolor !== undefined) {
      row.imagecolor = updates.imagecolor ?? updates.imageColor;
    }
    if (updates.icon !== undefined) row.icon = updates.icon;
    if (updates.image !== undefined && String(updates.image).trim().length > 0) {
      row.image = String(updates.image).trim();
    }
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('medicines').update(row).eq('id', id).select().single();
    if (error) throw error;
    return formatMedicine(data);
  },

  async delete(id) {
    const { error } = await supabase.from('medicines').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Real-time stock decrement and sales increment in Supabase!
  async decrementStockAndIncrementSales(id, qty) {
    const { data: current, error: fetchErr } = await supabase
      .from('medicines')
      .select('id, stock, sold, name, price')
      .eq('id', id)
      .single();

    if (fetchErr || !current) return null;

    const currentStock = Number(current.stock) || 0;
    const currentSold = Number(current.sold) || 0;
    const deductQty = parseInt(qty) || 1;

    const newStock = Math.max(0, currentStock - deductQty);
    const newSold = currentSold + deductQty;

    const { data: updated, error: updateErr } = await supabase
      .from('medicines')
      .update({
        stock: newStock,
        sold: newSold,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    return updated;
  }
};

// ===== ORDERS REPOSITORY =====
const orders = {
  async list({ phone, status } = {}) {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (phone) {
      const clean = phone.replace(/[^0-9]/g, '');
      query = query.ilike('phone', `%${clean}%`);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.not('status', 'in', '("delivered","cancelled")');
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async create(orderData) {
    const { data, error } = await supabase.from('orders').insert(orderData).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, newStatus) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// ===== PRESCRIPTIONS REPOSITORY =====
const prescriptions = {
  async list() {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase.from('prescriptions').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async create(rxData) {
    const { data, error } = await supabase.from('prescriptions').insert(rxData).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, newStatus) {
    const { data, error } = await supabase
      .from('prescriptions')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async saveBill(id, bill, orderId) {
    const { data, error } = await supabase
      .from('prescriptions')
      .update({
        bill,
        orderId,
        status: 'Completed'
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// ===== USERS REPOSITORY =====
const users = {
  async getByPhone(phone) {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('phone', `%${clean}%`)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  async create(userData) {
    const { data, error } = await supabase.from('users').insert(userData).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async updateAddresses(id, addresses) {
    const { data, error } = await supabase
      .from('users')
      .update({ addresses })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async list() {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};

// ===== ANALYTICS & STATS =====
const stats = {
  async getAggregatedStats() {
    const { data: allMeds } = await supabase.from('medicines').select('id, name, brand, category, price, stock, sold');
    const { data: allOrders } = await supabase.from('orders').select('id, status, total');
    const { data: allRx } = await supabase.from('prescriptions').select('id, status');

    const medList = allMeds || [];
    const orderList = allOrders || [];
    const rxList = allRx || [];

    const totalProducts = medList.length;
    const totalStockUnits = medList.reduce((sum, m) => sum + (Number(m.stock) || 0), 0);
    const totalSoldUnits = medList.reduce((sum, m) => sum + (Number(m.sold) || 0), 0);
    const outOfStockCount = medList.filter(m => Number(m.stock) === 0).length;
    const lowStockCount = medList.filter(m => Number(m.stock) > 0 && Number(m.stock) <= 15).length;

    const totalOrders = orderList.length;
    const activeOrders = orderList.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    const deliveredOrders = orderList.filter(o => o.status === 'delivered').length;
    const todayRevenue = orderList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const pendingRx = rxList.filter(r => r.status === 'Pending').length;
    const inReviewRx = rxList.filter(r => r.status === 'In Review').length;
    const completedRx = rxList.filter(r => r.status === 'Completed').length;

    const topSelling = [...medList]
      .sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0))
      .slice(0, 5)
      .map(m => ({
        id: m.id,
        name: m.name,
        brand: m.brand,
        category: m.category,
        price: m.price,
        stock: m.stock,
        sold: m.sold,
        salesRevenue: (Number(m.sold) || 0) * (Number(m.price) || 0)
      }));

    return {
      inventory: {
        totalProducts,
        totalStockUnits,
        totalSoldUnits,
        lowStockCount,
        outOfStockCount
      },
      orders: {
        total: totalOrders,
        active: activeOrders,
        delivered: deliveredOrders,
        todayRevenue
      },
      prescriptions: {
        total: rxList.length,
        pending: pendingRx,
        inReview: inReviewRx,
        completed: completedRx
      },
      topSelling
    };
  }
};

module.exports = {
  supabase,
  medicines,
  orders,
  prescriptions,
  users,
  stats,
  isSupabaseActive: () => true
};

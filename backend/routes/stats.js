// ===== KIRTI PHARMA BACKEND — stats.js (Supabase Cloud + SQLite) =====
// Real-time Inventory Health, Total Sales, Units Sold, and Revenue Analytics

const express = require('express');
const router = express.Router();
const { query, get } = require('../db');
const supabaseRepo = require('../supabase');

router.get('/', async (req, res) => {
  try {
    if (supabaseRepo.isSupabaseActive()) {
      const liveStats = await supabaseRepo.stats.getAggregatedStats();
      return res.json({
        success: true,
        data: liveStats
      });
    }

    const medAgg = await get(`
      SELECT 
        COUNT(*) as totalProducts,
        SUM(stock) as totalStockUnits,
        SUM(sold) as totalSoldUnits,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as outOfStockCount,
        SUM(CASE WHEN stock > 0 AND stock <= 15 THEN 1 ELSE 0 END) as lowStockCount
      FROM medicines
    `);

    const orderAgg = await get(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status NOT IN ('delivered', 'cancelled') THEN 1 ELSE 0 END) as activeOrders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as deliveredOrders,
        SUM(total) as totalRevenue
      FROM orders
    `);

    const rxAgg = await get(`
      SELECT 
        COUNT(*) as totalRx,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingRx,
        SUM(CASE WHEN status = 'In Review' THEN 1 ELSE 0 END) as inReviewRx,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedRx
      FROM prescriptions
    `);

    const topSelling = await query(`
      SELECT id, name, brand, category, price, stock, sold, (sold * price) as salesRevenue
      FROM medicines
      ORDER BY sold DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        inventory: {
          totalProducts: Number(medAgg.totalProducts || 0),
          totalStockUnits: Number(medAgg.totalStockUnits || 0),
          totalSoldUnits: Number(medAgg.totalSoldUnits || 0),
          lowStockCount: Number(medAgg.lowStockCount || 0),
          outOfStockCount: Number(medAgg.outOfStockCount || 0)
        },
        orders: {
          total: Number(orderAgg.totalOrders || 0),
          active: Number(orderAgg.activeOrders || 0),
          delivered: Number(orderAgg.deliveredOrders || 0),
          todayRevenue: Number(orderAgg.totalRevenue || 0)
        },
        prescriptions: {
          total: Number(rxAgg.totalRx || 0),
          pending: Number(rxAgg.pendingRx || 0),
          inReview: Number(rxAgg.inReviewRx || 0),
          completed: Number(rxAgg.completedRx || 0)
        },
        topSelling
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

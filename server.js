// ===== KIRTI PHARMA — FULL STACK SERVER =====
// Express.js Backend + REST API + SSE Real-Time Events + Static Assets Serving
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { registerSseClient } = require('./backend/events');
const medicinesRoute = require('./backend/routes/medicines');
const ordersRoute = require('./backend/routes/orders');
const prescriptionsRoute = require('./backend/routes/prescriptions');
const authRoute = require('./backend/routes/auth');
const statsRoute = require('./backend/routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors());

// Parse JSON and URL-encoded request bodies with generous limits for images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/css') && !req.path.startsWith('/images') && !req.path.startsWith('/js')) {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Real-time Server-Sent Events (SSE) stream
app.get('/api/events', registerSseClient);

// REST API Endpoints
app.use('/api/medicines', medicinesRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/prescriptions', prescriptionsRoute);
app.use('/api/auth', authRoute);
app.use('/api/stats', statsRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Kirti Pharma Backend API v1.0.0'
  });
});

// Interactive API Playground / Documentation
app.get('/api', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kirti Pharma — Backend API Explorer</title>
      <link rel="stylesheet" href="/css/style.css">
      <link rel="stylesheet" href="/css/components.css">
      <style>
        body { background: #F8FAFC; color: #1E293B; font-family: system-ui, -apple-system, sans-serif; padding: 32px 16px; margin: 0; }
        .api-container { max-width: 900px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 32px; border: 1px solid #E2E8F0; }
        .api-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; margin-right: 8px; }
        .get { background: #DCFCE7; color: #166534; }
        .post { background: #DBEAFE; color: #1E40AF; }
        .put { background: #FEF3C7; color: #92400E; }
        .delete { background: #FEE2E2; color: #991B1B; }
        .endpoint-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid #E2E8F0; border-radius: 10px; margin-bottom: 8px; transition: all 0.2s; }
        .endpoint-row:hover { background: #F8FAFC; transform: translateY(-1px); }
        .endpoint-url { font-family: monospace; font-size: 14px; font-weight: 600; }
        .endpoint-desc { font-size: 13px; color: #64748B; }
        .btn-test { padding: 6px 14px; font-size: 13px; font-weight: 600; border-radius: 6px; border: 1px solid #CBD5E1; background: white; cursor: pointer; text-decoration: none; color: #0F172A; }
        .btn-test:hover { background: #006642; color: white; border-color: #006642; }
      </style>
    </head>
    <body>
      <div class="api-container">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
          <div style="font-size:32px">💊</div>
          <div>
            <h1 style="margin:0;font-size:24px;color:#006642">Kirti Pharma Backend API</h1>
            <p style="margin:4px 0 0 0;color:#64748B;font-size:14px">Active REST API & Live SSE Events Server</p>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap">
          <a href="/" class="btn-test">🏠 Storefront</a>
          <a href="/dashboard.html" class="btn-test">🧑‍⚕️ Chemist Dashboard</a>
          <a href="/cart.html" class="btn-test">🛒 Cart</a>
          <a href="/track.html" class="btn-test">📦 Track Orders</a>
        </div>

        <h3 style="margin:24px 0 12px;font-size:16px">Medicines & Catalog</h3>
        <div class="endpoint-row">
          <div><span class="api-badge get">GET</span> <span class="endpoint-url">/api/medicines</span> <span class="endpoint-desc">— All 58 products, search, category</span></div>
          <a href="/api/medicines" target="_blank" class="btn-test">Open JSON ↗</a>
        </div>
        <div class="endpoint-row">
          <div><span class="api-badge get">GET</span> <span class="endpoint-url">/api/medicines/meta/categories</span> <span class="endpoint-desc">— Categories summary</span></div>
          <a href="/api/medicines/meta/categories" target="_blank" class="btn-test">Open JSON ↗</a>
        </div>
        <div class="endpoint-row">
          <div><span class="api-badge post">POST</span> <span class="endpoint-url">/api/medicines</span> <span class="endpoint-desc">— Add medicine with photo upload</span></div>
          <span style="font-size:12px;color:#94A3B8">Multipart form</span>
        </div>

        <h3 style="margin:24px 0 12px;font-size:16px">Orders & Checkout</h3>
        <div class="endpoint-row">
          <div><span class="api-badge get">GET</span> <span class="endpoint-url">/api/orders</span> <span class="endpoint-desc">— List all customer orders</span></div>
          <a href="/api/orders" target="_blank" class="btn-test">Open JSON ↗</a>
        </div>
        <div class="endpoint-row">
          <div><span class="api-badge get">GET</span> <span class="endpoint-url">/api/orders/KP-2847</span> <span class="endpoint-desc">— Single order tracking breakdown</span></div>
          <a href="/api/orders/KP-2847" target="_blank" class="btn-test">Open JSON ↗</a>
        </div>
        <div class="endpoint-row">
          <div><span class="api-badge post">POST</span> <span class="endpoint-url">/api/orders</span> <span class="endpoint-desc">— Create order & decrement stock</span></div>
          <span style="font-size:12px;color:#94A3B8">JSON Body</span>
        </div>

        <h3 style="margin:24px 0 12px;font-size:16px">Prescriptions</h3>
        <div class="endpoint-row">
          <div><span class="api-badge get">GET</span> <span class="endpoint-url">/api/prescriptions</span> <span class="endpoint-desc">— Chemist review queue</span></div>
          <a href="/api/prescriptions" target="_blank" class="btn-test">Open JSON ↗</a>
        </div>
        <div class="endpoint-row">
          <div><span class="api-badge post">POST</span> <span class="endpoint-url">/api/prescriptions</span> <span class="endpoint-desc">— Upload prescription (image/PDF)</span></div>
          <span style="font-size:12px;color:#94A3B8">File upload</span>
        </div>

        <h3 style="margin:24px 0 12px;font-size:16px">Authentication & Analytics</h3>
        <div class="endpoint-row">
          <div><span class="api-badge get">GET</span> <span class="endpoint-url">/api/stats</span> <span class="endpoint-desc">— Chemist operational analytics</span></div>
          <a href="/api/stats" target="_blank" class="btn-test">Open JSON ↗</a>
        </div>
        <div class="endpoint-row">
          <div><span class="api-badge get">GET</span> <span class="endpoint-url">/api/health</span> <span class="endpoint-desc">— Healthcheck & uptime</span></div>
          <a href="/api/health" target="_blank" class="btn-test">Health Check ↗</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Serve uploaded user files (prescriptions and custom medicine images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static assets (CSS, JS, Images, HTML files)
app.use(express.static(path.join(__dirname)));

// Fallback for HTML routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API route not found' });
  }
  const potentialFile = path.join(__dirname, req.path.endsWith('.html') ? req.path : `${req.path}.html`);
  if (fs.existsSync(potentialFile) && fs.statSync(potentialFile).isFile()) {
    return res.sendFile(potentialFile);
  }
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Kirti Pharma Full-Stack Server Running!`);
  console.log(`🌐 Local Web App:     http://localhost:${PORT}`);
  console.log(`🧑‍⚕️ Chemist Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`📦 Order Tracking:    http://localhost:${PORT}/track.html`);
  console.log(`🔌 REST API Explorer: http://localhost:${PORT}/api`);
  console.log(`======================================================\n`);
});

module.exports = app;

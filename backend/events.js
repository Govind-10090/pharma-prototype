// ===== KIRTI PHARMA BACKEND — events.js =====
// Real-time Server-Sent Events (SSE) notification manager

const EventEmitter = require('events');
const eventBus = new EventEmitter();

let sseClients = [];

function registerSseClient(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Heartbeat to keep connection alive every 25 seconds
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeatInterval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
}

function broadcastEvent(type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${message}\n\n`);
    } catch (err) {
      // dead client
    }
  });
}

module.exports = {
  eventBus,
  registerSseClient,
  broadcastEvent
};

// Minimal relay server: serves static controller UI and relays WS messages to connected overlays
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Broadcast helper
function broadcast(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

wss.on('connection', (ws) => {
  console.log('WS client connected');
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      // Expect controller to send { action:'alert', payload:{...}, duration:ms }
      if (msg && msg.action === 'alert') {
        broadcast(msg);
      }
    } catch (e) {
      console.warn('Invalid WS message', e);
    }
  });
  ws.on('close', () => console.log('WS client disconnected'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

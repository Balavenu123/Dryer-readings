// Reload trigger
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { 
  updateTelemetry, 
  getTelemetry, 
  getAlarms, 
  acknowledgeAlarm, 
  acknowledgeAllAlarms,
  toggleDryerStatus,
  updateTelemetryFromBridge
} from './services/simulator.js';

import { 
  connectOpcUa, 
  getOpcConnectionStatus, 
  testConnection,
  pollAllTags 
} from './opcua/client.js';

import authRouter, { requireAuth } from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsPath = path.join(__dirname, './config/settings.json');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Auth routes (public login + protected user management)
app.use('/api/auth', authRouter);

// All routes below require a valid JWT
app.use('/api', requireAuth);

// Load settings helper
function readSettings() {
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return {
      opcServerIp: "192.168.1.105",
      opcServerPort: 49320,
      opcUaEndpoint: "opc.tcp://alpha12-server:4840",
      refreshInterval: 5,
      limits: {
        temp: { critical: 160.0, warning: 150.0 },
        pressure: { critical: 3.5, warning: 3.0 }
      }
    };
  }
}

// Write settings helper
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// API Routes
app.get('/api/dryers', (req, res) => {
  res.json(getTelemetry());
});

app.get('/api/dryers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data = getTelemetry().find(d => d.dryerId === id);
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: "Dryer not found" });
  }
});

app.post('/api/dryers/:id/toggle', (req, res) => {
  const id = parseInt(req.params.id);
  const updated = toggleDryerStatus(id);
  const dryer = updated.find(d => d.dryerId === id);
  if (dryer) {
    io.emit('sensorUpdate', dryer);
  }
  res.json({ success: true, telemetry: updated });
});

app.get('/api/alarms', (req, res) => {
  res.json(getAlarms());
});

app.post('/api/alarms/:id/acknowledge', (req, res) => {
  const alarms = acknowledgeAlarm(req.params.id);
  io.emit('alarmsUpdate', alarms);
  res.json({ success: true, alarms });
});

app.post('/api/alarms/acknowledge-all', (req, res) => {
  const alarms = acknowledgeAllAlarms();
  io.emit('alarmsUpdate', alarms);
  res.json({ success: true, alarms });
});

app.get('/api/settings', (req, res) => {
  const settings = readSettings();
  const connStatus = getOpcConnectionStatus();
  res.json({ ...settings, opcStatus: connStatus });
});

app.post('/api/settings', async (req, res) => {
  const oldSettings = readSettings();
  const newSettings = req.body;
  
  const merged = { ...oldSettings, ...newSettings };
  saveSettings(merged);
  
  if (oldSettings.opcUaEndpoint !== merged.opcUaEndpoint) {
    console.log("[Server] OPC UA endpoint changed. Reconnecting...");
    connectOpcUa().catch(console.error);
  }
  
  resetStreamInterval(merged.refreshInterval);
  res.json({ success: true, settings: merged });
});

app.post('/api/settings/test-link', async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: "Endpoint required" });
  }
  const result = await testConnection(endpoint);
  res.json(result);
});

// Telemetry Streaming Interval Setup
let streamIntervalId = null;

function resetStreamInterval(intervalSeconds) {
  if (streamIntervalId) {
    clearInterval(streamIntervalId);
  }
  
  const ms = intervalSeconds * 1000;
  console.log(`[Server] Setting telemetry streaming interval to ${intervalSeconds}s (${ms}ms)`);
  
  streamIntervalId = setInterval(async () => {
    const status = getOpcConnectionStatus();
    
    if (status.usingSimulator) {
      updateTelemetry();
    } else {
      // Poll live values from KEPServer
      await pollAllTags();
    }
    
    const telemetry = getTelemetry();
    const alarms = getAlarms();
    
    telemetry.forEach(dryer => {
      io.emit('sensorUpdate', dryer);
    });
    io.emit('alarmsUpdate', alarms);
    io.emit('statusUpdate', {
      time: new Date().toISOString(),
      plcOnline: !status.usingSimulator,
      opcStatus: status.status,
      usingSimulator: status.usingSimulator
    });
  }, ms);
}

// Socket Connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  
  socket.emit('initialData', {
    telemetry: getTelemetry(),
    alarms: getAlarms(),
    settings: readSettings(),
    opcStatus: getOpcConnectionStatus()
  });
  
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// ── Bridge Push Endpoint (Site PC → Railway) ────────────────────────────────
// The site PC bridge script calls this every 5s with live KEPServer data.
// Protected by a shared secret key (set BRIDGE_SECRET env var on Railway).
app.post('/api/bridge/push', (req, res) => {
  const secret = req.headers['x-bridge-secret'];
  const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'dryer-bridge-secret-2024';
  if (secret !== BRIDGE_SECRET) {
    return res.status(401).json({ error: 'Invalid bridge secret' });
  }
  const { dryers: bridgeDryers } = req.body;
  if (!Array.isArray(bridgeDryers)) {
    return res.status(400).json({ error: 'Expected { dryers: [...] }' });
  }
  const telemetry = updateTelemetryFromBridge(bridgeDryers);
  const alarms = getAlarms();
  telemetry.forEach(dryer => io.emit('sensorUpdate', dryer));
  io.emit('alarmsUpdate', alarms);
  io.emit('statusUpdate', {
    time: new Date().toISOString(),
    plcOnline: true,
    opcStatus: 'Connected via Bridge',
    usingSimulator: false
  });
  res.json({ success: true, updated: bridgeDryers.length });
});

// Serve frontend static files
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

// Startup
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  console.log(`[Server] Industrial SCADA backend listening on port ${PORT}`);
  
  const settings = readSettings();
  resetStreamInterval(settings.refreshInterval);
  
  try {
    await connectOpcUa();
  } catch (err) {
    console.error("[Server] OPC UA connection failed on startup:", err.message);
  }
});

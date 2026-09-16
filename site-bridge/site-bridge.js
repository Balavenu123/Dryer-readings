// ─────────────────────────────────────────────────────────────────────────────
// PSPL Eluru Dryer - Site Bridge Script
// Runs on the SITE PC. Reads live data from KEPServer via OPC UA every 5s
// and pushes it to the Railway cloud server.
//
// Setup:
//   1. Edit the CONFIG section below
//   2. Run: npm install
//   3. Run: node site-bridge.js  (or double-click start-bridge.bat)
// ─────────────────────────────────────────────────────────────────────────────

import { OPCUAClient, AttributeIds } from 'node-opcua';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const CONFIG = {
  // Your Railway app URL (no trailing slash)
  RAILWAY_URL: 'https://dryer-readings-production.up.railway.app',

  // Must match the BRIDGE_SECRET env var set on Railway
  BRIDGE_SECRET: 'dryer-bridge-secret-2024',

  // KEPServer OPC UA endpoint on this site PC
  OPC_ENDPOINT: 'opc.tcp://127.0.0.1:49370',

  // How often to push data (milliseconds)
  PUSH_INTERVAL_MS: 5000,
};
// ─────────────────────────────────────────────────────────────────────────────

const channelsMap = {
  1: 'PSPL ELURU DRYER 11',
  2: 'PSPL ELURU DRYER 12',
  3: 'PSPL ELURU DRYER 13',
};

const tagDefinitions = {
  binStatus: {
    completedBins:       'BIN STATUS.COMPLETED BINS',
    downAirUnderProcess: 'BIN STATUS.DOWN AIR IS UNDER PROCESS',
    emptyBins:           'BIN STATUS.EMPTY BINS',
    intakeUnderProcess:  'BIN STATUS.INTAKE IS UNDER PROCESS',
    totalBins:           'BIN STATUS.TOTAL BINS',
    upAirUnderProcess:   'BIN STATUS.UP AIR IS UNDER PROCESS',
  },
  tempRh: {
    boilerHeaderTemp:          'TEMPARATURE &  RH.BOILER HEADER TEMPERATURE',
    boilerHeaderTopStartTemp:  'TEMPARATURE &  RH.BOILER HEADER TEMPERATURE - TOP TUNNEL START TEMPERATURE',
    bottomTunnelPressure:      'TEMPARATURE &  RH.BOTTOM  TUNNEL PRESSURE',
    bottomTunnelEndHumidity:   'TEMPARATURE &  RH.BOTTOM TUNNEL END HUMIDITY',
    bottomTunnelEndTemp:       'TEMPARATURE &  RH.BOTTOM TUNNEL END TEMPERATUE',
    bottomTunnelMidHumidity:   'TEMPARATURE &  RH.BOTTOM TUNNEL MID HUMIDITY',
    bottomTunnelMidTemp:       'TEMPARATURE &  RH.BOTTOM TUNNEL MID TEMPERATUE',
    bottomTunnelStartHumidity: 'TEMPARATURE &  RH.BOTTOM TUNNEL START HUMIDITY',
    bottomTunnelStartTemp:     'TEMPARATURE &  RH.BOTTOM TUNNEL START TEMPERATUE',
    topTunnelEndHumidity:      'TEMPARATURE &  RH.TOP TUNNEL END HUMIDITY',
    topTunnelEndTemp:          'TEMPARATURE &  RH.TOP TUNNEL END TEMPERATUE',
    topTunnelMidHumidity:      'TEMPARATURE &  RH.TOP TUNNEL MID HUMIDITY',
    topTunnelMidTemp:          'TEMPARATURE &  RH.TOP TUNNEL MID TEMPERATUE',
    topTunnelPressure:         'TEMPARATURE &  RH.TOP TUNNEL PRESSURE',
    topTunnelStartHumidity:    'TEMPARATURE &  RH.TOP TUNNEL START HUMIDITY',
    topTunnelStartTemp:        'TEMPARATURE &  RH.TOP TUNNEL START TEMPERATUE',
  },
};

let client = null;
let session = null;

async function connect() {
  console.log(`[Bridge] Connecting to KEPServer: ${CONFIG.OPC_ENDPOINT}`);
  client = OPCUAClient.create({
    endpointMustExist: false,
    connectionStrategy: { maxRetry: 3, initialDelay: 1000, maxDelay: 5000 },
  });
  await client.connect(CONFIG.OPC_ENDPOINT);
  session = await client.createSession();
  console.log('[Bridge] Connected to KEPServer ✓');
}

async function readAllTags() {
  const dryers = [];

  for (const [dryerIdStr, channelName] of Object.entries(channelsMap)) {
    const dryerId = parseInt(dryerIdStr);
    const dryer = { dryerId, binStatus: {}, tempRh: {} };

    for (const [groupKey, tags] of Object.entries(tagDefinitions)) {
      for (const [fieldKey, tagPath] of Object.entries(tags)) {
        const nodeId = `ns=2;s=${channelName}.${tagPath}`;
        try {
          const result = await session.read({ nodeId, attributeId: AttributeIds.Value });
          if (
            result.statusCode.toString().includes('Good') &&
            result.value &&
            result.value.value !== undefined
          ) {
            const val = result.value.value;
            dryer[groupKey][fieldKey] =
              typeof val === 'number'
                ? groupKey === 'binStatus'
                  ? Math.round(val)
                  : parseFloat(val.toFixed(2))
                : val;

            // Top-level summary fields for dashboard cards
            if (fieldKey === 'topTunnelMidTemp')      dryer.topTemp      = parseFloat(val.toFixed(1));
            if (fieldKey === 'bottomTunnelMidTemp')    dryer.bottomTemp   = parseFloat(val.toFixed(1));
            if (fieldKey === 'topTunnelPressure')      dryer.topPressure  = parseFloat(val.toFixed(2));
            if (fieldKey === 'bottomTunnelPressure')   dryer.bottomPressure = parseFloat(val.toFixed(2));
          }
        } catch (err) {
          // Skip individual tag errors silently
        }
      }
    }

    dryer.status = (dryer.topTemp && dryer.topTemp > 40) ? 'Running' : 'Stopped';
    dryers.push(dryer);
  }

  return dryers;
}

async function pushToRailway(dryers) {
  const url = `${CONFIG.RAILWAY_URL}/api/bridge/push`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bridge-secret': CONFIG.BRIDGE_SECRET,
    },
    body: JSON.stringify({ dryers }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Railway responded ${response.status}: ${text}`);
  }

  const json = await response.json();
  return json;
}

async function runLoop() {
  while (true) {
    try {
      if (!session) await connect();

      const dryers = await readAllTags();
      const result = await pushToRailway(dryers);
      console.log(`[Bridge] ${new Date().toLocaleTimeString()} — Pushed ${result.updated} dryers to Railway ✓`);
    } catch (err) {
      console.error(`[Bridge] Error: ${err.message}`);
      // On connection error, reset and retry
      try {
        if (session) { await session.close(); session = null; }
        if (client)  { await client.disconnect(); client = null; }
      } catch (_) {}
      console.log('[Bridge] Reconnecting in 10 seconds...');
      await new Promise(r => setTimeout(r, 10000));
      continue;
    }

    await new Promise(r => setTimeout(r, CONFIG.PUSH_INTERVAL_MS));
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  PSPL Eluru Dryer — Site Bridge Script');
console.log('  KEPServer → Railway Cloud');
console.log('═══════════════════════════════════════════════════════');
console.log(`  OPC Endpoint : ${CONFIG.OPC_ENDPOINT}`);
console.log(`  Railway URL  : ${CONFIG.RAILWAY_URL}`);
console.log(`  Push Interval: ${CONFIG.PUSH_INTERVAL_MS / 1000}s`);
console.log('═══════════════════════════════════════════════════════\n');

runLoop().catch(console.error);

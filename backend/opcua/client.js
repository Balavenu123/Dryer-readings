import { OPCUAClient, AttributeIds, ClientSubscription, TimestampsToReturn } from "node-opcua";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTelemetry } from '../services/simulator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsPath = path.join(__dirname, '../config/settings.json');

let client = null;
let session = null;
let subscription = null;
let connectionStatus = "Disconnected";
let usingSimulator = true;

// Map tags to nodeIds. Matches KEPServerEX channels: PSPL ELURU DRYER 11, 12, 13
const channelsMap = {
  1: "PSPL ELURU DRYER 11",
  2: "PSPL ELURU DRYER 12",
  3: "PSPL ELURU DRYER 13"
};

const tagDefinitions = {
  binStatus: {
    completedBins: "BIN STATUS.COMPLETED BINS",
    downAirUnderProcess: "BIN STATUS.DOWN AIR IS UNDER PROCESS",
    emptyBins: "BIN STATUS.EMPTY BINS",
    intakeUnderProcess: "BIN STATUS.INTAKE IS UNDER PROCESS",
    totalBins: "BIN STATUS.TOTAL BINS",
    upAirUnderProcess: "BIN STATUS.UP AIR IS UNDER PROCESS"
  },
  tempRh: {
    boilerHeaderTemp: "TEMPARATURE &  RH.BOILER HEADER TEMPERATURE",
    boilerHeaderTopStartTemp: "TEMPARATURE &  RH.BOILER HEADER TEMPERATURE - TOP TUNNEL START TEMPERATURE",
    bottomTunnelPressure: "TEMPARATURE &  RH.BOTTOM  TUNNEL PRESSURE",
    bottomTunnelEndHumidity: "TEMPARATURE &  RH.BOTTOM TUNNEL END HUMIDITY",
    bottomTunnelEndTemp: "TEMPARATURE &  RH.BOTTOM TUNNEL END TEMPERATUE",
    bottomTunnelMidHumidity: "TEMPARATURE &  RH.BOTTOM TUNNEL MID HUMIDITY",
    bottomTunnelMidTemp: "TEMPARATURE &  RH.BOTTOM TUNNEL MID TEMPERATUE",
    bottomTunnelStartHumidity: "TEMPARATURE &  RH.BOTTOM TUNNEL START HUMIDITY",
    bottomTunnelStartTemp: "TEMPARATURE &  RH.BOTTOM TUNNEL START TEMPERATUE",
    topTunnelEndHumidity: "TEMPARATURE &  RH.TOP TUNNEL END HUMIDITY",
    topTunnelEndTemp: "TEMPARATURE &  RH.TOP TUNNEL END TEMPERATUE",
    topTunnelMidHumidity: "TEMPARATURE &  RH.TOP TUNNEL MID HUMIDITY",
    topTunnelMidTemp: "TEMPARATURE &  RH.TOP TUNNEL MID TEMPERATUE",
    topTunnelPressure: "TEMPARATURE &  RH.TOP TUNNEL PRESSURE",
    topTunnelStartHumidity: "TEMPARATURE &  RH.TOP TUNNEL START HUMIDITY",
    topTunnelStartTemp: "TEMPARATURE &  RH.TOP TUNNEL START TEMPERATUE"
  }
};

function getEndpointUrl() {
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(raw);
    return settings.opcUaEndpoint;
  } catch (error) {
    return "opc.tcp://alpha12-server:4840";
  }
}

export async function connectOpcUa() {
  const endpointUrl = getEndpointUrl();
  console.log(`[OPC UA] Attempting connection to: ${endpointUrl}`);
  
  connectionStatus = "Connecting";
  usingSimulator = true;
  
  try {
    client = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: {
        maxRetry: 1,
        initialDelay: 500,
        maxDelay: 1000
      }
    });

    await client.connect(endpointUrl);
    console.log("[OPC UA] Connected to server.");
    
    session = await client.createSession();
    console.log("[OPC UA] Session created.");
    
    connectionStatus = "Connected";
    usingSimulator = false;

    // Create subscription to monitor tags in real time
    subscription = ClientSubscription.create(session, {
      requestedPublishingInterval: 1000,
      requestedLifetimeCount: 100,
      requestedMaxKeepAliveCount: 10,
      maxNotificationsPerPublish: 100,
      publishingEnabled: true,
      priority: 10
    });

    subscription.on("started", () => {
      console.log("[OPC UA] Subscription active.");
    });

    // Monitor tags for each dryer channel & device
    for (const [dryerIdStr, channelName] of Object.entries(channelsMap)) {
      const dryerId = parseInt(dryerIdStr);
      
      for (const [groupKey, tags] of Object.entries(tagDefinitions)) {
        for (const [fieldKey, tagPath] of Object.entries(tags)) {
          const nodeId = `ns=2;s=${channelName}.${tagPath}`;
          try {
            const itemToMonitor = {
              nodeId: nodeId,
              attributeId: AttributeIds.Value
            };
            const parameters = {
              samplingInterval: 1000,
              discardOldest: true,
              queueSize: 10
            };
            
            const monitoredItem = await subscription.monitor(itemToMonitor, parameters, TimestampsToReturn.Both);
            
            monitoredItem.on("changed", (dataValue) => {
              if (dataValue.value && dataValue.value.value !== undefined) {
                const val = dataValue.value.value;
                const telemetry = getTelemetry();
                const dryer = telemetry.find(d => d.dryerId === dryerId);
                if (dryer) {
                  if (groupKey === 'binStatus') {
                    if (!dryer.binStatus) dryer.binStatus = {};
                    dryer.binStatus[fieldKey] = typeof val === 'number' ? Math.round(val) : val;
                  } else if (groupKey === 'tempRh') {
                    if (!dryer.tempRh) dryer.tempRh = {};
                    dryer.tempRh[fieldKey] = typeof val === 'number' ? parseFloat(val.toFixed(2)) : val;
                    
                    // Maintain backward compatibility for top level summary metrics
                    if (fieldKey === 'topTunnelMidTemp') dryer.topTemp = parseFloat(val.toFixed(1));
                    if (fieldKey === 'bottomTunnelMidTemp') dryer.bottomTemp = parseFloat(val.toFixed(1));
                    if (fieldKey === 'topTunnelPressure') dryer.topPressure = parseFloat(val.toFixed(2));
                    if (fieldKey === 'bottomTunnelPressure') dryer.bottomPressure = parseFloat(val.toFixed(2));
                  }
                  dryer.timestamp = new Date().toISOString();
                  dryer.status = "Running";
                }
              }
            });
          } catch (err) {
            console.error(`[OPC UA] Error subscribing to ${nodeId}:`, err.message);
          }
        }
      }
    }
    // Do an initial bulk read of ALL tags to replace stale simulator values
    console.log("[OPC UA] Performing initial bulk read of all tags...");
    const telemetry = getTelemetry();
    for (const [dryerIdStr, channelName] of Object.entries(channelsMap)) {
      const dryerId = parseInt(dryerIdStr);
      const dryer = telemetry.find(d => d.dryerId === dryerId);
      if (!dryer) continue;

      for (const [groupKey, tags] of Object.entries(tagDefinitions)) {
        for (const [fieldKey, tagPath] of Object.entries(tags)) {
          const nodeId = `ns=2;s=${channelName}.${tagPath}`;
          try {
            const result = await session.read({ nodeId, attributeId: AttributeIds.Value });
            if (result.statusCode.toString().includes('Good') && result.value && result.value.value !== undefined) {
              const val = result.value.value;
              if (groupKey === 'binStatus') {
                if (!dryer.binStatus) dryer.binStatus = {};
                dryer.binStatus[fieldKey] = typeof val === 'number' ? Math.round(val) : val;
              } else if (groupKey === 'tempRh') {
                if (!dryer.tempRh) dryer.tempRh = {};
                dryer.tempRh[fieldKey] = typeof val === 'number' ? parseFloat(val.toFixed(2)) : val;

                if (fieldKey === 'topTunnelMidTemp') dryer.topTemp = parseFloat(val.toFixed(1));
                if (fieldKey === 'bottomTunnelMidTemp') dryer.bottomTemp = parseFloat(val.toFixed(1));
                if (fieldKey === 'topTunnelPressure') dryer.topPressure = parseFloat(val.toFixed(2));
                if (fieldKey === 'bottomTunnelPressure') dryer.bottomPressure = parseFloat(val.toFixed(2));
              }
              dryer.timestamp = new Date().toISOString();
            }
          } catch (readErr) {
            console.error(`[OPC UA] Initial read error for ${nodeId}: ${readErr.message}`);
          }
        }
      }
    }
    console.log("[OPC UA] Initial bulk read complete. All dryers seeded with live KEPServer values.");
    
  } catch (error) {
    console.warn(`[OPC UA] Connection failed: ${error.message}. Falling back to telemetry simulator.`);
    connectionStatus = "Disconnected";
    usingSimulator = true;
    cleanup();
  }
}

async function cleanup() {
  try {
    if (subscription) {
      await subscription.terminate();
      subscription = null;
    }
    if (session) {
      await session.close();
      session = null;
    }
    if (client) {
      await client.disconnect();
      client = null;
    }
  } catch (e) {
    console.error("[OPC UA] Error during cleanup:", e.message);
  }
}

export async function pollAllTags() {
  if (!session || usingSimulator) return;
  
  const telemetry = getTelemetry();
  for (const [dryerIdStr, channelName] of Object.entries(channelsMap)) {
    const dryerId = parseInt(dryerIdStr);
    const dryer = telemetry.find(d => d.dryerId === dryerId);
    if (!dryer) continue;

    for (const [groupKey, tags] of Object.entries(tagDefinitions)) {
      for (const [fieldKey, tagPath] of Object.entries(tags)) {
        const nodeId = `ns=2;s=${channelName}.${tagPath}`;
        try {
          const result = await session.read({ nodeId, attributeId: AttributeIds.Value });
          if (result.statusCode.toString().includes('Good') && result.value && result.value.value !== undefined) {
            const val = result.value.value;
            if (groupKey === 'binStatus') {
              if (!dryer.binStatus) dryer.binStatus = {};
              dryer.binStatus[fieldKey] = typeof val === 'number' ? Math.round(val) : val;
            } else if (groupKey === 'tempRh') {
              if (!dryer.tempRh) dryer.tempRh = {};
              dryer.tempRh[fieldKey] = typeof val === 'number' ? parseFloat(val.toFixed(2)) : val;

              if (fieldKey === 'topTunnelMidTemp') dryer.topTemp = parseFloat(val.toFixed(1));
              if (fieldKey === 'bottomTunnelMidTemp') dryer.bottomTemp = parseFloat(val.toFixed(1));
              if (fieldKey === 'topTunnelPressure') dryer.topPressure = parseFloat(val.toFixed(2));
              if (fieldKey === 'bottomTunnelPressure') dryer.bottomPressure = parseFloat(val.toFixed(2));
            }
            dryer.timestamp = new Date().toISOString();
          }
        } catch (readErr) {
          // Silently skip individual tag read errors during polling
        }
      }
    }
  }
}

export function getOpcConnectionStatus() {
  return {
    status: connectionStatus,
    usingSimulator: usingSimulator,
    endpoint: getEndpointUrl()
  };
}

export function testConnection(endpoint) {
  return new Promise(async (resolve) => {
    console.log(`[OPC UA] Testing link to ${endpoint}`);
    const testClient = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: { maxRetry: 1 }
    });
    
    let timer = setTimeout(() => {
      resolve({ success: false, message: "Timeout" });
    }, 5000);

    try {
      await testClient.connect(endpoint);
      clearTimeout(timer);
      await testClient.disconnect();
      resolve({ success: true, message: "Link Stable" });
    } catch (err) {
      clearTimeout(timer);
      resolve({ success: false, message: err.message });
    }
  });
}

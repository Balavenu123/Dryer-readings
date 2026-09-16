import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsPath = path.join(__dirname, '../config/settings.json');

// Default initial state matching KEPServerEX Channels: PSPL ELURU DRYER 11, 12, 13
let dryers = [
  {
    dryerId: 1,
    name: "Dryer 11",
    channelName: "PSPL ELURU DRYER 11",
    moduleId: "D-011",
    status: "Running",
    timestamp: new Date().toISOString(),
    topTemp: 145.0,
    bottomTemp: 142.0,
    topPressure: 2.4,
    bottomPressure: 2.3,
    binStatus: {
      completedBins: 12,
      downAirUnderProcess: 1,
      emptyBins: 4,
      intakeUnderProcess: 1,
      totalBins: 16,
      upAirUnderProcess: 1
    },
    tempRh: {
      boilerHeaderTemp: 152.4,
      boilerHeaderTopStartTemp: 148.2,
      bottomTunnelPressure: 2.3,
      bottomTunnelEndHumidity: 45.2,
      bottomTunnelEndTemp: 138.5,
      bottomTunnelMidHumidity: 50.1,
      bottomTunnelMidTemp: 142.0,
      bottomTunnelStartHumidity: 55.4,
      bottomTunnelStartTemp: 144.5,
      topTunnelEndHumidity: 42.1,
      topTunnelEndTemp: 141.2,
      topTunnelMidHumidity: 48.6,
      topTunnelMidTemp: 145.0,
      topTunnelPressure: 2.4,
      topTunnelStartHumidity: 52.3,
      topTunnelStartTemp: 147.8
    }
  },
  {
    dryerId: 2,
    name: "Dryer 12",
    channelName: "PSPL ELURU DRYER 12",
    moduleId: "D-012",
    status: "Running",
    timestamp: new Date().toISOString(),
    topTemp: 148.0,
    bottomTemp: 146.0,
    topPressure: 2.5,
    bottomPressure: 2.4,
    binStatus: {
      completedBins: 10,
      downAirUnderProcess: 1,
      emptyBins: 6,
      intakeUnderProcess: 0,
      totalBins: 16,
      upAirUnderProcess: 1
    },
    tempRh: {
      boilerHeaderTemp: 154.8,
      boilerHeaderTopStartTemp: 150.1,
      bottomTunnelPressure: 2.4,
      bottomTunnelEndHumidity: 46.8,
      bottomTunnelEndTemp: 141.0,
      bottomTunnelMidHumidity: 51.5,
      bottomTunnelMidTemp: 146.0,
      bottomTunnelStartHumidity: 56.2,
      bottomTunnelStartTemp: 148.5,
      topTunnelEndHumidity: 43.5,
      topTunnelEndTemp: 144.1,
      topTunnelMidHumidity: 49.2,
      topTunnelMidTemp: 148.0,
      topTunnelPressure: 2.5,
      topTunnelStartHumidity: 53.8,
      topTunnelStartTemp: 151.0
    }
  },
  {
    dryerId: 3,
    name: "Dryer 13",
    channelName: "PSPL ELURU DRYER 13",
    moduleId: "D-013",
    status: "Stopped",
    timestamp: new Date().toISOString(),
    topTemp: 24.0,
    bottomTemp: 23.0,
    topPressure: 0.1,
    bottomPressure: 0.1,
    binStatus: {
      completedBins: 0,
      downAirUnderProcess: 0,
      emptyBins: 16,
      intakeUnderProcess: 0,
      totalBins: 16,
      upAirUnderProcess: 0
    },
    tempRh: {
      boilerHeaderTemp: 26.5,
      boilerHeaderTopStartTemp: 25.0,
      bottomTunnelPressure: 0.1,
      bottomTunnelEndHumidity: 70.0,
      bottomTunnelEndTemp: 22.8,
      bottomTunnelMidHumidity: 71.2,
      bottomTunnelMidTemp: 23.0,
      bottomTunnelStartHumidity: 72.0,
      bottomTunnelStartTemp: 23.5,
      topTunnelEndHumidity: 69.5,
      topTunnelEndTemp: 23.8,
      topTunnelMidHumidity: 70.5,
      topTunnelMidTemp: 24.0,
      topTunnelPressure: 0.1,
      topTunnelStartHumidity: 71.0,
      topTunnelStartTemp: 24.5
    }
  }
];

// Active alarm log
let alarms = [
  {
    id: "a1",
    severity: "CRITICAL",
    machine: "Dryer 11",
    sensor: "T_OUT_HI",
    description: "Bottom tunnel end temperature exceeds high limit",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "Active"
  },
  {
    id: "a2",
    severity: "WARNING",
    machine: "Dryer 12",
    sensor: "P_IN_HI",
    description: "Top tunnel pressure approaching critical threshold",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    status: "Active"
  }
];

// Helper to read limits
function getLimits() {
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(raw);
    return settings.limits;
  } catch (error) {
    return {
      temp: { critical: 160.0, warning: 150.0 },
      pressure: { critical: 3.5, warning: 3.0 }
    };
  }
}

// Generate next telemetry tick
export function updateTelemetry() {
  const limits = getLimits();
  
  dryers = dryers.map(dryer => {
    if (dryer.status !== "Running") {
      const ambientTemp = 24.0;
      const ambientPressure = 0.1;
      const ambientHumidity = 70.0;
      
      dryer.topTemp = parseFloat((dryer.topTemp + (ambientTemp - dryer.topTemp) * 0.1 + (Math.random() - 0.5) * 0.2).toFixed(1));
      dryer.bottomTemp = parseFloat((dryer.bottomTemp + (ambientTemp - dryer.bottomTemp) * 0.1 + (Math.random() - 0.5) * 0.2).toFixed(1));
      dryer.topPressure = parseFloat(Math.max(0, (dryer.topPressure + (ambientPressure - dryer.topPressure) * 0.1)).toFixed(2));
      dryer.bottomPressure = parseFloat(Math.max(0, (dryer.bottomPressure + (ambientPressure - dryer.bottomPressure) * 0.1)).toFixed(2));
      
      dryer.tempRh = {
        boilerHeaderTemp: parseFloat((dryer.tempRh.boilerHeaderTemp + (ambientTemp - dryer.tempRh.boilerHeaderTemp) * 0.1).toFixed(1)),
        boilerHeaderTopStartTemp: parseFloat((dryer.tempRh.boilerHeaderTopStartTemp + (ambientTemp - dryer.tempRh.boilerHeaderTopStartTemp) * 0.1).toFixed(1)),
        bottomTunnelPressure: dryer.bottomPressure,
        bottomTunnelEndHumidity: parseFloat((dryer.tempRh.bottomTunnelEndHumidity + (ambientHumidity - dryer.tempRh.bottomTunnelEndHumidity) * 0.1).toFixed(1)),
        bottomTunnelEndTemp: dryer.bottomTemp,
        bottomTunnelMidHumidity: ambientHumidity,
        bottomTunnelMidTemp: dryer.bottomTemp,
        bottomTunnelStartHumidity: ambientHumidity,
        bottomTunnelStartTemp: dryer.bottomTemp,
        topTunnelEndHumidity: ambientHumidity,
        topTunnelEndTemp: dryer.topTemp,
        topTunnelMidHumidity: ambientHumidity,
        topTunnelMidTemp: dryer.topTemp,
        topTunnelPressure: dryer.topPressure,
        topTunnelStartHumidity: ambientHumidity,
        topTunnelStartTemp: dryer.topTemp
      };
      
      dryer.timestamp = new Date().toISOString();
      return dryer;
    }
    
    // Running dryer: fluctuate around nominal operating values
    const baseTop = dryer.dryerId === 1 ? 145.0 : 148.0;
    const basePress = dryer.dryerId === 1 ? 2.4 : 2.5;
    
    const noise = (span) => (Math.random() - 0.5) * span;
    
    dryer.topTemp = parseFloat((baseTop + noise(1.2)).toFixed(1));
    dryer.bottomTemp = parseFloat((baseTop - 3.0 + noise(1.2)).toFixed(1));
    dryer.topPressure = parseFloat((basePress + noise(0.08)).toFixed(2));
    dryer.bottomPressure = parseFloat((basePress - 0.1 + noise(0.08)).toFixed(2));

    dryer.tempRh = {
      boilerHeaderTemp: parseFloat((baseTop + 7.5 + noise(1.0)).toFixed(1)),
      boilerHeaderTopStartTemp: parseFloat((baseTop + 3.2 + noise(1.0)).toFixed(1)),
      bottomTunnelPressure: dryer.bottomPressure,
      bottomTunnelEndHumidity: parseFloat((45.0 + noise(3.0)).toFixed(1)),
      bottomTunnelEndTemp: parseFloat((dryer.bottomTemp - 3.5 + noise(1.0)).toFixed(1)),
      bottomTunnelMidHumidity: parseFloat((50.0 + noise(3.0)).toFixed(1)),
      bottomTunnelMidTemp: dryer.bottomTemp,
      bottomTunnelStartHumidity: parseFloat((55.0 + noise(3.0)).toFixed(1)),
      bottomTunnelStartTemp: parseFloat((dryer.bottomTemp + 2.5 + noise(1.0)).toFixed(1)),
      topTunnelEndHumidity: parseFloat((42.0 + noise(3.0)).toFixed(1)),
      topTunnelEndTemp: parseFloat((dryer.topTemp - 3.8 + noise(1.0)).toFixed(1)),
      topTunnelMidHumidity: parseFloat((48.0 + noise(3.0)).toFixed(1)),
      topTunnelMidTemp: dryer.topTemp,
      topTunnelPressure: dryer.topPressure,
      topTunnelStartHumidity: parseFloat((52.0 + noise(3.0)).toFixed(1)),
      topTunnelStartTemp: parseFloat((dryer.topTemp + 2.8 + noise(1.0)).toFixed(1))
    };

    // Check and trigger simulated alarms based on configured limits
    checkLimitsAndRaiseAlarms(dryer, limits);
    
    dryer.timestamp = new Date().toISOString();
    return dryer;
  });
  
  return dryers;
}

function checkLimitsAndRaiseAlarms(dryer, limits) {
  const sensors = [
    { name: "Top Mid Temp", val: dryer.topTemp, limitKey: "temp", tag: "T_IN_HI", desc: "Top Tunnel Mid temperature high" },
    { name: "Bottom Mid Temp", val: dryer.bottomTemp, limitKey: "temp", tag: "T_OUT_HI", desc: "Bottom Tunnel Mid temperature high" },
    { name: "Top Press", val: dryer.topPressure, limitKey: "pressure", tag: "P_IN_HI", desc: "Top Tunnel pressure high" },
    { name: "Bottom Press", val: dryer.bottomPressure, limitKey: "pressure", tag: "P_OUT_HI", desc: "Bottom Tunnel pressure high" }
  ];
  
  sensors.forEach(s => {
    const limit = limits[s.limitKey];
    if (s.val >= limit.critical) {
      const existing = alarms.find(a => a.machine === dryer.name && a.sensor === s.tag && a.status === "Active" && a.severity === "CRITICAL");
      if (!existing) {
        alarms.unshift({
          id: Math.random().toString(36).substring(2, 9),
          severity: "CRITICAL",
          machine: dryer.name,
          sensor: s.tag,
          description: `${s.desc} is ${s.val} (Limit: ${limit.critical})`,
          timestamp: new Date().toISOString(),
          status: "Active"
        });
      }
    } else if (s.val >= limit.warning) {
      const existing = alarms.find(a => a.machine === dryer.name && a.sensor === s.tag && a.status === "Active");
      if (!existing) {
        alarms.unshift({
          id: Math.random().toString(36).substring(2, 9),
          severity: "WARNING",
          machine: dryer.name,
          sensor: s.tag,
          description: `${s.desc} is ${s.val} (Limit: ${limit.warning})`,
          timestamp: new Date().toISOString(),
          status: "Active"
        });
      }
    }
  });
}

export function getTelemetry() {
  return dryers;
}

export function getAlarms() {
  return alarms;
}

export function acknowledgeAlarm(alarmId) {
  alarms = alarms.map(a => {
    if (a.id === alarmId) {
      return { ...a, status: "Acknowledged" };
    }
    return a;
  });
  return alarms;
}

export function acknowledgeAllAlarms() {
  alarms = alarms.map(a => ({ ...a, status: "Acknowledged" }));
  return alarms;
}

export function toggleDryerStatus(dryerId) {
  dryers = dryers.map(d => {
    if (d.dryerId === dryerId) {
      const newStatus = d.status === "Running" ? "Stopped" : "Running";
      const isRun = newStatus === "Running";
      return {
        ...d,
        status: newStatus,
        topTemp: isRun ? 145.0 : 24.0,
        bottomTemp: isRun ? 142.0 : 23.0,
        topPressure: isRun ? 2.4 : 0.1,
        bottomPressure: isRun ? 2.3 : 0.1,
        binStatus: {
          completedBins: isRun ? 12 : 0,
          downAirUnderProcess: isRun ? 1 : 0,
          emptyBins: isRun ? 4 : 16,
          intakeUnderProcess: isRun ? 1 : 0,
          totalBins: 16,
          upAirUnderProcess: isRun ? 1 : 0
        },
        tempRh: {
          boilerHeaderTemp: isRun ? 152.4 : 26.5,
          boilerHeaderTopStartTemp: isRun ? 148.2 : 25.0,
          bottomTunnelPressure: isRun ? 2.3 : 0.1,
          bottomTunnelEndHumidity: isRun ? 45.2 : 70.0,
          bottomTunnelEndTemp: isRun ? 138.5 : 22.8,
          bottomTunnelMidHumidity: isRun ? 50.1 : 71.2,
          bottomTunnelMidTemp: isRun ? 142.0 : 23.0,
          bottomTunnelStartHumidity: isRun ? 55.4 : 72.0,
          bottomTunnelStartTemp: isRun ? 144.5 : 23.5,
          topTunnelEndHumidity: isRun ? 42.1 : 69.5,
          topTunnelEndTemp: isRun ? 141.2 : 23.8,
          topTunnelMidHumidity: isRun ? 48.6 : 70.5,
          topTunnelMidTemp: isRun ? 145.0 : 24.0,
          topTunnelPressure: isRun ? 2.4 : 0.1,
          topTunnelStartHumidity: isRun ? 52.3 : 71.0,
          topTunnelStartTemp: isRun ? 147.8 : 24.5
        }
      };
    }
    return d;
  });
  return dryers;
}

// Called by the bridge endpoint to inject real KEPServer data from site PC
export function updateTelemetryFromBridge(bridgeDryers) {
  const limits = getLimits();
  bridgeDryers.forEach(bridgeDryer => {
    const dryer = dryers.find(d => d.dryerId === bridgeDryer.dryerId);
    if (dryer) {
      Object.assign(dryer, bridgeDryer);
      dryer.timestamp = new Date().toISOString();
      checkLimitsAndRaiseAlarms(dryer, limits);
    }
  });
  return dryers;
}

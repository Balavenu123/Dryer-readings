import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export function SocketProvider({ children, token }) {
  const [telemetry, setTelemetry] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [settings, setSettings] = useState(null);
  const [opcStatus, setOpcStatus] = useState({ status: "Disconnected", usingSimulator: true });
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());

  // Local ticking clock for responsive SCADA updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = io(BACKEND_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('initialData', (data) => {
      setTelemetry(data.telemetry || []);
      setAlarms(data.alarms || []);
      setSettings(data.settings || null);
      setOpcStatus(data.opcStatus || { status: "Disconnected", usingSimulator: true });
    });

    socket.on('sensorUpdate', (dryerUpdate) => {
      setTelemetry(prev => {
        const index = prev.findIndex(d => d.dryerId === dryerUpdate.dryerId);
        if (index !== -1) {
          const next = [...prev];
          next[index] = dryerUpdate;
          return next;
        }
        return [...prev, dryerUpdate];
      });
    });

    socket.on('alarmsUpdate', (updatedAlarms) => {
      setAlarms(updatedAlarms);
    });

    socket.on('statusUpdate', (status) => {
      setOpcStatus(prev => ({
        status: status.opcStatus,
        usingSimulator: status.usingSimulator,
        endpoint: status.endpoint || prev.endpoint
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  });

  const toggleDryer = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dryers/${id}/toggle`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setTelemetry(data.telemetry);
      }
    } catch (err) {
      console.error('Error toggling dryer:', err);
    }
  };

  const acknowledge = async (alarmId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/alarms/${alarmId}/acknowledge`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setAlarms(data.alarms);
      }
    } catch (err) {
      console.error('Error acknowledging alarm:', err);
    }
  };

  const acknowledgeAll = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/alarms/acknowledge-all`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setAlarms(data.alarms);
      }
    } catch (err) {
      console.error('Error acknowledging all alarms:', err);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        const statusRes = await fetch(`${BACKEND_URL}/api/settings`, { headers: authHeaders() });
        const statusData = await statusRes.json();
        setOpcStatus(statusData.opcStatus);
        return true;
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
    return false;
  };

  const testConnectionLink = async (endpoint) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/test-link`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ endpoint })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <SocketContext.Provider value={{
      telemetry,
      alarms,
      settings,
      opcStatus,
      connected,
      currentTime,
      toggleDryer,
      acknowledge,
      acknowledgeAll,
      updateSettings,
      testConnectionLink
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export default function Settings() {
  const { settings, opcStatus, updateSettings, testConnectionLink } = useSocket();

  // Local Form State
  const [opcIp, setOpcIp] = useState('192.168.1.105');
  const [opcPort, setOpcPort] = useState(49320);
  const [endpointUrl, setEndpointUrl] = useState('opc.tcp://alpha12-server:4840');
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [tempCritical, setTempCritical] = useState(160.0);
  const [tempWarning, setTempWarning] = useState(150.0);
  const [pressCritical, setPressCritical] = useState(3.5);
  const [pressWarning, setPressWarning] = useState(3.0);

  // Link Test States
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load initial settings when available
  useEffect(() => {
    if (settings) {
      setOpcIp(settings.opcServerIp || '192.168.1.105');
      setOpcPort(settings.opcServerPort || 49320);
      setEndpointUrl(settings.opcUaEndpoint || 'opc.tcp://alpha12-server:4840');
      setRefreshInterval(settings.refreshInterval || 5);
      if (settings.limits) {
        setTempCritical(settings.limits.temp.critical);
        setTempWarning(settings.limits.temp.warning);
        setPressCritical(settings.limits.pressure.critical);
        setPressWarning(settings.limits.pressure.warning);
      }
    }
  }, [settings]);

  const handleTestLink = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnectionLink(endpointUrl);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    const updatedPayload = {
      opcServerIp: opcIp,
      opcServerPort: parseInt(opcPort),
      opcUaEndpoint: endpointUrl,
      refreshInterval: parseInt(refreshInterval),
      limits: {
        temp: {
          critical: parseFloat(tempCritical),
          warning: parseFloat(tempWarning)
        },
        pressure: {
          critical: parseFloat(pressCritical),
          warning: parseFloat(pressWarning)
        }
      }
    };

    const success = await updateSettings(updatedPayload);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="p-8 flex-1 overflow-y-auto">
      <form onSubmit={handleSave} className="max-w-5xl mx-auto space-y-8">
        
        {/* Save success banner */}
        {saveSuccess && (
          <div className="bg-secondary/15 border border-secondary text-secondary p-4 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-semibold">SCADA Configuration successfully written to server.json</span>
          </div>
        )}

        {/* Connectivity Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary">lan</span>
            <h3 className="font-headline-md text-on-background">Connectivity</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Server details */}
            <div className="p-6 bg-surface-container rounded-lg border border-outline-variant hover:border-primary/50 transition-colors">
              <label className="block font-label-sm text-on-surface-variant mb-2">KEPServerEX Connection (IP)</label>
              <input 
                type="text"
                value={opcIp}
                onChange={(e) => setOpcIp(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary font-label-mono outline-none"
              />
              <div className="mt-4">
                <label className="block font-label-sm text-on-surface-variant mb-2">Port</label>
                <input 
                  type="number"
                  value={opcPort}
                  onChange={(e) => setOpcPort(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary font-label-mono outline-none"
                />
              </div>
            </div>

            {/* OPC UA endpoint details */}
            <div className="p-6 bg-surface-container rounded-lg border border-outline-variant hover:border-primary/50 transition-colors flex flex-col justify-between">
              <div>
                <label className="block font-label-sm text-on-surface-variant mb-2">OPC UA Endpoint URL</label>
                <input 
                  type="text"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary font-label-mono outline-none"
                />
              </div>

              {/* Status and link test */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className={`text-sm flex items-center gap-2 font-semibold ${
                    opcStatus.status === 'Connected' ? 'text-secondary' : opcStatus.usingSimulator ? 'text-tertiary' : 'text-error'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      opcStatus.status === 'Connected' ? 'bg-secondary animate-pulse' : opcStatus.usingSimulator ? 'bg-tertiary animate-pulse' : 'bg-error'
                    }`}></span>
                    {opcStatus.status === 'Connected' ? 'Connection Active' : opcStatus.usingSimulator ? 'Running Simulation' : 'Offline'}
                  </span>
                  
                  {testResult && (
                    <span className={`text-xs ${testResult.success ? 'text-secondary' : 'text-error'}`}>
                      Test Result: {testResult.message}
                    </span>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={handleTestLink}
                  disabled={testing}
                  className="bg-primary hover:bg-primary/95 text-on-primary px-4 py-2 rounded font-label-sm transition-colors uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {testing ? 'Testing...' : 'Test Link'}
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Limits and Refresh section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Refresh interval slider */}
          <section className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              <h3 className="font-headline-md text-on-background">System</h3>
            </div>
            <div className="p-6 bg-surface-container rounded-lg border border-outline-variant h-full flex flex-col justify-between min-h-[180px]">
              <div>
                <label className="block font-label-sm text-on-surface-variant mb-2">Refresh Interval</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range"
                    min="1"
                    max="60"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(e.target.value)}
                    className="flex-1 accent-primary cursor-pointer"
                  />
                  <span className="font-label-mono text-primary bg-primary-container/20 px-3 py-1 rounded">{refreshInterval}s</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Faster refresh increases network load but provides higher fidelity real-time telemetry.
              </p>
            </div>
          </section>

          {/* Alarm High Limits */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">warning</span>
              <h3 className="font-headline-md text-on-background">Alarm Limits</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Temperature limits */}
              <div className="p-6 bg-surface-container rounded-lg border border-outline-variant">
                <h4 className="font-label-sm text-on-surface-variant mb-4 uppercase font-semibold">Temperature (°C)</h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase text-error mb-1 block font-bold">Critical High</span>
                    <input 
                      type="number"
                      step="0.1"
                      value={tempCritical}
                      onChange={(e) => setTempCritical(e.target.value)}
                      className="w-full bg-surface-container-low border border-error/30 rounded px-3 py-2 text-on-surface font-label-mono outline-none focus:border-error"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-tertiary mb-1 block font-bold">Warning High</span>
                    <input 
                      type="number"
                      step="0.1"
                      value={tempWarning}
                      onChange={(e) => setTempWarning(e.target.value)}
                      className="w-full bg-surface-container-low border border-tertiary/30 rounded px-3 py-2 text-on-surface font-label-mono outline-none focus:border-tertiary"
                    />
                  </div>
                </div>
              </div>

              {/* Pressure limits */}
              <div className="p-6 bg-surface-container rounded-lg border border-outline-variant">
                <h4 className="font-label-sm text-on-surface-variant mb-4 uppercase font-semibold">Pressure (bar)</h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase text-error mb-1 block font-bold">Critical High</span>
                    <input 
                      type="number"
                      step="0.1"
                      value={pressCritical}
                      onChange={(e) => setPressCritical(e.target.value)}
                      className="w-full bg-surface-container-low border border-error/30 rounded px-3 py-2 text-on-surface font-label-mono outline-none focus:border-error"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-tertiary mb-1 block font-bold">Warning High</span>
                    <input 
                      type="number"
                      step="0.1"
                      value={pressWarning}
                      onChange={(e) => setPressWarning(e.target.value)}
                      className="w-full bg-surface-container-low border border-tertiary/30 rounded px-3 py-2 text-on-surface font-label-mono outline-none focus:border-tertiary"
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* Form Submit Action */}
        <div className="flex justify-end pt-4 border-t border-outline-variant">
          <button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-on-primary font-bold px-8 py-3 rounded-lg text-label-sm uppercase tracking-widest transition-all cursor-pointer shadow-lg"
          >
            Save Configuration
          </button>
        </div>

      </form>
    </div>
  );
}

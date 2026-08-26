import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Trends() {
  const { telemetry } = useSocket();
  const [selectedDryer, setSelectedDryer] = useState('Dryer 11');
  const [selectedSection, setSelectedSection] = useState('Top Tunnel');
  const [timeWindow, setTimeWindow] = useState('24h');
  const [trendData, setTrendData] = useState([]);
  const [stats, setStats] = useState({ tempAvg: 0, tempPeak: 0, pressAvg: 0, pressPeak: 0 });

  // Generate data based on selected dryer, section, and time window
  useEffect(() => {
    const dryer = telemetry.find(d => d.name === selectedDryer) || { topTemp: 145, bottomTemp: 140, topPressure: 2.4, bottomPressure: 2.2, status: 'Running' };
    const pointsCount = timeWindow === '1h' ? 30 : timeWindow === '6h' ? 36 : timeWindow === '24h' ? 24 : 28;
    const intervalMins = timeWindow === '1h' ? 2 : timeWindow === '6h' ? 10 : timeWindow === '24h' ? 60 : 360;
    
    const seededData = [];
    const now = Date.now();
    let tempSum = 0;
    let tempMax = 0;
    let pressSum = 0;
    let pressMax = 0;

    const isTop = selectedSection === 'Top Tunnel';
    const baseTemp = dryer.status === 'Running' ? (isTop ? dryer.topTemp : dryer.bottomTemp) : 24.0;
    const basePress = dryer.status === 'Running' ? (isTop ? dryer.topPressure : dryer.bottomPressure) : 0.1;

    for (let i = pointsCount - 1; i >= 0; i--) {
      const timeMs = now - i * intervalMins * 60 * 1000;
      const date = new Date(timeMs);
      
      let label = '';
      if (timeWindow === '1h' || timeWindow === '6h') {
        label = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } else if (timeWindow === '24h') {
        label = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      }

      // Add nominal SCADA noise
      const isOffline = dryer.status !== 'Running';
      const tempNoise = isOffline ? (Math.random() - 0.5) * 0.5 : (Math.random() - 0.5) * 4;
      const pressNoise = isOffline ? (Math.random() - 0.5) * 0.01 : (Math.random() - 0.5) * 0.15;
      
      const tempVal = parseFloat((baseTemp + tempNoise).toFixed(1));
      const pressVal = parseFloat(Math.max(0, basePress + pressNoise).toFixed(2));

      tempSum += tempVal;
      pressSum += pressVal;
      if (tempVal > tempMax) tempMax = tempVal;
      if (pressVal > pressMax) pressMax = pressVal;

      seededData.push({
        time: label,
        temperature: tempVal,
        pressure: pressVal
      });
    }

    setTrendData(seededData);
    setStats({
      tempAvg: parseFloat((tempSum / pointsCount).toFixed(1)),
      tempPeak: tempMax,
      pressAvg: parseFloat((pressSum / pointsCount).toFixed(2)),
      pressPeak: pressMax
    });

  }, [selectedDryer, selectedSection, timeWindow, telemetry]);

  const handleExport = () => {
    if (trendData.length === 0) return;
    const headers = ['Time', 'Temperature (°C)', 'Pressure (bar)'];
    const rows = trendData.map(d => [d.time, d.temperature, d.pressure]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${selectedDryer.replace(/\s+/g, '_')}_${selectedSection.replace(/\s+/g, '_')}_trends_${timeWindow}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
      
      {/* Control Filter Bar */}
      <section className="bg-surface-container p-4 rounded-lg border border-outline-variant flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Unit Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Select Unit</label>
            <div className="relative">
              <select 
                value={selectedDryer}
                onChange={(e) => setSelectedDryer(e.target.value)}
                className="appearance-none bg-surface-container-low border border-outline-variant text-on-surface text-body-md px-4 py-2 pr-10 rounded focus:border-primary focus:ring-0 outline-none cursor-pointer"
              >
                <option>Dryer 11</option>
                <option>Dryer 12</option>
                <option>Dryer 13</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
          </div>

          {/* Section Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Select Section</label>
            <div className="relative">
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="appearance-none bg-surface-container-low border border-outline-variant text-on-surface text-body-md px-4 py-2 pr-10 rounded focus:border-primary focus:ring-0 outline-none cursor-pointer"
              >
                <option>Top Tunnel</option>
                <option>Bottom Tunnel</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
          </div>

          {/* Time Window Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Time Window</label>
            <div className="relative">
              <select 
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="appearance-none bg-surface-container-low border border-outline-variant text-on-surface text-body-md px-4 py-2 pr-10 rounded focus:border-primary focus:ring-0 outline-none cursor-pointer"
              >
                <option value="1h">Last 1h</option>
                <option value="6h">Last 6h</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7d</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-surface-container-low border border-outline-variant px-4 py-2 rounded text-label-sm font-semibold hover:bg-surface-container-highest transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export CSV
          </button>
          <button 
            onClick={() => setTimeWindow(w => w)} 
            className="flex items-center gap-2 bg-primary px-4 py-2 rounded text-on-primary text-label-sm font-bold shadow-lg hover:opacity-90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            Refresh Data
          </button>
        </div>
      </section>

      {/* Analytics Charts Grid */}
      <div className="flex-1 grid grid-cols-1 gap-6">
        
        {/* Temperature chart */}
        <div className="bg-surface-container p-6 rounded-lg border border-outline-variant flex flex-col min-h-[350px] relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              <h3 className="font-headline-md text-headline-md text-on-background">Temperature Trends</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-label-sm text-on-surface-variant uppercase">Average</p>
                <p className="font-label-mono text-headline-md text-primary">
                  {stats.tempAvg} <span className="text-body-md font-normal">°C</span>
                </p>
              </div>
              <div className="h-10 w-px bg-outline-variant"></div>
              <div className="text-right">
                <p className="text-label-sm text-on-surface-variant uppercase">Peak (Period)</p>
                <p className="font-label-mono text-headline-md text-tertiary">
                  {stats.tempPeak} <span className="text-body-md font-normal">°C</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 relative chart-grid border border-outline-variant/30 rounded bg-background/20 p-4 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTempTrends" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#adc7ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#adc7ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#8b90a0" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis domain={[0, 200]} stroke="#8b90a0" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c2027', borderColor: '#414754', color: '#e0e2ed' }}
                  labelStyle={{ fontFamily: 'monospace', fontSize: 11 }}
                />
                <Area type="monotone" dataKey="temperature" name="Temp" stroke="#adc7ff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTempTrends)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pressure chart */}
        <div className="bg-surface-container p-6 rounded-lg border border-outline-variant flex flex-col min-h-[350px] relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-tertiary rounded-full"></div>
              <h3 className="font-headline-md text-headline-md text-on-background">Pressure Trends</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-label-sm text-on-surface-variant uppercase">Average</p>
                <p className="font-label-mono text-headline-md text-primary">
                  {stats.pressAvg} <span className="text-body-md font-normal">bar</span>
                </p>
              </div>
              <div className="h-10 w-px bg-outline-variant"></div>
              <div className="text-right">
                <p className="text-label-sm text-on-surface-variant uppercase">Peak (Period)</p>
                <p className="font-label-mono text-headline-md text-tertiary">
                  {stats.pressPeak} <span className="text-body-md font-normal">bar</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 relative chart-grid border border-outline-variant/30 rounded bg-background/20 p-4 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPressTrends" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fabd00" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#fabd00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#8b90a0" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis domain={[0.0, 4.0]} stroke="#8b90a0" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c2027', borderColor: '#414754', color: '#e0e2ed' }}
                  labelStyle={{ fontFamily: 'monospace', fontSize: 11 }}
                />
                <Area type="monotone" dataKey="pressure" name="Pressure" stroke="#fabd00" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPressTrends)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

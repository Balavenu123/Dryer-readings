import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function Alarms() {
  const { alarms, acknowledge, acknowledgeAll } = useSocket();

  // Filter States
  const [machineFilter, setMachineFilter] = useState('All Dryers');
  const [severityFilter, setSeverityFilter] = useState('All Levels');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Applied filter cache (for "Apply Filters" button action)
  const [appliedFilters, setAppliedFilters] = useState({
    machine: 'All Dryers',
    severity: 'All Levels',
    start: '',
    end: ''
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      machine: machineFilter,
      severity: severityFilter,
      start: startDate,
      end: endDate
    });
  };

  const handleResetFilters = () => {
    setMachineFilter('All Dryers');
    setSeverityFilter('All Levels');
    setStartDate('');
    setEndDate('');
    setAppliedFilters({
      machine: 'All Dryers',
      severity: 'All Levels',
      start: '',
      end: ''
    });
  };

  // Filter logic
  const filteredAlarms = alarms.filter(a => {
    // Machine filter
    if (appliedFilters.machine !== 'All Dryers' && a.machine !== appliedFilters.machine) {
      return false;
    }
    // Severity filter
    if (appliedFilters.severity !== 'All Levels' && a.severity !== appliedFilters.severity) {
      return false;
    }
    // Date filter
    if (appliedFilters.start) {
      const alarmDate = new Date(a.timestamp);
      const filterStart = new Date(appliedFilters.start + 'T00:00:00Z');
      if (alarmDate < filterStart) return false;
    }
    if (appliedFilters.end) {
      const alarmDate = new Date(a.timestamp);
      const filterEnd = new Date(appliedFilters.end + 'T23:59:59Z');
      if (alarmDate > filterEnd) return false;
    }
    return true;
  });

  // CSV Export helper
  const exportCSV = () => {
    if (filteredAlarms.length === 0) return;
    
    const headers = ['Severity', 'Machine', 'Sensor', 'Description', 'Timestamp', 'Status'];
    const rows = filteredAlarms.map(a => [
      a.severity,
      a.machine,
      a.sensor,
      `"${a.description.replace(/"/g, '""')}"`,
      a.timestamp,
      a.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dryer_alarms_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 flex-1 overflow-y-auto">
      
      {/* Filter Bar */}
      <section className="glass-panel rounded-xl p-4 mb-6 flex flex-wrap items-end gap-4">
        
        {/* Dryer unit filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm text-on-surface-variant px-1 uppercase tracking-tight">Machine Filter</label>
          <select 
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface text-body-md rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none min-w-[160px] cursor-pointer"
          >
            <option>All Dryers</option>
            <option>Dryer 1</option>
            <option>Dryer 2</option>
            <option>Dryer 3</option>
          </select>
        </div>

        {/* Severity level filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm text-on-surface-variant px-1 uppercase tracking-tight">Severity</label>
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface text-body-md rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none min-w-[160px] cursor-pointer"
          >
            <option>All Levels</option>
            <option>CRITICAL</option>
            <option>WARNING</option>
          </select>
        </div>

        {/* Date range filters */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm text-on-surface-variant px-1 uppercase tracking-tight">Date Range</label>
          <div className="flex items-center gap-2">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant text-on-surface text-body-md rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
            />
            <span className="text-on-surface-variant">to</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant text-on-surface text-body-md rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Action buttons */}
        <button 
          onClick={handleApplyFilters}
          className="ml-auto bg-primary text-on-primary font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">filter_alt</span>
          <span>Apply Filters</span>
        </button>
        <button 
          onClick={handleResetFilters}
          className="bg-transparent border border-outline-variant text-on-surface font-bold px-6 py-2.5 rounded-lg hover:bg-surface-container-low transition-all cursor-pointer"
        >
          Reset
        </button>
      </section>

      {/* Alarm Log Table Section */}
      <section className="glass-panel rounded-xl overflow-hidden flex flex-col">
        {/* Table header */}
        <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">list_alt</span>
            <h3 className="font-label-mono text-label-mono uppercase">Live Alarm Log</h3>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={exportCSV}
              disabled={filteredAlarms.length === 0}
              className="text-label-sm bg-surface-container-highest px-3 py-1.5 rounded flex items-center gap-2 hover:text-primary transition-colors disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export CSV
            </button>
            <button 
              onClick={acknowledgeAll}
              disabled={alarms.filter(a => a.status === 'Active').length === 0}
              className="text-label-sm bg-surface-container-highest px-3 py-1.5 rounded flex items-center gap-2 hover:text-primary transition-colors disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Acknowledge All
            </button>
          </div>
        </div>

        {/* Scrollable table canvas */}
        <div className="scada-table-container overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase tracking-wider font-semibold border-b border-outline-variant">
                <th className="px-6 py-4 w-40">Severity</th>
                <th className="px-6 py-4">Machine</th>
                <th className="px-6 py-4">Sensor / Tag</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filteredAlarms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-on-surface-variant/50 font-label-mono text-sm">
                    No matching alarm records found in logs
                  </td>
                </tr>
              ) : (
                filteredAlarms.map(a => {
                  const isActive = a.status === 'Active';
                  return (
                    <tr key={a.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 font-bold ${
                          a.severity === 'CRITICAL' 
                            ? 'text-error ' + (isActive ? 'pulse-critical' : '')
                            : 'text-tertiary'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">report</span>
                          {a.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-on-surface">{a.machine}</td>
                      <td className="px-6 py-4 font-label-mono text-label-mono text-primary">{a.sensor}</td>
                      <td className="px-6 py-4 text-on-surface">{a.description}</td>
                      <td className="px-6 py-4 font-label-mono text-label-mono text-on-surface-variant">
                        {new Date(a.timestamp).toLocaleString('en-US', { hour12: false })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isActive 
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isActive ? (
                          <button 
                            onClick={() => acknowledge(a.id)}
                            className="bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
                          >
                            ACK
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant opacity-40 select-none">RESOLVED</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

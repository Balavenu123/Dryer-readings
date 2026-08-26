import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ title }) {
  const { connected, alarms, opcStatus, currentTime } = useSocket();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const activeAlarms = alarms.filter(a => a.status === 'Active');
  const activeCriticalCount = activeAlarms.filter(a => a.severity === 'CRITICAL').length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC';
    } catch {
      return '--:--:-- UTC';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] h-16 bg-background border-b border-outline-variant z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="font-headline-md text-headline-md text-on-background">{title || 'Dryer Monitoring'}</h2>
        {activeCriticalCount > 0 && (
          <span className="bg-error-container text-on-error-container text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
            {activeCriticalCount} Active Critical
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* WS Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded border border-outline-variant">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-secondary animate-pulse' : 'bg-error'}`}></span>
          <span className={`text-label-sm uppercase font-bold tracking-tight ${connected ? 'text-secondary' : 'text-error'}`}>
            {connected ? 'WS Connected' : 'WS Offline'}
          </span>
        </div>

        {/* PLC Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded border border-outline-variant">
          <span className={`w-2 h-2 rounded-full ${opcStatus.status === 'Connected' ? 'bg-secondary animate-pulse' : opcStatus.usingSimulator ? 'bg-tertiary animate-pulse' : 'bg-error'}`}></span>
          <span className={`text-label-sm uppercase font-bold tracking-tight ${opcStatus.status === 'Connected' ? 'text-secondary' : opcStatus.usingSimulator ? 'text-tertiary' : 'text-error'}`}>
            {opcStatus.status === 'Connected' ? 'PLC Online' : opcStatus.usingSimulator ? 'Simulation Mode' : 'PLC Offline'}
          </span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          <span className="font-label-mono text-label-mono">{formatTime(currentTime)}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="p-2 hover:bg-surface-container-low rounded-full transition-all text-on-background relative cursor-pointer"
            >
              <span className="material-symbols-outlined">notifications</span>
              {activeAlarms.length > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] bg-error rounded-full flex items-center justify-center text-[9px] font-bold text-on-error px-1">
                  {activeAlarms.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-[360px] bg-surface-container border border-outline-variant rounded-lg shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-outline-variant bg-surface-container-high flex items-center justify-between">
                  <span className="font-label-sm text-on-surface uppercase tracking-widest font-semibold">Notifications</span>
                  <span className="text-[10px] font-label-mono text-on-surface-variant">{activeAlarms.length} active</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {activeAlarms.length === 0 ? (
                    <div className="p-6 text-center text-on-surface-variant/50">
                      <span className="material-symbols-outlined text-[32px] mb-2 block">notifications_off</span>
                      <span className="font-label-sm">No active notifications</span>
                    </div>
                  ) : (
                    activeAlarms.map(alarm => (
                      <div key={alarm.id} className="px-4 py-3 border-b border-outline-variant/30 hover:bg-surface-container-high transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`material-symbols-outlined text-[14px] ${alarm.severity === 'CRITICAL' ? 'text-error' : 'text-tertiary'}`}>
                            {alarm.severity === 'CRITICAL' ? 'error' : 'warning'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${alarm.severity === 'CRITICAL' ? 'text-error' : 'text-tertiary'}`}>
                            {alarm.severity}
                          </span>
                          <span className="text-[10px] font-label-mono text-on-surface-variant ml-auto">{alarm.machine}</span>
                        </div>
                        <p className="text-xs text-on-surface pl-5">{alarm.description}</p>
                        <span className="text-[10px] font-label-mono text-on-surface-variant pl-5 block mt-1">
                          {new Date(alarm.timestamp).toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} UTC
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => { setShowNotifications(false); navigate('/alarms'); }}
                  className="w-full p-3 text-center text-primary font-label-sm uppercase tracking-widest hover:bg-surface-container-high transition-colors border-t border-outline-variant cursor-pointer"
                >
                  View All Alarms
                </button>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container-low rounded-full transition-all text-on-background cursor-pointer border border-transparent hover:border-outline-variant"
            >
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
              <span className="font-label-sm text-sm capitalize hidden sm:block">{user?.username}</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-52 bg-surface-container border border-outline-variant rounded-lg shadow-2xl overflow-hidden z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-high">
                  <p className="font-bold text-on-background text-sm capitalize">{user?.username}</p>
                  <p className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                    {user?.role === 'superadmin' ? 'Super Admin' : 'Monitor'}
                  </p>
                </div>

                {/* Admin panel shortcut (superadmin only) */}
                {user?.role === 'superadmin' && (
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer text-left"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">admin_panel_settings</span>
                    User Management
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/20 transition-colors cursor-pointer text-left border-t border-outline-variant"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

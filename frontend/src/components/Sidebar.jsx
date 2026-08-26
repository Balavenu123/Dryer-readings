import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import advantaSymbol from '../assets/advanta_symbol.png';

export default function Sidebar() {
  const { user } = useAuth();

  const getLinkClass = ({ isActive }) => {
    const base = "flex items-center gap-3 px-4 py-3 transition-colors active:opacity-80 transition-all font-body-md text-body-md";
    if (isActive) {
      return `${base} text-primary border-l-4 border-primary bg-surface-container-high font-bold`;
    }
    return `${base} text-on-surface-variant hover:bg-surface-container-highest`;
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-surface-container border-r border-outline-variant flex flex-col z-50">
      <div className="py-6 px-4 border-b border-outline-variant/30 flex flex-col items-center justify-center gap-2 bg-surface-container-low/50">
        <img src={advantaSymbol} alt="Advanta Symbol" className="h-16 w-16 object-contain" />
        <div className="text-center">
          <h2 className="text-lg font-black uppercase tracking-[0.15em] font-sans" style={{ color: '#173164' }}>Advanta</h2>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 mt-10 space-y-1 px-2">
        <NavLink to="/dryer/1" className={getLinkClass}>
          <span className="material-symbols-outlined">air</span>
          <span>Dryer 11</span>
        </NavLink>
        <NavLink to="/dryer/2" className={getLinkClass}>
          <span className="material-symbols-outlined">air</span>
          <span>Dryer 12</span>
        </NavLink>
        <NavLink to="/dryer/3" className={getLinkClass}>
          <span className="material-symbols-outlined">air</span>
          <span>Dryer 13</span>
        </NavLink>
        <NavLink to="/alarms" className={getLinkClass}>
          <span className="material-symbols-outlined">notifications_active</span>
          <span>Alarms</span>
        </NavLink>
        <NavLink to="/settings" className={getLinkClass}>
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </NavLink>

        {/* Admin-only section */}
        {user?.role === 'superadmin' && (
          <>
            <div className="px-4 pt-6 pb-1">
              <span className="text-[10px] font-label-mono uppercase tracking-widest text-on-surface-variant/50">
                Administration
              </span>
            </div>
            <NavLink to="/admin" className={getLinkClass}>
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span>User Management</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Operator profile */}
      <div className="p-4 border-t border-outline-variant flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant">
          <span className="material-symbols-outlined text-[22px] text-on-surface-variant">account_circle</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-label-sm text-label-sm font-bold truncate text-on-surface capitalize">
            {user?.username || 'Unknown'}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant truncate capitalize">
            {user?.role === 'superadmin' ? 'Super Admin' : 'Monitor'}
          </p>
        </div>
      </div>
    </aside>
  );
}

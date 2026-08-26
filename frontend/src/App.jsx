import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';

import Login from './pages/Login';
import DryerDetails from './pages/DryerDetails';
import Alarms from './pages/Alarms';
import Trends from './pages/Trends';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

// ── Redirect to login if not authenticated ──────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
          <span className="font-label-sm uppercase tracking-widest text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ── Super admin only route ──────────────────────────────────────────────────
function RequireSuperAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'superadmin') {
    return <Navigate to="/dryer/1" replace />;
  }
  return children;
}

// ── Main app layout (requires auth) ────────────────────────────────────────
function MainLayout() {
  const { token } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dryer/')) {
      const id = path.split('/')[2];
      return `Dryer ${id} Details`;
    }
    if (path === '/alarms') return 'Alarms Management';
    if (path === '/trends') return 'Historical Trends';
    if (path === '/settings') return 'System Configuration';
    if (path === '/admin') return 'User Management';
    return 'Dryer Monitoring';
  };

  return (
    <SocketProvider token={token}>
      <div className="flex min-h-screen overflow-hidden bg-background text-on-background">
        <Sidebar />
        <div className="flex-1 ml-[260px] flex flex-col h-screen relative">
          <Header title={getPageTitle()} />
          <main className="flex-1 mt-16 overflow-y-auto bg-background flex flex-col">
            <Routes>
              <Route path="/" element={<Navigate to="/dryer/1" replace />} />
              <Route path="/dryer/:id" element={<DryerDetails />} />
              <Route path="/alarms" element={<Alarms />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/settings" element={<Settings />} />
              <Route
                path="/admin"
                element={
                  <RequireSuperAdmin>
                    <Admin />
                  </RequireSuperAdmin>
                }
              />
              <Route path="*" element={<Navigate to="/dryer/1" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </SocketProvider>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginRedirect />} />

          {/* Protected — everything else */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// If already logged in and visiting /login, go to app
function LoginRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dryer/1" replace />;
  return <Login />;
}

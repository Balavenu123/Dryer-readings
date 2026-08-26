import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import advantaLogo from '../assets/advanta_symbol.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dryer/1';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-10 gap-3">
          <img src={advantaLogo} alt="Advanta" className="h-20 w-20 object-contain" />
          <h1 className="text-2xl font-black uppercase tracking-[0.15em] font-sans" style={{ color: '#adc7ff' }}>
            Advanta
          </h1>
          <p className="text-on-surface-variant font-label-sm text-sm uppercase tracking-widest">
            DryerFlow SCADA Panel
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-8">
          <h2 className="font-headline-md text-on-background text-lg font-bold mb-6 text-center">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-[11px] uppercase tracking-widest text-on-surface-variant">
                Username
              </label>
              <div className="flex items-center bg-surface-container-low border border-outline-variant rounded px-3 gap-2 focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="Enter username"
                  className="flex-1 bg-transparent py-3 text-on-background font-body-md text-sm outline-none placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-[11px] uppercase tracking-widest text-on-surface-variant">
                Password
              </label>
              <div className="flex items-center bg-surface-container-low border border-outline-variant rounded px-3 gap-2 focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter password"
                  className="flex-1 bg-transparent py-3 text-on-background font-body-md text-sm outline-none placeholder:text-on-surface-variant/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-on-surface-variant hover:text-on-background transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-error-container/30 border border-error/40 rounded px-3 py-2">
                <span className="material-symbols-outlined text-[16px] text-error">error</span>
                <span className="text-error text-xs font-label-sm">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary text-on-primary font-label-sm text-sm font-bold uppercase tracking-widest py-3 rounded hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-on-surface-variant/40 text-[11px] font-label-mono mt-6 uppercase tracking-widest">
          Control Panel v2.4.1 · Industrial Monitor
        </p>
      </div>
    </div>
  );
}

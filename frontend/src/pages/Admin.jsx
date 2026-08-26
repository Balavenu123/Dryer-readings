import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Admin() {
  const { authFetch } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Create user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  // Reset password state
  const [resetTarget, setResetTarget] = useState(null); // user id
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetting, setResetting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setFetchError('');
    try {
      const res = await authFetch(`${BACKEND_URL}/api/auth/users`);
      const data = await res.json();
      if (res.ok) setUsers(data);
      else setFetchError(data.error || 'Failed to load users');
    } catch {
      setFetchError('Network error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreating(true);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/auth/users`, {
        method: 'POST',
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setCreateSuccess(`User "${data.username}" created successfully`);
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
      } else {
        setCreateError(data.error || 'Failed to create user');
      }
    } catch {
      setCreateError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId) => {
    setDeleting(true);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/auth/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        fetchUsers();
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setResetting(true);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/auth/users/${resetTarget}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: resetPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess('Password updated successfully');
        setResetPassword('');
        setResetTarget(null);
      } else {
        setResetError(data.error || 'Failed to reset password');
      }
    } catch {
      setResetError('Network error');
    } finally {
      setResetting(false);
    }
  };

  const monitorUsers = users.filter(u => u.role !== 'superadmin');

  return (
    <div className="p-6 flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="font-headline-md text-xl font-bold text-on-background mb-1">User Management</h2>
        <p className="text-on-surface-variant text-sm font-label-sm">
          Create and manage monitor accounts. Monitor users can view dryer data but cannot access admin settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Create New Monitor User ───────────────────────── */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-6">
          <h3 className="font-bold uppercase tracking-widest text-sm text-primary mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Create Monitor User
          </h3>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-label-sm">Username</label>
              <div className="flex items-center bg-surface-container-low border border-outline-variant rounded px-3 gap-2 focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  required
                  placeholder="e.g. operator01"
                  className="flex-1 bg-transparent py-2.5 text-on-background text-sm outline-none placeholder:text-on-surface-variant/40 font-body-md"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-label-sm">Password</label>
              <div className="flex items-center bg-surface-container-low border border-outline-variant rounded px-3 gap-2 focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">lock</span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  className="flex-1 bg-transparent py-2.5 text-on-background text-sm outline-none placeholder:text-on-surface-variant/40 font-body-md"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(v => !v)}
                  className="text-on-surface-variant hover:text-on-background transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {createError && (
              <div className="flex items-center gap-2 bg-error-container/30 border border-error/40 rounded px-3 py-2">
                <span className="material-symbols-outlined text-[14px] text-error">error</span>
                <span className="text-error text-xs">{createError}</span>
              </div>
            )}
            {createSuccess && (
              <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded px-3 py-2">
                <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                <span className="text-secondary text-xs">{createSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="mt-1 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest py-2.5 rounded hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {creating ? (
                <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Creating...</>
              ) : (
                <><span className="material-symbols-outlined text-[16px]">add</span>Create User</>
              )}
            </button>
          </form>
        </div>

        {/* ── Monitor Users List ────────────────────────────── */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-6">
          <h3 className="font-bold uppercase tracking-widest text-sm text-primary mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">group</span>
            Monitor Users
            <span className="ml-auto bg-surface-container-high text-on-surface-variant text-[10px] font-label-mono px-2 py-0.5 rounded-full">
              {monitorUsers.length}
            </span>
          </h3>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-10 text-on-surface-variant gap-2">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              <span className="text-sm">Loading...</span>
            </div>
          ) : fetchError ? (
            <div className="text-error text-sm py-4">{fetchError}</div>
          ) : monitorUsers.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-on-surface-variant/40 gap-2">
              <span className="material-symbols-outlined text-[36px]">group_off</span>
              <span className="text-sm font-label-sm">No monitor users yet</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {monitorUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-surface-container-low border border-outline-variant/60 rounded px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-background">{u.username}</p>
                      <p className="text-[10px] font-label-mono text-on-surface-variant uppercase">
                        {u.role} · {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setResetTarget(u.id); setResetPassword(''); setResetError(''); setResetSuccess(''); }}
                      className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      title="Reset password"
                    >
                      <span className="material-symbols-outlined text-[18px]">key</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u.id)}
                      className="p-1.5 rounded hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                      title="Delete user"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Reset Password Modal ──────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-bold text-on-background mb-1">Reset Password</h3>
            <p className="text-on-surface-variant text-xs mb-5">
              Set a new password for <span className="text-primary font-bold">{users.find(u => u.id === resetTarget)?.username}</span>
            </p>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div className="flex items-center bg-surface-container-low border border-outline-variant rounded px-3 gap-2 focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">lock_reset</span>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="New password (min. 6 chars)"
                  className="flex-1 bg-transparent py-2.5 text-on-background text-sm outline-none placeholder:text-on-surface-variant/40"
                />
              </div>
              {resetError && <p className="text-error text-xs">{resetError}</p>}
              {resetSuccess && <p className="text-secondary text-xs">{resetSuccess}</p>}
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="flex-1 border border-outline-variant text-on-surface-variant text-xs font-bold uppercase tracking-widest py-2 rounded hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest py-2 rounded hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">warning</span>
              <h3 className="font-bold text-on-background">Delete User</h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-6">
              Are you sure you want to delete <span className="text-error font-bold">{users.find(u => u.id === deleteTarget)?.username}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-outline-variant text-on-surface-variant text-xs font-bold uppercase tracking-widest py-2.5 rounded hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="flex-1 bg-error-container text-on-error-container text-xs font-bold uppercase tracking-widest py-2.5 rounded hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

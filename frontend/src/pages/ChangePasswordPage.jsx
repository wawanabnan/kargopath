import React, { useState } from 'react';
import { Lock, Save, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import request from '../api';

const inputBase = "w-full pl-9 pr-9 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors";
const labelBase = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide";

function PasswordField({ label, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={labelBase}>{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Lock className="w-4 h-4" />
        </div>
        <input
          required
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={inputBase}
        />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const { logout } = useAuth();
  const [form, setForm]     = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [status, setStatus] = useState('');
  const [error, setError]   = useState('');

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.'); return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.'); return;
    }
    setStatus('saving');
    try {
      await request('/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          current_password: form.current_password,
          new_password:     form.new_password,
        }),
      });
      setStatus('success');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
      // Auto logout after password change for security
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setError(err?.detail || err?.current_password?.[0] || 'Failed to change password.');
      setStatus('error');
    }
  };

  return (
    <DashboardLayout title="Change Password">
      <div className="max-w-md">
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-900">Change Password</h2>
          <p className="text-xs text-slate-500 mt-0.5">You will be signed out after changing your password</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-4 space-y-3">

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Password changed. Signing you out...
            </div>
          )}

          <PasswordField
            label="Current Password *"
            value={form.current_password}
            onChange={set('current_password')}
            placeholder="Enter current password"
            autoComplete="current-password"
          />

          <PasswordField
            label="New Password *"
            value={form.new_password}
            onChange={set('new_password')}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
          />

          {form.new_password && (
            <div className="flex gap-1">
              {[1,2,3,4].map(n => (
                <div key={n} className={`h-0.5 flex-1 transition-all ${
                  form.new_password.length >= n * 3
                    ? form.new_password.length >= 10 ? 'bg-green-500' : 'bg-amber-400'
                    : 'bg-slate-200'
                }`} />
              ))}
            </div>
          )}

          <PasswordField
            label="Confirm New Password *"
            value={form.confirm_password}
            onChange={set('confirm_password')}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />

          {form.confirm_password && form.new_password !== form.confirm_password && (
            <p className="text-xs text-red-500 font-medium">Passwords do not match.</p>
          )}

          <div className="pt-2">
            <button type="submit" disabled={status === 'saving' || status === 'success'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition-colors">
              {status === 'saving'
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : <><Save className="w-3.5 h-3.5" /> Change Password</>
              }
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

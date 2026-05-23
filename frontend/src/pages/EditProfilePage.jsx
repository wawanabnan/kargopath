import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Briefcase, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import DashboardLayout from '../components/DashboardLayout';

const inputBase = "w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors";
const labelBase = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide";

function IconWrap({ children }) {
  return <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{children}</div>;
}

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm]       = useState({ first_name: '', last_name: '' });
  const [status, setStatus]   = useState(''); // 'saving' | 'success' | 'error'
  const [error, setError]     = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name:  user.last_name  || '',
      });
    }
  }, [user]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    setError('');
    try {
      await authAPI.updateProfile(form);
      await refreshUser();
      setStatus('success');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setError(err?.detail || 'Failed to update profile.');
      setStatus('error');
    }
  };

  return (
    <DashboardLayout title="Edit Profile">
      <div className="max-w-lg">
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
          <p className="text-xs text-slate-500 mt-0.5">Update your name and contact details</p>
        </div>

        {/* Read-only info */}
        <div className="bg-white border border-slate-200 p-4 mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Account Info</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">{user?.email}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Account Type</p>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700 capitalize">
                  {user?.client_type === 'personal_business' ? 'Personal Business' : user?.client_type || '—'}
                </p>
              </div>
            </div>
            {user?.company?.name && (
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-0.5">Company</p>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">{user.company.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editable form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Edit Details</p>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Profile updated successfully.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelBase}>First Name *</label>
              <div className="relative">
                <IconWrap><User className="w-4 h-4" /></IconWrap>
                <input required type="text" value={form.first_name} onChange={set('first_name')}
                  placeholder="John" className={inputBase} />
              </div>
            </div>
            <div>
              <label className={labelBase}>Last Name</label>
              <div className="relative">
                <IconWrap><User className="w-4 h-4" /></IconWrap>
                <input type="text" value={form.last_name} onChange={set('last_name')}
                  placeholder="Doe" className={inputBase} />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={status === 'saving'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition-colors">
              {status === 'saving'
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : <><Save className="w-3.5 h-3.5" /> Save Changes</>
              }
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

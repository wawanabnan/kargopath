import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { kycAPI } from '../api';
import {
  CheckCircle2, AlertCircle, ArrowLeft, ArrowRight,
  User, Phone, MapPin, FileText, Building2, Shield,
} from 'lucide-react';

const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400";
const labelClass = "block text-sm font-bold text-slate-700 mb-2";

const KYC_LEVELS = [
  { level: 1, label: 'Basic Account',    desc: 'Account created',              icon: '📋' },
  { level: 2, label: 'Verified',         desc: 'Identity documents confirmed', icon: '✅' },
  { level: 3, label: 'Trusted Partner',  desc: 'Approved by KargoPath team',   icon: '⭐' },
];

export default function KYCPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [kycData, setKycData]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const [form, setForm] = useState({
    phone:      '',
    whatsapp:   '',
    address:    '',
    city:       '',
    postal_code:'',
    country:    'Indonesia',
    id_type:    'ktp',
    id_number:  '',
    npwp:       '',
    nib_siup:   '',
    company_email: '',
    position:   '',
  });

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    kycAPI.getProfile()
      .then(data => {
        setKycData(data);
        setForm(prev => ({ ...prev, ...data }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await kycAPI.updateProfile(form);
      setSaved(true);
      if (refreshUser) await refreshUser();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = typeof err === 'object'
        ? Object.values(err).flat().join(' | ')
        : 'Failed to save. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const isIndividual  = user?.client_type === 'individual';
  const isCorporate   = user?.client_type === 'corporate';
  const currentLevel  = user?.kyc_level || 1;
  const canBook       = user?.can_accept_booking;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-extrabold text-slate-900">Identity Verification</span>
          </div>
          <Link to="/dashboard" className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">

          {/* ── LEFT: Status Panel ─────────────────────────────────────── */}
          <div className="space-y-5">
            {/* KYC Level Badge */}
            <div className={`rounded-2xl p-6 border ${
              canBook ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  canBook ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  {canBook ? '✅' : '🔒'}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">KYC Status</p>
                  <p className={`font-extrabold text-lg ${canBook ? 'text-green-700' : 'text-amber-700'}`}>
                    Level {currentLevel} — {user?.get_kyc_level_display || (currentLevel === 1 ? 'Basic' : currentLevel === 2 ? 'Verified' : 'Trusted')}
                  </p>
                </div>
              </div>
              {canBook ? (
                <p className="text-sm text-green-700 font-medium">
                  ✅ You can accept quotations and confirm shipment bookings.
                </p>
              ) : (
                <p className="text-sm text-amber-700 font-medium">
                  Complete the form to unlock booking capabilities.
                </p>
              )}
            </div>

            {/* Level Roadmap */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Verification Levels</p>
              <div className="space-y-4">
                {KYC_LEVELS.map((lvl, i) => {
                  const done   = currentLevel >= lvl.level;
                  const active = currentLevel === lvl.level;
                  return (
                    <div key={lvl.level} className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 border-2 ${
                        done ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        {done ? <CheckCircle2 className="w-5 h-5" /> : lvl.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${done ? 'text-slate-900' : 'text-slate-400'}`}>{lvl.label}</p>
                        <p className={`text-xs font-medium ${done ? 'text-slate-500' : 'text-slate-300'}`}>{lvl.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* What's required */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Required for Level 2</p>
              <div className="space-y-2">
                {[
                  { label: 'Phone number', done: !!kycData?.phone },
                  { label: 'Full address',  done: !!kycData?.address },
                  ...(isIndividual
                    ? [{ label: 'ID number (KTP/Passport)', done: !!kycData?.id_number }]
                    : [
                        { label: 'NPWP', done: !!kycData?.npwp },
                        { label: 'NIB / SIUP', done: !!kycData?.nib_siup },
                      ]
                  ),
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? 'bg-green-100' : 'bg-slate-100'
                    }`}>
                      {done
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </div>
                    <span className={`text-sm font-medium ${done ? 'text-slate-700 line-through' : 'text-slate-600'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Form ────────────────────────────────────────────── */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h1 className="text-xl font-extrabold text-slate-900">Complete Your Profile</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Fill in the required fields below to reach <strong>Verified (Level 2)</strong> status.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border-b border-red-100 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {saved && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border-b border-green-100 text-green-700">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-bold">Profile saved successfully!</p>
                </div>
              )}

              <form onSubmit={handleSave} className="p-6 space-y-8">

                {/* Contact */}
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                    <Phone className="w-4 h-4 text-blue-600" /> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Phone Number *</label>
                      <input required type="tel" value={form.phone} onChange={set('phone')}
                        placeholder="+62 812 3456 7890" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>WhatsApp <span className="font-normal text-slate-400">(if different)</span></label>
                      <input type="tel" value={form.whatsapp} onChange={set('whatsapp')}
                        placeholder="+62 812 3456 7890" className={inputClass} />
                    </div>
                    {!isIndividual && (
                      <>
                        <div>
                          <label className={labelClass}>Position / Title</label>
                          <input type="text" value={form.position} onChange={set('position')}
                            placeholder="e.g. Logistics Manager" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Company Email <span className="font-normal text-slate-400">(official)</span></label>
                          <input type="email" value={form.company_email} onChange={set('company_email')}
                            placeholder="you@company.com" className={inputClass} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                    <MapPin className="w-4 h-4 text-blue-600" /> Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Full Address *</label>
                      <textarea required value={form.address} onChange={set('address')}
                        placeholder="Street name, building / unit number..."
                        className={inputClass + " h-20 resize-none"} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <label className={labelClass}>City *</label>
                        <input required type="text" value={form.city} onChange={set('city')}
                          placeholder="Jakarta" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Postal Code</label>
                        <input type="text" value={form.postal_code} onChange={set('postal_code')}
                          placeholder="12190" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Country</label>
                        <input type="text" value={form.country} onChange={set('country')}
                          placeholder="Indonesia" className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identity */}
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-blue-600" />
                    {isIndividual ? 'Identity Document' : 'Business Documents'}
                  </h3>

                  {isIndividual ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>ID Type *</label>
                        <select value={form.id_type} onChange={set('id_type')} className={inputClass + " cursor-pointer"}>
                          <option value="ktp">KTP (Indonesia)</option>
                          <option value="passport">Passport</option>
                          <option value="other">Other Government ID</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>ID Number *</label>
                        <input required type="text" value={form.id_number} onChange={set('id_number')}
                          placeholder="16-digit KTP number" className={inputClass} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>NPWP *</label>
                          <input required type="text" value={form.npwp} onChange={set('npwp')}
                            placeholder="XX.XXX.XXX.X-XXX.XXX" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>NIB / SIUP *</label>
                          <input required type="text" value={form.nib_siup} onChange={set('nib_siup')}
                            placeholder="NIB number" className={inputClass} />
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-slate-400 text-lg mt-0.5">📎</span>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Document Upload</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Supporting documents (NPWP scan, NIB, Akta Perusahaan) can be sent via email to{' '}
                            <a href="mailto:verify@kargopath.com" className="text-blue-600 font-bold">verify@kargopath.com</a>{' '}
                            or uploaded via the file upload feature (coming soon).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button type="submit" disabled={saving}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    {saving
                      ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                      : <><Shield className="w-5 h-5" /> Save & Verify Profile</>}
                  </button>
                  <Link to="/dashboard"
                    className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-center text-sm">
                    Do it Later
                  </Link>
                </div>

                <p className="text-xs text-slate-400 text-center">
                  Your data is encrypted and used solely for logistics verification purposes.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

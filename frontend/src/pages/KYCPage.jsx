import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { kycAPI } from '../api';
import {
  CheckCircle2, AlertCircle, Phone, MapPin, FileText, Shield,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const inputBase = "w-full pl-3 pr-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors";
const labelBase = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide";

const KYC_LEVELS = [
  { level: 1, label: 'Basic',    desc: 'Account created' },
  { level: 2, label: 'Verified', desc: 'Documents confirmed' },
  { level: 3, label: 'Trusted',  desc: 'Approved by team' },
];

export default function KYCPage() {
  const { user, refreshUser } = useAuth();

  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    phone: '', whatsapp: '', address: '', city: '',
    postal_code: '', country: 'Indonesia',
    id_type: 'ktp', id_number: '',
    npwp: '', nib_siup: '', company_email: '', position: '',
  });

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    kycAPI.getProfile()
      .then(data => { setKycData(data); setForm(prev => ({ ...prev, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await kycAPI.updateProfile(form);
      setSaved(true);
      if (refreshUser) await refreshUser();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(typeof err === 'object' ? Object.values(err).flat().join(' | ') : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const isPersonalBusiness = user?.client_type === 'personal_business';
  const isCompany          = user?.client_type === 'company';
  const currentLevel       = user?.kyc_level || 1;
  const canBook            = user?.can_accept_booking;

  // Required fields checklist based on client type
  const requiredFields = [
    { label: 'Phone number',  done: !!kycData?.phone },
    { label: 'Full address',  done: !!kycData?.address },
    ...(isPersonalBusiness
      ? [{ label: 'ID number (KTP/Passport)', done: !!kycData?.id_number }]
      : [
          { label: 'NPWP',       done: !!kycData?.npwp },
          { label: 'NIB / SIUP', done: !!kycData?.nib_siup },
        ]
    ),
  ];

  if (loading) return (
    <DashboardLayout title="Identity Verification">
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-xs text-slate-500">Loading...</span>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Identity Verification">
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Left: Status panel ── */}
        <div className="space-y-4">
          {/* KYC level badge */}
          <div className={`p-4 border ${canBook ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`w-4 h-4 ${canBook ? 'text-green-600' : 'text-amber-600'}`} />
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">KYC Status</p>
            </div>
            <p className={`text-sm font-bold ${canBook ? 'text-green-700' : 'text-amber-700'}`}>
              Level {currentLevel} — {currentLevel === 1 ? 'Basic' : currentLevel === 2 ? 'Verified' : 'Trusted'}
            </p>
            <p className={`text-xs mt-1 ${canBook ? 'text-green-600' : 'text-amber-600'}`}>
              {canBook
                ? '✓ You can accept quotations and confirm bookings.'
                : 'Complete the form below to unlock booking.'}
            </p>
          </div>

          {/* Level roadmap */}
          <div className="bg-white border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Verification Levels</p>
            <div className="space-y-3">
              {KYC_LEVELS.map(lvl => {
                const done = currentLevel >= lvl.level;
                return (
                  <div key={lvl.level} className="flex items-center gap-3">
                    <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                      done ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-400'
                    }`}>
                      {done ? <CheckCircle2 className="w-3 h-3" /> : lvl.level}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${done ? 'text-slate-800' : 'text-slate-400'}`}>{lvl.label}</p>
                      <p className={`text-xs ${done ? 'text-slate-500' : 'text-slate-300'}`}>{lvl.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Required fields checklist */}
          <div className="bg-white border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Required for Level 2</p>
            <div className="space-y-2">
              {requiredFields.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 flex items-center justify-center flex-shrink-0 ${done ? 'text-green-500' : 'text-slate-300'}`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 border border-slate-300" />}
                  </div>
                  <span className={`text-xs ${done ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Complete Your Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill in the required fields to reach <strong>Verified (Level 2)</strong> status.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-5 py-3 bg-red-50 border-b border-red-200 text-red-700 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 px-5 py-3 bg-green-50 border-b border-green-200 text-green-700 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Profile saved successfully.
              </div>
            )}

            <form onSubmit={handleSave} className="p-5 space-y-5">

              {/* Contact */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelBase}>
                      {isCompany ? 'Office Phone *' : 'Phone / WhatsApp *'}
                    </label>
                    <input required type="tel" value={form.phone} onChange={set('phone')}
                      placeholder={isCompany ? '+62 21 1234 5678' : '+62 812 3456 7890'}
                      className={inputBase} />
                    {isCompany && (
                      <p className="text-xs text-slate-400 mt-1">Office number. WhatsApp available once shipment is active.</p>
                    )}
                  </div>
                  {isPersonalBusiness && (
                    <div>
                      <label className={labelBase}>WhatsApp <span className="font-normal text-slate-400">(if different)</span></label>
                      <input type="tel" value={form.whatsapp} onChange={set('whatsapp')}
                        placeholder="+62 812 3456 7890" className={inputBase} />
                    </div>
                  )}
                  {isCompany && (
                    <>
                      <div>
                        <label className={labelBase}>Position / Title</label>
                        <input type="text" value={form.position} onChange={set('position')}
                          placeholder="e.g. Logistics Manager" className={inputBase} />
                      </div>
                      <div>
                        <label className={labelBase}>Company Email</label>
                        <input type="email" value={form.company_email} onChange={set('company_email')}
                          placeholder="you@company.com" className={inputBase} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={labelBase}>Full Address *</label>
                    <textarea required value={form.address} onChange={set('address')}
                      placeholder="Street name, building / unit number..."
                      className={inputBase + " h-16 resize-none"} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className={labelBase}>City *</label>
                      <input required type="text" value={form.city} onChange={set('city')}
                        placeholder="Jakarta" className={inputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Postal Code</label>
                      <input type="text" value={form.postal_code} onChange={set('postal_code')}
                        placeholder="12190" className={inputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Country</label>
                      <input type="text" value={form.country} onChange={set('country')}
                        placeholder="Indonesia" className={inputBase} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity / Business docs */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {isPersonalBusiness ? 'Identity Document' : 'Business Documents'}
                </p>

                {isPersonalBusiness ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelBase}>ID Type *</label>
                      <select value={form.id_type} onChange={set('id_type')} className={inputBase + " cursor-pointer"}>
                        <option value="ktp">KTP (Indonesia)</option>
                        <option value="passport">Passport</option>
                        <option value="other">Other Government ID</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelBase}>ID Number *</label>
                      <input required type="text" value={form.id_number} onChange={set('id_number')}
                        placeholder="16-digit KTP number" className={inputBase} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelBase}>NPWP *</label>
                        <input required type="text" value={form.npwp} onChange={set('npwp')}
                          placeholder="XX.XXX.XXX.X-XXX.XXX" className={inputBase} />
                      </div>
                      <div>
                        <label className={labelBase}>NIB / SIUP *</label>
                        <input required type="text" value={form.nib_siup} onChange={set('nib_siup')}
                          placeholder="NIB number" className={inputBase} />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <span className="flex-shrink-0">📎</span>
                      <p>Supporting documents (NPWP scan, NIB, Akta) can be sent to{' '}
                        <a href="mailto:verify@kargopath.com" className="text-blue-600 font-semibold">verify@kargopath.com</a>.
                        File upload coming soon.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition-colors">
                  {saving
                    ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    : <><Shield className="w-3.5 h-3.5" /> Save & Verify</>
                  }
                </button>
                <Link to="/dashboard"
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors">
                  Do it Later
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2,
  User, Building2, Briefcase, Mail, Lock, Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quotationRequestAPI } from '../api';

const FREE_DOMAINS = new Set([
  'gmail.com','yahoo.com','yahoo.co.id','hotmail.com','outlook.com',
  'live.com','icloud.com','protonmail.com','ymail.com','rocketmail.com',
  'mail.com','aol.com','gmx.com','zoho.com',
]);

const CLIENT_TYPES = [
  {
    id: 'company',
    icon: <Building2 className="w-5 h-5" />,
    label: 'Company',
    sub: 'CV, PT, Corporate, BUMN',
    desc: 'Registered business entity with formal company documents.',
    emailNote: 'Company email required (e.g. @yourcompany.com).',
  },
  {
    id: 'personal_business',
    icon: <User className="w-5 h-5" />,
    label: 'Personal Business',
    sub: 'Freelancer, Trader, Reseller',
    desc: 'No formal company entity but active as a shipping client. Subject to sales review.',
    emailNote: 'Personal email accepted.',
  },
];

const inputBase = "w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors";
const labelBase = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide";

function IconWrap({ children }) {
  return <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{children}</div>;
}

const STEPS = ['Account Type', 'Credentials', 'Profile'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [step, setStep]       = useState(1);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    client_type: '', email: '', password: '', confirm_password: '',
    first_name: '', last_name: '', company_name: '', position: '', phone: '',
  });

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const validateStep1 = () => {
    if (!form.client_type) { setError('Please select an account type.'); return false; }
    return true;
  };

  const validateStep2 = () => {
    setError('');
    if (!form.email) { setError('Email is required.'); return false; }
    if (form.client_type === 'company') {
      const domain = form.email.split('@')[1]?.toLowerCase();
      if (domain && FREE_DOMAINS.has(domain)) {
        setError(`Company accounts require a company email. Free providers like @${domain} are not accepted.`);
        return false;
      }
    }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return false; }
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return false; }
    return true;
  };

  const validateStep3 = () => {
    setError('');
    if (!form.first_name.trim()) { setError('First name is required.'); return false; }
    if (form.client_type === 'company' && !form.company_name.trim()) {
      setError('Company name is required.'); return false;
    }
    return true;
  };

  const next = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    try {
      await register(form);
      const draftKey = localStorage.getItem('kargopath_draft_key');
      if (draftKey) {
        try {
          const req = await quotationRequestAPI.submitDraft(draftKey);
          localStorage.removeItem('kargopath_draft_key');
          navigate('/dashboard', { replace: true, state: { quoteSubmitted: true, reference: req.reference_no } });
          return;
        } catch {
          localStorage.removeItem('kargopath_draft_key');
        }
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = typeof err === 'object'
        ? Object.entries(err).map(([, v]) => Array.isArray(v) ? v.join(', ') : v).join(' | ')
        : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans overflow-x-hidden">

      {/* ── Left sidebar ── */}
      <div className="hidden lg:flex w-72 xl:w-80 bg-slate-900 flex-col flex-shrink-0">
        <div className="px-7 py-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-white font-bold tracking-tight">KargoPath</span>
          </Link>
        </div>

        <div className="px-7 py-7 flex-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Registration</p>
          <div className="space-y-0.5">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done   = step > n;
              const active = step === n;
              return (
                <div key={n} className={`flex items-center gap-3 px-3 py-2.5 ${active ? 'bg-slate-800' : ''}`}>
                  <div className={`w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                    done   ? 'bg-blue-600 border-blue-600 text-white' :
                    active ? 'bg-white border-white text-slate-900' :
                             'border-slate-700 text-slate-600'
                  }`}>
                    {done ? <CheckCircle2 className="w-3 h-3" /> : n}
                  </div>
                  <span className={`text-sm ${active ? 'text-white font-semibold' : done ? 'text-blue-400' : 'text-slate-600'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="px-7 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-600">© 2026 KargoPath</p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900 text-sm">KargoPath</span>
          </Link>
          <div className="flex items-center gap-3">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-6 h-0.5 ${step > i + 1 ? 'bg-blue-600' : step === i + 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            ))}
          </div>
          <Link to="/login" className="text-xs font-semibold text-blue-600">Sign in</Link>
        </div>

        <div className="flex-1 flex items-start justify-center px-5 py-8 lg:px-12 lg:py-10">
          <div className="w-full max-w-md">

            {/* Title */}
            <div className="mb-5">
              <h1 className="text-lg font-bold text-slate-900">
                {step === 1 && 'Select Account Type'}
                {step === 2 && 'Set Your Credentials'}
                {step === 3 && 'Complete Your Profile'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Step {step} of {STEPS.length}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-2">
                {CLIENT_TYPES.map(t => {
                  const selected = form.client_type === t.id;
                  return (
                    <button key={t.id} type="button"
                      onClick={() => { setForm(p => ({ ...p, client_type: t.id })); setError(''); }}
                      className={`w-full text-left p-4 border-2 transition-all ${
                        selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {t.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className={`text-sm font-bold ${selected ? 'text-blue-700' : 'text-slate-900'}`}>{t.label}</p>
                            <span className="text-xs text-slate-400">{t.sub}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p>
                          {selected && (
                            <p className="text-xs font-semibold text-blue-600 mt-1.5">📧 {t.emailNote}</p>
                          )}
                        </div>
                        <div className={`w-4 h-4 border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                          selected ? 'border-blue-600' : 'border-slate-300'
                        }`}>
                          {selected && <div className="w-2 h-2 bg-blue-600" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="space-y-3">
                {form.client_type === 'company' && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    Company accounts require a company email address (e.g. @yourcompany.com).
                  </div>
                )}
                <div>
                  <label className={labelBase}>Email Address</label>
                  <div className="relative">
                    <IconWrap><Mail className="w-4 h-4" /></IconWrap>
                    <input required type="email" value={form.email} onChange={set('email')}
                      placeholder={form.client_type === 'company' ? 'you@yourcompany.com' : 'you@example.com'}
                      autoComplete="email" className={inputBase} />
                  </div>
                </div>
                <div>
                  <label className={labelBase}>Password</label>
                  <div className="relative">
                    <IconWrap><Lock className="w-4 h-4" /></IconWrap>
                    <input required type="password" value={form.password} onChange={set('password')}
                      placeholder="Minimum 8 characters" autoComplete="new-password" className={inputBase} />
                  </div>
                  {form.password && (
                    <div className="flex gap-1 mt-1.5">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`h-0.5 flex-1 transition-all ${
                          form.password.length >= n * 3
                            ? form.password.length >= 10 ? 'bg-green-500' : 'bg-amber-400'
                            : 'bg-slate-200'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelBase}>Confirm Password</label>
                  <div className="relative">
                    <IconWrap><Lock className="w-4 h-4" /></IconWrap>
                    <input required type="password" value={form.confirm_password} onChange={set('confirm_password')}
                      placeholder="Repeat your password" autoComplete="new-password" className={inputBase} />
                    {form.confirm_password && (
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        form.password === form.confirm_password ? 'text-green-500' : 'text-red-400'
                      }`}>
                        {form.password === form.confirm_password
                          ? <CheckCircle2 className="w-4 h-4" />
                          : <AlertCircle className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-3">
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

                {/* Phone — different label & hint per type */}
                <div>
                  <label className={labelBase}>
                    {form.client_type === 'company' ? 'Office Phone *' : 'Phone / WhatsApp *'}
                  </label>
                  <div className="relative">
                    <IconWrap><Phone className="w-4 h-4" /></IconWrap>
                    <input required type="tel" value={form.phone} onChange={set('phone')}
                      placeholder={form.client_type === 'company' ? '+62 21 1234 5678' : '+62 812 3456 7890'}
                      className={inputBase} />
                  </div>
                  {form.client_type === 'company' && (
                    <p className="text-xs text-slate-400 mt-1">
                      Use your company's office number. WhatsApp communication is available once a shipment is active.
                    </p>
                  )}
                </div>

                {form.client_type === 'company' && (
                  <>
                    <div>
                      <label className={labelBase}>Company Name *</label>
                      <div className="relative">
                        <IconWrap><Building2 className="w-4 h-4" /></IconWrap>
                        <input required type="text" value={form.company_name} onChange={set('company_name')}
                          placeholder="PT Logistik Nusantara" className={inputBase} />
                      </div>
                    </div>
                    <div>
                      <label className={labelBase}>Position / Title</label>
                      <div className="relative">
                        <IconWrap><Briefcase className="w-4 h-4" /></IconWrap>
                        <input type="text" value={form.position} onChange={set('position')}
                          placeholder="e.g. Logistics Manager" className={inputBase} />
                      </div>
                    </div>
                  </>
                )}

                {/* KYC notice */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <span className="flex-shrink-0">⚠</span>
                  <div>
                    <p className="font-bold mb-0.5">Verification required to confirm bookings</p>
                    <p className="text-amber-700 leading-relaxed">
                      {form.client_type === 'company'
                        ? 'Requires: NPWP + NIB/SIUP + company email. Communication via email or in-app chat.'
                        : 'Personal Business accounts require sales review before booking is enabled.'}
                    </p>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                    : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* Nav buttons (step 1 & 2) */}
            {step < 3 && (
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-200">
                {step > 1
                  ? <button type="button" onClick={() => { setError(''); setStep(s => s - 1); }}
                      className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  : <Link to="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                      <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                }
                <button type="button" onClick={next}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-5 text-center">
              By creating an account you agree to our{' '}
              <a href="#" className="underline hover:text-slate-600">Terms of Service</a> and{' '}
              <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

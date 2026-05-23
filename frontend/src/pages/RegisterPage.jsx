import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, User, Building2, Briefcase, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quotationRequestAPI } from '../api';

// Free email domains — mirrors backend blocklist
const FREE_DOMAINS = new Set([
  'gmail.com','yahoo.com','yahoo.co.id','hotmail.com','outlook.com',
  'live.com','icloud.com','protonmail.com','ymail.com','rocketmail.com',
  'mail.com','aol.com','gmx.com','zoho.com',
]);

const CLIENT_TYPES = [
  {
    id: 'individual',
    icon: <User className="w-7 h-7" />,
    label: 'Individual',
    sub: 'Personal / Freelancer',
    desc: 'Importing or exporting goods as a private person or sole trader.',
    emailNote: 'Personal email (Gmail, etc.) accepted.',
    color: 'sky',
  },
  {
    id: 'business',
    icon: <Briefcase className="w-7 h-7" />,
    label: 'Business / SME',
    sub: 'CV, UD, PT Kecil',
    desc: 'Small or medium business with moderate shipping volume.',
    emailNote: 'Company email required (e.g. @yourcompany.com).',
    color: 'blue',
  },
  {
    id: 'corporate',
    icon: <Building2 className="w-7 h-7" />,
    label: 'Corporate',
    sub: 'PT Tbk, MNC, BUMN',
    desc: 'Enterprise or large company with high-volume logistics needs.',
    emailNote: 'Company email required (e.g. @yourcompany.com).',
    color: 'indigo',
  },
];

const COLOR = {
  sky:    { border: 'border-sky-500',    bg: 'bg-sky-50',    text: 'text-sky-700',    ring: 'ring-sky-200'    },
  blue:   { border: 'border-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200'   },
  indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
};

const inputClass = "w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400";

function IconWrap({ children }) {
  return <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{children}</div>;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [step, setStep]     = useState(1);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    client_type:      '',
    email:            '',
    password:         '',
    confirm_password: '',
    first_name:       '',
    last_name:        '',
    company_name:     '',
    position:         '',
    phone:            '',
  });

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const selectedType = CLIENT_TYPES.find(t => t.id === form.client_type);

  // ── Step validation ────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.client_type) { setError('Please select your account type.'); return false; }
    return true;
  };

  const validateStep2 = () => {
    setError('');
    if (!form.email) { setError('Email is required.'); return false; }
    if (form.client_type === 'business' || form.client_type === 'corporate') {
      const domain = form.email.split('@')[1]?.toLowerCase();
      if (domain && FREE_DOMAINS.has(domain)) {
        setError(
          `Business and Corporate accounts require a company email address. ` +
          `Free providers like @${domain} are not accepted.`
        );
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
    if (form.client_type !== 'individual' && !form.company_name.trim()) {
      setError('Company name is required for Business and Corporate accounts.');
      return false;
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
      
      // Auto-submit pending draft quote if any
      const draftKey = localStorage.getItem('kargopath_draft_key');
      if (draftKey) {
        try {
          const req = await quotationRequestAPI.submitDraft(draftKey);
          localStorage.removeItem('kargopath_draft_key');
          navigate('/dashboard', { replace: true, state: { quoteSubmitted: true, reference: req.reference_no } });
          return;
        } catch (apiErr) {
          console.error("Auto-submit draft failed:", apiErr);
          localStorage.removeItem('kargopath_draft_key');
        }
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = typeof err === 'object'
        ? Object.entries(err).map(([k, v]) => `${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-br from-blue-700 to-sky-500 z-0" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl z-0" />

      <div className="w-full max-w-lg z-10">
        {/* Back to home */}
        <div className="mb-5">
          <Link to="/" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-xl mb-4 hover:scale-105 transition-transform">
            <Package className="w-7 h-7 text-blue-600" />
          </Link>
          <h1 className="text-3xl font-extrabold text-white mb-1.5">Create Your Account</h1>
          <p className="text-blue-100 text-sm font-medium">
            Already have one?{' '}
            <Link to="/login" target="_blank" rel="noopener noreferrer" className="text-white font-bold underline underline-offset-2 hover:text-blue-200">Sign in here</Link>
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {['Account Type','Credentials','Your Profile'].map((label, i) => {
            const n = i + 1;
            const done   = step > n;
            const active = step === n;
            return (
              <React.Fragment key={n}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done   ? 'bg-green-500 border-green-500 text-white' :
                    active ? 'bg-white border-white text-blue-700' :
                             'bg-white/20 border-white/30 text-white/50'
                  }`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : n}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${active ? 'text-white' : 'text-white/50'}`}>{label}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-px max-w-[40px] ${step > n ? 'bg-green-400' : 'bg-white/20'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border-b border-red-100 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="p-7">

            {/* ── STEP 1: Client Type ─────────────────────────────────── */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">What best describes you?</h2>
                <p className="text-sm text-slate-500 font-medium mb-6">This helps us tailor your experience and verify your account correctly.</p>
                <div className="space-y-3">
                  {CLIENT_TYPES.map(t => {
                    const selected = form.client_type === t.id;
                    const c = COLOR[t.color];
                    return (
                      <button key={t.id} type="button"
                        onClick={() => { setForm(p => ({ ...p, client_type: t.id })); setError(''); }}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                          selected ? `${c.border} ${c.bg} ring-4 ${c.ring}` : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                            selected ? `${c.bg} ${c.text}` : 'bg-slate-100 text-slate-500'
                          }`}>
                            {t.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-bold ${selected ? c.text : 'text-slate-900'}`}>{t.label}</p>
                              <span className="text-xs text-slate-400 font-medium">{t.sub}</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{t.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            selected ? `${c.border} bg-white` : 'border-slate-300'
                          }`}>
                            {selected && <div className={`w-2.5 h-2.5 rounded-full ${c.bg.replace('bg-','bg-').replace('50','600')}`} />}
                          </div>
                        </div>
                        {selected && (
                          <div className={`mt-3 pt-3 border-t ${c.border.replace('border-','border-').replace('500','200')} flex items-center gap-1.5`}>
                            <span className="text-xs">📧</span>
                            <p className={`text-xs font-semibold ${c.text}`}>{t.emailNote}</p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 2: Credentials ─────────────────────────────────── */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">Set Your Credentials</h2>
                <p className="text-sm text-slate-500 font-medium mb-6">
                  {form.client_type !== 'individual'
                    ? '⚠️ Business and Corporate accounts require a company email address.'
                    : 'Use your primary email to sign in to KargoPath.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Email Address
                      {form.client_type !== 'individual' && (
                        <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Company email required</span>
                      )}
                    </label>
                    <div className="relative">
                      <IconWrap><Mail className="w-5 h-5" /></IconWrap>
                      <input required type="email" value={form.email} onChange={set('email')}
                        placeholder={form.client_type !== 'individual' ? 'you@yourcompany.com' : 'you@example.com'}
                        autoComplete="email" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                    <div className="relative">
                      <IconWrap><Lock className="w-5 h-5" /></IconWrap>
                      <input required type="password" value={form.password} onChange={set('password')}
                        placeholder="Min. 8 characters" autoComplete="new-password" className={inputClass} />
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-all ${
                          form.password.length >= n * 3
                            ? form.password.length >= 10 ? 'bg-green-500' : 'bg-yellow-400'
                            : 'bg-slate-200'
                        }`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <IconWrap><Lock className="w-5 h-5" /></IconWrap>
                      <input required type="password" value={form.confirm_password} onChange={set('confirm_password')}
                        placeholder="Repeat your password" autoComplete="new-password" className={inputClass} />
                      {form.confirm_password && (
                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                          form.password === form.confirm_password ? 'text-green-500' : 'text-red-400'
                        }`}>
                          {form.password === form.confirm_password ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Profile ─────────────────────────────────────── */}
            {step === 3 && (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">Your Basic Profile</h2>
                <p className="text-sm text-slate-500 font-medium mb-6">
                  You can complete full verification later to unlock booking capabilities.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label>
                      <div className="relative">
                        <IconWrap><User className="w-5 h-5" /></IconWrap>
                        <input required type="text" value={form.first_name} onChange={set('first_name')} placeholder="John" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                      <div className="relative">
                        <IconWrap><User className="w-5 h-5" /></IconWrap>
                        <input type="text" value={form.last_name} onChange={set('last_name')} placeholder="Doe" className={inputClass} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Phone / WhatsApp *
                    </label>
                    <div className="relative">
                      <IconWrap><Phone className="w-5 h-5" /></IconWrap>
                      <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+62 812 3456 7890" className={inputClass} />
                    </div>
                  </div>

                  {form.client_type !== 'individual' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Company Name *</label>
                        <div className="relative">
                          <IconWrap><Building2 className="w-5 h-5" /></IconWrap>
                          <input required type="text" value={form.company_name} onChange={set('company_name')}
                            placeholder={form.client_type === 'corporate' ? 'PT Logistik Nusantara Tbk' : 'CV Karya Mandiri'}
                            className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Your Position / Title</label>
                        <div className="relative">
                          <IconWrap><Briefcase className="w-5 h-5" /></IconWrap>
                          <input type="text" value={form.position} onChange={set('position')} placeholder="e.g. Logistics Manager" className={inputClass} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* KYC notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                    <span className="text-xl flex-shrink-0">🔒</span>
                    <div>
                      <p className="text-sm font-bold text-amber-800 mb-1">Identity Verification Required to Confirm Bookings</p>
                      <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        You can request quotations right away. To accept a booking and create shipments,
                        you'll need to complete identity verification in your profile settings.
                        {form.client_type === 'individual' && ' Requires: KTP/Passport + phone.'}
                        {form.client_type === 'business' && ' Requires: NPWP + NIB/SIUP + phone.'}
                        {form.client_type === 'corporate' && ' Requires: NPWP + NIB + company docs.'}
                      </p>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 text-lg">
                    {loading
                      ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                      : <><span>Create Account</span><ArrowRight className="w-5 h-5" /></>}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer nav */}
          {step < 3 && (
            <div className="px-7 pb-7 flex items-center justify-between gap-4">
              {step > 1
                ? <button type="button" onClick={() => { setError(''); setStep(s => s - 1); }}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                : <div />}
              <button type="button" onClick={next}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5 text-sm">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          By creating an account you agree to our{' '}
          <a href="#" className="underline hover:text-slate-600">Terms of Service</a> and{' '}
          <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

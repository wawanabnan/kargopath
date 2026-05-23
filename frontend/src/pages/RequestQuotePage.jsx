import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, ArrowLeft, ArrowRight, CheckCircle2,
  Anchor, Plane, Truck, AlertCircle, MapPin, Search,
  ChevronDown, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quotationRequestAPI, locationsAPI } from '../api';

// ── Service Matrix Helpers ────────────────────────────────────────────────────
const needsPickup     = (scope) => scope.startsWith('d2');
const needsDelivery   = (scope) => scope.endsWith('2d');
const needsOriginPort = (scope) => scope.startsWith('p2');
const needsDestPort   = (scope) => scope.endsWith('2p');

// ── Style constants ───────────────────────────────────────────────────────────
const inputCls = 'w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors';
const labelCls = 'block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5';
const selectCls = 'w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors appearance-none';

// ── Searchable Location Dropdown ──────────────────────────────────────────────
function LocationSelect({ label, placeholder, options, value, onChange, required, icon: Icon }) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (value) {
      const found = options.find(o => o.value === value);
      setQuery(found ? found.label : '');
    } else {
      setQuery('');
    }
  }, [value, options]);

  const filtered = options
    .filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 15);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setQuery(opt.label);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className={labelCls}>{label}{required && ' *'}</label>}
      <div className="relative">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />}
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); onChange(''); }}
          onFocus={() => { setOpen(true); setFocused(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          className={`${inputCls} ${Icon ? 'pl-9' : 'pl-3'} pr-8`}
        />
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {value && (
        <p className="text-xs text-blue-600 font-semibold mt-1">
          ✓ {options.find(o => o.value === value)?.label || value}
        </p>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 shadow-lg mt-0.5 max-h-52 overflow-y-auto">
          {filtered.map(opt => (
            <button key={opt.value} type="button"
              onMouseDown={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-slate-100 last:border-0 transition-colors ${
                opt.value === value ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-800'
              }`}>
              <span className="font-bold text-slate-500 mr-2 text-xs">{opt.code}</span>
              {opt.name}
              {opt.city && opt.city !== opt.name && <span className="text-slate-400 text-xs ml-1">— {opt.city}</span>}
            </button>
          ))}
        </div>
      )}
      {open && query.length > 1 && filtered.length === 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 shadow-lg mt-0.5 px-3 py-2 text-xs text-slate-400">
          No results for "{query}"
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const STEPS = ['Service', 'Routing', 'Cargo'];

const MODES = [
  { id: 'sea',  label: 'Sea Freight',   icon: Anchor, sub: 'FCL / LCL' },
  { id: 'air',  label: 'Air Freight',   icon: Plane,  sub: 'Express / General' },
  { id: 'land', label: 'Land Trucking', icon: Truck,  sub: 'Point to Point' },
];

const SCOPES = {
  sea:  [
    { id: 'd2d', label: 'Door to Door',  sub: 'Pickup → Delivery' },
    { id: 'd2p', label: 'Door to Port',  sub: 'Pickup → Port' },
    { id: 'p2d', label: 'Port to Door',  sub: 'Port → Delivery' },
    { id: 'p2p', label: 'Port to Port',  sub: 'Port → Port' },
  ],
  air:  [
    { id: 'd2d', label: 'Door to Door',     sub: 'Pickup → Delivery' },
    { id: 'd2p', label: 'Door to Airport',  sub: 'Pickup → Airport' },
    { id: 'p2d', label: 'Airport to Door',  sub: 'Airport → Delivery' },
    { id: 'p2p', label: 'Airport to Airport', sub: 'Airport → Airport' },
  ],
  land: [
    { id: 'd2d', label: 'Point to Point', sub: 'City → City' },
  ],
};

const INCOTERMS = ['EXW','FCA','FOB','CFR','CIF','DAP','DDP','CPT','CIP'];

const CONTAINER_SIZES = [
  { value: '20GP', label: "20' GP Standard" },
  { value: '40GP', label: "40' GP Standard" },
  { value: '40HC', label: "40' HC High Cube" },
  { value: '20RF', label: "20' RF Reefer" },
  { value: '40RF', label: "40' RF Reefer" },
];

const PACKAGE_TYPES = ['Pallet','Carton','Crate','Drum','Bag','Bundle'];

export default function RequestQuotePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Location data from API ──────────────────────────────────────────────────
  const [seaPorts,  setSeaPorts]  = useState([]);
  const [airports,  setAirports]  = useState([]);
  const [cities,    setCities]    = useState([]);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const [seaRes, airRes, cityRes] = await Promise.all([
          locationsAPI.ports({ port_type: 'SEA', page_size: 200 }),
          locationsAPI.ports({ port_type: 'AIR', page_size: 200 }),
          locationsAPI.cities({ page_size: 200 }),
        ]);
        const toOpt = (items) => (items?.results ?? items ?? []).map(p => ({
          value: p.code || p.id,
          label: p.display_label || `${p.name}, ${p.city || p.province || ''}`.trim(),
          code:  p.code || '',
          name:  p.name,
          city:  p.city || p.province || '',
        }));
        setSeaPorts(toOpt(seaRes));
        setAirports(toOpt(airRes));
        setCities((cityRes?.results ?? cityRes ?? []).map(c => ({
          value: c.name,
          label: c.province ? `${c.name}, ${c.province}` : c.name,
          code:  '',
          name:  c.name,
          city:  c.province || '',
        })));
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setLocLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [step, setStep]         = useState(1);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    // Step 1
    mode: 'sea', scope: 'p2p', sea_type: 'FCL',
    // Step 2 — Origin
    pol: '', pol_name: '', pickup_city: '', pickup_address: '', pickup_country: 'Indonesia',
    shipper_same_as_client: true,
    shipper_company: '', shipper_pic: '', shipper_phone: '', shipper_email: '',
    // Step 2 — Destination
    pod: '', pod_name: '', delivery_city: '', delivery_address: '', delivery_country: 'Indonesia',
    consignee_same_as_client: false,
    consignee_company: '', consignee_pic: '', consignee_phone: '', consignee_email: '',
    // Step 3 — Cargo
    commodity: '', hs_code: '', is_dangerous: false, dg_class: '',
    incoterms: '', cargo_value: '', cargo_currency: 'USD', target_etd: '',
    special_instructions: '',
    container_size: '', container_qty: '', container_weight: '',
    package_type: 'Pallet', package_qty: '', gross_weight: '', volume_cbm: '',
  });

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const setE = (field) => (e) => set(field, e.target.value);

  // Auto-fill shipper from user profile
  useEffect(() => {
    if (user && form.shipper_same_as_client) {
      const name = user.company?.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
      setForm(p => ({
        ...p,
        shipper_company: name,
        shipper_pic:     `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        shipper_email:   user.email || '',
      }));
    }
  }, [user, form.shipper_same_as_client]);

  const changeMode = (m) => {
    const defaultScope = m === 'land' ? 'd2d' : 'p2p';
    setForm(p => ({ ...p, mode: m, scope: defaultScope, pol: '', pod: '', pickup_city: '', delivery_city: '' }));
  };

  const portOptions = form.mode === 'air' ? airports : seaPorts;
  const portLabel   = form.mode === 'air' ? 'Airport' : 'Port';

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.mode) { setError('Please select a transport mode.'); return false; }
    if (!form.scope) { setError('Please select a service scope.'); return false; }
    if (form.mode === 'sea' && !form.sea_type) { setError('Please select FCL or LCL.'); return false; }
    return true;
  };

  const validateStep2 = () => {
    setError('');
    if (needsOriginPort(form.scope) && !form.pol) {
      setError(`Please select an origin ${portLabel}.`); return false;
    }
    if (needsPickup(form.scope) && !form.pickup_city) {
      setError('Please select an origin city.'); return false;
    }
    if (needsPickup(form.scope) && !form.pickup_address) {
      setError('Please enter the pickup address.'); return false;
    }
    if (needsDestPort(form.scope) && !form.pod) {
      setError(`Please select a destination ${portLabel}.`); return false;
    }
    if (needsDelivery(form.scope) && !form.delivery_city) {
      setError('Please select a destination city.'); return false;
    }
    if (needsDelivery(form.scope) && !form.delivery_address) {
      setError('Please enter the delivery address.'); return false;
    }
    return true;
  };

  const validateStep3 = () => {
    setError('');
    if (!form.commodity.trim()) { setError('Commodity is required.'); return false; }
    if (form.mode === 'sea' && form.sea_type === 'FCL') {
      if (!form.container_size) { setError('Container size is required.'); return false; }
      if (!form.container_qty)  { setError('Container quantity is required.'); return false; }
    } else {
      if (!form.package_qty)   { setError('Package quantity is required.'); return false; }
      if (!form.gross_weight)  { setError('Gross weight is required.'); return false; }
      if (!form.volume_cbm)    { setError('Volume (CBM) is required.'); return false; }
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

  const back = () => { setError(''); setStep(s => s - 1); window.scrollTo({ top: 0 }); };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    try {
      if (user) {
        await quotationRequestAPI.submit(form);
        setSubmitted(true);
      } else {
        try {
          const { draft_key } = await quotationRequestAPI.saveDraft(form);
          localStorage.setItem('kargopath_draft_key', draft_key);
        } catch {
          localStorage.setItem('kargopath_pending_quote', JSON.stringify(form));
        }
        navigate('/register', { state: { quotePending: true } });
      }
    } catch (err) {
      setError(err?.detail || 'Failed to submit. Please check your form and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 p-10 text-center max-w-sm w-full">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-sm font-bold text-slate-900 mb-2">Request Submitted</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Your quotation request has been received. Our sales team will review and respond within 2–4 business hours.
        </p>
        <Link to="/dashboard"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-block">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 font-sans overflow-x-hidden">

      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-5 h-12 flex items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> {user ? 'Back to Dashboard' : 'Back to Home'}
        </Link>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900 text-sm tracking-tight">KargoPath</span>
        </div>
        {!user && (
          <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline">Sign in</Link>
        )}
        {user && <div className="w-16" />}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Page title + progress */}
        <div className="mb-6">
          <h1 className="text-base font-bold text-slate-900">Request a Quotation</h1>
          <p className="text-xs text-slate-500 mt-0.5">Step {step} of {STEPS.length} — {STEPS[step - 1]}</p>
          <div className="flex gap-1 mt-3">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 transition-all ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 mb-4">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        {/* ── STEP 1: Service ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Mode */}
            <div className="bg-white border border-slate-200 p-5">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">Transport Mode</h2>
              <div className="grid grid-cols-3 gap-3">
                {MODES.map(m => {
                  const Icon = m.icon;
                  const active = form.mode === m.id;
                  return (
                    <button key={m.id} type="button" onClick={() => changeMode(m.id)}
                      className={`p-4 border-2 text-center transition-all ${
                        active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                      <p className={`text-xs font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>{m.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scope */}
            <div className="bg-white border border-slate-200 p-5">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">Service Scope</h2>
              <div className="grid grid-cols-2 gap-2">
                {SCOPES[form.mode].map(s => {
                  const active = form.scope === s.id;
                  return (
                    <button key={s.id} type="button" onClick={() => set('scope', s.id)}
                      className={`p-3 border-2 text-left transition-all ${
                        active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      <p className={`text-xs font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>{s.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sea type */}
            {form.mode === 'sea' && (
              <div className="bg-white border border-slate-200 p-5">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">Ocean Freight Type</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'FCL', label: 'FCL', sub: 'Full Container Load' },
                    { id: 'LCL', label: 'LCL', sub: 'Less than Container Load' },
                  ].map(t => {
                    const active = form.sea_type === t.id;
                    return (
                      <button key={t.id} type="button" onClick={() => set('sea_type', t.id)}
                        className={`p-3 border-2 text-left transition-all ${
                          active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}>
                        <p className={`text-xs font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>{t.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Routing ── */}
        {step === 2 && (
          <div className="space-y-5">
            {locLoading ? (
              <div className="bg-white border border-slate-200 p-10 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-xs text-slate-500">Loading location data...</span>
              </div>
            ) : (
              <>
                {/* Origin */}
                <div className="bg-white border border-slate-200 p-5">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Origin
                  </h2>
                  <div className="space-y-4">
                    {needsOriginPort(form.scope) && (
                      <LocationSelect
                        label={`${portLabel} of Loading`}
                        placeholder={`Search ${portLabel.toLowerCase()}...`}
                        options={portOptions}
                        value={form.pol}
                        onChange={v => { set('pol', v); set('pol_name', portOptions.find(o => o.value === v)?.name || ''); }}
                        required
                        icon={Search}
                      />
                    )}
                    {needsPickup(form.scope) && (
                      <>
                        <LocationSelect
                          label="Origin City"
                          placeholder="Search city..."
                          options={cities}
                          value={form.pickup_city}
                          onChange={v => set('pickup_city', v)}
                          required
                          icon={Search}
                        />
                        <div>
                          <label className={labelCls}>Pickup Address *</label>
                          <div className="relative">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <textarea
                              value={form.pickup_address}
                              onChange={setE('pickup_address')}
                              placeholder="Full street address, building, postal code"
                              rows={2}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    {/* Shipper */}
                    {needsPickup(form.scope) && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Shipper Details</p>
                          {user && (
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                              <input type="checkbox" checked={form.shipper_same_as_client}
                                onChange={e => set('shipper_same_as_client', e.target.checked)}
                                className="w-3.5 h-3.5 border-slate-300 text-blue-600" />
                              Same as my account
                            </label>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className={labelCls}>Company / Contact Name *</label>
                            <input type="text" value={form.shipper_company} onChange={setE('shipper_company')}
                              disabled={form.shipper_same_as_client && !!user}
                              placeholder="PT Example Indonesia"
                              className={`${inputCls} pl-3 ${form.shipper_same_as_client && user ? 'bg-slate-50 text-slate-500' : ''}`} />
                          </div>
                          <div>
                            <label className={labelCls}>PIC Name *</label>
                            <input type="text" value={form.shipper_pic} onChange={setE('shipper_pic')}
                              disabled={form.shipper_same_as_client && !!user}
                              placeholder="Contact person"
                              className={`${inputCls} pl-3 ${form.shipper_same_as_client && user ? 'bg-slate-50 text-slate-500' : ''}`} />
                          </div>
                          <div>
                            <label className={labelCls}>Phone *</label>
                            <input type="tel" value={form.shipper_phone} onChange={setE('shipper_phone')}
                              disabled={form.shipper_same_as_client && !!user}
                              placeholder="+62 812 ..."
                              className={`${inputCls} pl-3 ${form.shipper_same_as_client && user ? 'bg-slate-50 text-slate-500' : ''}`} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Destination */}
                <div className="bg-white border border-slate-200 p-5">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-green-600" /> Destination
                  </h2>
                  <div className="space-y-4">
                    {needsDestPort(form.scope) && (
                      <LocationSelect
                        label={`${portLabel} of Discharge`}
                        placeholder={`Search ${portLabel.toLowerCase()}...`}
                        options={portOptions}
                        value={form.pod}
                        onChange={v => { set('pod', v); set('pod_name', portOptions.find(o => o.value === v)?.name || ''); }}
                        required
                        icon={Search}
                      />
                    )}
                    {needsDelivery(form.scope) && (
                      <>
                        <LocationSelect
                          label="Destination City"
                          placeholder="Search city..."
                          options={cities}
                          value={form.delivery_city}
                          onChange={v => set('delivery_city', v)}
                          required
                          icon={Search}
                        />
                        <div>
                          <label className={labelCls}>Delivery Address *</label>
                          <div className="relative">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <textarea
                              value={form.delivery_address}
                              onChange={setE('delivery_address')}
                              placeholder="Full street address, building, postal code"
                              rows={2}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    {/* Consignee */}
                    {needsDelivery(form.scope) && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Consignee Details</p>
                          {user && (
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                              <input type="checkbox" checked={form.consignee_same_as_client}
                                onChange={e => set('consignee_same_as_client', e.target.checked)}
                                className="w-3.5 h-3.5 border-slate-300 text-blue-600" />
                              Same as my account
                            </label>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className={labelCls}>Company / Contact Name *</label>
                            <input type="text" value={form.consignee_company} onChange={setE('consignee_company')}
                              placeholder="PT Example Indonesia"
                              className={`${inputCls} pl-3`} />
                          </div>
                          <div>
                            <label className={labelCls}>PIC Name *</label>
                            <input type="text" value={form.consignee_pic} onChange={setE('consignee_pic')}
                              placeholder="Contact person"
                              className={`${inputCls} pl-3`} />
                          </div>
                          <div>
                            <label className={labelCls}>Phone *</label>
                            <input type="tel" value={form.consignee_phone} onChange={setE('consignee_phone')}
                              placeholder="+62 812 ..."
                              className={`${inputCls} pl-3`} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 3: Cargo ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Commodity */}
            <div className="bg-white border border-slate-200 p-5">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">Cargo Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Commodity / Goods Description *</label>
                  <input type="text" value={form.commodity} onChange={setE('commodity')}
                    placeholder="e.g. Electronic Components, Garment, Machinery Parts"
                    className={`${inputCls} pl-3`} />
                </div>
                <div>
                  <label className={labelCls}>HS Code</label>
                  <input type="text" value={form.hs_code} onChange={setE('hs_code')}
                    placeholder="e.g. 8542.31"
                    className={`${inputCls} pl-3`} />
                </div>
                <div>
                  <label className={labelCls}>Dangerous Goods?</label>
                  <div className="relative">
                    <select value={form.is_dangerous ? 'yes' : 'no'}
                      onChange={e => { set('is_dangerous', e.target.value === 'yes'); if (e.target.value === 'no') set('dg_class', ''); }}
                      className={selectCls}>
                      <option value="no">No — General Cargo</option>
                      <option value="yes">Yes — DG / Hazmat</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                {form.is_dangerous && (
                  <div className="col-span-2">
                    <label className={labelCls}>IMDG/IATA DG Class *</label>
                    <input type="text" value={form.dg_class} onChange={setE('dg_class')}
                      placeholder="e.g. Class 3 - Flammable Liquid, UN 1263"
                      className={`${inputCls} pl-3`} />
                  </div>
                )}
              </div>
            </div>

            {/* FCL */}
            {form.mode === 'sea' && form.sea_type === 'FCL' && (
              <div className="bg-white border border-slate-200 p-5">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">Container Details</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Container Size *</label>
                    <div className="relative">
                      <select value={form.container_size} onChange={setE('container_size')} className={selectCls}>
                        <option value="">Select</option>
                        {CONTAINER_SIZES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Quantity *</label>
                    <input type="number" min="1" value={form.container_qty} onChange={setE('container_qty')}
                      placeholder="e.g. 2" className={`${inputCls} pl-3`} />
                  </div>
                  <div>
                    <label className={labelCls}>Weight / Container (KG)</label>
                    <input type="number" value={form.container_weight} onChange={setE('container_weight')}
                      placeholder="e.g. 18000" className={`${inputCls} pl-3`} />
                  </div>
                </div>
              </div>
            )}

            {/* LCL / Air / Land */}
            {(form.mode !== 'sea' || form.sea_type === 'LCL') && (
              <div className="bg-white border border-slate-200 p-5">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">Package & Weight</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Package Type</label>
                    <div className="relative">
                      <select value={form.package_type} onChange={setE('package_type')} className={selectCls}>
                        {PACKAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Quantity *</label>
                    <input type="number" min="1" value={form.package_qty} onChange={setE('package_qty')}
                      placeholder="e.g. 10" className={`${inputCls} pl-3`} />
                  </div>
                  <div>
                    <label className={labelCls}>Total Gross Weight (KG) *</label>
                    <input type="number" step="0.01" value={form.gross_weight} onChange={setE('gross_weight')}
                      placeholder="e.g. 250" className={`${inputCls} pl-3`} />
                  </div>
                  <div>
                    <label className={labelCls}>Total Volume (CBM) *</label>
                    <input type="number" step="0.001" value={form.volume_cbm} onChange={setE('volume_cbm')}
                      placeholder="e.g. 1.8" className={`${inputCls} pl-3`} />
                  </div>
                </div>
              </div>
            )}

            {/* Additional */}
            <div className="bg-white border border-slate-200 p-5">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">Additional Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Incoterms</label>
                  <div className="relative">
                    <select value={form.incoterms} onChange={setE('incoterms')} className={selectCls}>
                      <option value="">— Select —</option>
                      {INCOTERMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Target ETD</label>
                  <input type="date" value={form.target_etd} onChange={setE('target_etd')}
                    className={`${inputCls} pl-3`} />
                </div>
                <div>
                  <label className={labelCls}>Cargo Value (for insurance)</label>
                  <div className="flex gap-2">
                    <div className="relative w-24">
                      <select value={form.cargo_currency} onChange={setE('cargo_currency')} className={selectCls}>
                        {['USD','IDR','SGD','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <input type="number" value={form.cargo_value} onChange={setE('cargo_value')}
                      placeholder="e.g. 50000" className={`${inputCls} pl-3 flex-1`} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Special Instructions</label>
                  <textarea value={form.special_instructions} onChange={setE('special_instructions')}
                    placeholder="e.g. fragile items, temperature sensitive, special handling required..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none" />
                </div>
              </div>
            </div>

            {/* Guest notice */}
            {!user && (
              <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>You'll be asked to create an account before your request is submitted. Your form data will be saved.</span>
              </div>
            )}

            {/* Submit button */}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                : <>{user ? 'Submit Request' : 'Continue to Register'} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        )}

        {/* Navigation buttons (step 1 & 2) */}
        {step < 3 && (
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-200">
            {step > 1
              ? <button type="button" onClick={back}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              : <div />
            }
            <button type="button" onClick={next}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4">
            <button type="button" onClick={back}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Need help?{' '}
          <Link to="/contact" className="underline hover:text-slate-600">Contact our team</Link>
        </p>
      </div>
    </div>
  );
}

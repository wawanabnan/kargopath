import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, ArrowLeft, ArrowRight, CheckCircle2,
  Anchor, Plane, Truck, AlertCircle, MapPin, Search,
  ChevronDown, ChevronLeft, ChevronRight, Loader2, Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quotationRequestAPI, locationsAPI } from '../api';
import DashboardLayout from '../components/DashboardLayout';

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

const NumberInputID = ({ value, onChange, placeholder, className }) => {
  const [focused, setFocused] = useState(false);
  const [localVal, setLocalVal] = useState('');
  useEffect(() => {
    if (!focused) {
      if (value === '' || value === undefined || value === null || isNaN(value)) {
        setLocalVal('');
      } else {
        setLocalVal(new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(value));
      }
    }
  }, [value, focused]);
  const handleChange = (e) => {
    let val = e.target.value.replace(/[^0-9.,]/g, '');
    setLocalVal(val);
    let numeric = val.replace(/\./g, '').replace(',', '.');
    onChange(numeric === '' ? '' : (parseFloat(numeric) || ''));
  };
  return (
    <input type="text" value={localVal} onChange={handleChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder} className={className} />
  );
};

// ── Custom Date Picker ────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function DatePickerInput({ value, onChange, placeholder = 'Select date', className }) {
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const today             = new Date();

  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear,  setViewYear]  = useState(parsed ? parsed.getFullYear()  : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth()     : today.getMonth());

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  // Build calendar grid
  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectDay = (day) => {
    if (!day) return;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const displayValue = parsed
    ? `${String(parsed.getDate()).padStart(2,'0')} ${MONTH_NAMES[parsed.getMonth()]} ${parsed.getFullYear()}`
    : '';

  const isSelected = (day) => {
    if (!parsed || !day) return false;
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  };

  const isPast = (day) => {
    if (!day) return false;
    const cell = new Date(viewYear, viewMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cell < t;
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen(o => !o)}
        className={`${className} flex items-center cursor-pointer select-none`}
        style={{paddingLeft:'2.5rem'}}
      >
        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <span className={displayValue ? 'text-slate-900' : 'text-slate-400'}>
          {displayValue || placeholder}
        </span>
        {value && (
          <button type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="ml-auto text-slate-400 hover:text-slate-600 leading-none text-base">×</button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-200 shadow-xl p-3 w-64" style={{top:'100%',left:0}}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => (
              <button
                key={i}
                type="button"
                disabled={!day || isPast(day)}
                onClick={() => selectDay(day)}
                className={`w-full aspect-square text-xs flex items-center justify-center rounded transition-colors
                  ${ !day ? '' :
                    isSelected(day) ? 'bg-blue-600 text-white font-bold' :
                    isPast(day) ? 'text-slate-300 cursor-not-allowed' :
                    'hover:bg-blue-50 text-slate-700 cursor-pointer'
                  }`}
              >
                {day || ''}
              </button>
            ))}
          </div>

          {/* Quick shortcuts */}
          <div className="border-t border-slate-100 mt-2 pt-2 flex gap-2">
            {[7, 14, 30].map(days => {
              const d = new Date(today);
              d.setDate(d.getDate() + days);
              return (
                <button key={days} type="button"
                  onClick={() => {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth()+1).padStart(2,'0');
                    const dd = String(d.getDate()).padStart(2,'0');
                    onChange(`${yyyy}-${mm}-${dd}`);
                    setViewYear(d.getFullYear());
                    setViewMonth(d.getMonth());
                    setOpen(false);
                  }}
                  className="flex-1 text-xs py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 rounded transition-colors">
                  +{days}d
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
          locationsAPI.seaPorts({ page_size: 200 }),
          locationsAPI.airports({ page_size: 200 }),
          locationsAPI.cities({ page_size: 200 }),
        ]);
        const toOpt = (items) => (items?.results ?? items ?? []).map(p => ({
          value: p.code,
          label: p.label || `${p.code} – ${p.name}`,
          code: p.iata_code || p.unlocode || p.code || '',
          name: p.name,
          city: p.city || p.province || '',
        }));
        setSeaPorts(toOpt(seaRes));
        setAirports(toOpt(airRes));
        setCities((cityRes?.results ?? cityRes ?? []).map(c => ({
          value: c.name,
          label: c.label || `${c.name}, ${c.province || ''}`,
          code:  c.code || '',
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
  const [step, setStep]           = useState(1);
  const [routingTab, setRoutingTab] = useState('origin');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [guestModal, setGuestModal] = useState(false);

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
    incoterms: '', cargo_value: '', cargo_currency: 'IDR', target_etd: '',
    special_instructions: '',
    cargo_items: [{
      container_size: '', container_qty: '', container_weight: '',
      package_type: 'Pallet', package_qty: '', gross_weight: '', volume_cbm: '', length: '', width: '', height: '', is_stackable: true,
    }],
  });

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const setE = (field) => (e) => set(field, e.target.value);

  const addCargoItem = () => {
    setForm(p => ({
      ...p,
      cargo_items: [...p.cargo_items, {
        container_size: '', container_qty: '', container_weight: '',
        package_type: 'Pallet', package_qty: '', gross_weight: '', volume_cbm: '', length: '', width: '', height: '', is_stackable: true,
      }]
    }));
  };

  const removeCargoItem = (index) => {
    if (form.cargo_items.length <= 1) return;
    setForm(p => ({
      ...p,
      cargo_items: p.cargo_items.filter((_, i) => i !== index)
    }));
  };

  const updateCargoItem = (index, field, value) => {
    setForm(p => ({
      ...p,
      cargo_items: p.cargo_items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  // Auto-fill cargo_currency from user's preferred_currency
  useEffect(() => {
    if (user?.preferred_currency && user.role === 'CLIENT') {
      setForm(p => ({ ...p, cargo_currency: user.preferred_currency }));
    }
  }, [user]);

  // Auto-fill shipper from user profile
  useEffect(() => {
    if (user && form.shipper_same_as_client) {
      const name = user.company?.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
      setForm(p => ({
        ...p,
        shipper_company: name,
        shipper_pic:     `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        shipper_phone:   user.phone || '',
        shipper_email:   user.email || '',
      }));
    }
  }, [user, form.shipper_same_as_client]);

  // Auto-fill consignee from user profile
  useEffect(() => {
    if (user && form.consignee_same_as_client) {
      const name = user.company?.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
      setForm(p => ({
        ...p,
        consignee_company: name,
        consignee_pic:     `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        consignee_phone:   user.phone || '',
        consignee_email:   user.email || '',
      }));
    }
  }, [user, form.consignee_same_as_client]);

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
    
    if (form.mode === 'sea' || form.mode === 'air') {
      if (!form.pol) { setError(`Please select an origin ${portLabel}.`); setRoutingTab('origin'); return false; }
      if (!form.pod) { setError(`Please select a destination ${portLabel}.`); setRoutingTab('destination'); return false; }
    }

    if (form.mode === 'land' && !form.pickup_city) {
      setError('Please select an origin city.'); setRoutingTab('origin'); return false;
    }
    if (needsPickup(form.scope) && !form.pickup_address) {
      setError('Please enter the pickup address.'); setRoutingTab('origin'); return false;
    }

    if (form.mode === 'land' && !form.delivery_city) {
      setError('Please select a destination city.'); setRoutingTab('destination'); return false;
    }
    if (needsDelivery(form.scope) && !form.delivery_address) {
      setError('Please enter the delivery address.'); setRoutingTab('destination'); return false;
    }

    if (!form.shipper_company || !form.shipper_pic || !form.shipper_phone) {
      setError('Please fill in complete Shipper Details.'); setRoutingTab('origin'); return false;
    }
    if (!form.consignee_company || !form.consignee_pic || !form.consignee_phone) {
      setError('Please fill in complete Consignee Details.'); setRoutingTab('destination'); return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    setError('');
    if (!form.commodity.trim()) { setError('Commodity is required.'); return false; }
    
    for (let i = 0; i < form.cargo_items.length; i++) {
      const item = form.cargo_items[i];
      if (form.mode === 'sea' && form.sea_type === 'FCL') {
        if (!item.container_size) { setError(`Container size is required for item #${i+1}.`); return false; }
        if (!item.container_qty)  { setError(`Container quantity is required for item #${i+1}.`); return false; }
      } else {
        if (!item.package_qty)   { setError(`Package quantity is required for item #${i+1}.`); return false; }
        if (!item.gross_weight)  { setError(`Gross weight is required for item #${i+1}.`); return false; }
        if (!item.volume_cbm)    { setError(`Volume (CBM) is required for item #${i+1}.`); return false; }
      }
    }
    return true;
  };

  const prepareSubmitData = (data) => {
    const payload = JSON.parse(JSON.stringify(data)); // Deep clone
    
    // Parse numeric fields
    if (payload.cargo_value) payload.cargo_value = parseFloat(payload.cargo_value);
    
    let totalContainers = 0;
    let totalPackages = 0;
    let totalWeight = 0;
    let totalVolume = 0;
    
    payload.cargo_items = payload.cargo_items.map(item => {
      const clean = { ...item };
      if (clean.container_qty) clean.container_qty = parseInt(clean.container_qty, 10);
      if (clean.container_weight) clean.container_weight = parseFloat(clean.container_weight);
      if (clean.package_qty) clean.package_qty = parseInt(clean.package_qty, 10);
      if (clean.gross_weight) clean.gross_weight = parseFloat(clean.gross_weight);
      if (clean.volume_cbm) clean.volume_cbm = parseFloat(clean.volume_cbm);
      if (clean.length) clean.length = parseFloat(clean.length);
      if (clean.width) clean.width = parseFloat(clean.width);
      if (clean.height) clean.height = parseFloat(clean.height);
      
      // Clean up based on mode & Aggregate
      if (payload.mode === 'sea' && payload.sea_type === 'FCL') {
        totalContainers += clean.container_qty || 0;
        if (!payload.container_size) payload.container_size = clean.container_size;
        
        delete clean.package_type; delete clean.package_qty; delete clean.gross_weight; 
        delete clean.volume_cbm; delete clean.length; delete clean.width; delete clean.height;
      } else {
        totalPackages += clean.package_qty || 0;
        totalWeight += clean.gross_weight || 0;
        totalVolume += clean.volume_cbm || 0;
        
        delete clean.container_size; delete clean.container_qty; delete clean.container_weight;
      }
      return clean;
    });

    // Attach aggregates to root payload to bypass backend root-level validation
    if (payload.mode === 'sea' && payload.sea_type === 'FCL') {
      payload.container_qty = totalContainers;
    } else {
      payload.package_qty = totalPackages;
      payload.gross_weight = totalWeight;
      payload.volume_cbm = totalVolume;
    }

    if (payload.mode === 'land') {
      delete payload.sea_type;
      delete payload.pol; delete payload.pol_name; delete payload.pod; delete payload.pod_name;
    }
    return payload;
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
    
    const payload = prepareSubmitData(form);
    
    try {
      if (user) {
        await quotationRequestAPI.submit(payload);
        setSubmitted(true);
      } else {
        // Save draft silently then show the friendly modal
        try {
          const { draft_key } = await quotationRequestAPI.saveDraft(payload);
          localStorage.setItem('kargopath_draft_key', draft_key);
        } catch {
          localStorage.setItem('kargopath_pending_quote', JSON.stringify(payload));
        }
        setGuestModal(true);
      }
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to submit. Please check your form and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) return (
    <DashboardLayout title="Request Quotation">
      <div className="flex items-center justify-center p-4 font-sans">
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
    </DashboardLayout>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Request Quotation">

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
              <div className="bg-white border border-slate-200 p-5">
                <div className="flex border-b border-slate-200 mb-6">
                  <button type="button" onClick={() => setRoutingTab('origin')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${routingTab === 'origin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <MapPin className="w-3.5 h-3.5 inline-block mr-2" /> Origin Details
                  </button>
                  <button type="button" onClick={() => setRoutingTab('destination')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${routingTab === 'destination' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <MapPin className="w-3.5 h-3.5 inline-block mr-2" /> Destination Details
                  </button>
                </div>
                
                {/* ── Origin Tab ── */}
                {routingTab === 'origin' && (
                  <div className="space-y-4 animate-fade-in-up">
                    
                    {/* For Sea/Air: POL/Origin Airport is always required */}
                    {(form.mode === 'sea' || form.mode === 'air') && (
                      <LocationSelect
                        label={form.mode === 'air' ? 'Origin (Airport)' : 'Port of Loading'}
                        placeholder={`Search ${form.mode === 'air' ? 'airport' : 'port'}...`}
                        options={portOptions}
                        value={form.pol}
                        onChange={v => { set('pol', v); set('pol_name', portOptions.find(o => o.value === v)?.name || ''); }}
                        required
                        icon={Search}
                      />
                    )}

                    {/* For Land: Origin City is always required */}
                    {form.mode === 'land' && (
                      <LocationSelect
                        label="Origin City"
                        placeholder="Search city..."
                        options={cities}
                        value={form.pickup_city}
                        onChange={v => set('pickup_city', v)}
                        required
                        icon={Search}
                      />
                    )}

                    {/* Pickup Address */}
                    {needsPickup(form.scope) && (
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
                    )}

                    {/* Shipper Details */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
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
                        <div className="grid grid-cols-1 gap-3">
                          <div>
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
                  </div>
                )}

                {/* ── Destination Tab ── */}
                {routingTab === 'destination' && (
                  <div className="space-y-4 animate-fade-in-up">
                    
                    {/* For Sea/Air: POD/Dest Airport is always required */}
                    {(form.mode === 'sea' || form.mode === 'air') && (
                      <LocationSelect
                        label={form.mode === 'air' ? 'Destination (Airport)' : 'Port of Discharge'}
                        placeholder={`Search ${form.mode === 'air' ? 'airport' : 'port'}...`}
                        options={portOptions}
                        value={form.pod}
                        onChange={v => { set('pod', v); set('pod_name', portOptions.find(o => o.value === v)?.name || ''); }}
                        required
                        icon={Search}
                      />
                    )}

                    {/* For Land: Dest City is always required */}
                    {form.mode === 'land' && (
                      <LocationSelect
                        label="Destination City"
                        placeholder="Search city..."
                        options={cities}
                        value={form.delivery_city}
                        onChange={v => set('delivery_city', v)}
                        required
                        icon={Search}
                      />
                    )}

                    {/* Delivery Address */}
                    {needsDelivery(form.scope) && (
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
                    )}

                    {/* Consignee Details */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
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
                        <div className="grid grid-cols-1 gap-3">
                          <div>
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
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Cargo ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Cargo Items List */}
            <div className="bg-white border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {form.mode === 'sea' && form.sea_type === 'FCL' ? 'Container Details' : 'Package & Weight'}
                </h2>
                <button type="button" onClick={addCargoItem}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  + Add Item
                </button>
              </div>
              
              <div className="space-y-4">
                {form.cargo_items.map((item, index) => (
                  <div key={index} className="relative p-4 border border-slate-100 bg-slate-50 relative">
                    {form.cargo_items.length > 1 && (
                      <button type="button" onClick={() => removeCargoItem(index)}
                        className="absolute right-3 top-3 text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1">
                        ✕ Remove
                      </button>
                    )}
                    <p className="text-xs font-bold text-slate-500 mb-3">ITEM #{index + 1}</p>
                    
                    {/* FCL */}
                    {form.mode === 'sea' && form.sea_type === 'FCL' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelCls}>Container Size *</label>
                          <div className="relative">
                            <select value={item.container_size} onChange={e => updateCargoItem(index, 'container_size', e.target.value)} className={selectCls}>
                              <option value="">Select</option>
                              {CONTAINER_SIZES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Quantity *</label>
                          <NumberInputID value={item.container_qty} onChange={v => updateCargoItem(index, 'container_qty', v)}
                            placeholder="e.g. 2" className={`${inputCls} pl-3`} />
                        </div>
                        <div>
                          <label className={labelCls}>Weight / Container (KG)</label>
                          <NumberInputID value={item.container_weight} onChange={v => updateCargoItem(index, 'container_weight', v)}
                            placeholder="e.g. 18000" className={`${inputCls} pl-3`} />
                        </div>
                      </div>
                    )}

                    {/* LCL / Air / Land */}
                    {(form.mode !== 'sea' || form.sea_type === 'LCL') && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className={labelCls}>Package Type</label>
                          <div className="relative">
                            <select value={item.package_type} onChange={e => updateCargoItem(index, 'package_type', e.target.value)} className={selectCls}>
                              {PACKAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Quantity *</label>
                          <NumberInputID value={item.package_qty} onChange={v => updateCargoItem(index, 'package_qty', v)}
                            placeholder="e.g. 10" className={`${inputCls} pl-3`} />
                        </div>
                        <div>
                          <label className={labelCls}>Total Gross Wt (KG) *</label>
                          <NumberInputID value={item.gross_weight} onChange={v => updateCargoItem(index, 'gross_weight', v)}
                            placeholder="e.g. 250" className={`${inputCls} pl-3`} />
                        </div>
                        <div>
                          <label className={labelCls}>Total Volume (CBM) *</label>
                          <NumberInputID value={item.volume_cbm} onChange={v => updateCargoItem(index, 'volume_cbm', v)}
                            placeholder="e.g. 1.8" className={`${inputCls} pl-3`} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

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
                  <DatePickerInput value={form.target_etd} onChange={v => set('target_etd', v)}
                    placeholder="Select target date" className={inputCls} />
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
                    <NumberInputID value={form.cargo_value} onChange={v => set('cargo_value', v)}
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



            {/* Submit button */}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                : <>Submit Request <ArrowRight className="w-4 h-4" /></>
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

      {/* Guest completion modal */}
      {guestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,23,42,0.65)', backdropFilter:'blur(4px)'}}>
          <div className="relative bg-white w-full max-w-sm shadow-2xl overflow-hidden" style={{animation:'fadeInUp 0.25s ease'}}>
            {/* Close button */}
            <button onClick={() => setGuestModal(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-white/70 hover:text-white z-10 text-lg leading-none">
              ×
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-base leading-tight">Your request is ready!</h2>
              </div>
              <p className="text-sm text-blue-100 leading-relaxed">
                We've saved all your details. One quick step — create a free account so our team can send your quotation directly to you.
              </p>
            </div>

            {/* Progress steps */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="space-y-3">
                {[
                  { num: '✓', label: 'Quotation form filled', done: true },
                  { num: '2', label: 'Create your free account (2 min)', done: false },
                  { num: '3', label: 'Receive quotation in your inbox', done: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      s.done ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>{s.num}</span>
                    <span className={`text-xs ${s.done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 space-y-2">
              <button onClick={() => navigate('/register', { state: { quotePending: true } })}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/login', { state: { quotePending: true } })}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

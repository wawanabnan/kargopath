import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Package, MapPin, Anchor, CheckCircle2, FileText, FileDown, MessageSquare, Loader2, AlertCircle, Clock, UserPlus, ChevronDown, X, User } from 'lucide-react';
import { quotationAPI, quotationRequestAPI, usersAPI, chargeMasterAPI } from '../api';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

// ── Assign Sales Modal ──────────────────────────────────────────────────────────
function AssignModal({ request, onClose, onAssigned }) {
  const [selectedId, setSelectedId] = useState('');
  const [salesUsers, setSalesUsers]  = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState('');
  const ref = useRef(null);

  useEffect(() => {
    usersAPI.salesUsers()
      .then(data => setSalesUsers(data ?? []))
      .catch(() => setError('Failed to load sales users.'))
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const handleAssign = async () => {
    if (!selectedId) { setError('Please select a sales person'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await quotationRequestAPI.assignSales(request.id, selectedId);
      onAssigned(request.id, res.sales_display);
      onClose();
    } catch (err) {
      setError(err?.detail || 'Failed to assign. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}>
      <div ref={ref} className="bg-white w-full max-w-xs shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assign Sales</h3>
            <p className="text-xs text-slate-500 mt-0.5">Ref: {request.reference_no}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Select Sales Person
            </label>
            {usersLoading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading users...
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 appearance-none bg-white">
                  <option value="">-- Select person --</option>
                  {salesUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.display} ({u.role})</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
          <button
            onClick={handleAssign}
            disabled={loading || usersLoading || !selectedId}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Assigning...</>
              : <><UserPlus className="w-4 h-4" /> Assign Sales</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Add Charge Modal (with Charge Master selector) ─────────────────────────────
function fmt(v) {
  const n = parseFloat(String(v).replace(/[^0-9,\-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
  return n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function toRaw(v) {
  return String(v).replace(/[^0-9,\-]/g, '').replace(/\./g, '').replace(',', '.');
}

function AddChargeModal({ chargeForm, setChargeForm, chargeMasters, setChargeMasters, chargeSaving, onSave, onClose }) {
  const [cmLoading, setCmLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    chargeMasterAPI.list()
      .then(data => setChargeMasters(data?.results ?? data ?? []))
      .catch(() => {})
      .finally(() => setCmLoading(false));
  }, [setChargeMasters]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const handleMasterSelect = (e) => {
    const val = e.target.value;
    if (val === '__others__') {
      setChargeForm({ ...chargeForm, charge_master: '__others__', charge_name: '', unit_price: '0,00', unit: 'KG', is_taxable: true });
      return;
    }
    if (!val || val === '__unselected__') return;
    const master = chargeMasters.find(m => m.id == val);
    if (master) {
      setChargeForm({
        ...chargeForm,
        charge_master: master.id,
        charge_name: master.name,
        unit_price: fmt(master.default_rate),
        unit: master.default_unit,
        is_taxable: master.taxable_default,
      });
    }
  };

  const isOthers = chargeForm.charge_master === '__others__';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}>
      <div ref={ref} className="bg-white w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Add New Charge</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Select Charge Item</label>
            <select
              value={chargeForm.charge_master || '__unselected__'}
              onChange={handleMasterSelect}
              disabled={cmLoading}
              className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 bg-white appearance-none"
            >
              <option value="__unselected__" disabled>Select Charge Item</option>
              {cmLoading ? (
                <option disabled>Loading...</option>
              ) : chargeMasters.length === 0 ? (
                <option disabled>No charge masters available</option>
              ) : (
                chargeMasters.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.default_currency}/{m.default_unit})
                  </option>
                ))
              )}
              <option value="__others__">Others (Manual Entry)</option>
            </select>
          </div>
          {isOthers && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Charge Name</label>
              <input
                type="text"
                value={chargeForm.charge_name}
                onChange={e => setChargeForm({ ...chargeForm, charge_name: e.target.value })}
                placeholder="e.g. Ocean Freight, Documentation Fee"
                className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Qty</label>
              <input
                type="text" inputMode="decimal"
                value={chargeForm.qty}
                onChange={e => setChargeForm({ ...chargeForm, qty: e.target.value })}
                onFocus={e => { const r = toRaw(e.target.value); if (r) e.target.value = r; }}
                onBlur={e => { if (e.target.value) e.target.value = fmt(e.target.value); setChargeForm({ ...chargeForm, qty: e.target.value }); }}
                className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Price</label>
              <input
                type="text" inputMode="decimal"
                value={chargeForm.unit_price}
                onChange={e => setChargeForm({ ...chargeForm, unit_price: e.target.value })}
                onFocus={e => { const r = toRaw(e.target.value); if (r) e.target.value = r; }}
                onBlur={e => { if (e.target.value) e.target.value = fmt(e.target.value); setChargeForm({ ...chargeForm, unit_price: e.target.value }); }}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Unit</label>
              <select
                value={chargeForm.unit}
                onChange={e => setChargeForm({ ...chargeForm, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 bg-white appearance-none"
              >
                <option value="KG">KG</option>
                <option value="CBM">CBM</option>
                <option value="UNIT">UNIT</option>
                <option value="CONTAINER">CONTAINER</option>
                <option value="LOT">LOT</option>
                <option value="DOC">DOC</option>
                <option value="TRIP">TRIP</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={chargeForm.is_taxable}
              onChange={e => setChargeForm({ ...chargeForm, is_taxable: e.target.checked })}
              className="rounded border-slate-300"
            />
            Taxable (PPN)
          </label>
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={chargeSaving}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {chargeSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <>Add Charge</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function QuoteDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeParam = searchParams.get('type') || 'quotation';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [isQuotation, setIsQuotation] = useState(typeParam === 'quotation');
  const [chatOpen, setChatOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [salesDisplay, setSalesDisplay] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [quotationId, setQuotationId] = useState(isQuotation ? id : null);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [chargeForm, setChargeForm] = useState({ charge_name: '', qty: '1,00', unit_price: '0,00', unit: 'KG', is_taxable: true, charge_master: '__unselected__' });
  const [chargeSaving, setChargeSaving] = useState(false);
  const [chargeMasters, setChargeMasters] = useState([]);
  const [discountEditing, setDiscountEditing] = useState(false);
  const [discountValue, setDiscountValue] = useState('0');
  const [discountType, setDiscountType] = useState('AMOUNT');
  const [discountSaving, setDiscountSaving] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(1);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        if (isQuotation) {
          // Fetch Quotation (official sales offer)
          try {
            const res = await quotationAPI.detail(id);
            setData(res);
            setQuotationId(res.id);
          } catch (qErr) {
            // Fallback: maybe it's actually a raw request ID
            console.warn("Failing to load as quotation, trying as request:", qErr);
            const fallbackRes = await quotationRequestAPI.detail(id);
            setData(fallbackRes);
            setIsQuotation(false);
            setQuotationId(null);
          }
        } else {
          // Fetch Quotation Request (client's raw pending request)
          const res = await quotationRequestAPI.detail(id);
          setData(res);
          // If the request has already been quoted, redirect or switch mode
          if (res.quotation_details) {
            setIsQuotation(true);
            const quoteRes = await quotationAPI.detail(res.quotation_details.id);
            setData(quoteRes);
            setQuotationId(quoteRes.id);
          }
        }
      } catch (err) {
        console.error("Gagal memuat detail:", err);
        setError("Quotation details not found or you do not have permission to access them.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, isQuotation]);

  useEffect(() => {
    if (data) {
      setDiscountValue(String(data.discount || 0));
      setDiscountType(data.discount_type || 'AMOUNT');
    }
  }, [data]);

  const handleAccept = async () => {
    const qId = quotationId || id;
    if (!window.confirm("Are you sure you want to accept this quotation and proceed with the shipment?")) return;
    setActionLoading(true);
    try {
      await quotationAPI.accept(qId);
      alert("Quotation accepted! Your shipment is being created.");
      navigate('/dashboard/shipments');
    } catch (err) {
      alert(err?.detail || err?.message || "Failed to accept quotation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const qId = quotationId || id;
      await quotationAPI.reject(qId, rejectionReason);
      alert("Quotation rejected.");
      setShowRejectModal(false);
      // Reload page state
      setIsQuotation(true);
      navigate('/dashboard');
    } catch (err) {
      alert(err?.detail || err?.message || "Failed to reject quotation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateQuotation = async () => {
    setCreateLoading(true);
    setError('');
    try {
      const res = await quotationAPI.create({ request: requestObj.id, currency: requestObj.cargo_currency || 'USD' });
      setQuotationId(res.id);
      setIsQuotation(true);
      const quoteRes = await quotationAPI.detail(res.id);
      setData(quoteRes);
    } catch (err) {
      setError(err?.detail || 'Failed to create quotation.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSendToClient = async () => {
    const qId = quotationId || id;
    setActionLoading(true);
    try {
      await quotationAPI.sendToClient(qId);
      const updated = await quotationAPI.detail(qId);
      setData(updated);
    } catch (err) {
      alert(err?.detail || 'Failed to send quotation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCharge = async () => {
    if (!chargeForm.charge_name.trim() || !chargeForm.qty || !chargeForm.unit_price) {
      alert('Please fill in charge name, qty, and unit price.');
      return;
    }
    const qId = quotationId || id;
    setChargeSaving(true);
    try {
      const parseNum = (v) => parseFloat(String(v).replace(/[^0-9,\-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
      const payload = {
        charge_name: chargeForm.charge_name,
        qty: parseNum(chargeForm.qty),
        unit_price: parseNum(chargeForm.unit_price),
        unit: chargeForm.unit,
        is_taxable: chargeForm.is_taxable,
        currency: data.currency || 'USD',
      };
      const cmVal = chargeForm.charge_master;
      if (cmVal && cmVal !== '__others__') {
        payload.charge_master = cmVal;
      }
      await quotationAPI.addItem(qId, payload);
      const updated = await quotationAPI.detail(qId);
      setData(updated);
      setShowAddCharge(false);
      setChargeForm({ charge_name: '', qty: '1,00', unit_price: '0,00', unit: 'KG', is_taxable: true, charge_master: '__unselected__' });
    } catch (err) {
      alert(err?.detail || 'Failed to add charge.');
    } finally {
      setChargeSaving(false);
    }
  };

  const handleDeleteCharge = async (itemId) => {
    if (!window.confirm('Remove this charge from quotation?')) return;
    const qId = quotationId || id;
    try {
      await quotationAPI.deleteItem(qId, itemId);
      const updated = await quotationAPI.detail(qId);
      setData(updated);
    } catch (err) {
      alert(err?.detail || 'Failed to delete charge.');
    }
  };

  const handleDiscountSave = async () => {
    const qId = quotationId || id;
    setDiscountSaving(true);
    try {
      const val = parseFloat(String(discountValue).replace(/[^0-9,\-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
      await quotationAPI.update(qId, { discount: val, discount_type: discountType });
      const updated = await quotationAPI.detail(qId);
      setData(updated);
      setDiscountEditing(false);
    } catch (err) {
      alert(err?.detail || 'Failed to update discount.');
    } finally {
      setDiscountSaving(false);
    }
  };

  if (loading) return (
    <DashboardLayout title="Quotation Detail">
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-2" />
        <span className="text-xs text-slate-500">Loading quotation details...</span>
      </div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout title="Quotation Detail">
      <div className="bg-white border border-slate-200 p-12 text-center max-w-md mx-auto mt-8">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-sm font-bold text-slate-800 mb-2">An Error Occurred</h2>
        <p className="text-slate-500 text-xs mb-6 leading-relaxed">{error}</p>
        <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors inline-block">
          Back to Dashboard
        </Link>
      </div>
    </DashboardLayout>
  );

  // Extract variables depending on type
  const requestObj = isQuotation ? data.request_details : data;
  const isPending = !isQuotation || requestObj.status === 'INQUIRY' || requestObj.status === 'ASSIGNED';
  const isRejected = isQuotation && data.status === 'REJECTED';
  const isAccepted = isQuotation && data.status === 'ACCEPTED';

  const mode = requestObj.mode;
  const scope = requestObj.scope;

  const pol = requestObj.pol ? requestObj.pol.split(' – ')[0] : (requestObj.pickup_city || 'Alamat Asal');
  const pod = requestObj.pod ? requestObj.pod.split(' – ')[0] : (requestObj.delivery_city || 'Alamat Tujuan');

  const modeLabel = mode === 'sea' ? 'Sea Freight' : mode === 'air' ? 'Air Freight' : 'Land Trucking';
  const scopeLabel = mode === 'land' ? 'Point to Point' : scope === 'd2d' ? 'Door to Door' : scope === 'd2p' ? 'Door to Port' : scope === 'p2d' ? 'Port to Door' : 'Port to Port';

  const statusLabel = isPending ? 'Pending Review' : isAccepted ? 'Booked' : isRejected ? 'Rejected' : 'Quoted';
  const validUntil = isQuotation && data.valid_until
    ? new Date(data.valid_until).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Pending Review';

  return (
    <>
      {/* ===================================================================== */}
      {/* WEB UI (Visible on screen, hidden on print) */}
      {/* ===================================================================== */}
      <DashboardLayout title="Quotation Detail">
        <div className="pb-10 print:hidden">
          {/* Top action bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {user?.role === 'ADMIN' && !isQuotation && requestObj?.status === 'INQUIRY' && !requestObj?.sales_in_charge && (
                <button onClick={() => setShowAssignModal(true)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center gap-1.5 text-xs shadow-md">
                  <UserPlus className="w-3.5 h-3.5" /> Assign Sales
                </button>
              )}
              {user?.role === 'CLIENT' && (
                <button onClick={() => setChatOpen(true)} className="px-3 py-1.5 border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" /> Contact Sales
                </button>
              )}
              {isQuotation && (user?.role !== 'CLIENT' || data?.status !== 'DRAFT') && (
                <button onClick={() => setShowPdfPreview(true)} className="px-3 py-1.5 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-xs">
                  <FileDown className="w-3.5 h-3.5" /> Preview PDF
                </button>
              )}
            </div>
          </div>
          {/* Status Banner */}
          <div className={`rounded-2xl p-6 text-white mb-6 flex flex-col md:flex-row md:items-center justify-between shadow-xl ${
            isPending ? 'bg-amber-600 shadow-amber-600/10' :
            isAccepted ? 'bg-green-600 shadow-green-600/10' :
            isRejected ? 'bg-red-600 shadow-red-600/10' :
            'bg-blue-600 shadow-blue-600/10'
          }`}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">{statusLabel}</span>
                <span className="text-white/80 font-medium text-sm">
                  {isPending ? 'Request Under Review' :
                   isAccepted ? 'Quotation Accepted & In Shipment Process' :
                   isRejected ? 'Quotation Rejected' :
                   user?.role === 'CLIENT' ? 'Quotation Ready to Accept' :
                   'Awaiting Client Response'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                {isQuotation ? data.quotation_number : requestObj.reference_no}
              </h1>
              <p className="text-white/80 mt-1 font-medium text-xs">
                Valid until: {validUntil}
              </p>
            </div>
            {isQuotation && (
              <div className="mt-6 md:mt-0 md:text-right">
                <p className="text-white/70 font-medium text-sm mb-1">Total Billing Amount (Inc. Tax)</p>
                <div className="flex items-end gap-2 justify-start md:justify-end">
                  <span className="text-xl font-bold text-white/70">{data.currency || 'IDR'}</span>
                  <span className="text-3xl md:text-4xl font-extrabold">
                    {parseFloat(data.grand_total).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            
            {/* Routing */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" /> Route & Service Details
              </h2>
              
              <div className="flex flex-col md:flex-row justify-between mb-8 relative">
                <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-slate-100"></div>
                
                <div className="relative z-10 text-center flex-1">
                  <div className="w-12 h-12 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-800">{pol}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Origin / Port of Loading</p>
                </div>

                <div className="relative z-10 text-center flex-1 mt-6 md:mt-0">
                  <div className="w-12 h-12 bg-blue-50 border-4 border-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md text-blue-600">
                    <Anchor className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-blue-600">{modeLabel}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{scopeLabel}</p>
                </div>

                <div className="relative z-10 text-center flex-1 mt-6 md:mt-0">
                  <div className="w-12 h-12 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-800">{pod}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Destination / Port of Discharge</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shipper & Pickup Address</p>
                  <p className="text-sm font-bold text-slate-800">{requestObj.shipper_company || '-'}</p>
                  {requestObj.pickup_address ? (
                    <p className="text-xs font-medium text-slate-600 mt-1">{requestObj.pickup_address}</p>
                  ) : (
                    <p className="text-xs font-medium text-slate-400 mt-1">Port of Loading Delivery (Self-Delivery)</p>
                  )}
                  {(requestObj.shipper_pic || requestObj.shipper_phone) && (
                    <p className="text-[10px] font-medium text-slate-500 mt-2">
                      PIC: {requestObj.shipper_pic} ({requestObj.shipper_phone})
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Consignee & Delivery Address</p>
                  <p className="text-sm font-bold text-slate-800">{requestObj.consignee_company || '-'}</p>
                  {requestObj.delivery_address ? (
                    <p className="text-xs font-medium text-slate-600 mt-1">{requestObj.delivery_address}</p>
                  ) : (
                    <p className="text-xs font-medium text-slate-400 mt-1">Port of Discharge Pickup (Self-Pickup)</p>
                  )}
                  {(requestObj.consignee_pic || requestObj.consignee_phone) && (
                    <p className="text-[10px] font-medium text-slate-500 mt-2">
                      PIC: {requestObj.consignee_pic} ({requestObj.consignee_phone})
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Profile */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-400" /> Customer Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company</p>
                    <p className="font-bold text-slate-800">{requestObj.submitted_by_email ? (requestObj.shipper_company || '-') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                    <p className="font-medium text-slate-700">{requestObj.submitted_by_email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Request Currency</p>
                    <p className="font-bold text-slate-800">{requestObj.cargo_currency || 'IDR'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo Value</p>
                    <p className="font-medium text-slate-700">
                      {requestObj.cargo_currency || 'IDR'} {parseFloat(requestObj.cargo_value || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Incoterms</p>
                    <p className="font-bold text-slate-800">{requestObj.incoterms || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target ETD</p>
                    <p className="font-medium text-slate-700">{requestObj.target_etd ? new Date(requestObj.target_etd).toLocaleDateString('id-ID') : 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Charges Breakdown */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-400" /> Charges Breakdown
                  </h2>
                  
                  {!isQuotation ? (
                    /* ── No Quotation Yet ─────────────────────────────── */
                    user?.role === 'SALES' && requestObj?.sales_in_charge && (requestObj?.status === 'INQUIRY' || requestObj?.status === 'ASSIGNED') ? (
                      <div className="text-center py-10 bg-blue-50 rounded-xl border border-blue-100 p-5 space-y-4">
                        <FileText className="w-8 h-8 text-blue-500 mx-auto" />
                        <p className="text-sm font-bold text-blue-800">Ready to Price</p>
                        <p className="text-xs text-blue-600/90 leading-relaxed font-medium">
                          Create a quotation to start adding logistics charges.
                        </p>
                        <button
                          onClick={handleCreateQuotation}
                          disabled={createLoading}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm mx-auto shadow-lg shadow-blue-600/20"
                        >
                          {createLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                          ) : (
                            <><FileText className="w-4 h-4" /> Start Pricing</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-amber-50 rounded-xl border border-amber-100 p-5 space-y-3">
                        <Clock className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                        <p className="text-sm font-bold text-amber-800">Under Review</p>
                        <p className="text-xs text-amber-600/90 leading-relaxed font-medium">
                          Official logistics charges are being calculated by the KargoPath sales team. The complete tariff offer will appear here shortly.
                        </p>
                      </div>
                    )
                  ) : (
                    /* ── Quotation Exists ─────────────────────────────── */
                    <div className="space-y-4 text-sm font-medium">
                      {/* Line Items */}
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {data.items && data.items.length > 0 ? (
                          data.items.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-xs text-slate-600 border-b border-slate-50 pb-2 group">
                              <div className="flex-1 pr-3">
                                <p className="font-bold text-slate-800">{item.charge_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Qty: {item.qty} × {item.unit_price} / {item.unit}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">
                                  {data.currency} {parseFloat(item.amount).toLocaleString('id-ID')}
                                </span>
                                {user?.role === 'SALES' && data.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handleDeleteCharge(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-400 text-center py-4 font-medium">No charges added yet.</p>
                        )}
                      </div>

                      {/* Sales: Add Charge Button */}
                      {user?.role === 'SALES' && data.status === 'DRAFT' && (
                        <button
                          onClick={() => setShowAddCharge(true)}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1.5 text-xs"
                        >
                          <Package className="w-3.5 h-3.5" /> Add New Charge
                        </button>
                      )}

                      {/* Summary */}
                      <div className="border-t border-slate-200 pt-4 mt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span className="font-semibold">Subtotal</span>
                          <span className="font-bold text-slate-800">
                            {data.currency} {parseFloat(data.subtotal).toLocaleString('id-ID')}
                          </span>
                        </div>

                        {user?.role === 'SALES' && data.status === 'DRAFT' ? (
                          <div className="flex items-center gap-2 pt-2">
                            <span className="text-xs font-semibold text-slate-600">Discount</span>
                            <select
                              value={discountType}
                              onChange={e => setDiscountType(e.target.value)}
                              className="px-2 py-1 border border-slate-300 text-xs font-bold focus:outline-none focus:border-blue-600 bg-white"
                            >
                              <option value="AMOUNT">{data.currency}</option>
                              <option value="PERCENT">%</option>
                            </select>
                            <input
                              type="text"
                              value={discountValue}
                              onChange={e => setDiscountValue(e.target.value)}
                              onBlur={e => {
                                const raw = parseFloat(e.target.value.replace(/[^0-9,\-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
                                setDiscountValue(raw > 0 ? raw.toLocaleString('id-ID') : '0');
                              }}
                              onFocus={e => {
                                const raw = parseFloat(e.target.value.replace(/[^0-9,\-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
                                setDiscountValue(String(raw));
                              }}
                              className="w-24 px-2 py-1 border border-slate-300 text-xs font-bold text-right focus:outline-none focus:border-blue-600"
                            />
                            <button
                              onClick={handleDiscountSave}
                              disabled={discountSaving}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold transition-colors"
                            >
                              {discountSaving ? '...' : 'Set'}
                            </button>
                          </div>
                        ) : parseFloat(data.discount || 0) > 0 ? (
                          <div className="flex justify-between text-green-600">
                            <span>Discount ({data.discount_type === 'PERCENT' ? `${parseFloat(data.discount)}%` : 'Fixed'})</span>
                            <span>- {data.currency} {parseFloat(data.discount_amount || data.discount).toLocaleString('id-ID')}</span>
                          </div>
                        ) : null}

                        <div className="flex justify-between text-slate-600">
                          <span>Tax / VAT ({parseFloat(data.tax_rate || 0)}%)</span>
                          <span className="font-bold text-slate-800">
                            {data.currency} {parseFloat(data.tax_amount).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Grand Total</span>
                        <div className="text-right">
                          <span className="text-2xl font-extrabold text-blue-600">
                            {data.currency} {parseFloat(data.grand_total).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {data.status === 'DRAFT' && user?.role === 'SALES' ? (
                        <button
                          onClick={handleSendToClient}
                          disabled={actionLoading || parseFloat(data.grand_total || 0) <= 0}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:shadow-none transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          {actionLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                          ) : parseFloat(data.grand_total || 0) <= 0 ? (
                            <><CheckCircle2 className="w-5 h-5" /> Add Charges First</>
                          ) : (
                            <><CheckCircle2 className="w-5 h-5" /> Send to Client</>
                          )}
                        </button>
                      ) : data.status === 'SENT' && user?.role === 'CLIENT' ? (
                        <div className="mt-8 space-y-3">
                          <button
                            onClick={handleAccept}
                            disabled={actionLoading}
                            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Accept & Process (Book)
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-red-500 font-bold rounded-xl transition-all border border-slate-200 text-sm"
                          >
                            Reject Quotation
                          </button>
                        </div>
                      ) : data.status === 'SENT' ? (
                        <div className="mt-6 pt-4 text-center border-t border-slate-100 text-xs font-semibold">
                          <p className="text-slate-400">Waiting for client response on this quotation.</p>
                        </div>
                      ) : data.status === 'DRAFT' ? (
                        <div className="mt-6 pt-4 text-center border-t border-slate-100 text-xs font-semibold">
                          <p className="text-slate-400">Awaiting pricing from sales team.</p>
                        </div>
                      ) : (
                        <div className="mt-6 pt-4 text-center border-t border-slate-100 text-xs font-semibold">
                          {isAccepted && <p className="text-green-600">✓ This quotation has been accepted & processed.</p>}
                          {isRejected && <p className="text-red-500">❌ This quotation has been rejected.</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Charge Modal */}
                  {showAddCharge && (
                    <AddChargeModal
                      chargeForm={chargeForm}
                      setChargeForm={setChargeForm}
                      chargeMasters={chargeMasters}
                      setChargeMasters={setChargeMasters}
                      chargeSaving={chargeSaving}
                      onSave={handleAddCharge}
                      onClose={() => { setShowAddCharge(false); setChargeForm({ charge_name: '', qty: '1,00', unit_price: '0,00', unit: 'KG', is_taxable: true, charge_master: '__unselected__' }); }}
                    />
                  )}
                </div>
                
                <div className="bg-slate-100/50 p-4 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    This quotation is subject to KargoPath Terms & Conditions. Actual charges may vary if real cargo dimensions or weight differ from provided information.
                  </p>
                </div>
              </div>
            </div>

            {/* Cargo Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-400" /> Cargo Specification Info
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Commodity</p>
                  <p className="text-sm font-bold text-slate-800">{requestObj.commodity}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HS Code</p>
                  <p className="text-sm font-bold text-slate-800">{requestObj.hs_code || '-'}</p>
                </div>
                {mode === 'sea' && requestObj.sea_type === 'FCL' ? (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Container Size</p>
                      <p className="text-sm font-bold text-slate-800">{requestObj.container_size}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Container Quantity</p>
                      <p className="text-sm font-bold text-slate-800">{requestObj.container_qty} units</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Package Type</p>
                      <p className="text-sm font-bold text-slate-800">{requestObj.package_type} ({requestObj.package_qty} Units)</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stackable?</p>
                      <p className="text-sm font-bold text-slate-800">{requestObj.is_stackable ? 'Yes' : 'No'}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dangerous Goods?</p>
                  <p className="text-sm font-bold text-slate-800">
                    {requestObj.is_dangerous ? `Yes (IMDG ${requestObj.dg_class})` : 'No'}
                  </p>
                </div>
                {(requestObj.gross_weight || requestObj.volume_cbm) && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gross Weight</p>
                      <p className="text-sm font-bold text-slate-800">{requestObj.gross_weight} KG</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Volume</p>
                      <p className="text-sm font-bold text-slate-800">{requestObj.volume_cbm} CBM</p>
                    </div>
                  </>
                )}
                {requestObj.cargo_value && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo Value</p>
                    <p className="text-sm font-bold text-slate-800">
                      {requestObj.cargo_currency} {parseFloat(requestObj.cargo_value).toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
              </div>

              {/* Cargo Items Table (if multiple items exist) */}
              {requestObj.cargo_items && requestObj.cargo_items.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Detailed Cargo Items Breakdown</p>
                  
                  {mode === 'sea' && requestObj.sea_type === 'FCL' ? (
                    /* FCL Table */
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b-2 border-slate-300">
                            <th className="py-2 px-3 text-left font-bold text-slate-700">#</th>
                            <th className="py-2 px-3 text-left font-bold text-slate-700">Container Size</th>
                            <th className="py-2 px-3 text-center font-bold text-slate-700">Quantity</th>
                            <th className="py-2 px-3 text-right font-bold text-slate-700">Weight/Container (KG)</th>
                            <th className="py-2 px-3 text-right font-bold text-slate-700">Subtotal Weight (KG)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestObj.cargo_items.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-600 font-medium">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-800">{item.container_size || '-'}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-800">{item.container_qty || 0}</td>
                              <td className="py-2 px-3 text-right text-slate-700">{item.container_weight ? parseFloat(item.container_weight).toLocaleString('id-ID') : '-'}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-800">
                                {item.container_weight && item.container_qty 
                                  ? (parseFloat(item.container_weight) * parseInt(item.container_qty)).toLocaleString('id-ID')
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-blue-50 border-t-2 border-blue-300 font-bold">
                            <td colSpan="2" className="py-2 px-3 text-slate-800 uppercase text-[10px] tracking-wider">TOTAL</td>
                            <td className="py-2 px-3 text-center text-blue-600 font-black">
                              {requestObj.cargo_items.reduce((sum, item) => sum + (parseInt(item.container_qty) || 0), 0)} units
                            </td>
                            <td className="py-2 px-3"></td>
                            <td className="py-2 px-3 text-right text-blue-600 font-black">
                              {requestObj.cargo_items.reduce((sum, item) => 
                                sum + ((parseFloat(item.container_weight) || 0) * (parseInt(item.container_qty) || 0)), 0
                              ).toLocaleString('id-ID')} KG
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* LCL/Air/Land Table */
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b-2 border-slate-300">
                            <th className="py-2 px-3 text-left font-bold text-slate-700">#</th>
                            <th className="py-2 px-3 text-left font-bold text-slate-700">Package Type</th>
                            <th className="py-2 px-3 text-center font-bold text-slate-700">Qty</th>
                            <th className="py-2 px-3 text-right font-bold text-slate-700">Weight (KG)</th>
                            <th className="py-2 px-3 text-right font-bold text-slate-700">Volume (CBM)</th>
                            <th className="py-2 px-3 text-center font-bold text-slate-700">Dimensions (cm)</th>
                            <th className="py-2 px-3 text-center font-bold text-slate-700">Stackable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestObj.cargo_items.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-600 font-medium">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-800">{item.package_type || '-'}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-800">{item.package_qty || 0}</td>
                              <td className="py-2 px-3 text-right text-slate-700">
                                {item.gross_weight ? parseFloat(item.gross_weight).toLocaleString('id-ID') : '-'}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-700">
                                {item.volume_cbm ? parseFloat(item.volume_cbm).toFixed(3) : '-'}
                              </td>
                              <td className="py-2 px-3 text-center text-slate-600 text-[10px]">
                                {item.length && item.width && item.height 
                                  ? `${item.length}×${item.width}×${item.height}`
                                  : '-'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {item.is_stackable ? '✅' : '❌'}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-blue-50 border-t-2 border-blue-300 font-bold">
                            <td colSpan="2" className="py-2 px-3 text-slate-800 uppercase text-[10px] tracking-wider">TOTAL</td>
                            <td className="py-2 px-3 text-center text-blue-600 font-black">
                              {requestObj.cargo_items.reduce((sum, item) => sum + (parseInt(item.package_qty) || 0), 0)} units
                            </td>
                            <td className="py-2 px-3 text-right text-blue-600 font-black">
                              {requestObj.cargo_items.reduce((sum, item) => sum + (parseFloat(item.gross_weight) || 0), 0).toLocaleString('id-ID')} KG
                            </td>
                            <td className="py-2 px-3 text-right text-blue-600 font-black">
                              {requestObj.cargo_items.reduce((sum, item) => sum + (parseFloat(item.volume_cbm) || 0), 0).toFixed(3)} CBM
                            </td>
                            <td colSpan="2" className="py-2 px-3"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {requestObj.special_instructions && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Special Instructions</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-medium">
                    {requestObj.special_instructions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Chat Widget */}
        {chatOpen && (
          <div className="fixed bottom-6 right-6 w-80 md:w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Sales Support</p>
                  <p className="text-xs text-blue-100 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full inline-block shadow-sm shadow-green-900 animate-pulse"></span> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-blue-100 hover:text-white transition-colors">✕</button>
            </div>
            <div className="h-72 bg-slate-50 p-4 overflow-y-auto flex flex-col gap-3">
              <div className="text-center text-xs text-slate-400 font-medium my-2">Today</div>
              <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none w-[85%] text-xs text-slate-700 shadow-sm leading-relaxed font-medium">
                Hello! I am KargoPath Sales Assistant. How can I help you regarding this Quote <span className="font-bold">{isQuotation ? data.quotation_number : requestObj.reference_no}</span>?
              </div>
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
              <input type="text" placeholder="Type your message..." className="flex-1 px-4 py-3 bg-slate-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-blue-600 transition-all" />
              <button className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all">
                ✈
              </button>
            </div>
          </div>
        )}

        {/* Assign Sales Modal */}
        {showAssignModal && requestObj && (
          <AssignModal
            request={{ id: requestObj.id, reference_no: requestObj.reference_no }}
            onClose={() => setShowAssignModal(false)}
            onAssigned={(id, display) => {
              setSalesDisplay(display);
              setShowAssignModal(false);
            }}
          />
        )}

        {/* Reject Dialog Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[200]">
            <form onSubmit={handleRejectSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Reject Quotation</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Please provide the reason for your rejection. Our sales team will review your reason to provide a better alternative quote.
              </p>
              <textarea
                required
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g., Price too high, vessel schedule not suitable..."
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-xs font-semibold resize-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors shadow-lg shadow-red-600/20">
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        )}
      </DashboardLayout>

      {/* ===================================================================== */}
      {/* PDF PREVIEW MODAL */}
      {/* ===================================================================== */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-[300] bg-slate-900/85 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPdfZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-700 font-bold text-lg"
              >−</button>
              <span className="text-sm font-bold text-slate-700 w-12 text-center">{Math.round(pdfZoom * 100)}%</span>
              <button
                onClick={() => setPdfZoom(z => Math.min(2, +(z + 0.25).toFixed(2)))}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-700 font-bold text-lg"
              >+</button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" /> Print
              </button>
              <button
                onClick={() => { setShowPdfPreview(false); setPdfZoom(1); }}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-500 font-bold"
              >✕</button>
            </div>
          </div>
          {/* Document area */}
          <div className="flex-1 overflow-auto bg-slate-200 p-6">
            <div
              style={{ transform: `scale(${pdfZoom})`, transformOrigin: 'top center' }}
              className="bg-white text-slate-900 font-sans max-w-4xl mx-auto p-8 text-sm shadow-xl mb-8 relative overflow-hidden"
            >
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ zIndex: 9999 }}>
                <span className={`text-[120px] font-black uppercase tracking-[0.5em] ${
                  data?.status === 'ACCEPTED' ? 'text-green-600/10' :
                  data?.status === 'REJECTED' ? 'text-red-600/10' :
                  'text-slate-400/10'
                }`} style={{ transform: 'rotate(-30deg)' }}>
                  {data?.status === 'DRAFT' ? 'DRAFT' :
                   data?.status === 'ACCEPTED' ? 'ACCEPTED' :
                   data?.status === 'REJECTED' ? 'REJECTED' :
                   'QUOTATION'}
                </span>
              </div>

              {/* Document Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-black tracking-tight text-slate-900">KargoPath</span>
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-900">PT KargoPath Logistics Nusantara</p>
                    <p>Gedung KargoPath Tower Lt. 15</p>
                    <p>Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan 12190</p>
                    <p>Indonesia</p>
                    <p className="pt-1"><strong>Email:</strong> sales@kargopath.com | <strong>Tel:</strong> +62 21 555 1234</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">Quotation</h1>
                  <div className="mt-2 text-[10px] grid grid-cols-[80px_1fr] gap-y-1 text-left border border-slate-200 p-3 rounded-lg">
                    <span className="font-bold text-slate-500">Quote No:</span> 
                    <span className="font-bold text-slate-900">{data.quotation_number}</span>
                    <span className="font-bold text-slate-500">Date:</span> 
                    <span className="text-slate-900">
                      {new Date(data.created_at).toLocaleDateString('en-US')}
                    </span>
                    <span className="font-bold text-slate-500">Validity:</span> 
                    <span className="text-slate-900">{validUntil}</span>
                  </div>
                </div>
              </div>

              {/* Routing & Parties */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border border-slate-200 p-3 rounded-lg">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Shipper Details</p>
                  <p className="font-black text-slate-900 text-xs uppercase">{requestObj.shipper_company || '-'}</p>
                  <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                    {requestObj.pickup_address && <p>{requestObj.pickup_address}</p>}
                    <p className="pt-1.5 font-medium">PIC: {requestObj.shipper_pic || '-'}</p>
                    <p className="font-medium">Tel: {requestObj.shipper_phone || '-'}</p>
                  </div>
                </div>
                <div className="border border-slate-200 p-3 rounded-lg">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Consignee Details</p>
                  <p className="font-black text-slate-900 text-xs uppercase">{requestObj.consignee_company || '-'}</p>
                  <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                    {requestObj.delivery_address && <p>{requestObj.delivery_address}</p>}
                    <p className="pt-1.5 font-medium">PIC: {requestObj.consignee_pic || '-'}</p>
                    <p className="font-medium">Tel: {requestObj.consignee_phone || '-'}</p>
                  </div>
                </div>
                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Routing & Terms</p>
                  <div className="grid grid-cols-[60px_1fr] gap-y-1 text-[9px]">
                    <span className="text-slate-500">Service:</span> <span className="font-bold text-slate-900">{modeLabel} ({scopeLabel})</span>
                    <span className="text-slate-500">Origin:</span> <span className="font-bold text-slate-900">{pol}</span>
                    <span className="text-slate-500">Dest:</span> <span className="font-bold text-slate-900">{pod}</span>
                    <span className="text-slate-500">Incoterms:</span> <span className="font-bold text-slate-900">{requestObj.incoterms || '-'}</span>
                    <span className="text-slate-500">Specs:</span> <span className="font-bold text-slate-900">{requestObj.commodity}</span>
                  </div>
                </div>
              </div>

              {/* Cargo Items */}
              {requestObj.cargo_items && requestObj.cargo_items.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cargo Items Breakdown</p>
                  {mode === 'sea' && requestObj.sea_type === 'FCL' ? (
                    <table className="w-full text-[9px] border-collapse border border-slate-300">
                      <thead className="bg-slate-100"><tr>
                        <th className="py-1 px-2 text-left font-bold border border-slate-300">#</th>
                        <th className="py-1 px-2 text-left font-bold border border-slate-300">Container Size</th>
                        <th className="py-1 px-2 text-center font-bold border border-slate-300">Qty</th>
                        <th className="py-1 px-2 text-right font-bold border border-slate-300">W/Container (KG)</th>
                        <th className="py-1 px-2 text-right font-bold border border-slate-300">Subtotal (KG)</th>
                      </tr></thead>
                      <tbody>
                        {requestObj.cargo_items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1 px-2 border border-slate-300">{idx + 1}</td>
                            <td className="py-1 px-2 font-bold border border-slate-300">{item.container_size || '-'}</td>
                            <td className="py-1 px-2 text-center font-bold border border-slate-300">{item.container_qty || 0}</td>
                            <td className="py-1 px-2 text-right border border-slate-300">{item.container_weight ? parseFloat(item.container_weight).toLocaleString('id-ID') : '-'}</td>
                            <td className="py-1 px-2 text-right font-bold border border-slate-300">
                              {item.container_weight && item.container_qty ? (parseFloat(item.container_weight) * parseInt(item.container_qty)).toLocaleString('id-ID') : '-'}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold">
                          <td colSpan="2" className="py-1 px-2 border border-slate-300 uppercase text-[8px]">TOTAL</td>
                          <td className="py-1 px-2 text-center border border-slate-300">{requestObj.cargo_items.reduce((s, i) => s + (parseInt(i.container_qty) || 0), 0)} units</td>
                          <td className="py-1 px-2 border border-slate-300"></td>
                          <td className="py-1 px-2 text-right border border-slate-300">
                            {requestObj.cargo_items.reduce((s, i) => s + ((parseFloat(i.container_weight) || 0) * (parseInt(i.container_qty) || 0)), 0).toLocaleString('id-ID')} KG
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-[9px] border-collapse border border-slate-300">
                      <thead className="bg-slate-100"><tr>
                        <th className="py-1 px-2 text-left font-bold border border-slate-300">#</th>
                        <th className="py-1 px-2 text-left font-bold border border-slate-300">Package Type</th>
                        <th className="py-1 px-2 text-center font-bold border border-slate-300">Qty</th>
                        <th className="py-1 px-2 text-right font-bold border border-slate-300">Weight (KG)</th>
                        <th className="py-1 px-2 text-right font-bold border border-slate-300">Volume (CBM)</th>
                        <th className="py-1 px-2 text-center font-bold border border-slate-300">Dimensions (cm)</th>
                        <th className="py-1 px-2 text-center font-bold border border-slate-300">Stack</th>
                      </tr></thead>
                      <tbody>
                        {requestObj.cargo_items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1 px-2 border border-slate-300">{idx + 1}</td>
                            <td className="py-1 px-2 font-bold border border-slate-300">{item.package_type || '-'}</td>
                            <td className="py-1 px-2 text-center font-bold border border-slate-300">{item.package_qty || 0}</td>
                            <td className="py-1 px-2 text-right border border-slate-300">{item.gross_weight ? parseFloat(item.gross_weight).toLocaleString('id-ID') : '-'}</td>
                            <td className="py-1 px-2 text-right border border-slate-300">{item.volume_cbm ? parseFloat(item.volume_cbm).toFixed(3) : '-'}</td>
                            <td className="py-1 px-2 text-center border border-slate-300 text-[8px]">
                              {item.length && item.width && item.height ? `${item.length}×${item.width}×${item.height}` : '-'}
                            </td>
                            <td className="py-1 px-2 text-center border border-slate-300">{item.is_stackable ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold">
                          <td colSpan="2" className="py-1 px-2 border border-slate-300 uppercase text-[8px]">TOTAL</td>
                          <td className="py-1 px-2 text-center border border-slate-300">{requestObj.cargo_items.reduce((s, i) => s + (parseInt(i.package_qty) || 0), 0)} units</td>
                          <td className="py-1 px-2 text-right border border-slate-300">{requestObj.cargo_items.reduce((s, i) => s + (parseFloat(i.gross_weight) || 0), 0).toLocaleString('id-ID')} KG</td>
                          <td className="py-1 px-2 text-right border border-slate-300">{requestObj.cargo_items.reduce((s, i) => s + (parseFloat(i.volume_cbm) || 0), 0).toFixed(3)} CBM</td>
                          <td colSpan="2" className="py-1 px-2 border border-slate-300"></td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Charges */}
              <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Charges Breakdown</p>
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-800 text-white"><tr>
                    <th className="py-1.5 px-3 text-left font-bold border border-slate-700">Description</th>
                    <th className="py-1.5 px-3 text-center font-bold border border-slate-700">Qty</th>
                    <th className="py-1.5 px-3 text-center font-bold border border-slate-700">Unit</th>
                    <th className="py-1.5 px-3 text-right font-bold border border-slate-700">Unit Price ({data.currency})</th>
                    <th className="py-1.5 px-3 text-right font-bold border border-slate-700">Amount ({data.currency})</th>
                  </tr></thead>
                  <tbody className="text-slate-800">
                    {data.items && data.items.map(item => (
                      <tr key={item.id} className="border-b border-slate-300">
                        <td className="py-1.5 px-3 font-bold">{item.charge_name}</td>
                        <td className="py-1.5 px-3 text-center">{item.qty}</td>
                        <td className="py-1.5 px-3 text-center">{item.unit}</td>
                        <td className="py-1.5 px-3 text-right">{parseFloat(item.unit_price).toLocaleString('id-ID')}</td>
                        <td className="py-1.5 px-3 text-right font-bold">{parseFloat(item.amount).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-2">
                  <div className="w-1/2">
                    <div className="flex justify-between py-1 border-b border-slate-300 text-xs">
                      <span className="text-slate-600 font-bold">Subtotal</span>
                      <span className="font-bold text-slate-900">{parseFloat(data.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                    {parseFloat(data.discount || 0) > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-300 text-xs text-green-600">
                        <span className="font-bold">Discount</span>
                        <span className="font-bold">-{parseFloat(data.discount_amount || data.discount).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b-2 border-slate-800 text-xs">
                      <span className="font-bold">VAT / PPN ({parseFloat(data.tax_rate || 0)}%)</span>
                      <span className="font-bold text-slate-900">{parseFloat(data.tax_amount).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest self-end">Grand Total ({data.currency})</span>
                      <span className="text-lg font-black text-slate-900">{parseFloat(data.grand_total).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Signatures */}
              <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-slate-800">
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Terms & Conditions</p>
                  <ul className="text-[8px] text-slate-600 list-disc pl-3 space-y-0.5 text-justify leading-tight font-medium">
                    <li>Rates are based on actual weight or volumetric weight, whichever is higher.</li>
                    <li>Quotation excludes duties, taxes, storage, demurrage, and customs inspection fees unless specified.</li>
                    <li>Subject to space and equipment availability at the time of booking.</li>
                    <li>This quotation is electronically generated and is valid without a physical signature.</li>
                  </ul>
                </div>
                <div className="flex justify-between text-xs gap-4 mt-2">
                  <div className="text-center w-1/2">
                    <p className="text-slate-600 font-medium mb-12">Prepared By,</p>
                    <div className="w-full h-px bg-slate-800 mx-auto mb-1"></div>
                    <p className="text-[9px] text-slate-500">KargoPath Logistics Support</p>
                  </div>
                  <div className="text-center w-1/2">
                    <p className="text-slate-600 font-medium mb-12">Accepted & Confirmed By,</p>
                    <div className="w-full h-px bg-slate-800 mx-auto mb-1"></div>
                    <p className="text-[9px] text-slate-500">Authorized Signature & Stamp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PRINT UI (Hidden on screen, visible on print — keep for actual print) */}
      {/* ===================================================================== */}
      {isQuotation && (
        <div className="hidden print:block bg-white text-slate-900 font-sans max-w-4xl mx-auto p-0 text-sm relative overflow-hidden">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ zIndex: 9999 }}>
            <span className={`text-[120px] font-black uppercase tracking-[0.5em] ${
              data?.status === 'ACCEPTED' ? 'text-green-600/10' :
              data?.status === 'REJECTED' ? 'text-red-600/10' :
              'text-slate-400/10'
            }`} style={{ transform: 'rotate(-30deg)' }}>
              {data?.status === 'DRAFT' ? 'DRAFT' :
               data?.status === 'ACCEPTED' ? 'ACCEPTED' :
               data?.status === 'REJECTED' ? 'REJECTED' :
               'QUOTATION'}
            </span>
          </div>
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-black tracking-tight text-slate-900">KargoPath</span>
              </div>
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-900">PT KargoPath Logistics Nusantara</p>
                <p>Gedung KargoPath Tower Lt. 15</p>
                <p>Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan 12190</p>
                <p>Indonesia</p>
                <p className="pt-1"><strong>Email:</strong> sales@kargopath.com | <strong>Tel:</strong> +62 21 555 1234</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">Quotation</h1>
              <div className="mt-2 text-[10px] grid grid-cols-[80px_1fr] gap-y-1 text-left border border-slate-200 p-3 rounded-lg">
                <span className="font-bold text-slate-500">Quote No:</span> 
                <span className="font-bold text-slate-900">{data.quotation_number}</span>
                <span className="font-bold text-slate-500">Date:</span> 
                <span className="text-slate-900">
                  {new Date(data.created_at).toLocaleDateString('en-US')}
                </span>
                <span className="font-bold text-slate-500">Validity:</span> 
                <span className="text-slate-900">{validUntil}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-slate-200 p-3 rounded-lg">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Shipper Details</p>
              <p className="font-black text-slate-900 text-xs uppercase">{requestObj.shipper_company || '-'}</p>
              <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                {requestObj.pickup_address && <p>{requestObj.pickup_address}</p>}
                <p className="pt-1.5 font-medium">PIC: {requestObj.shipper_pic || '-'}</p>
                <p className="font-medium">Tel: {requestObj.shipper_phone || '-'}</p>
              </div>
            </div>
            <div className="border border-slate-200 p-3 rounded-lg">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Consignee Details</p>
              <p className="font-black text-slate-900 text-xs uppercase">{requestObj.consignee_company || '-'}</p>
              <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                {requestObj.delivery_address && <p>{requestObj.delivery_address}</p>}
                <p className="pt-1.5 font-medium">PIC: {requestObj.consignee_pic || '-'}</p>
                <p className="font-medium">Tel: {requestObj.consignee_phone || '-'}</p>
              </div>
            </div>
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Routing & Terms</p>
              <div className="grid grid-cols-[60px_1fr] gap-y-1 text-[9px]">
                <span className="text-slate-500">Service:</span> <span className="font-bold text-slate-900">{modeLabel} ({scopeLabel})</span>
                <span className="text-slate-500">Origin:</span> <span className="font-bold text-slate-900">{pol}</span>
                <span className="text-slate-500">Dest:</span> <span className="font-bold text-slate-900">{pod}</span>
                <span className="text-slate-500">Incoterms:</span> <span className="font-bold text-slate-900">{requestObj.incoterms || '-'}</span>
                <span className="text-slate-500">Specs:</span> <span className="font-bold text-slate-900">{requestObj.commodity}</span>
              </div>
            </div>
          </div>
          {requestObj.cargo_items && requestObj.cargo_items.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cargo Items Breakdown</p>
              {mode === 'sea' && requestObj.sea_type === 'FCL' ? (
                <table className="w-full text-[9px] border-collapse border border-slate-300">
                  <thead className="bg-slate-100"><tr>
                    <th className="py-1 px-2 text-left font-bold border border-slate-300">#</th>
                    <th className="py-1 px-2 text-left font-bold border border-slate-300">Container Size</th>
                    <th className="py-1 px-2 text-center font-bold border border-slate-300">Qty</th>
                    <th className="py-1 px-2 text-right font-bold border border-slate-300">W/Container (KG)</th>
                    <th className="py-1 px-2 text-right font-bold border border-slate-300">Subtotal (KG)</th>
                  </tr></thead>
                  <tbody>
                    {requestObj.cargo_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 px-2 border border-slate-300">{idx + 1}</td>
                        <td className="py-1 px-2 font-bold border border-slate-300">{item.container_size || '-'}</td>
                        <td className="py-1 px-2 text-center font-bold border border-slate-300">{item.container_qty || 0}</td>
                        <td className="py-1 px-2 text-right border border-slate-300">{item.container_weight ? parseFloat(item.container_weight).toLocaleString('id-ID') : '-'}</td>
                        <td className="py-1 px-2 text-right font-bold border border-slate-300">
                          {item.container_weight && item.container_qty ? (parseFloat(item.container_weight) * parseInt(item.container_qty)).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan="2" className="py-1 px-2 border border-slate-300 uppercase text-[8px]">TOTAL</td>
                      <td className="py-1 px-2 text-center border border-slate-300">{requestObj.cargo_items.reduce((s, i) => s + (parseInt(i.container_qty) || 0), 0)} units</td>
                      <td className="py-1 px-2 border border-slate-300"></td>
                      <td className="py-1 px-2 text-right border border-slate-300">
                        {requestObj.cargo_items.reduce((s, i) => s + ((parseFloat(i.container_weight) || 0) * (parseInt(i.container_qty) || 0)), 0).toLocaleString('id-ID')} KG
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-[9px] border-collapse border border-slate-300">
                  <thead className="bg-slate-100"><tr>
                    <th className="py-1 px-2 text-left font-bold border border-slate-300">#</th>
                    <th className="py-1 px-2 text-left font-bold border border-slate-300">Package Type</th>
                    <th className="py-1 px-2 text-center font-bold border border-slate-300">Qty</th>
                    <th className="py-1 px-2 text-right font-bold border border-slate-300">Weight (KG)</th>
                    <th className="py-1 px-2 text-right font-bold border border-slate-300">Volume (CBM)</th>
                    <th className="py-1 px-2 text-center font-bold border border-slate-300">Dimensions (cm)</th>
                    <th className="py-1 px-2 text-center font-bold border border-slate-300">Stack</th>
                  </tr></thead>
                  <tbody>
                    {requestObj.cargo_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 px-2 border border-slate-300">{idx + 1}</td>
                        <td className="py-1 px-2 font-bold border border-slate-300">{item.package_type || '-'}</td>
                        <td className="py-1 px-2 text-center font-bold border border-slate-300">{item.package_qty || 0}</td>
                        <td className="py-1 px-2 text-right border border-slate-300">{item.gross_weight ? parseFloat(item.gross_weight).toLocaleString('id-ID') : '-'}</td>
                        <td className="py-1 px-2 text-right border border-slate-300">{item.volume_cbm ? parseFloat(item.volume_cbm).toFixed(3) : '-'}</td>
                        <td className="py-1 px-2 text-center border border-slate-300 text-[8px]">
                          {item.length && item.width && item.height ? `${item.length}×${item.width}×${item.height}` : '-'}
                        </td>
                        <td className="py-1 px-2 text-center border border-slate-300">{item.is_stackable ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan="2" className="py-1 px-2 border border-slate-300 uppercase text-[8px]">TOTAL</td>
                      <td className="py-1 px-2 text-center border border-slate-300">{requestObj.cargo_items.reduce((s, i) => s + (parseInt(i.package_qty) || 0), 0)} units</td>
                      <td className="py-1 px-2 text-right border border-slate-300">{requestObj.cargo_items.reduce((s, i) => s + (parseFloat(i.gross_weight) || 0), 0).toLocaleString('id-ID')} KG</td>
                      <td className="py-1 px-2 text-right border border-slate-300">{requestObj.cargo_items.reduce((s, i) => s + (parseFloat(i.volume_cbm) || 0), 0).toFixed(3)} CBM</td>
                      <td colSpan="2" className="py-1 px-2 border border-slate-300"></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Charges Breakdown</p>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-800 text-white"><tr>
                <th className="py-1.5 px-3 text-left font-bold border border-slate-700">Description</th>
                <th className="py-1.5 px-3 text-center font-bold border border-slate-700">Qty</th>
                <th className="py-1.5 px-3 text-center font-bold border border-slate-700">Unit</th>
                <th className="py-1.5 px-3 text-right font-bold border border-slate-700">Unit Price ({data.currency})</th>
                <th className="py-1.5 px-3 text-right font-bold border border-slate-700">Amount ({data.currency})</th>
              </tr></thead>
              <tbody className="text-slate-800">
                {data.items && data.items.map(item => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="py-1.5 px-3 font-bold">{item.charge_name}</td>
                    <td className="py-1.5 px-3 text-center">{item.qty}</td>
                    <td className="py-1.5 px-3 text-center">{item.unit}</td>
                    <td className="py-1.5 px-3 text-right">{parseFloat(item.unit_price).toLocaleString('id-ID')}</td>
                    <td className="py-1.5 px-3 text-right font-bold">{parseFloat(item.amount).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-2">
              <div className="w-1/2">
                <div className="flex justify-between py-1 border-b border-slate-300 text-xs">
                  <span className="text-slate-600 font-bold">Subtotal</span>
                  <span className="font-bold text-slate-900">{parseFloat(data.subtotal).toLocaleString('id-ID')}</span>
                </div>
                {parseFloat(data.discount || 0) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-300 text-xs text-green-600">
                    <span className="font-bold">Discount</span>
                    <span className="font-bold">-{parseFloat(data.discount_amount || data.discount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b-2 border-slate-800 text-xs">
                  <span className="font-bold">VAT / PPN ({parseFloat(data.tax_rate || 0)}%)</span>
                  <span className="font-bold text-slate-900">{parseFloat(data.tax_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest self-end">Grand Total ({data.currency})</span>
                  <span className="text-lg font-black text-slate-900">{parseFloat(data.grand_total).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-slate-800">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Terms & Conditions</p>
              <ul className="text-[8px] text-slate-600 list-disc pl-3 space-y-0.5 text-justify leading-tight font-medium">
                <li>Rates are based on actual weight or volumetric weight, whichever is higher.</li>
                <li>Quotation excludes duties, taxes, storage, demurrage, and customs inspection fees unless specified.</li>
                <li>Subject to space and equipment availability at the time of booking.</li>
                <li>This quotation is electronically generated and is valid without a physical signature.</li>
              </ul>
            </div>
            <div className="flex justify-between text-xs gap-4 mt-2">
              <div className="text-center w-1/2">
                <p className="text-slate-600 font-medium mb-12">Prepared By,</p>
                <div className="w-full h-px bg-slate-800 mx-auto mb-1"></div>
                <p className="text-[9px] text-slate-500">KargoPath Logistics Support</p>
              </div>
              <div className="text-center w-1/2">
                <p className="text-slate-600 font-medium mb-12">Accepted & Confirmed By,</p>
                <div className="w-full h-px bg-slate-800 mx-auto mb-1"></div>
                <p className="text-[9px] text-slate-500">Authorized Signature & Stamp</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

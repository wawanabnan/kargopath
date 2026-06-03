import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, Ship, Clock, Package,
  Loader2, X, ChevronRight, AlertCircle,
  UserPlus, ChevronDown, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quotationRequestAPI, shipmentAPI, usersAPI } from '../api';
import DashboardLayout from '../components/DashboardLayout';

// ── Status Badge (same as QuotationsListPage) ────────────────────────────────
const STATUS_CONFIG = {
  INQUIRY:  { label: 'Inquiry',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ASSIGNED: { label: 'Assigned', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  QUOTED:   { label: 'Quoted',   cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  ACCEPTED: { label: 'Booked',   cls: 'bg-green-50 text-green-700 border border-green-200' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border border-red-200' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Assign Sales Modal (same as QuotationsListPage) ──────────────────────────
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

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  const colors = {
    amber:  'text-amber-600 bg-amber-50',
    blue:   'text-blue-600 bg-blue-50',
    green:  'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className="bg-white border border-slate-200 p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-9 h-9 flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isStaff = user?.role && ['ADMIN', 'SALES', 'OPS'].includes(user.role);
  const isAdmin  = user?.role === 'ADMIN';

  const [requests, setRequests]           = useState([]);
  const [shipmentsCount, setShipmentsCount] = useState(0);
  const [loading, setLoading]             = useState(true);
  const [toast, setToast]                 = useState('');
  const [assignTarget, setAssignTarget]   = useState(null);

  useEffect(() => {
    if (location.state?.quoteSubmitted) {
      setToast(`Quote request ${location.state.reference || ''} submitted successfully.`);
      window.history.replaceState({}, document.title);
      setTimeout(() => setToast(''), 6000);
    }
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqs, ships] = await Promise.all([
          quotationRequestAPI.list(),
          shipmentAPI.list(),
        ]);
        setRequests(reqs?.results ?? reqs ?? []);
        setShipmentsCount((ships?.results ?? ships ?? []).length);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Stats
  const pendingCount    = requests.filter(r => r.status === 'INQUIRY' || r.status === 'ASSIGNED').length;
  const quotedCount     = requests.filter(r => r.status === 'QUOTED').length;
  const acceptedCount   = requests.filter(r => r.status === 'ACCEPTED').length;
  const unassignedCount = isStaff
    ? requests.filter(r => r.status === 'INQUIRY' && !r.sales_in_charge).length
    : 0;

  // Table rows:
  // ADMIN/OPS: top 10 unassigned inquiries
  // SALES: top 10 of their assigned (backend already filtered)
  // CLIENT: latest 10
  const tableRows = isAdmin
    ? requests.filter(r => r.status === 'INQUIRY' && !r.sales_in_charge).slice(0, 10)
    : requests.slice(0, 10);

  const getRoute = (req) => ({
    origin:      req.pol?.split(' – ')[0] || req.pickup_city || '—',
    destination: req.pod?.split(' – ')[0] || req.delivery_city || '—',
  });

  const getModeLabel = (req) => {
    if (req.mode === 'sea') return `Sea · ${req.sea_type || 'FCL'}`;
    if (req.mode === 'air') return 'Air';
    return 'Land';
  };

  const handleRowClick = (req, e) => {
    if (e.target.closest('[data-no-nav]')) return;
    const hasQ   = !!req.quotation_details;
    const linkId = hasQ ? req.quotation_details.id : req.id;
    const type   = hasQ ? 'quotation' : 'request';
    navigate(`/quote/detail/${linkId}?type=${type}`);
  };

  const handleAssigned = (reqId, salesDisplay) => {
    setRequests(prev => prev.map(r =>
      r.id === reqId ? { ...r, sales_in_charge: salesDisplay, sales_display: salesDisplay } : r
    ));
  };

  const pageTitle = isStaff ? 'Operations Dashboard' : 'Client Portal';

  return (
    <DashboardLayout title={pageTitle}>

      {/* Toast */}
      {toast && (
        <div className="mb-4 flex items-center justify-between px-4 py-2.5 bg-green-50 border border-green-200 text-green-800 text-xs font-medium">
          <span>✓ {toast}</span>
          <button onClick={() => setToast('')}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-2" />
          <span className="text-xs text-slate-500">Loading...</span>
        </div>
      ) : (
        <>
          {/* Stats */}
          {isStaff ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard label="Inquiry"         value={pendingCount}   icon={Clock}    color="amber"
                subtitle={isAdmin
                  ? (unassignedCount > 0 ? `${unassignedCount} unassigned` : 'All assigned')
                  : undefined} />
              <StatCard label="Quoted"         value={quotedCount}    icon={FileText} color="blue" />
              <StatCard label="Booked"         value={acceptedCount}  icon={Package}  color="green" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard label="Inquiry"         value={pendingCount}   icon={Clock}    color="amber" />
              <StatCard label="Quoted"           value={quotedCount}    icon={FileText} color="blue"  />
              <StatCard label="Active Shipments" value={shipmentsCount} icon={Ship}     color="green" />
            </div>
          )}

          {/* Unassigned alert — ADMIN only */}
          {isAdmin && unassignedCount > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{unassignedCount} request{unassignedCount > 1 ? 's' : ''} belum di-assign ke sales.</span>
              <Link to="/dashboard/quotations?filter=Inquiry" className="ml-auto text-amber-700 font-bold hover:underline whitespace-nowrap">
                Lihat semua →
              </Link>
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-slate-200">
            {/* Table header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {isAdmin
                    ? '🔔 Unassigned (Inquiry)'
                    : isStaff
                      ? '📋 My Assigned Quotations (Latest 10)'
                      : 'Recent Quotations'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isAdmin
                    ? `Showing up to 10 unassigned · Click row to open detail`
                    : isStaff
                      ? `Showing latest 10 assigned to you · Click row to open detail`
                      : `Showing latest 10 · Click row to open detail`}
                </p>
              </div>
              <Link
                to="/dashboard/quotations"
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Reference</th>
                    {isStaff && <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Client</th>}
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Route</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Commodity</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Mode</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Price</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Status</th>
                    {isStaff && <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Sales</th>}
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Date</th>
                    <th className="px-4 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((req, idx) => {
                    const route    = getRoute(req);
                    const hasQ     = !!req.quotation_details;
                    const price    = hasQ
                      ? `${req.quotation_details.currency} ${parseFloat(req.quotation_details.grand_total).toLocaleString('id-ID')}`
                      : '—';
                    const refLabel = hasQ ? req.quotation_details.quotation_number : req.reference_no;
                    const needsAttention = isStaff && req.status === 'INQUIRY' && !req.sales_in_charge;

                    return (
                      <tr
                        key={idx}
                        onClick={(e) => handleRowClick(req, e)}
                        className={`group border-b border-slate-100 cursor-pointer transition-colors ${
                          needsAttention
                            ? 'bg-amber-50/50 hover:bg-amber-50'
                            : 'hover:bg-blue-50/40'
                        }`}>

                        {/* Reference */}
                        <td className="px-4 py-3 font-semibold text-blue-600 whitespace-nowrap">
                          <span>{refLabel}</span>
                          {needsAttention && (
                            <span title="No sales assigned" className="ml-1.5 inline-flex w-2 h-2 rounded-full bg-amber-400 align-middle" />
                          )}
                        </td>

                        {/* Client (staff only) */}
                        {isStaff && (
                          <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">
                            {req.submitted_by_email || '—'}
                          </td>
                        )}

                        {/* Route */}
                        <td className="px-4 py-3 text-slate-700 min-w-[150px]">
                          <span className="font-medium">{route.origin}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="font-medium">{route.destination}</span>
                        </td>

                        {/* Commodity */}
                        <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">{req.commodity || '—'}</td>

                        {/* Mode */}
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{getModeLabel(req)}</td>

                        {/* Price */}
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{price}</td>

                        {/* Status */}
                        <td className="px-4 py-3"><StatusBadge status={req.status} /></td>

                        {/* Sales (staff only) */}
                        {isStaff && (
                          <td className="px-4 py-3 whitespace-nowrap" data-no-nav>
                            {req.sales_display ? (
                              <span className="text-slate-600 font-medium">{req.sales_display}</span>
                            ) : isAdmin ? (
                              <button
                                data-no-nav
                                onClick={e => { e.stopPropagation(); setAssignTarget(req); }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors rounded-sm">
                                <UserPlus className="w-3 h-3" />
                                Assign
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                        )}

                        {/* Date */}
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(req.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>

                        {/* Arrow */}
                        <td className="px-3 py-3 text-slate-300 group-hover:text-blue-500 transition-colors text-right">
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </td>
                      </tr>
                    );
                  })}

                  {tableRows.length === 0 && (
                    <tr>
                      <td colSpan={isStaff ? 10 : 8} className="px-4 py-12 text-center text-slate-400 text-xs">
                        {isAdmin
                          ? '✅ Semua request sudah di-assign ke sales.'
                          : isStaff
                            ? 'Belum ada quotation yang di-assign ke Anda.'
                            : 'Belum ada quotation.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <AssignModal
          request={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={handleAssigned}
        />
      )}
    </DashboardLayout>
  );
}

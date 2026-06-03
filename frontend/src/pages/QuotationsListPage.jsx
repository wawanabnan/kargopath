import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Search, FileText, UserPlus, X, ChevronRight, AlertCircle, ChevronDown } from 'lucide-react';
import { quotationRequestAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

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

// ── Assign Sales Modal ──────────────────────────────────────────────────────
function AssignModal({ request, onClose, onAssigned }) {
  const [selectedId, setSelectedId] = useState('');
  const [salesUsers, setSalesUsers]  = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState('');
  const ref = useRef(null);

  // Fetch sales users on mount
  useEffect(() => {
    usersAPI.salesUsers()
      .then(data => setSalesUsers(data ?? []))
      .catch(() => setError('Failed to load sales users.'))
      .finally(() => setUsersLoading(false));
  }, []);

  // Close on outside click
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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assign Sales</h3>
            <p className="text-xs text-slate-500 mt-0.5">Ref: {request.reference_no}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
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
                  className="w-full px-3 py-2 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 appearance-none bg-white">
                  <option value="">-- Select person --</option>
                  {salesUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.display} ({u.role})
                    </option>
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


const FILTERS = ['All', 'Inquiry', 'Quoted', 'Booked', 'Rejected'];

export default function QuotationsListPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const isStaff    = user?.role && ['ADMIN', 'SALES', 'OPS'].includes(user.role);
  const isAdmin     = user?.role === 'ADMIN';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [search, setSearch]     = useState('');
  const [assignTarget, setAssignTarget] = useState(null); // row being assigned

  useEffect(() => {
    quotationRequestAPI.list()
      .then(data => setRequests(data?.results ?? data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(r => {
    const matchFilter =
      filter === 'All'      ? true :
      filter === 'Inquiry'  ? (r.status === 'INQUIRY' || r.status === 'ASSIGNED') :
      filter === 'Quoted'   ? r.status === 'QUOTED' :
      filter === 'Booked'   ? r.status === 'ACCEPTED' :
      filter === 'Rejected' ? r.status === 'REJECTED' : true;

    const q = search.toLowerCase();
    const matchSearch = !q || (
      r.reference_no?.toLowerCase().includes(q) ||
      r.commodity?.toLowerCase().includes(q) ||
      r.pol?.toLowerCase().includes(q) ||
      r.pod?.toLowerCase().includes(q) ||
      r.pickup_city?.toLowerCase().includes(q) ||
      r.delivery_city?.toLowerCase().includes(q)
    );
    return matchFilter && matchSearch;
  });

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
    // Don't navigate if clicking the assign button
    if (e.target.closest('[data-no-nav]')) return;
    const hasQ    = !!req.quotation_details;
    const linkId  = hasQ ? req.quotation_details.id : req.id;
    const type    = hasQ ? 'quotation' : 'request';
    navigate(`/quote/detail/${linkId}?type=${type}`);
  };

  const handleAssigned = (reqId, salesId) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, sales_in_charge: salesId } : r));
  };

  return (
    <DashboardLayout title="Quotations">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {isStaff ? 'All Quotation Requests' : 'My Quotations'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{requests.length} total requests</p>
        </div>
        {!isStaff && (
          <Link to="/quote"
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors">
            + New Quote
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-2" />
          <span className="text-xs text-slate-500">Loading...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">No quotations yet</h3>
          <p className="text-xs text-slate-500 mb-6">Submit your first quotation request to get started.</p>
          <Link to="/quote"
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-block">
            + New Quote
          </Link>
        </div>
      ) : (
        <>
          {/* Filters + Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    filter === f
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search reference, commodity, route..."
                className="pl-8 pr-3 py-1.5 border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-blue-600 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Hint for clickable rows */}
          <p className="text-[10px] text-slate-400 mb-2 flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            Click any row to open detail
          </p>

          {/* Table */}
          <div className="bg-white border border-slate-200">
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
                  {filtered.map((req, idx) => {
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

                        {/* Arrow cue */}
                        <td className="px-3 py-3 text-slate-300 group-hover:text-blue-500 transition-colors text-right">
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={isStaff ? 10 : 9} className="px-4 py-10 text-center text-slate-400">
                        {search ? `No results for "${search}"` : 'No quotations match this filter.'}
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

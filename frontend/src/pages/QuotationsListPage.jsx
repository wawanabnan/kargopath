import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, Search, FileText } from 'lucide-react';
import { quotationRequestAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

const STATUS_CONFIG = {
  DRAFT:    { label: 'Draft',          cls: 'bg-slate-100 text-slate-600' },
  PENDING:  { label: 'Pending Review', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  QUOTED:   { label: 'Quoted',         cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  ACCEPTED: { label: 'Booked',         cls: 'bg-green-50 text-green-700 border border-green-200' },
  REJECTED: { label: 'Rejected',       cls: 'bg-red-50 text-red-700 border border-red-200' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

const FILTERS = ['All', 'Pending', 'Quoted', 'Booked', 'Rejected'];

export default function QuotationsListPage() {
  const { user } = useAuth();
  const isStaff = user?.role && ['ADMIN', 'SALES', 'OPS'].includes(user.role);

  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('All');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    quotationRequestAPI.list()
      .then(data => setRequests(data?.results ?? data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(r => {
    const matchFilter =
      filter === 'All'      ? true :
      filter === 'Pending'  ? (r.status === 'PENDING' || r.status === 'DRAFT') :
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
    if (req.mode === 'sea') return `Sea / ${req.sea_type || 'FCL'}`;
    if (req.mode === 'air') return 'Air Freight';
    return 'Land Trucking';
  };

  return (
    <DashboardLayout title="Quotations">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {isStaff ? 'All Quotation Requests' : 'All Quotations'}
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
        /* Empty state — no filter/search shown */
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
          {/* Filters + Search — only shown when there's data */}
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
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Mode</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Price</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Status</th>
                    {isStaff && <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Sales</th>}
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Date</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req, idx) => {
                    const route    = getRoute(req);
                    const hasQ     = !!req.quotation_details;
                    const price    = hasQ
                      ? `${req.quotation_details.currency} ${parseFloat(req.quotation_details.grand_total).toLocaleString('id-ID')}`
                      : '—';
                    const linkId   = hasQ ? req.quotation_details.id : req.id;
                    const linkType = hasQ ? 'quotation' : 'request';
                    const refLabel = hasQ ? req.quotation_details.quotation_number : req.reference_no;
                    const needsAttention = isStaff && req.status === 'PENDING' && !req.sales_in_charge;

                    return (
                      <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${needsAttention ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-4 py-2.5 font-semibold text-blue-600 whitespace-nowrap">
                          {refLabel}
                          {needsAttention && <span className="ml-1.5 text-[9px] font-bold text-amber-600 bg-amber-100 px-1 py-0.5">UNASSIGNED</span>}
                        </td>
                        {isStaff && (
                          <td className="px-4 py-2.5 text-slate-600 max-w-[120px] truncate">
                            {req.submitted_by_email || '—'}
                          </td>
                        )}
                        <td className="px-4 py-2.5 text-slate-700 min-w-[150px]">
                          <span className="font-medium">{route.origin}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="font-medium">{route.destination}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 max-w-[120px] truncate">{req.commodity || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{getModeLabel(req)}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{price}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={req.status} /></td>
                        {isStaff && (
                          <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                            {req.sales_in_charge || <span className="text-amber-600 font-semibold">—</span>}
                          </td>
                        )}
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                          {new Date(req.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link to={`/quote/detail/${linkId}?type=${linkType}`}
                            className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline whitespace-nowrap">
                            View <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={isStaff ? 9 : 8} className="px-4 py-10 text-center text-slate-400">
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
    </DashboardLayout>
  );
}

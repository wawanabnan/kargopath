import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package, FileText, Ship, Clock, LogOut, Bell,
  Menu, Loader2, ArrowRight, X, ChevronDown,
  LayoutDashboard, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quotationRequestAPI, shipmentAPI } from '../api';

const STATUS_CONFIG = {
  DRAFT:    { label: 'Draft',          cls: 'bg-slate-100 text-slate-600' },
  PENDING:  { label: 'Pending Review', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  QUOTED:   { label: 'Quoted',         cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  ACCEPTED: { label: 'Booked',         cls: 'bg-green-50 text-green-700 border border-green-200' },
  REJECTED: { label: 'Rejected',       cls: 'bg-red-50 text-red-700 border border-red-200' },
  REVISED:  { label: 'Revised',        cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    amber: 'text-amber-600 bg-amber-50',
    blue:  'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
  };
  return (
    <div className="bg-white border border-slate-200 p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`w-9 h-9 flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { to: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/quotations', icon: FileText,        label: 'Quotations' },
  { to: '/dashboard/shipments',  icon: Ship,            label: 'Shipments' },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [filter, setFilter]           = useState('All');
  const [requests, setRequests]       = useState([]);
  const [shipmentsCount, setShipmentsCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState('');
  const [mobileNav, setMobileNav]     = useState(false);
  const [collapsed, setCollapsed]     = useState(false); // sidebar collapse

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
        const shipList = ships?.results ?? ships ?? [];
        setShipmentsCount(shipList.length);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const clientName = user
    ? (user.company?.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email)
    : '—';

  const clientRole = user?.client_type === 'company'
    ? 'Company'
    : user?.client_type === 'personal_business'
    ? 'Personal Business'
    : 'Client';

  const getInitials = (name) =>
    name ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : 'U';

  const pendingCount = requests.filter(r => r.status === 'PENDING' || r.status === 'DRAFT').length;
  const quotedCount  = requests.filter(r => r.status === 'QUOTED').length;

  const filtered = requests.filter(r => {
    if (filter === 'All')      return true;
    if (filter === 'Pending')  return r.status === 'PENDING' || r.status === 'DRAFT';
    if (filter === 'Quoted')   return r.status === 'QUOTED';
    if (filter === 'Booked')   return r.status === 'ACCEPTED';
    if (filter === 'Rejected') return r.status === 'REJECTED';
    return true;
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
    <div className="min-h-screen bg-slate-100 flex font-sans overflow-x-hidden">

      {/* ── Sidebar (desktop) ── */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-slate-900 transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-52'
      }`}>
        {/* Logo */}
        <div className={`h-12 flex items-center border-b border-slate-800 ${collapsed ? 'justify-center px-0' : 'px-4 gap-2'}`}>
          {collapsed ? (
            <Package className="w-4 h-4 text-blue-400" />
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-white font-bold tracking-tight text-sm">KargoPath</span>
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3">
          {!collapsed && (
            <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Menu</p>
          )}
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors mb-0.5 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        {/* User + collapse toggle */}
        <div className="px-2 py-3 border-t border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
              <div className="w-6 h-6 bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitials(clientName)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">{clientName}</p>
                <p className="text-xs text-slate-500 leading-tight">{clientRole}</p>
              </div>
            </div>
          )}
          <button onClick={logout} title="Sign Out"
            className={`w-full flex items-center gap-3 px-2 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mb-1 ${
              collapsed ? 'justify-center' : ''
            }`}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Sign Out'}
          </button>
          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-full flex items-center gap-3 px-2 py-2 text-xs text-slate-600 hover:bg-slate-800 hover:text-white transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}>
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <><PanelLeftClose className="w-4 h-4" /><span>Collapse</span></>
            }
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-5 lg:px-6 h-12 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-500" onClick={() => setMobileNav(true)}>
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-slate-800">Client Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-slate-400 hover:text-slate-600">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <Link to="/quote"
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors">
              + New Quote
            </Link>
            <div className="lg:hidden w-6 h-6 bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {getInitials(clientName)}
            </div>
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div className="mx-5 lg:mx-6 mt-3 flex items-center justify-between px-4 py-2.5 bg-green-50 border border-green-200 text-green-800 text-xs font-medium">
            <span>✓ {toast}</span>
            <button onClick={() => setToast('')}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 px-5 lg:px-6 py-5">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Activity Summary</h2>
              <p className="text-xs text-slate-500 mt-0.5">Overview of your quotations and shipments</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-2" />
              <span className="text-xs text-slate-500">Loading...</span>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <StatCard label="Pending Review"   value={pendingCount}   icon={Clock}    color="amber" />
                <StatCard label="Quoted"           value={quotedCount}    icon={FileText} color="blue"  />
                <StatCard label="Active Shipments" value={shipmentsCount} icon={Ship}     color="green" />
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Recent Quotations</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Filter:</span>
                    <div className="relative">
                      <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="appearance-none pl-2.5 pr-6 py-1 border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer">
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Quoted">Quoted</option>
                        <option value="Booked">Booked</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Reference</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Route</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Mode</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Price</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Status</th>
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

                        return (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5 font-semibold text-blue-600 whitespace-nowrap">{refLabel}</td>
                            <td className="px-4 py-2.5 text-slate-700 min-w-[150px]">
                              <span className="font-medium">{route.origin}</span>
                              <span className="text-slate-400 mx-1">→</span>
                              <span className="font-medium">{route.destination}</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{getModeLabel(req)}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{price}</td>
                            <td className="px-4 py-2.5"><StatusBadge status={req.status} /></td>
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
                          <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                            No quotations found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50">
                  <button className="text-xs font-semibold text-blue-600 hover:underline">
                    View all quotations →
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Mobile nav overlay ── */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-52 bg-slate-900 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-white font-bold text-sm">KargoPath</span>
              </Link>
              <button onClick={() => setMobileNav(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 px-2 py-3">
              {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                <Link key={to} to={to} onClick={() => setMobileNav(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 text-sm font-medium mb-0.5 ${
                    location.pathname === to
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
            </nav>
            <div className="px-2 py-3 border-t border-slate-800">
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-2 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileNav(false)} />
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package, FileText, Ship, Clock, LogOut, Bell,
  Menu, Loader2, ArrowRight, X, ChevronDown,
  LayoutDashboard, PanelLeftClose, PanelLeftOpen,
  User, KeyRound, Users, DollarSign, AlertCircle,
  Settings,
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

function StatCard({ label, value, icon: Icon, color, sub }) {
  const colors = {
    amber:  'text-amber-600 bg-amber-50',
    blue:   'text-blue-600 bg-blue-50',
    green:  'text-green-600 bg-green-50',
    red:    'text-red-600 bg-red-50',
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

const CLIENT_NAV = [
  { to: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/quotations', icon: FileText,        label: 'Quotations' },
  { to: '/dashboard/shipments',  icon: Ship,            label: 'Shipments' },
];

const STAFF_NAV = [
  { to: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/quotations', icon: FileText,        label: 'Quotations' },
  { to: '/dashboard/shipments',  icon: Ship,            label: 'Shipments' },
  { to: '/dashboard/tariffs',    icon: DollarSign,      label: 'Tariffs' },
];

function getInitials(name) {
  return name ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : 'U';
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isStaff = user?.role && ['ADMIN', 'SALES', 'OPS'].includes(user.role);
  const NAV_ITEMS = isStaff ? STAFF_NAV : CLIENT_NAV;

  const [filter, setFilter]           = useState('All');
  const [requests, setRequests]       = useState([]);
  const [shipmentsCount, setShipmentsCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState('');
  const [mobileNav, setMobileNav]     = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [userMenu, setUserMenu]       = useState(false);
  const userMenuRef                   = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const displayName = user
    ? (isStaff
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
        : (user.company?.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email))
    : '—';

  const displayRole = isStaff
    ? (user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'SALES' ? 'Sales' : 'Operations')
    : (user?.client_type === 'company' ? 'Company' : user?.client_type === 'personal_business' ? 'Personal Business' : 'Client');

  // ── Stats ──────────────────────────────────────────────────────────────────
  const pendingCount   = requests.filter(r => r.status === 'PENDING' || r.status === 'DRAFT').length;
  const quotedCount    = requests.filter(r => r.status === 'QUOTED').length;
  const acceptedCount  = requests.filter(r => r.status === 'ACCEPTED').length;
  const rejectedCount  = requests.filter(r => r.status === 'REJECTED').length;

  // Staff: unassigned requests need attention
  const unassignedCount = isStaff
    ? requests.filter(r => r.status === 'PENDING' && !r.sales_in_charge).length
    : 0;

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

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = ({ mobile = false }) => (
    <div className={`${mobile ? 'w-52' : ''} bg-slate-900 flex flex-col h-full`}>
      <div className={`h-12 flex items-center border-b border-slate-800 ${!mobile && collapsed ? 'justify-center px-0' : 'px-4 gap-2'}`}>
        {!mobile && collapsed ? (
          <Package className="w-4 h-4 text-blue-400" />
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-white font-bold tracking-tight text-sm">KargoPath</span>
          </Link>
        )}
      </div>

      <nav className="flex-1 px-2 py-3">
        {(!mobile && !collapsed) && (
          <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            {isStaff ? 'Operations' : 'Menu'}
          </p>
        )}
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} title={!mobile && collapsed ? label : undefined}
              className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors mb-0.5 ${
                !mobile && collapsed ? 'justify-center' : ''
              } ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {(mobile || !collapsed) && label}
            </Link>
          );
        })}

        {/* Admin-only: Django admin link */}
        {isStaff && user?.role === 'ADMIN' && (mobile || !collapsed) && (
          <>
            <div className="my-3 border-t border-slate-800" />
            <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Admin</p>
            <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mb-0.5">
              <Settings className="w-4 h-4 flex-shrink-0" /> Django Admin
            </a>
          </>
        )}
      </nav>

      <div className="px-2 py-3 border-t border-slate-800">
        {!mobile && (
          <button onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
            className={`w-full flex items-center gap-3 px-2 py-2 text-xs text-slate-600 hover:bg-slate-800 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}>
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <><PanelLeftClose className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        )}
        {mobile && (
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-2 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans overflow-x-hidden">

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}>
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-5 lg:px-6 h-12 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-500" onClick={() => setMobileNav(true)}>
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-slate-800">
              {isStaff ? 'Operations Dashboard' : 'Client Portal'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-slate-400 hover:text-slate-600">
              <Bell className="w-4 h-4" />
              {unassignedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                  {unassignedCount}
                </span>
              )}
            </button>

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setUserMenu(v => !v)}
                className="flex items-center gap-2 pl-3 border-l border-slate-200 hover:bg-slate-50 pr-2 py-1 transition-colors">
                <div className={`w-6 h-6 flex items-center justify-center text-white text-xs font-bold ${isStaff ? 'bg-slate-700' : 'bg-blue-600'}`}>
                  {getInitials(displayName)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight max-w-[120px] truncate">{displayName}</p>
                  <p className="text-xs text-slate-400 leading-tight">{displayRole}</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${userMenu ? 'rotate-180' : ''}`} />
              </button>
              {userMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 shadow-lg z-50">
                  <div className="px-3 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">{displayRole}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/profile/edit" onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Edit Profile
                    </Link>
                    <Link to="/profile/change-password" onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Change Password
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <button onClick={() => { setUserMenu(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
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

        <main className="flex-1 px-5 lg:px-6 py-5">

          {/* Page header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isStaff ? 'Operations Overview' : 'Activity Summary'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isStaff
                  ? `${requests.length} total requests across all clients`
                  : 'Overview of your quotations and shipments'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-2" />
              <span className="text-xs text-slate-500">Loading...</span>
            </div>
          ) : (
            <>
              {/* Stats — different for staff vs client */}
              {isStaff ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  <StatCard label="Pending Review"    value={pendingCount}   icon={Clock}        color="amber"
                    sub={unassignedCount > 0 ? `${unassignedCount} unassigned` : 'All assigned'} />
                  <StatCard label="Quoted"            value={quotedCount}    icon={FileText}     color="blue"  />
                  <StatCard label="Booked"            value={acceptedCount}  icon={Ship}         color="green" />
                  <StatCard label="Active Shipments"  value={shipmentsCount} icon={Package}      color="purple"/>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <StatCard label="Pending Review"   value={pendingCount}   icon={Clock}    color="amber" />
                  <StatCard label="Quoted"           value={quotedCount}    icon={FileText} color="blue"  />
                  <StatCard label="Active Shipments" value={shipmentsCount} icon={Ship}     color="green" />
                </div>
              )}

              {/* Unassigned alert for staff */}
              {isStaff && unassignedCount > 0 && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{unassignedCount} quotation request{unassignedCount > 1 ? 's' : ''} pending assignment to sales.</span>
                  <Link to="/dashboard/quotations?filter=Pending" className="ml-auto text-amber-700 font-bold hover:underline whitespace-nowrap">
                    Review now →
                  </Link>
                </div>
              )}

              {/* Table */}
              <div className="bg-white border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {isStaff ? 'Recent Requests (All Clients)' : 'Recent Quotations'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Filter:</span>
                    <div className="relative">
                      <select value={filter} onChange={e => setFilter(e.target.value)}
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
                        {isStaff && <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Client</th>}
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Route</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Mode</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Price</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Status</th>
                        {isStaff && <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Sales</th>}
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Date</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 10).map((req, idx) => {
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
                            <td className="px-4 py-2.5 text-slate-700 min-w-[140px]">
                              <span className="font-medium">{route.origin}</span>
                              <span className="text-slate-400 mx-1">→</span>
                              <span className="font-medium">{route.destination}</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{getModeLabel(req)}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{price}</td>
                            <td className="px-4 py-2.5"><StatusBadge status={req.status} /></td>
                            {isStaff && (
                              <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                                {req.sales_in_charge ? req.sales_in_charge : <span className="text-amber-600 font-semibold">—</span>}
                              </td>
                            )}
                            <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                              {new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                          <td colSpan={isStaff ? 9 : 7} className="px-4 py-10 text-center text-slate-400">
                            No quotations found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Showing {Math.min(filtered.length, 10)} of {filtered.length}
                  </span>
                  <Link to="/dashboard/quotations" className="text-xs font-semibold text-blue-600 hover:underline">
                    View all →
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile nav */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-52 flex flex-col">
            <div className="flex-1">
              <Sidebar mobile />
            </div>
            <button onClick={() => setMobileNav(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileNav(false)} />
        </div>
      )}
    </div>
  );
}

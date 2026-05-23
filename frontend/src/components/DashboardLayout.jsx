import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package, FileText, Ship, LogOut, Bell,
  Menu, X, LayoutDashboard, PanelLeftClose, PanelLeftOpen,
  User, KeyRound, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/quotations', icon: FileText,        label: 'Quotations' },
  { to: '/dashboard/shipments',  icon: Ship,            label: 'Shipments' },
];

function getInitials(name) {
  return name ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : 'U';
}

/**
 * DashboardLayout
 * Props:
 *   children  — page content
 *   title     — page title shown in the top bar
 */
export default function DashboardLayout({ children, title = 'Client Portal' }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [userMenu, setUserMenu]   = useState(false);
  const userMenuRef               = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clientName = user
    ? (user.company?.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email)
    : '—';

  const clientRole = user?.client_type === 'company'
    ? 'Company'
    : user?.client_type === 'personal_business'
    ? 'Personal Business'
    : 'Client';

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

        {/* User info + collapse toggle */}
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
            <h1 className="text-sm font-bold text-slate-800">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Bell */}
            <button className="relative text-slate-400 hover:text-slate-600">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* New Quote */}
            <Link to="/quote"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors">
              + New Quote
            </Link>

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenu(v => !v)}
                className="flex items-center gap-2 pl-3 border-l border-slate-200 hover:bg-slate-50 pr-2 py-1 transition-colors">
                <div className="w-6 h-6 bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {getInitials(clientName)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight max-w-[120px] truncate">{clientName}</p>
                  <p className="text-xs text-slate-400 leading-tight">{clientRole}</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${userMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {userMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 shadow-lg z-50">
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{clientName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link to="/profile/edit"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Edit Profile
                    </Link>
                    <Link to="/profile/change-password"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      Change Password
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button onClick={() => { setUserMenu(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-5 lg:px-6 py-5">
          {children}
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

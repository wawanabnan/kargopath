import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home',        to: '/'            },
  { label: 'Services',    to: '/services'    },
  { label: 'About Us',    to: '/about'       },
  { label: 'Contact',     to: '/contact'     },
  { label: 'FAQ',         to: '/faq'         },
];

/**
 * Shared top navigation.
 * On the home page ("/") it starts transparent with white text and transitions
 * to a light/white style after scrolling. On all other pages it is always light.
 */
export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isHome   = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, [isHome]);

  const dark = isHome && !scrolled; // dark mode = on hero, not yet scrolled

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${
      dark ? 'bg-transparent' : 'bg-white shadow-md border-b border-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className={`text-2xl font-extrabold tracking-tight transition-colors duration-500 ${dark ? 'text-white' : 'text-slate-900'}`}>
              KargoPath
            </span>
          </Link>

          {/* Right Side: Navigation & Actions */}
          <div className="flex items-center gap-8">
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(({ label, to }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to}
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      active
                        ? 'text-blue-600'
                        : dark
                          ? 'text-white/75 hover:text-white'
                          : 'text-slate-600 hover:text-blue-600'
                    }`}>
                    {label}
                    {active && <div className="h-0.5 bg-blue-600 mt-0.5" />}
                  </Link>
                );
              })}
            </div>

            {/* Language & Auth */}
            <div className="flex items-center gap-4 border-l pl-6 border-slate-300/30">
              <select className={`bg-transparent text-sm font-semibold focus:outline-none cursor-pointer appearance-none ${dark ? 'text-white' : 'text-slate-700'}`}>
                <option value="en" className="text-slate-900">EN</option>
                <option value="id" className="text-slate-900">ID</option>
              </select>

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link to="/dashboard"
                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all hover:-translate-y-0.5">
                    Dashboard &rarr;
                  </Link>
                  <button onClick={logout}
                    className={`hidden md:inline-flex px-4 py-2.5 text-sm font-bold border transition-all duration-300 ${
                      dark
                        ? 'text-white border-white/30 hover:bg-white/10'
                        : 'text-slate-700 border-slate-200 hover:text-red-600 hover:border-red-300'
                    }`}>
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hidden md:inline-flex px-4 py-2.5 text-sm font-bold border transition-all duration-300 ${
                      dark
                        ? 'text-white border-white/30 hover:bg-white/10'
                        : 'text-slate-700 border-slate-200 hover:text-blue-600 hover:border-blue-300'
                    }`}>
                    Sign In
                  </Link>
                  <Link to="/quote"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all hover:-translate-y-0.5">
                    Get a Quote &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

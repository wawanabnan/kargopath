import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <span className="text-xl font-bold text-white block mb-5">KargoPath</span>
            <p className="text-slate-500 leading-relaxed mb-6 max-w-xs">
              Indonesia's technology-enabled 3PL provider for businesses.
            </p>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-slate-600">Email: </span><span className="text-slate-400">hello@kargopath.com</span></p>
              <p><span className="text-slate-600">Phone: </span><span className="text-slate-400">+62 21 555 1234</span></p>
            </div>
          </div>

          {[
            { heading: 'Company', links: [['About Us', '/about'], ['Services', '/services'], ['Contact', '/contact'], ['FAQ', '/faq']] },
            { heading: 'Client Tools', links: [['Track Shipment', '/tracking'], ['Client Login', '/login'], ['Request Quote', '/quote']] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-5">{heading}</p>
              <ul className="space-y-3">
                {links.map(([label, to]) => (
                  <li key={label}>
                    <Link 
                      to={to} 
                      {...(to === '/login' || to === '/quote' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 mt-16 pt-8 flex justify-between items-center">
          <p className="text-sm text-slate-600">© 2026 PT KargoPath Logistics Nusantara.</p>
        </div>
      </div>
    </footer>
  );
}

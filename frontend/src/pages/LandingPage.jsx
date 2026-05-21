import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FAQS = [
  {
    q: "How fast can I get a quotation?",
    a: "Through our centralized dashboard, standard routes are quoted instantly. Complex project logistics may take up to 24 hours."
  },
  {
    q: "Do I need to sign a contract to use the platform?",
    a: "You can create a free account and request quotes without any binding contract. Contracts are only required upon booking confirmation."
  },
  {
    q: "What documents are required for international shipping?",
    a: "Typically you will need a Commercial Invoice and Packing List. Our platform will automatically guide you on any additional customs documents based on your route."
  }
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="font-sans text-slate-900 bg-slate-50">

      {/* ── HERO (SaaS Style) ────────────────────────────────────────── */}
      <section className="pt-32 pb-24 bg-slate-900 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            
            <div className="inline-block px-3 py-1 bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
              KargoPath Logistics OS
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Integrated Cargo Solutions.<br />
              <span className="text-blue-500">Powered by Tech.</span>
            </h1>
            
            <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              Combining decades of logistics expertise with advanced technology to deliver your cargo faster and safer. We manage your shipments across Sea, Air, and Land seamlessly from a single centralized dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
                {isAuthenticated ? 'Go to Dashboard' : 'Try Platform Now'}
              </Link>
              <Link to="/quote"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border border-slate-600 hover:bg-slate-800 text-white font-bold transition-colors">
                Request Quotation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRACKING BAR ─────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 text-center">Quick Shipment Tracking</p>
          <div className="flex flex-col sm:flex-row gap-0 border border-slate-300">
            <input type="text" placeholder="Enter tracking number (e.g. KP-2026-A3F2)"
              className="flex-1 px-5 py-4 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 transition-colors" />
            <Link to="/tracking"
              className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors whitespace-nowrap border-l border-slate-900 flex items-center justify-center">
              Track Cargo
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPREHENSIVE CARGO SERVICES ─────────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Complete Freight Capabilities</h2>
            <p className="text-lg text-slate-500">
              Whether you need to ship a small parcel or charter a full vessel, our extensive network and digital infrastructure handle it all.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: '🚢',
                title: 'Sea Freight (FCL & LCL)',
                desc: 'Cost-effective ocean shipping for large volumes. We handle both Full Container Loads (FCL) and Less than Container Loads (LCL) globally.' 
              },
              { 
                icon: '✈️',
                title: 'Air Freight',
                desc: 'Priority air cargo solutions for time-sensitive and high-value shipments, ensuring rapid delivery to any destination.' 
              },
              { 
                icon: '🚛',
                title: 'Land Trucking (FTL & LTL)',
                desc: 'Reliable domestic and cross-border trucking services. From Full Truckload (FTL) to Less than Truckload (LTL) distribution.' 
              },
            ].map(s => (
              <div key={s.title} className="bg-slate-50 p-10 border border-slate-200">
                <span className="text-3xl block mb-6">{s.icon}</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FITUR UNGGULAN (Pain Points Solver) ──────────────────────── */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The Future of Logistics</h2>
            <p className="text-lg text-slate-500">
              KargoPath is designed specifically to eliminate inefficiencies in traditional freight forwarding.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: '⚡',
                title: 'Instant Quotation',
                desc: 'Stop waiting days for email replies. Get and compare route prices transparently directly from the system.' 
              },
              { 
                icon: '💻',
                title: 'Smart Online Booking',
                desc: 'Approve quotes with a single click. The system automatically creates shipment drafts without manual data entry.' 
              },
              { 
                icon: '🗂️',
                title: 'Centralized Control',
                desc: 'All important documents (B/L, AWB, Invoices) and cargo journey history are securely stored in one place.' 
              },
            ].map(s => (
              <div key={s.title} className="bg-white p-10 border border-slate-200">
                <span className="text-3xl block mb-6">{s.icon}</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRASI & KEPERCAYAAN ──────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">Your Cargo is in Good Hands</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale">
            {['IATA', 'FIATA', 'GAFEKSI', 'BEA CUKAI RI'].map(brand => (
              <div key={brand} className="px-6 py-3 border-2 border-slate-300 font-bold text-slate-600 text-sm tracking-widest uppercase">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ──────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-500">Everything you need to know about the platform.</p>
          </div>
          
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6">
                <h4 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Freight Operations?</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Join the first digital 3PL platform designed for maximum efficiency in Indonesia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
              {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <span className="text-xl font-bold text-white block mb-5">KargoPath</span>
              <p className="text-slate-500 leading-relaxed mb-6 max-w-xs">
                The First Digital Logistics Operating System for Indonesia's Freight Forwarding Ecosystem.
              </p>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-slate-600">Email: </span><span className="text-slate-400">hello@kargopath.com</span></p>
                <p><span className="text-slate-600">Phone: </span><span className="text-slate-400">+62 21 555 1234</span></p>
              </div>
            </div>

            {[
              { heading: 'Platform', links: [['Features', '#'], ['Pricing', '#'], ['API Docs', '#']] },
              { heading: 'Portal',   links: [['Track Cargo', '/tracking'], ['Request Quote', '/quote'], ['Sign In', '/login']] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-white font-bold text-xs uppercase tracking-widest mb-5">{heading}</p>
                <ul className="space-y-3">
                  {links.map(([label, to]) => (
                    <li key={label}><Link to={to} className="text-sm hover:text-white transition-colors">{label}</Link></li>
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
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    n: '01', icon: '📋', title: 'Request a Quote',
    desc: 'Fill our smart 3-step form with your shipment details — mode of transport, routing, and cargo specs. No account required to start. Takes less than 5 minutes.',
    detail: ['Select Sea, Air, or Land mode', 'Enter POL, POD, or door-to-door address', 'Add cargo dimensions & commodity', 'Submit — we\'ll take it from here'],
  },
  {
    n: '02', icon: '💼', title: 'Sales Review & Quotation',
    desc: 'Our expert sales team reviews your request and prepares a detailed, competitive quotation within hours — fully itemized with all charges, taxes, and valid period.',
    detail: ['Freight rate from carrier partners', 'Origin & destination trucking cost', 'Customs & handling charges', 'VAT, discount, and grand total'],
  },
  {
    n: '03', icon: '✅', title: 'Accept & Confirm Booking',
    desc: 'Review the quotation in your client portal. Accept, request revisions, or reject. Upon acceptance, our operations team immediately creates the shipment booking.',
    detail: ['View official quotation document', 'Accept or request revision', 'Download PDF for finance approval', 'Auto-creates shipment on acceptance'],
  },
  {
    n: '04', icon: '📦', title: 'We Handle Everything',
    desc: 'Once booked, we manage the entire logistics chain — pickup, export customs, main freight, import customs, and final delivery — all tracked in real-time.',
    detail: ['Cargo pickup from shipper', 'Export documentation & customs', 'Main freight (sea/air/land)', 'Import clearance & delivery'],
  },
  {
    n: '05', icon: '📍', title: 'Live Tracking',
    desc: 'Monitor your shipment at every milestone through your client dashboard. Receive status updates and alerts so you\'re always informed.',
    detail: ['Real-time milestone updates', 'ETA notifications', 'Document management', '24/7 support access'],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen font-sans bg-white">
      {/* Header */}
      <div className="bg-slate-900 pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">The Process</p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5">How It Works</h1>
          <p className="text-slate-400 text-lg font-medium">From quote to delivery — a transparent, end-to-end process designed for your business.</p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto px-4 py-24 space-y-16">
        {STEPS.map((s, i) => (
          <div key={s.n} className="relative grid md:grid-cols-[80px_1fr] gap-8 items-start">
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className="hidden md:block absolute left-10 top-20 w-0.5 h-full bg-gradient-to-b from-blue-200 to-transparent" />
            )}
            {/* Step number */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-blue-600/20 flex-shrink-0 z-10">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-bold text-white/60 mt-0.5">{s.n}</span>
            </div>
            {/* Content */}
            <div className="pt-2">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-3">{s.title}</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-5">{s.desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {s.detail.map(d => (
                  <div key={d} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-slate-50 border-t border-slate-100 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Ready to Get Started?</h2>
        <p className="text-slate-500 font-medium mb-8">It takes less than 5 minutes to submit your first quotation request.</p>
        <Link to="/quote" className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 text-lg">
          Request a Quote Now →
        </Link>
      </div>
    </div>
  );
}

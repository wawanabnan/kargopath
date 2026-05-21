import React from 'react';
import { Link } from 'react-router-dom';

const SERVICES = [
  {
    emoji: '🚢', title: 'Sea Freight', color: 'blue',
    options: ['FCL – Full Container Load', 'LCL – Less than Container Load', 'Reefer / Temperature Controlled', 'Break Bulk & Project Cargo'],
    desc: 'Cost-effective ocean freight for large volumes. We handle export/import documentation, customs clearance, and port-to-port or door-to-door delivery worldwide.',
    features: ['Competitive ocean freight rates', 'Weekly sailing schedules', 'FCL & LCL consolidation', 'Real-time vessel tracking', 'Export/Import customs clearance', 'Cargo insurance available'],
  },
  {
    emoji: '✈️', title: 'Air Freight', color: 'sky',
    options: ['Express / Priority', 'Standard Deferred', 'Charter Services', 'Dangerous Goods (IATA)'],
    desc: 'Priority air cargo solutions for time-critical shipments. Guaranteed space allocation and fastest transit times to 50+ countries across Asia, Europe, and the Americas.',
    features: ['Priority space guaranteed', '24-48h transit to major hubs', 'IATA certified handling', 'DG goods compliance', 'Airport-to-airport / Door-to-door', 'Real-time AWB tracking'],
  },
  {
    emoji: '🚚', title: 'Land Trucking', color: 'indigo',
    options: ['Full Truck Load (FTL)', 'Less than Truck Load (LTL)', 'Cross-Border (ASEAN)', 'Specialized Heavy Cargo'],
    desc: 'Reliable domestic and cross-border trucking with modern GPS-tracked fleet. Covering all major industrial estates and ports across Java, Sumatra, Kalimantan, and Sulawesi.',
    features: ['Modern GPS-tracked fleet', 'FTL & LTL options', 'Cross-border ASEAN routes', 'Industrial estate coverage', 'Container trucking (port)', 'Temperature-controlled trucks'],
  },
  {
    emoji: '🛃', title: 'Customs Clearance', color: 'amber',
    options: ['Import Customs (BC 2.0)', 'Export Customs (PEB)', 'Bonded Warehouse (GB)', 'LARTAS / Special Permits'],
    desc: 'Licensed customs broker (PPJK) with expert handling of all Indonesian import/export documentation, duty calculation, and regulatory compliance.',
    features: ['Licensed PPJK broker', 'Import & export declaration', 'HS code classification', 'Duty & tax calculation', 'LARTAS permit assistance', 'Bonded logistics zone'],
  },
];

const colorMap = {
  blue:  'bg-blue-50 text-blue-600 border-blue-100',
  sky:   'bg-sky-50 text-sky-600 border-sky-100',
  indigo:'bg-indigo-50 text-indigo-600 border-indigo-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen font-sans bg-white text-slate-900">
      {/* Header */}
      <div className="bg-slate-900 pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">What We Offer</p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5 tracking-tight">Our Services</h1>
          <p className="text-slate-400 text-lg font-medium">Complete logistics solutions — from first mile to last mile, across sea, air, and land.</p>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-6xl mx-auto px-4 py-24 space-y-20">
        {SERVICES.map((s, i) => (
          <div key={s.title} className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            <div className={i % 2 !== 0 ? 'md:order-2' : ''}>
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border text-sm font-bold mb-5 ${colorMap[s.color]}`}>
                <span className="text-xl">{s.emoji}</span> {s.title}
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{s.title}</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">{s.desc}</p>
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Service Types</p>
                <div className="flex flex-wrap gap-2">
                  {s.options.map(o => (
                    <span key={o} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">{o}</span>
                  ))}
                </div>
              </div>
              <Link to="/quote" className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
                Get a Quote →
              </Link>
            </div>
            <div className={`bg-slate-50 rounded-3xl p-8 border border-slate-100 ${i % 2 !== 0 ? 'md:order-1' : ''}`}>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5">What's Included</p>
              <ul className="space-y-3">
                {s.features.map(f => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-slate-700 font-medium text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-blue-600 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">Need a Custom Solution?</h2>
        <p className="text-blue-100 font-medium mb-8">Our team will design a logistics plan tailored to your business.</p>
        <Link to="/contact" className="px-10 py-4 bg-white text-blue-700 font-bold rounded-2xl shadow-xl hover:-translate-y-1 transition-all inline-block">
          Talk to Our Team →
        </Link>
      </div>
    </div>
  );
}

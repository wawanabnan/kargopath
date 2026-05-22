import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const SERVICES = [
  {
    emoji: '📦',
    title: 'Freight Forwarding',
    tagline: 'International & Domestic Cargo Forwarding',
    color: 'blue',
    desc: 'End-to-end freight forwarding services for businesses. We handle your cargo across sea, air, and land with technology-enabled efficiency. From pickup to final delivery, we manage the entire logistics chain for companies and business professionals.',
    
    transportModes: [
      {
        mode: '🚢 Sea Freight',
        options: ['FCL (Full Container Load)', 'LCL (Less than Container Load)', 'Reefer Container', 'Break Bulk']
      },
      {
        mode: '✈️ Air Freight',
        options: ['Express Service', 'Standard Deferred', 'Charter Services', 'Dangerous Goods (IATA)']
      },
      {
        mode: '🚚 Land Trucking',
        options: ['FTL (Full Truck Load)', 'LTL (Less than Truck Load)', 'Cross-Border ASEAN', 'Heavy Cargo']
      }
    ],
    
    features: [
      'Multimodal transport solutions',
      'Door-to-door delivery',
      'FCL & LCL consolidation',
      'Cross-border logistics',
      'Dangerous goods handling',
      'Temperature-controlled cargo'
    ],
    
    techEnabled: [
      'Instant online quotation (2-4 hours)',
      'Real-time shipment tracking',
      'Digital documentation',
      'Automated booking system'
    ]
  },
  
  {
    emoji: '🛃',
    title: 'Customs Brokerage',
    tagline: 'Licensed PPJK Customs Broker',
    color: 'amber',
    desc: 'Expert customs clearance services for import and export. As a licensed PPJK (Pengusaha Pengurusan Jasa Kepabeanan), we handle all Indonesian customs documentation, duty calculation, and regulatory compliance for businesses.',
    
    options: [
      'Import Customs Clearance (BC 2.0)',
      'Export Customs Clearance (PEB)',
      'HS Code Classification',
      'Duty & Tax Calculation',
      'LARTAS Permit Assistance',
      'Bonded Warehouse (Gudang Berikat)'
    ],
    
    features: [
      'Licensed PPJK broker',
      'Import & export declaration',
      'Regulatory compliance',
      'Customs consultation',
      'Document preparation',
      'Duty optimization'
    ],
    
    techEnabled: [
      'Digital customs documentation',
      'Automated duty calculation',
      'Real-time clearance status',
      'Document management system'
    ]
  },
  
  {
    emoji: '🏗️',
    title: 'Project Cargo',
    tagline: 'Heavy Lift & Specialized Cargo',
    color: 'indigo',
    desc: 'Specialized logistics for oversized, heavy, and complex cargo. Our project cargo team has extensive experience in handling industrial equipment, machinery, and construction materials that require special handling and permits.',
    
    options: [
      'Heavy Lift Operations',
      'Out-of-Gauge (OOG) Cargo',
      'Break Bulk Shipments',
      'Ro-Ro (Roll-on/Roll-off)',
      'Special Equipment & Rigging',
      'Route Surveys & Permits'
    ],
    
    features: [
      'Project planning & coordination',
      'Special equipment handling',
      'Route surveys',
      'Permit acquisition',
      'Risk assessment',
      'On-site supervision'
    ],
    
    techEnabled: [
      'Project milestone tracking',
      'Real-time project updates',
      'Digital documentation',
      'Coordination platform'
    ]
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
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Complete 3PL Solutions</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Our Services</h1>
          <p className="text-slate-400 text-lg font-medium">
            Comprehensive third-party logistics services for businesses — freight forwarding, customs brokerage, and specialized cargo solutions.
          </p>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-6xl mx-auto px-4 py-24 space-y-20">
        {SERVICES.map((s, i) => (
          <div key={s.title} className={`grid md:grid-cols-2 gap-12 items-start ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            <div className={i % 2 !== 0 ? 'md:order-2' : ''}>
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border text-sm font-bold mb-5 ${colorMap[s.color]}`}>
                <span className="text-xl">{s.emoji}</span> {s.title}
              </div>
              {s.tagline && (
                <p className="text-sm font-semibold text-blue-600 mb-3">{s.tagline}</p>
              )}
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{s.title}</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">{s.desc}</p>
              
              {/* Transport Modes (for Freight Forwarding) */}
              {s.transportModes && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Transport Modes</p>
                  <div className="space-y-3">
                    {s.transportModes.map(tm => (
                      <div key={tm.mode} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="font-bold text-slate-800 mb-2">{tm.mode}</p>
                        <div className="flex flex-wrap gap-2">
                          {tm.options.map(opt => (
                            <span key={opt} className="px-2 py-1 bg-white text-slate-600 text-xs font-medium rounded border border-slate-200">{opt}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Service Options (for other services) */}
              {s.options && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Service Types</p>
                  <div className="flex flex-wrap gap-2">
                    {s.options.map(o => (
                      <span key={o} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">{o}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <Link to="/quote" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
                Get a Quote →
              </Link>
            </div>
            
            <div className={`space-y-6 ${i % 2 !== 0 ? 'md:order-1' : ''}`}>
              {/* What's Included */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
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
              
              {/* Technology-Enabled */}
              {s.techEnabled && (
                <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
                  <p className="text-sm font-bold text-blue-700 uppercase tracking-widest mb-5">💻 Technology-Enabled</p>
                  <ul className="space-y-3">
                    {s.techEnabled.map(t => (
                      <li key={t} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-blue-900 font-medium text-sm">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-blue-600 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">Need a Custom Logistics Solution?</h2>
        <p className="text-blue-100 font-medium mb-2">Our team will design a 3PL strategy tailored to your business needs.</p>
        <p className="text-blue-200 text-sm mb-8">Serving companies and business professionals across Indonesia.</p>
        <Link to="/contact" className="px-10 py-4 bg-white text-blue-700 font-bold rounded-2xl shadow-xl hover:-translate-y-1 transition-all inline-block">
          Talk to Our Team →
        </Link>
      </div>

      <Footer />
    </div>
  );
}

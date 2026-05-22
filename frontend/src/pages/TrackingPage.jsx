import React, { useState } from 'react';
import Footer from '../components/Footer';

export default function TrackingPage() {
  const [number, setNumber] = useState('');
  const [result, setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // Mock result — replace with API call
      setResult({
        ref: number,
        status: 'In Transit',
        mode: 'Air Freight',
        origin: 'Surabaya (SUB)',
        dest: 'Tokyo (NRT)',
        eta: '18 May 2026',
        milestones: [
          { date: '16 May 09:00', event: 'Cargo Picked Up from Shipper', done: true },
          { date: '16 May 14:30', event: 'Arrived at Origin Warehouse', done: true },
          { date: '16 May 20:00', event: 'Export Customs Cleared', done: true },
          { date: '17 May 02:00', event: 'Departed Surabaya (SUB)', done: true },
          { date: '17 May 14:00', event: 'In Transit — Cargo on Aircraft', done: false, active: true },
          { date: '18 May 08:00', event: 'Arrived Tokyo (NRT)', done: false },
          { date: '18 May 16:00', event: 'Delivered to Consignee', done: false },
        ],
      });
      setLoading(false);
    }, 900);
  };

  return (
    <div className="min-h-screen font-sans bg-white">
      {/* Header */}
      <div className="bg-slate-900 pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Live Tracking</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Track Your Shipment</h1>
          <p className="text-slate-400 text-lg font-medium">Enter your tracking number to get real-time status updates.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Search */}
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 mb-12">
          <input
            required value={number} onChange={e => setNumber(e.target.value)}
            type="text" placeholder="Enter tracking number (e.g. KP-20260516-A3F2)"
            className="flex-1 px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-medium text-slate-900"
          />
          <button type="submit" disabled={loading}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-60 whitespace-nowrap shadow-lg shadow-blue-600/20">
            {loading ? 'Searching...' : 'Track Now →'}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
            {/* Summary header */}
            <div className="bg-slate-900 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Tracking Reference</p>
                  <p className="text-white font-extrabold text-xl">{result.ref}</p>
                </div>
                <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-bold rounded-xl">
                  {result.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-sm">
                {[
                  ['Mode',   result.mode   ],
                  ['Origin', result.origin ],
                  ['Dest.',  result.dest   ],
                  ['ETA',    result.eta    ],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-slate-500 font-medium text-xs mb-1">{label}</p>
                    <p className="text-white font-bold">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div className="p-6 space-y-5">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Shipment Milestones</p>
              {result.milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    m.done ? 'bg-green-500 border-green-500' :
                    m.active ? 'bg-blue-600 border-blue-600 animate-pulse' :
                    'bg-white border-slate-300'
                  }`}>
                    {m.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    {m.active && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${m.done || m.active ? 'text-slate-900' : 'text-slate-400'}`}>{m.event}</p>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">{m.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-6xl mb-4">📦</div>
            <p className="font-medium">Enter a tracking number to see shipment status</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

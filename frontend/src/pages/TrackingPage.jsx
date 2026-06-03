import React, { useState } from 'react';
import { AlertCircle, Package } from 'lucide-react';
import Footer from '../components/Footer';
import { trackingAPI } from '../api';

export default function TrackingPage() {
  const [number, setNumber] = useState('');
  const [result, setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await trackingAPI.track(number);
      setResult(data);
    } catch (err) {
      if (err.status === 404) {
        setError('Shipment not found. Please check your tracking number and try again.');
      } else {
        setError(err?.detail || err?.message || 'Failed to track shipment. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
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

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
            {/* Summary header */}
            <div className="bg-slate-900 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Tracking Reference</p>
                  <p className="text-white font-extrabold text-xl">{result.shipment_number}</p>
                  {result.awb_bl_number && (
                    <p className="text-slate-500 text-xs mt-1">AWB/BL: {result.awb_bl_number}</p>
                  )}
                </div>
                <span className={`px-4 py-2 text-sm font-bold rounded-xl ${
                  result.status === 'POD_CONFIRMED' || result.status === 'DELIVERED'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : result.status === 'IN_TRANSIT' || result.status === 'ARRIVED'
                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                    : 'bg-slate-500/20 border border-slate-500/30 text-slate-400'
                }`}>
                  {result.status_label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-sm">
                {[
                  ['Mode',        result.mode        ],
                  ['Origin',      result.origin      ],
                  ['Destination', result.destination  ],
                  ['ETA',         result.eta ? new Date(result.eta).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-slate-500 font-medium text-xs mb-1">{label}</p>
                    <p className="text-white font-bold">{val || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div className="p-6 space-y-5">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Shipment Milestones</p>
              {result.milestones.length === 0 ? (
                <p className="text-sm text-slate-400">No milestones recorded yet.</p>
              ) : (
                result.milestones.map((m, i) => {
                  const isLast = i === result.milestones.length - 1;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                        isLast ? 'bg-blue-600 border-blue-600 animate-pulse' : 'bg-green-500 border-green-500'
                      }`}>
                        {isLast ? (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        ) : (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${isLast ? 'text-slate-900' : 'text-slate-700'}`}>
                          {m.description}
                          {m.location && <span className="font-normal text-slate-400"> — {m.location}</span>}
                        </p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">
                          {new Date(m.timestamp).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Enter a tracking number to see shipment status</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

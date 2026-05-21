import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shipmentAPI } from '../api';
import { Package, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shipmentAPI.list()
      .then(data => setShipments(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/dashboard" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" /> My Shipments
            </h1>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No shipments yet</h3>
            <p className="text-slate-500 font-medium mb-6">You don't have any active shipments at the moment.</p>
            <Link to="/dashboard" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors inline-block">
              Request a Quotation
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shipment No.</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date Created</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-extrabold text-slate-900">{s.shipment_number}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Ref: {s.quotation_details?.quotation_number}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        s.status === 'DELIVERED' || s.status === 'POD_CONFIRMED' ? 'bg-green-100 text-green-700' :
                        s.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-600">{new Date(s.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 text-right">
                      <Link to={`/dashboard/shipments/${s.id}`} className="inline-flex items-center justify-center p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

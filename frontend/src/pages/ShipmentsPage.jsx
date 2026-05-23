import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shipmentAPI } from '../api';
import { Package, Loader2, ArrowRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const STATUS_CONFIG = {
  DELIVERED:     { label: 'Delivered',     cls: 'bg-green-50 text-green-700 border border-green-200' },
  POD_CONFIRMED: { label: 'POD Confirmed', cls: 'bg-green-50 text-green-700 border border-green-200' },
  IN_TRANSIT:    { label: 'In Transit',    cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status.replace('_', ' '), cls: 'bg-amber-50 text-amber-700 border border-amber-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shipmentAPI.list()
      .then(data => setShipments(data?.results ?? data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Shipments">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-2" />
          <span className="text-xs text-slate-500">Loading...</span>
        </div>
      ) : shipments.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">No shipments yet</h3>
          <p className="text-xs text-slate-500 mb-6">You don't have any active shipments at the moment.</p>
          <Link to="/quote" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-block">
            Request a Quotation
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">My Shipments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Shipment No.</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Quotation Ref</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wide whitespace-nowrap">Date Created</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{s.shipment_number}</td>
                    <td className="px-4 py-2.5 text-slate-500">{s.quotation_details?.quotation_number || '—'}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link to={`/dashboard/shipments/${s.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline whitespace-nowrap">
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

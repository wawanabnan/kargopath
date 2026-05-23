import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shipmentAPI } from '../api';
import { Package, Loader2, MapPin, FileText, CheckCircle2, Clock } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shipmentAPI.detail(id)
      .then(data => setShipment(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Shipment Detail">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-2" />
          <span className="text-xs text-slate-500">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) {
    return (
      <DashboardLayout title="Shipment Detail">
        <div className="bg-white border border-slate-200 p-12 text-center">
          <p className="text-sm font-bold text-red-500">Shipment not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const statusCls =
    shipment.status === 'DELIVERED' || shipment.status === 'POD_CONFIRMED'
      ? 'border-green-200 bg-green-50 text-green-700'
      : shipment.status === 'IN_TRANSIT'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <DashboardLayout title="Shipment Detail">
      {/* Page heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" /> {shipment.shipment_number}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Ref: {shipment.quotation_details?.quotation_number || '—'}</p>
        </div>
        <span className={`px-3 py-1 border text-xs font-bold inline-flex w-max ${statusCls}`}>
          {shipment.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Tracking Timeline */}
        <div className="md:col-span-2 bg-white border border-slate-200 p-5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> Tracking Timeline
          </h3>

          {shipment.milestones && shipment.milestones.length > 0 ? (
            <div className="space-y-5">
              {shipment.milestones.map((ms, i) => (
                <div key={ms.id} className="relative flex gap-4">
                  {i !== shipment.milestones.length - 1 && (
                    <div className="absolute top-7 left-3.5 w-px h-full bg-slate-200" />
                  )}
                  <div className="relative flex-shrink-0 w-7 h-7 bg-blue-50 border-2 border-white flex items-center justify-center z-10 shadow-sm text-blue-600">
                    {i === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                      {new Date(ms.timestamp).toLocaleString()}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900">{ms.status_code}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{ms.description}</p>
                    {ms.location && <p className="text-xs text-slate-400 mt-0.5 font-semibold">📍 {ms.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No tracking updates available yet.</p>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Details */}
          <div className="bg-white border border-slate-200 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Shipment Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">AWB / BL Number</p>
                <p className="text-sm font-bold text-slate-900">{shipment.awb_bl_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Route</p>
                <p className="text-sm font-bold text-slate-900">
                  {shipment.quotation_details?.origin} ➝ {shipment.quotation_details?.destination}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Transport Mode</p>
                <p className="text-sm font-bold text-slate-900">{shipment.quotation_details?.mode_of_transport}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-slate-200 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" /> Documents
            </h3>
            {shipment.documents && shipment.documents.length > 0 ? (
              <div className="space-y-2">
                {shipment.documents.filter(d => d.is_visible_to_client).map(doc => (
                  <a key={doc.id} href={doc.file} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-red-50 text-red-600 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                        {doc.document_type}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No documents uploaded yet.</p>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shipmentAPI } from '../api';
import { Package, ArrowLeft, Loader2, MapPin, FileText, CheckCircle2, Clock } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!shipment) return <div className="p-12 text-center text-red-500 font-bold">Shipment not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <Link to="/dashboard/shipments" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Shipments
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" /> {shipment.shipment_number}
              </h1>
              <p className="text-slate-500 font-medium mt-1">Ref: {shipment.quotation_details?.quotation_number}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl border-2 font-bold inline-flex w-max ${
              shipment.status === 'DELIVERED' || shipment.status === 'POD_CONFIRMED' ? 'border-green-200 bg-green-50 text-green-700' :
              shipment.status === 'IN_TRANSIT' ? 'border-blue-200 bg-blue-50 text-blue-700' :
              'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {shipment.status.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Tracking Timeline */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" /> Tracking Timeline
              </h2>
              
              {shipment.milestones && shipment.milestones.length > 0 ? (
                <div className="space-y-6">
                  {shipment.milestones.map((ms, i) => (
                    <div key={ms.id} className="relative flex gap-4">
                      {/* Timeline line */}
                      {i !== shipment.milestones.length - 1 && (
                        <div className="absolute top-8 left-4 w-0.5 h-full -ml-px bg-slate-200" />
                      )}
                      
                      <div className="relative flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center z-10 shadow-sm text-blue-600">
                        {i === 0 ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      
                      <div className="pb-2">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                          {new Date(ms.timestamp).toLocaleString()}
                        </p>
                        <h4 className="text-base font-extrabold text-slate-900">{ms.status_code}</h4>
                        <p className="text-sm font-medium text-slate-600 mt-1">{ms.description}</p>
                        {ms.location && <p className="text-xs text-slate-400 mt-1 font-bold">📍 {ms.location}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 font-medium">No tracking updates available yet.</p>
              )}
            </div>
            
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Details */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-extrabold text-slate-900 mb-4">Shipment Details</h3>
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
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Documents
              </h3>
              {shipment.documents && shipment.documents.length > 0 ? (
                <div className="space-y-3">
                  {shipment.documents.filter(d => d.is_visible_to_client).map(doc => (
                    <a key={doc.id} href={doc.file} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{doc.document_type}</span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium">No documents uploaded yet.</p>
              )}
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}

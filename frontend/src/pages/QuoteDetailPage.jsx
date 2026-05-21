import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, MapPin, Anchor, CheckCircle2, FileText, FileDown, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { quotationAPI, quotationRequestAPI } from '../api';

export default function QuoteDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeParam = searchParams.get('type') || 'quotation';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null); // Can be Quotation or QuotationRequest
  const [isQuotation, setIsQuotation] = useState(typeParam === 'quotation');
  const [chatOpen, setChatOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        if (isQuotation) {
          // Fetch Quotation (official sales offer)
          try {
            const res = await quotationAPI.detail(id);
            setData(res);
          } catch (qErr) {
            // Fallback: maybe it's actually a raw request ID
            console.warn("Failing to load as quotation, trying as request:", qErr);
            const fallbackRes = await quotationRequestAPI.detail(id);
            setData(fallbackRes);
            setIsQuotation(false);
          }
        } else {
          // Fetch Quotation Request (client's raw pending request)
          const res = await quotationRequestAPI.detail(id);
          setData(res);
          // If the request has already been quoted, redirect or switch mode
          if (res.quotation_details) {
            setIsQuotation(true);
            const quoteRes = await quotationAPI.detail(res.quotation_details.id);
            setData(quoteRes);
          }
        }
      } catch (err) {
        console.error("Gagal memuat detail:", err);
        setError("Quotation details not found or you do not have permission to access them.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, isQuotation]);

  const handleAccept = async () => {
    if (!window.confirm("Are you sure you want to accept this quotation and proceed with the shipment?")) return;
    setActionLoading(true);
    try {
      await quotationAPI.accept(id);
      alert("Quotation accepted! Your shipment is being created.");
      navigate('/dashboard/shipments');
    } catch (err) {
      alert(err?.detail || err?.message || "Failed to accept quotation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await quotationAPI.reject(id, rejectionReason);
      alert("Quotation rejected.");
      setShowRejectModal(false);
      // Reload page state
      setIsQuotation(true);
      navigate('/dashboard');
    } catch (err) {
      alert(err?.detail || err?.message || "Failed to reject quotation.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
      <p className="text-slate-500 font-medium text-sm">Loading quotation details...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white shadow-xl p-8 text-center border border-slate-100 rounded-2xl">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">An Error Occurred</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>
        <Link to="/dashboard" className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors inline-block">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  // Extract variables depending on type
  const requestObj = isQuotation ? data.request_details : data;
  const isPending = !isQuotation || requestObj.status === 'PENDING' || requestObj.status === 'DRAFT';
  const isRejected = isQuotation && data.status === 'REJECTED';
  const isAccepted = isQuotation && data.status === 'ACCEPTED';

  const mode = requestObj.mode;
  const scope = requestObj.scope;

  const pol = requestObj.pol ? requestObj.pol.split(' – ')[0] : (requestObj.pickup_city || 'Alamat Asal');
  const pod = requestObj.pod ? requestObj.pod.split(' – ')[0] : (requestObj.delivery_city || 'Alamat Tujuan');

  const modeLabel = mode === 'sea' ? 'Sea Freight' : mode === 'air' ? 'Air Freight' : 'Land Trucking';
  const scopeLabel = mode === 'land' ? 'Point to Point' : scope === 'd2d' ? 'Door to Door' : scope === 'd2p' ? 'Door to Port' : scope === 'p2d' ? 'Port to Door' : 'Port to Port';

  const statusLabel = isPending ? 'Pending Review' : isAccepted ? 'Booked' : isRejected ? 'Rejected' : 'Quoted';
  const validUntil = isQuotation && data.valid_until
    ? new Date(data.valid_until).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Pending Review';

  return (
    <>
      {/* ===================================================================== */}
      {/* WEB UI (Visible on screen, hidden on print) */}
      {/* ===================================================================== */}
      <div className="min-h-screen bg-slate-50 font-sans pb-20 print:hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <button onClick={() => setChatOpen(true)} className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs">
                <MessageSquare className="w-4 h-4" /> Contact Sales
              </button>
              {isQuotation && !isPending && (
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2 text-xs">
                  <FileDown className="w-4 h-4" /> Print / Download PDF
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 mt-8">
          {/* Status Banner */}
          <div className={`rounded-2xl p-6 text-white mb-6 flex flex-col md:flex-row md:items-center justify-between shadow-xl ${
            isPending ? 'bg-amber-600 shadow-amber-600/10' :
            isAccepted ? 'bg-green-600 shadow-green-600/10' :
            isRejected ? 'bg-red-600 shadow-red-600/10' :
            'bg-blue-600 shadow-blue-600/10'
          }`}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">{statusLabel}</span>
                <span className="text-white/80 font-medium text-sm">
                  {isPending ? 'Request Under Review' :
                   isAccepted ? 'Quotation Accepted & In Shipment Process' :
                   isRejected ? 'Quotation Rejected' :
                   'Quotation Ready to Accept'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                {isQuotation ? data.quotation_number : requestObj.reference_no}
              </h1>
              <p className="text-white/80 mt-1 font-medium text-xs">
                Valid until: {validUntil}
              </p>
            </div>
            {isQuotation && (
              <div className="mt-6 md:mt-0 md:text-right">
                <p className="text-white/70 font-medium text-sm mb-1">Total Billing Amount (Inc. Tax)</p>
                <div className="flex items-end gap-2 justify-start md:justify-end">
                  <span className="text-xl font-bold text-white/70">{data.currency || 'IDR'}</span>
                  <span className="text-3xl md:text-4xl font-extrabold">
                    {parseFloat(data.grand_total).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Routing */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-400" /> Route & Service Details
                </h2>
                
                <div className="flex flex-col md:flex-row justify-between mb-8 relative">
                  <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-slate-100"></div>
                  
                  <div className="relative z-10 text-center flex-1">
                    <div className="w-12 h-12 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-slate-800">{pol}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Origin / Port of Loading</p>
                  </div>

                  <div className="relative z-10 text-center flex-1 mt-6 md:mt-0">
                    <div className="w-12 h-12 bg-blue-50 border-4 border-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md text-blue-600">
                      <Anchor className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-blue-600">{modeLabel}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{scopeLabel}</p>
                  </div>

                  <div className="relative z-10 text-center flex-1 mt-6 md:mt-0">
                    <div className="w-12 h-12 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-slate-800">{pod}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Destination / Port of Discharge</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shipper & Pickup Address</p>
                    <p className="text-sm font-bold text-slate-800">{requestObj.shipper_company || '-'}</p>
                    {requestObj.pickup_address ? (
                      <p className="text-xs font-medium text-slate-600 mt-1">{requestObj.pickup_address}</p>
                    ) : (
                      <p className="text-xs font-medium text-slate-400 mt-1">Port of Loading Delivery (Self-Delivery)</p>
                    )}
                    {(requestObj.shipper_pic || requestObj.shipper_phone) && (
                      <p className="text-[10px] font-medium text-slate-500 mt-2">
                        PIC: {requestObj.shipper_pic} ({requestObj.shipper_phone})
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Consignee & Delivery Address</p>
                    <p className="text-sm font-bold text-slate-800">{requestObj.consignee_company || '-'}</p>
                    {requestObj.delivery_address ? (
                      <p className="text-xs font-medium text-slate-600 mt-1">{requestObj.delivery_address}</p>
                    ) : (
                      <p className="text-xs font-medium text-slate-400 mt-1">Port of Discharge Pickup (Self-Pickup)</p>
                    )}
                    {(requestObj.consignee_pic || requestObj.consignee_phone) && (
                      <p className="text-[10px] font-medium text-slate-500 mt-2">
                        PIC: {requestObj.consignee_pic} ({requestObj.consignee_phone})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cargo Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-slate-400" /> Cargo Specification Info
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Commodity</p>
                    <p className="text-sm font-bold text-slate-800">{requestObj.commodity}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HS Code</p>
                    <p className="text-sm font-bold text-slate-800">{requestObj.hs_code || '-'}</p>
                  </div>
                  {mode === 'sea' && requestObj.sea_type === 'FCL' ? (
                    <>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Container Size</p>
                        <p className="text-sm font-bold text-slate-800">{requestObj.container_size}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Container Quantity</p>
                        <p className="text-sm font-bold text-slate-800">{requestObj.container_qty} units</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Package Type</p>
                        <p className="text-sm font-bold text-slate-800">{requestObj.package_type} ({requestObj.package_qty} Units)</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stackable?</p>
                        <p className="text-sm font-bold text-slate-800">{requestObj.is_stackable ? 'Yes' : 'No'}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dangerous Goods?</p>
                    <p className="text-sm font-bold text-slate-800">
                      {requestObj.is_dangerous ? `Yes (IMDG ${requestObj.dg_class})` : 'No'}
                    </p>
                  </div>
                  {(requestObj.gross_weight || requestObj.volume_cbm) && (
                    <>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gross Weight</p>
                        <p className="text-sm font-bold text-slate-800">{requestObj.gross_weight} KG</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Volume</p>
                        <p className="text-sm font-bold text-slate-800">{requestObj.volume_cbm} CBM</p>
                      </div>
                    </>
                  )}
                  {requestObj.cargo_value && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo Value</p>
                      <p className="text-sm font-bold text-slate-800">
                        {requestObj.cargo_currency} {parseFloat(requestObj.cargo_value).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>

                {requestObj.special_instructions && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Special Instructions</p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-medium">
                      {requestObj.special_instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing & Action Sidepanel */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" /> Charges Breakdown
                </h2>
                
                {isPending ? (
                  <div className="text-center py-10 bg-amber-50 rounded-xl border border-amber-100 p-5 space-y-3">
                    <Clock className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                    <p className="text-sm font-bold text-amber-800">Pending Sales Review</p>
                    <p className="text-xs text-amber-600/90 leading-relaxed font-medium">
                      Official logistics charges are being calculated by the KargoPath sales team. The complete tariff offer will appear here shortly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-sm font-medium">
                    {/* Line Items List */}
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {data.items && data.items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs text-slate-600 border-b border-slate-50 pb-2">
                          <div className="flex-1 pr-3">
                            <p className="font-bold text-slate-800">{item.description}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Qty: {item.quantity} × {item.unit_price} / {item.unit}</p>
                          </div>
                          <span className="font-semibold text-slate-800 self-center">
                            {data.currency} {parseFloat(item.amount).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4 mt-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span className="font-semibold">Subtotal</span>
                        <span className="font-bold text-slate-800">
                          {data.currency} {parseFloat(data.subtotal).toLocaleString('id-ID')}
                        </span>
                      </div>
                      
                      {parseFloat(data.discount_value) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({data.discount_type === 'PERCENT' ? `${parseFloat(data.discount_value)}%` : 'Fixed'})</span>
                          <span>- {data.currency} {parseFloat(data.discount).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-slate-600">
                        <span>Tax / VAT (11%)</span>
                        <span className="font-bold text-slate-800">
                          {data.currency} {parseFloat(data.tax_amount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Grand Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-blue-600">
                          {data.currency} {parseFloat(data.grand_total).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons if not Booked/Rejected */}
                    {data.status === 'DRAFT' || data.status === 'SENT' ? (
                      <div className="mt-8 space-y-3">
                        <button
                          onClick={handleAccept}
                          disabled={actionLoading}
                          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Accept & Process (Book)
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={actionLoading}
                          className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-red-500 font-bold rounded-xl transition-all border border-slate-200 text-sm"
                        >
                          Reject Quotation
                        </button>
                      </div>
                    ) : (
                      <div className="mt-6 pt-4 text-center border-t border-slate-100 text-xs font-semibold">
                        {isAccepted && <p className="text-green-600">✓ This quotation has been accepted & processed.</p>}
                        {isRejected && <p className="text-red-500">❌ This quotation has been rejected.</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-slate-100/50 rounded-2xl p-5 border border-slate-200 text-center">
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  This quotation is subject to KargoPath Terms & Conditions. Actual charges may vary if real cargo dimensions or weight differ from provided information.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Chat Widget (Mocked but elegant) */}
        {chatOpen && (
          <div className="fixed bottom-6 right-6 w-80 md:w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Sales Support</p>
                  <p className="text-xs text-blue-100 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full inline-block shadow-sm shadow-green-900 animate-pulse"></span> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-blue-100 hover:text-white transition-colors">✕</button>
            </div>
            <div className="h-72 bg-slate-50 p-4 overflow-y-auto flex flex-col gap-3">
              <div className="text-center text-xs text-slate-400 font-medium my-2">Today</div>
              <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none w-[85%] text-xs text-slate-700 shadow-sm leading-relaxed font-medium">
                Hello! I am KargoPath Sales Assistant. How can I help you regarding this Quote <span className="font-bold">{isQuotation ? data.quotation_number : requestObj.reference_no}</span>?
              </div>
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
              <input type="text" placeholder="Type your message..." className="flex-1 px-4 py-3 bg-slate-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-blue-600 transition-all" />
              <button className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all">
                ✈
              </button>
            </div>
          </div>
        )}

        {/* Reject Dialog Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[200]">
            <form onSubmit={handleRejectSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Reject Quotation</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Please provide the reason for your rejection. Our sales team will review your reason to provide a better alternative quote.
              </p>
              <textarea
                required
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g., Price too high, vessel schedule not suitable..."
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-xs font-semibold resize-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors shadow-lg shadow-red-600/20">
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* PRINT UI (Hidden on screen, visible on print) */}
      {/* ===================================================================== */}
      {isQuotation && !isPending && (
        <div className="hidden print:block bg-white text-slate-900 font-sans max-w-4xl mx-auto p-0 text-sm">
          {/* Document Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-black tracking-tight text-slate-900">KargoPath</span>
              </div>
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-900">PT KargoPath Logistics Nusantara</p>
                <p>Gedung KargoPath Tower Lt. 15</p>
                <p>Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan 12190</p>
                <p>Indonesia</p>
                <p className="pt-1"><strong>Email:</strong> sales@kargopath.com | <strong>Tel:</strong> +62 21 555 1234</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">Quotation</h1>
              <div className="mt-2 text-[10px] grid grid-cols-[80px_1fr] gap-y-1 text-left border border-slate-200 p-3 rounded-lg">
                <span className="font-bold text-slate-500">Quote No:</span> 
                <span className="font-bold text-slate-900">{data.quotation_number}</span>
                <span className="font-bold text-slate-500">Date:</span> 
                <span className="text-slate-900">
                  {new Date(data.created_at).toLocaleDateString('en-US')}
                </span>
                <span className="font-bold text-slate-500">Validity:</span> 
                <span className="text-slate-900">{validUntil}</span>
              </div>
            </div>
          </div>

          {/* Routing & Parties */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-slate-200 p-3 rounded-lg">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Shipper Details</p>
              <p className="font-black text-slate-900 text-xs uppercase">{requestObj.shipper_company || '-'}</p>
              <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                {requestObj.pickup_address && <p>{requestObj.pickup_address}</p>}
                <p className="pt-1.5 font-medium">PIC: {requestObj.shipper_pic || '-'}</p>
                <p className="font-medium">Tel: {requestObj.shipper_phone || '-'}</p>
              </div>
            </div>

            <div className="border border-slate-200 p-3 rounded-lg">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Consignee Details</p>
              <p className="font-black text-slate-900 text-xs uppercase">{requestObj.consignee_company || '-'}</p>
              <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                {requestObj.delivery_address && <p>{requestObj.delivery_address}</p>}
                <p className="pt-1.5 font-medium">PIC: {requestObj.consignee_pic || '-'}</p>
                <p className="font-medium">Tel: {requestObj.consignee_phone || '-'}</p>
              </div>
            </div>

            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Routing & Terms</p>
              <div className="grid grid-cols-[60px_1fr] gap-y-1 text-[9px]">
                <span className="text-slate-500">Service:</span> <span className="font-bold text-slate-900">{modeLabel} ({scopeLabel})</span>
                <span className="text-slate-500">Origin:</span> <span className="font-bold text-slate-900">{pol}</span>
                <span className="text-slate-500">Dest:</span> <span className="font-bold text-slate-900">{pod}</span>
                <span className="text-slate-500">Incoterms:</span> <span className="font-bold text-slate-900">{requestObj.incoterms || '-'}</span>
                <span className="text-slate-500">Specs:</span> <span className="font-bold text-slate-900">{requestObj.commodity}</span>
              </div>
            </div>
          </div>

          {/* Charges Breakdown */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Charges Breakdown</p>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="py-1.5 px-3 text-left font-bold border border-slate-700">Description</th>
                  <th className="py-1.5 px-3 text-center font-bold border border-slate-700">Qty</th>
                  <th className="py-1.5 px-3 text-center font-bold border border-slate-700">Unit</th>
                  <th className="py-1.5 px-3 text-right font-bold border border-slate-700">Unit Price ({data.currency})</th>
                  <th className="py-1.5 px-3 text-right font-bold border border-slate-700">Amount ({data.currency})</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {data.items && data.items.map(item => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="py-1.5 px-3 font-bold">{item.description}</td>
                    <td className="py-1.5 px-3 text-center">{item.quantity}</td>
                    <td className="py-1.5 px-3 text-center">{item.unit}</td>
                    <td className="py-1.5 px-3 text-right">{parseFloat(item.unit_price).toLocaleString('id-ID')}</td>
                    <td className="py-1.5 px-3 text-right font-bold">{parseFloat(item.amount).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Totals */}
            <div className="flex justify-end mt-2">
              <div className="w-1/2">
                <div className="flex justify-between py-1 border-b border-slate-300 text-xs">
                  <span className="text-slate-600 font-bold">Subtotal</span>
                  <span className="font-bold text-slate-900">{parseFloat(data.subtotal).toLocaleString('id-ID')}</span>
                </div>
                {parseFloat(data.discount_value) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-300 text-xs text-green-600">
                    <span className="font-bold">Discount</span>
                    <span className="font-bold">-{parseFloat(data.discount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b-2 border-slate-800 text-xs">
                  <span className="font-bold">VAT / PPN (11%)</span>
                  <span className="font-bold text-slate-900">{parseFloat(data.tax_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest self-end">Grand Total ({data.currency})</span>
                  <span className="text-lg font-black text-slate-900">{parseFloat(data.grand_total).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-slate-800">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Terms & Conditions</p>
              <ul className="text-[8px] text-slate-600 list-disc pl-3 space-y-0.5 text-justify leading-tight font-medium">
                <li>Rates are based on actual weight or volumetric weight, whichever is higher.</li>
                <li>Quotation excludes duties, taxes, storage, demurrage, and customs inspection fees unless specified.</li>
                <li>Subject to space and equipment availability at the time of booking.</li>
                <li>This quotation is electronically generated and is valid without a physical signature.</li>
              </ul>
            </div>
            <div className="flex justify-between text-xs gap-4 mt-2">
              <div className="text-center w-1/2">
                <p className="text-slate-600 font-medium mb-12">Prepared By,</p>
                <div className="w-full h-px bg-slate-800 mx-auto mb-1"></div>
                <p className="text-[9px] text-slate-500">KargoPath Logistics Support</p>
              </div>
              <div className="text-center w-1/2">
                <p className="text-slate-600 font-medium mb-12">Accepted & Confirmed By,</p>
                <div className="w-full h-px bg-slate-800 mx-auto mb-1"></div>
                <p className="text-[9px] text-slate-500">Authorized Signature & Stamp</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

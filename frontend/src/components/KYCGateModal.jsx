import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, X, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * KYCGateModal
 * Show this when a client (kyc_level < 2) tries to accept a booking.
 *
 * Usage:
 *   <KYCGateModal
 *     isOpen={showKycModal}
 *     onClose={() => setShowKycModal(false)}
 *     clientType="individual"       // 'individual' | 'business' | 'corporate'
 *     missingFields={['Phone number', 'ID number']}
 *   />
 */
export default function KYCGateModal({ isOpen, onClose, clientType = 'individual', missingFields = [] }) {
  if (!isOpen) return null;

  const REQUIREMENTS = {
    individual: [
      { label: 'Phone number',          icon: '📱' },
      { label: 'Full address',           icon: '🏠' },
      { label: 'ID number (KTP/Passport)', icon: '🪪' },
    ],
    business: [
      { label: 'Phone number',  icon: '📱' },
      { label: 'Full address',  icon: '🏠' },
      { label: 'NPWP',          icon: '📄' },
      { label: 'NIB / SIUP',   icon: '📑' },
    ],
    corporate: [
      { label: 'Phone number',   icon: '📱' },
      { label: 'Full address',   icon: '🏠' },
      { label: 'Company email',  icon: '📧' },
      { label: 'NPWP',           icon: '📄' },
      { label: 'NIB / SIUP',    icon: '📑' },
    ],
  };

  const requirements = REQUIREMENTS[clientType] || REQUIREMENTS.individual;
  const missingSet   = new Set(missingFields);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-extrabold text-slate-900">Identity Verification Required</h2>
            <p className="text-sm text-amber-700 font-medium mt-0.5">
              Complete your profile to confirm bookings.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-slate-600 font-medium mb-5">
            To accept a quotation and confirm a shipment booking, we need to verify your identity.
            This is a one-time process required by Indonesian customs regulations.
          </p>

          <div className="mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Required documents
            </p>
            <div className="space-y-2">
              {requirements.map(({ label, icon }) => {
                const missing = missingSet.has(label);
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                      missing ? 'bg-red-50' : 'bg-green-50'
                    }`}>
                      {missing ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <span className={`text-sm font-medium ${missing ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      {icon} {label}
                    </span>
                    {!missing && <span className="text-xs text-green-600 font-bold ml-auto">✓ Done</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/profile/verify"
              onClick={onClose}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Complete Verification Now
            </Link>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all text-sm">
              I'll Do It Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

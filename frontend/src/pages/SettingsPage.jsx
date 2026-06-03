import React, { useState, useEffect } from 'react';
import { Loader2, Settings, Save, AlertCircle, CheckCircle2, ChevronRight, Hash, DollarSign, FileSignature, X } from 'lucide-react';
import { usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import RichTextEditor from '../components/RichTextEditor';

const TABS = [
  { id: 'numbering', label: 'Numbering Rules', icon: Hash },
  { id: 'financials', label: 'Financial Settings', icon: DollarSign },
  { id: 'documents', label: 'Document Templates', icon: FileSignature },
];

const GLOBAL_CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'CNY', 'AUD', 'GBP'];

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('numbering');

  const [form, setForm] = useState({
    qr_prefix: 'Q',
    qr_date_format: 'YYMM',
    qr_seq_length: 4,
    currencies: ['IDR', 'USD'],
    default_tax_rate: 11.00,
    default_discount_type: 'percentage',
    default_discount_value: 0.00,
    quotation_agreement: '<h3>Standard Trading Conditions</h3><ul><li>This quotation is valid for 14 days from the date of issue.</li><li>Rates are subject to space and equipment availability.</li><li>All business is transacted under the Standard Trading Conditions of ALFI/ILFA.</li><li>Rates exclude cargo insurance, duties, and taxes unless explicitly stated.</li></ul>',
    booking_terms: '<h3>Booking Terms & Conditions</h3><ul><li>By accepting this booking, you agree to our standard trading terms.</li><li>Final chargeable weight is determined upon physical receipt of cargo.</li><li>Dangerous Goods must be declared prior to booking acceptance.</li></ul>',
    service_level_agreement: '<h3>Service Level Agreement</h3><ul><li><strong>Response Time:</strong> We commit to responding to inquiries within 24 hours.</li><li><strong>Transit Times:</strong> Estimated transit times are not guaranteed.</li><li><strong>Tracking:</strong> Milestone updates provided upon departure, arrival, and delivery.</li></ul>'
  });

  useEffect(() => {
    usersAPI.getTenantSettings()
      .then(data => {
        setForm({
          qr_prefix: data.qr_prefix || 'Q',
          qr_date_format: data.qr_date_format || 'YYMM',
          qr_seq_length: data.qr_seq_length || 4,
          currencies: data.currencies || ['IDR', 'USD'],
          default_tax_rate: data.default_tax_rate || 11.00,
          default_discount_type: data.default_discount_type || 'percentage',
          default_discount_value: data.default_discount_value || 0.00,
          quotation_agreement: data.quotation_agreement || '<h3>Standard Trading Conditions</h3><ul><li>This quotation is valid for 14 days from the date of issue.</li><li>Rates are subject to space and equipment availability.</li><li>All business is transacted under the Standard Trading Conditions of ALFI/ILFA.</li><li>Rates exclude cargo insurance, duties, and taxes unless explicitly stated.</li></ul>',
          booking_terms: data.booking_terms || '<h3>Booking Terms & Conditions</h3><ul><li>By accepting this booking, you agree to our standard trading terms.</li><li>Final chargeable weight is determined upon physical receipt of cargo.</li><li>Dangerous Goods must be declared prior to booking acceptance.</li></ul>',
          service_level_agreement: data.service_level_agreement || '<h3>Service Level Agreement</h3><ul><li><strong>Response Time:</strong> We commit to responding to inquiries within 24 hours.</li><li><strong>Transit Times:</strong> Estimated transit times are not guaranteed.</li><li><strong>Tracking:</strong> Milestone updates provided upon departure, arrival, and delivery.</li></ul>'
        });
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'qr_prefix') {
      const val = value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
      setForm(f => ({ ...f, [name]: val }));
    } else if (name === 'qr_seq_length') {
      setForm(f => ({ ...f, [name]: parseInt(value, 10) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
    setMessage('');
    setError('');
  };

  const handleTextareaChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setMessage('');
    setError('');
  };

  const toggleCurrency = (currency) => {
    setForm(f => {
      if (f.currencies.includes(currency)) {
        return { ...f, currencies: f.currencies.filter(c => c !== currency) };
      }
      return { ...f, currencies: [...f.currencies, currency] };
    });
    setMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.qr_prefix) {
      setError('Prefix cannot be empty.');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      await usersAPI.updateTenantSettings(form);
      setMessage('Settings saved successfully.');
    } catch (err) {
      setError(err?.detail || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // Generate preview
  const getPreview = (modeScope) => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dateStr = form.qr_date_format === 'MMYY' ? `${mm}${yy}` : `${yy}${mm}`;
    const seq = '1'.padStart(form.qr_seq_length, '0');
    return `${form.qr_prefix}-${dateStr}-${modeScope}-${seq}`;
  };

  if (user?.role !== 'ADMIN') {
    return (
      <DashboardLayout title="Settings">
        <div className="p-12 text-center text-slate-500 text-sm">
          You do not have permission to view this page.
        </div>
      </DashboardLayout>
    );
  }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  return (
    <DashboardLayout title="Settings">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg text-slate-600">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Workspace Settings</h2>
          <p className="text-xs text-slate-500">Configure global settings for your tenant.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
          <span className="text-sm text-slate-500">Loading settings...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Tabs Navigation */}
          <div className="lg:col-span-1 space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setMessage(''); setError(''); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            <form onSubmit={handleSave} className="bg-white border border-slate-200">
              
              {/* Messages */}
              <div className="px-5 pt-5 pb-2">
                {message && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {message}
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}
              </div>

              {/* Numbering Rules Tab */}
              {activeTab === 'numbering' && (
                <div className="p-5 space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Quotation Numbering Rules</h3>
                    <p className="text-xs text-slate-500 mt-1">Configure how reference numbers are automatically generated for new quotation requests.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Prefix (Group 1)
                      </label>
                      <input
                        type="text"
                        name="qr_prefix"
                        value={form.qr_prefix}
                        onChange={handleChange}
                        placeholder="e.g. Q"
                        className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 uppercase"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Max 3 letters. Replaces the default "REQ".</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Date Format (Group 2)
                      </label>
                      <select
                        name="qr_date_format"
                        value={form.qr_date_format}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white">
                        <option value="YYMM">Year-Month (YYMM) e.g. 2605</option>
                        <option value="MMYY">Month-Year (MMYY) e.g. 0526</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 border-t border-slate-100 pt-5">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Sequence Digits (Group 4)
                      </label>
                      <select
                        name="qr_seq_length"
                        value={form.qr_seq_length}
                        onChange={handleChange}
                        className="w-full sm:w-1/2 px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white">
                        <option value={4}>4 digits (e.g. 0001)</option>
                        <option value={5}>5 digits (e.g. 00001)</option>
                        <option value={6}>6 digits (e.g. 000001)</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Number resets back to 1 every month.</p>
                    </div>
                  </div>

                  {/* Live Preview Card inside the tab */}
                  <div className="bg-slate-900 text-white p-5 rounded-md mt-6">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Live Preview
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Sea Door-to-Door</p>
                        <p className="text-sm font-mono bg-slate-800/50 px-3 py-2 border border-slate-700 text-emerald-300">
                          {getPreview('SD2D')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Air Port-to-Port</p>
                        <p className="text-sm font-mono bg-slate-800/50 px-3 py-2 border border-slate-700 text-blue-300">
                          {getPreview('AP2P')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Trucking Point-to-Point</p>
                        <p className="text-sm font-mono bg-slate-800/50 px-3 py-2 border border-slate-700 text-amber-300">
                          {getPreview('TPTP')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Settings Tab */}
              {activeTab === 'financials' && (
                <div className="p-5 space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Financial Settings</h3>
                    <p className="text-xs text-slate-500 mt-1">Configure default rates and currencies for quotations and invoices.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                      Enabled Currencies
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GLOBAL_CURRENCIES.map(curr => {
                        const isSelected = form.currencies.includes(curr);
                        return (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => toggleCurrency(curr)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                              isSelected 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}>
                            {curr}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Click to toggle currencies available for quoting.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Default Tax / PPN Rate
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          name="default_tax_rate"
                          value={form.default_tax_rate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 pr-8 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Default Discount Type
                      </label>
                      <select
                        name="default_discount_type"
                        value={form.default_discount_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white">
                        <option value="percentage">Percentage (%)</option>
                        <option value="nominal">Nominal / Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Default Discount Value
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="default_discount_value"
                        value={form.default_discount_value}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Document Templates Tab */}
              {activeTab === 'documents' && (
                <div className="p-5 space-y-8">
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Document Templates</h3>
                    <p className="text-xs text-slate-500 mt-1">Configure default terms, agreements, and SLA inserted into generated documents.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Quotation Agreement
                    </label>
                    <p className="text-[10px] text-slate-400 mb-2">Terms and conditions appended to quotation documents sent to clients.</p>
                    <RichTextEditor
                      value={form.quotation_agreement}
                      onChange={(v) => handleTextareaChange({ target: { name: 'quotation_agreement', value: v } })}
                      placeholder="Enter quotation agreement terms..."
                    />
                  </div>

                  <div className="space-y-2 pt-6 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Booking Terms & Conditions
                    </label>
                    <p className="text-[10px] text-slate-400 mb-2">Standard terms and conditions for bookings.</p>
                    <RichTextEditor
                      value={form.booking_terms}
                      onChange={(v) => handleTextareaChange({ target: { name: 'booking_terms', value: v } })}
                      placeholder="Enter booking terms and conditions..."
                    />
                  </div>

                  <div className="space-y-2 pt-6 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Service Level Agreement (SLA)
                    </label>
                    <p className="text-[10px] text-slate-400 mb-2">Default operational SLA to set client expectations.</p>
                    <RichTextEditor
                      value={form.service_level_agreement}
                      onChange={(v) => handleTextareaChange({ target: { name: 'service_level_agreement', value: v } })}
                      placeholder="Enter service level agreement..."
                    />
                  </div>
                  
                  {/* Provide extra space at bottom for Quill dropdowns if needed */}
                  <div className="h-4"></div> 
                </div>
              )}

              {/* Footer Save Button */}
              <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { Package, Plus, Loader2, AlertCircle, X, Check, ChevronDown } from 'lucide-react';
import { chargeMasterAPI } from '../api';
import DashboardLayout from '../components/DashboardLayout';

export default function ChargeMasterPage() {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', category: 'freight', default_unit: 'LOT', default_rate: 0, default_currency: 'IDR', taxable_default: true });

  const load = async () => {
    setLoading(true);
    try {
      const data = await chargeMasterAPI.list();
      setMasters(data?.results ?? data ?? []);
    } catch {
      setError('Failed to load charge masters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', code: '', category: 'freight', default_unit: 'LOT', default_rate: 0, default_currency: 'IDR', taxable_default: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (m) => {
    setForm({
      name: m.name, code: m.code || '', category: m.category,
      default_unit: m.default_unit, default_rate: parseFloat(m.default_rate),
      default_currency: m.default_currency, taxable_default: m.taxable_default,
    });
    setEditing(m.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Name is required.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await chargeMasterAPI.update(editing, form);
      } else {
        await chargeMasterAPI.create(form);
      }
      resetForm();
      await load();
    } catch (err) {
      alert(err?.detail || 'Failed to save charge master.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this charge master?')) return;
    try {
      await chargeMasterAPI.remove(id);
      await load();
    } catch (err) {
      alert(err?.detail || 'Failed to delete.');
    }
  };

  const categories = [
    { value: 'freight', label: 'Main Freight' },
    { value: 'trucking', label: 'Trucking' },
    { value: 'customs', label: 'Customs & Clearance' },
    { value: 'handling', label: 'Handling & THC' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other Charges' },
  ];

  return (
    <DashboardLayout title="Charge Master">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" /> Charge Master
          </h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Charge
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-xs"><AlertCircle className="w-3.5 h-3.5" />{error}</div>
        )}

        {showForm && (
          <form onSubmit={handleSave} className="bg-white border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{editing ? 'Edit Charge' : 'New Charge'}</h3>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Code</label>
                <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. OFR, THC" className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600">
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Default Rate</label>
                  <input type="number" min="0" step="0.01" value={form.default_rate} onChange={e => setForm({...form, default_rate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Currency</label>
                  <select value={form.default_currency} onChange={e => setForm({...form, default_currency: e.target.value})} className="w-full px-3 py-2 border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600">
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Default Unit</label>
                <select value={form.default_unit} onChange={e => setForm({...form, default_unit: e.target.value})} className="w-full px-3 py-2 border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600">
                  <option value="KG">KG</option>
                  <option value="CBM">CBM</option>
                  <option value="CONTAINER">CONTAINER</option>
                  <option value="LOT">LOT</option>
                  <option value="DOC">DOC</option>
                  <option value="TRIP">TRIP</option>
                  <option value="UNIT">UNIT</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 self-end pb-2">
                <input type="checkbox" checked={form.taxable_default} onChange={e => setForm({...form, taxable_default: e.target.checked})} className="rounded border-slate-300" />
                Taxable (PPN)
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs transition-colors flex items-center gap-1.5">
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Check className="w-3.5 h-3.5" /> {editing ? 'Update' : 'Create'}</>}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-blue-600 animate-spin" /></div>
        ) : masters.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No charge masters yet</p>
            <p className="text-xs text-slate-400 mt-1">Create your first charge template.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {masters.map(m => (
              <div key={m.id} className="bg-white border border-slate-200 px-5 py-3 flex items-center justify-between hover:border-slate-300 transition-colors group">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{m.name}</span>
                    {m.code && <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5">{m.code}</span>}
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5">{categories.find(c => c.value === m.category)?.label || m.category}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {m.default_currency} {parseFloat(m.default_rate).toLocaleString('id-ID')} / {m.default_unit}
                    {m.taxable_default ? ' · Taxable' : ' · Non-taxable'}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(m)} className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="px-2.5 py-1 text-xs font-bold text-red-500 hover:bg-red-50 border border-red-200 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

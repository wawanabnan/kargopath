import React, { useState, useEffect } from 'react';
import { Percent, Plus, Loader2, AlertCircle, X, Check } from 'lucide-react';
import { taxMasterAPI } from '../api';
import DashboardLayout from '../components/DashboardLayout';

export default function TaxMasterPage() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ description: '', code: '', display: '', rate: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await taxMasterAPI.list();
      setTaxes(data?.results ?? data ?? []);
    } catch {
      setError('Failed to load tax masters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ description: '', code: '', display: '', rate: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (t) => {
    setForm({
      description: t.description,
      code: t.code,
      display: t.display,
      rate: t.rate,
    });
    setEditing(t.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.code.trim()) { alert('Description and Code are required.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await taxMasterAPI.update(editing, form);
      } else {
        await taxMasterAPI.create(form);
      }
      resetForm();
      await load();
    } catch (err) {
      alert(err?.detail || 'Failed to save tax master.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tax type?')) return;
    try {
      await taxMasterAPI.remove(id);
      await load();
    } catch (err) {
      alert(err?.detail || 'Failed to delete.');
    }
  };

  return (
    <DashboardLayout title="Tax Master">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Percent className="w-5 h-5 text-slate-400" /> Tax Master
          </h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Tax
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-xs"><AlertCircle className="w-3.5 h-3.5" />{error}</div>
        )}

        {showForm && (
          <form onSubmit={handleSave} className="bg-white border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{editing ? 'Edit Tax' : 'New Tax'}</h3>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g. PPN - Usaha Logistik" required className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Code</label>
                <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. VAT1" required className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Display Label</label>
                <input type="text" value={form.display} onChange={e => setForm({...form, display: e.target.value})} placeholder="e.g. VAT" className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Rate (%)</label>
                <input type="number" min="0" step="0.01" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} placeholder="e.g. 1.10" required className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:border-blue-600" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm({...form, is_active: e.target.checked})} className="rounded border-slate-300" />
                  Active
                </label>
              </div>
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
        ) : taxes.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200">
            <Percent className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No tax types yet</p>
            <p className="text-xs text-slate-400 mt-1">Create your first tax definition.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {taxes.map(t => (
              <div key={t.id} className="bg-white border border-slate-200 px-5 py-3 flex items-center justify-between hover:border-slate-300 transition-colors group">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{t.description}</span>
                    <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 border border-amber-200 px-1.5 py-0.5">{t.code}</span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5">{t.display || '—'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{t.rate}% rate</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(t)} className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="px-2.5 py-1 text-xs font-bold text-red-500 hover:bg-red-50 border border-red-200 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

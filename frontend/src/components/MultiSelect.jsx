import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

export default function MultiSelect({ options, value, onChange, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = options.filter(o => value.includes(o.value));
  const unselected = options.filter(o => !value.includes(o.value));

  const toggle = (val) => {
    const next = value.includes(val) ? value.filter(v => v !== val) : [...value, val];
    onChange(next);
  };

  return (
    <div ref={ref} className="relative">
      {/* ── trigger button ── */}
      <button type="button" disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <div className="flex flex-wrap gap-1 min-w-0 flex-1">
          {selected.length === 0 ? (
            <span className="text-slate-400">{placeholder || 'Select...'}</span>
          ) : (
            selected.map(o => (
              <span key={o.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded"
              >
                {o.label}
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(o.value); }}
                  className="hover:text-blue-200 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* ── dropdown ── */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-lg max-h-60 overflow-y-auto">
          {unselected.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">All items selected</div>
          ) : (
            unselected.map(o => (
              <div key={o.value}
                onClick={() => toggle(o.value)}
                className="px-3 py-2 text-sm cursor-pointer text-slate-700 hover:bg-slate-50"
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

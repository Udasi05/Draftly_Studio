'use client';

import { DOC_TYPES, type DocTypeValue } from '@/types/document';
import { DocTypeIcon } from '@/components/icons';
import { useState, useRef, useEffect } from 'react';

interface DocTypeSelectorProps {
  value: DocTypeValue;
  onChange: (value: DocTypeValue) => void;
}

export default function DocTypeSelector({ value, onChange }: DocTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = DOC_TYPES.find((d) => d.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = DOC_TYPES.filter(
    (d) =>
      d.label.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const categories = [...new Set(filtered.map((d) => d.category))];

  return (
    <div ref={ref} className="relative" id="doc-type-selector">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-slate-700">Document Type</label>
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Category picker</span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="panel flex w-full items-center justify-between rounded-[22px] px-4 py-3.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-sky-200"
        id="doc-type-trigger"
      >
        <span className="flex items-center gap-2">
          {selected ? (
            <DocTypeIcon value={selected.value} className="h-5 w-5 text-slate-700" />
          ) : null}
          <span className="text-slate-900">{selected?.label || 'Select type...'}</span>
        </span>
        <svg className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search */}
          <div className="border-b border-slate-200 p-2">
            <input
              type="text"
              placeholder="Search document types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-300"
              autoFocus
              id="doc-type-search"
            />
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
            {categories.map((category) => (
              <div key={category}>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {category}
                </div>
                {filtered
                  .filter((d) => d.category === category)
                  .map((docType) => (
                    <button
                      key={docType.value}
                      type="button"
                      onClick={() => {
                        onChange(docType.value);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                        docType.value === value
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      id={`doc-type-option-${docType.value}`}
                    >
                      <DocTypeIcon value={docType.value} className="h-4 w-4 text-current" />
                      <span>{docType.label}</span>
                    </button>
                  ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">No matching document types</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

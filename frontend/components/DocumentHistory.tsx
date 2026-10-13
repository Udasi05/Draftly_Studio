'use client';

import type { DocumentHistoryItem } from '@/types/document';
import { DocTypeIcon } from '@/components/icons';

interface DocumentHistoryProps {
  items: DocumentHistoryItem[];
  onSelect: (item: DocumentHistoryItem) => void;
  onClear: () => void;
}

export default function DocumentHistory({ items, onSelect, onClear }: DocumentHistoryProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" id="document-history-widget">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recent Studio Drafts
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {items.length}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] text-slate-400 hover:text-slate-600 transition"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-thin">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-left transition hover:border-sky-200 hover:bg-sky-50/40 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 group-hover:text-sky-600">
                <DocTypeIcon value={item.docType} className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{item.promptSnippet}</p>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

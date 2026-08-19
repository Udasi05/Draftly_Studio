'use client';

import { EXPORT_FORMATS, type ExportFormat } from '@/types/document';
import { FormatIcon } from '@/components/icons';

interface FormatSelectorProps {
  value: ExportFormat;
  onChange: (value: ExportFormat) => void;
}

export default function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div id="format-selector">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-slate-700">
          Export Format <span className="text-rose-500">*</span>
        </label>
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Choose one
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Export format"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {EXPORT_FORMATS.map((format) => {
          const selected = value === format.value;

          return (
            <button
              key={format.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(format.value)}
              className={[
                'group relative flex items-center gap-3 rounded-[22px] px-4 py-3.5 text-left transition-all',
                'focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 focus:ring-offset-white',
                selected
                  ? 'border-2 border-sky-500 bg-sky-50 text-slate-900 shadow-md shadow-sky-500/15 ring-1 ring-sky-200'
                  : 'border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')}
              id={`format-option-${format.value}`}
            >
              {/* Radio dot indicator */}
              <span
                className={[
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  selected
                    ? 'border-sky-500 bg-sky-500'
                    : 'border-slate-300 bg-white group-hover:border-slate-400',
                ].join(' ')}
                aria-hidden="true"
              >
                {selected && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>

              <FormatIcon
                value={format.value}
                className={[
                  'h-5 w-5 transition-transform',
                  selected ? 'scale-110 text-slate-900' : 'text-slate-500 group-hover:text-slate-700',
                ].join(' ')}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{format.label}</p>
                <p
                  className={[
                    'mt-0.5 text-[11px]',
                    selected ? 'text-slate-600' : 'text-slate-400',
                  ].join(' ')}
                >
                  {format.description}
                </p>
              </div>

              {/* Selected badge */}
              {selected && (
                <span
                  className="absolute right-3 top-3 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                  aria-hidden="true"
                >
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper text showing current selection */}
      <p className="mt-2 text-xs text-slate-500" aria-live="polite">
        Current:{' '}
        <span className="font-medium text-slate-700">
          {EXPORT_FORMATS.find((f) => f.value === value)?.label}
        </span>
        {' '}— click to change.
      </p>
    </div>
  );
}

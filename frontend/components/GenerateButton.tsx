'use client';

interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

export default function GenerateButton({ onClick, loading, disabled }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative w-full rounded-full px-6 py-3.5 text-sm font-semibold
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-white
        ${
          disabled || loading
            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
            : 'bg-slate-900 bg-[length:200%_100%] text-white shadow-lg shadow-slate-900/10 hover:bg-[position:100%_0] active:scale-[0.98]'
        }
      `}
      id="generate-btn"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-3">
          {/* Animated spinner */}
          <svg className="h-4.5 w-4.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Generating your document...</span>
          {/* Pulsing dots */}
          <span className="flex gap-1">
            <span className="h-1 w-1 animate-bounce rounded-full bg-white/70" style={{ animationDelay: '0ms' }} />
            <span className="h-1 w-1 animate-bounce rounded-full bg-white/70" style={{ animationDelay: '150ms' }} />
            <span className="h-1 w-1 animate-bounce rounded-full bg-white/70" style={{ animationDelay: '300ms' }} />
          </span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate Document
        </span>
      )}
    </button>
  );
}

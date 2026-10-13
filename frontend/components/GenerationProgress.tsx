'use client';

import { useEffect, useState } from 'react';

interface GenerationProgressProps {
  loading: boolean;
  docType: string;
}

const STAGES = [
  { label: 'Analyzing prompt brief & requirements', minTime: 0 },
  { label: 'Engaging local AI model (Llama 3.1)', minTime: 4 },
  { label: 'Synthesizing document schema & sections', minTime: 18 },
  { label: 'Compiling typography and layout tables', minTime: 40 },
];

export default function GenerationProgress({ loading, docType }: GenerationProgressProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!loading) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  if (!loading) return null;

  const currentStageIndex = STAGES.reduce((acc, stage, idx) => {
    return seconds >= stage.minTime ? idx : acc;
  }, 0);

  return (
    <div
      className="rounded-3xl border border-sky-200 bg-gradient-to-b from-sky-50/80 to-white p-6 shadow-md shadow-sky-500/5 animate-in fade-in duration-300"
      id="generation-progress"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-30" />
            <div className="h-6 w-6 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Generating your {docType.replace('_', ' ')}...
            </p>
            <p className="text-xs text-slate-500">
              Local AI inference in progress · {seconds}s elapsed
            </p>
          </div>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-mono font-medium text-sky-800">
          {seconds}s
        </span>
      </div>

      {/* Progress Stages */}
      <div className="mt-5 space-y-2">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;

          return (
            <div
              key={stage.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors ${
                isCurrent
                  ? 'bg-white font-medium text-slate-900 shadow-sm border border-sky-100'
                  : isDone
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  isDone
                    ? 'bg-emerald-100 text-emerald-700 font-bold'
                    : isCurrent
                    ? 'bg-sky-500 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span>{stage.label}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[11px] text-slate-400">
        💡 Note: Local inference runs privately on your hardware and typically takes 30–75s depending on complexity.
      </p>
    </div>
  );
}

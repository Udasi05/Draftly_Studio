'use client';

import { useEffect, useRef, useState } from 'react';

interface PromptBoxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PLACEHOLDER_SUGGESTIONS = [
  'Create a software requirements specification for a food delivery app with 5 functional requirements...',
  'Write a professional resume for a full-stack developer with 3 years of experience...',
  'Generate a project report for a machine learning-based sentiment analysis system...',
  'Create an invoice for web development services totaling $2,500...',
  'Draft a cover letter for a software engineering position at Google...',
];

const QUICK_STARTS = [
  'Create an SRS for a food delivery app with user roles, features, and non-functional requirements.',
  'Write a polished resume for a frontend developer with React, Next.js, and UI design experience.',
  'Generate a project report for an AI document generator with architecture, testing, and future scope.',
  'Draft meeting minutes for a weekly product review with decisions, action items, and deadlines.',
];

export default function PromptBox({ value, onChange, disabled }: PromptBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_SUGGESTIONS[0]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 240) + 'px';
    }
  }, [value]);

  const charCount = value.length;
  const isOverLimit = charCount > 2000;
  const isUnderMin = charCount > 0 && charCount < 10;

  return (
    <div id="prompt-box">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-slate-700">Describe your document</label>
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Prompt builder</span>
      </div>

      <div className="panel rounded-[24px] p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setPlaceholder(PLACEHOLDER_SUGGESTIONS[Math.floor(Math.random() * PLACEHOLDER_SUGGESTIONS.length)]);
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          maxLength={2100}
          className={`w-full resize-none rounded-[20px] border bg-slate-50 px-4 py-4 text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            isOverLimit
              ? 'border-rose-300 focus:ring-rose-200'
              : isUnderMin
              ? 'border-amber-300 focus:border-amber-300 focus:ring-amber-100'
              : 'border-slate-200 hover:border-slate-300 focus:border-sky-300 focus:ring-sky-100'
          }`}
          id="prompt-textarea"
        />

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Quick starts</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_STARTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(item)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-end">
            {isUnderMin && (
              <span className="text-xs text-amber-600">Minimum 10 characters</span>
            )}
            {isOverLimit && (
              <span className="text-xs text-rose-600">Exceeds 2,000 character limit</span>
            )}
            <span
              className={`text-xs tabular-nums ${
                isOverLimit ? 'text-rose-600' : charCount > 1800 ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              {charCount.toLocaleString()} / 2,000
            </span>
          </div>
        </div>

      </div>

      <p className="mt-1.5 text-xs text-slate-400">
        Tip: Mention sections, tone, audience, and any structure you want included.
      </p>
    </div>
  );
}

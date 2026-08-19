'use client';

import { KeyboardEvent, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DocTypeSelector from '@/components/DocTypeSelector';
import PromptBox from '@/components/PromptBox';
import FormatSelector from '@/components/FormatSelector';
import GenerateButton from '@/components/GenerateButton';
import DownloadCard from '@/components/DownloadCard';
import { generateDocument } from '@/lib/apiClient';
import type { DocTypeValue, ExportFormat } from '@/types/document';

type AxiosErrorLike = {
  response?: {
    status?: number;
    data?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const DYNAMIC_FIELDS: Record<DocTypeValue, { name: string; placeholder: string }[]> = {
  meeting_minutes: [
    { name: 'Date & Time', placeholder: 'e.g., Oct 12, 10:00 AM' },
    { name: 'Location', placeholder: 'e.g., Conference Room B or Zoom' },
    { name: 'Attendees', placeholder: 'e.g., Alice, Bob, Charlie' },
  ],
  assignment: [
    { name: 'Subject', placeholder: 'e.g., Computer Science' },
    { name: 'Topic', placeholder: 'e.g., Data Structures' },
    { name: 'Class/Grade', placeholder: 'e.g., CS101 or 12th Grade' },
  ],
  lab_experiment: [
    { name: 'Experiment Name', placeholder: 'e.g., Titration Analysis' },
    { name: 'Objective', placeholder: 'e.g., Determine concentration of HCl' },
    { name: 'Materials Used', placeholder: 'e.g., Burette, Pipette, Indicator' },
  ],
  srs: [
    { name: 'Project Name', placeholder: 'e.g., Draftly Web App' },
    { name: 'Target Audience', placeholder: 'e.g., Students and Professionals' },
    { name: 'Main Features', placeholder: 'e.g., Auth, PDF Export, AI Gen' },
  ],
  project_report: [
    { name: 'Project Title', placeholder: 'e.g., E-Commerce Platform' },
    { name: 'Team Members', placeholder: 'e.g., John Doe, Jane Smith' },
    { name: 'Tech Stack', placeholder: 'e.g., Next.js, Node.js, MongoDB' },
  ],
  resume: [
    { name: 'Full Name', placeholder: 'e.g., Alex Johnson' },
    { name: 'Target Role', placeholder: 'e.g., Senior Frontend Engineer' },
    { name: 'Experience Level', placeholder: 'e.g., 5 Years' },
  ],
  cover_letter: [
    { name: 'Applicant Name', placeholder: 'e.g., Alex Johnson' },
    { name: 'Target Company', placeholder: 'e.g., Google or Startup Inc' },
    { name: 'Job Role', placeholder: 'e.g., Product Manager' },
  ],
  general: [
    { name: 'Target Audience', placeholder: 'e.g., General Public, Experts' },
    { name: 'Document Purpose', placeholder: 'e.g., Informative, Persuasive' },
  ],
};

const HELPER_TIPS = [
  {
    title: 'Add the target audience and tone.',
    body: 'Tell Draftly who will read this — recruiter, professor, board — so the language matches.',
  },
  {
    title: 'Mention sections, tables, or lists if you need them.',
    body: 'A short hint like "include a 4-row table" is enough to shape the structure.',
  },
  {
    title: 'Describe any constraints like length or style.',
    body: 'Specify "2 pages", "ATS-friendly", or "executive summary" to keep output focused.',
  },
];

const WORKFLOW_STEPS = [
  'Choose a document category.',
  'Write the brief in natural language.',
  'Export the generated file immediately.',
];

const OUTPUT_TILES = [
  { label: 'Tone', value: 'Confident' },
  { label: 'Layout', value: 'Editorial' },
  { label: 'Motion', value: 'Subtle' },
  { label: 'Theme', value: 'Dark slate' },
];

const SHELL = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

export default function GeneratePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [docType, setDocType] = useState<DocTypeValue>('general');
  const [prompt, setPrompt] = useState('');
  const [format, setFormat] = useState<ExportFormat>('docx');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setDynamicValues({});
  }, [docType]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
          <p className="text-sm text-slate-500">Loading your studio...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isValid = prompt.trim().length >= 10 && prompt.length <= 2000;

  const handleGenerate = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    let finalPrompt = prompt;
    const currentFields = DYNAMIC_FIELDS[docType];
    if (currentFields && currentFields.length > 0) {
      const contextLines = currentFields
        .map((f) => {
          const val = dynamicValues[f.name];
          return val ? `${f.name}: ${val}` : null;
        })
        .filter(Boolean);

      if (contextLines.length > 0) {
        finalPrompt = `Context Information:\n${contextLines.join('\n')}\n\nTask:\n${prompt}`;
      }
    }

    try {
      const response = await generateDocument({ prompt: finalPrompt, docType, format });
      setResult(response);
    } catch (err: unknown) {
      const axiosErr = err as AxiosErrorLike;
      const respStatus = axiosErr.response?.status;
      let data = axiosErr.response?.data;

      if (data instanceof Blob && data.type === 'application/json') {
        try {
          data = JSON.parse(await data.text());
        } catch {
          data = undefined;
        }
      }

      if (respStatus === 429) {
        setError(
          'You have hit the rate limit. Please wait a minute before generating again.'
        );
      } else if (respStatus === 401) {
        setError('Your session has expired. Please sign in again.');
        setTimeout(() => {
          signOut({ callbackUrl: '/' });
        }, 3000);
      } else if (isRecord(data)) {
        const details = data.details;

        if (Array.isArray(details)) {
          const validationErrors = details
            .map((item) => {
              if (!isRecord(item)) return null;
              const field =
                typeof item.field === 'string' ? item.field : 'field';
              const message =
                typeof item.message === 'string'
                  ? item.message
                  : 'Invalid value';
              return `${field}: ${message}`;
            })
            .filter((item): item is string => Boolean(item))
            .join(', ');

          setError(
            validationErrors
              ? `Validation error: ${validationErrors}`
              : 'Validation error: please review your prompt.'
          );
        } else {
          const message =
            typeof data.message === 'string' ? data.message : undefined;
          const apiError =
            typeof data.error === 'string' ? data.error : undefined;
          setError(
            message || apiError || 'Something went wrong. Please try again.'
          );
        }
      } else {
        setError('Failed to generate document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setPrompt('');
    setDynamicValues({});
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (
      e.key === 'Enter' &&
      (e.ctrlKey || e.metaKey) &&
      isValid &&
      !loading
    ) {
      handleGenerate();
    }
  };

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-10%] h-[420px] w-[420px] rounded-full bg-sky-200/35 blur-[120px]" />
        <div className="absolute right-[-10%] top-[8%] h-[380px] w-[380px] rounded-full bg-amber-100/70 blur-[140px]" />
        <div className="absolute bottom-[-8%] left-[18%] h-[360px] w-[360px] rounded-full bg-cyan-100/40 blur-[120px]" />
      </div>

      <div className={`relative ${SHELL} flex flex-col gap-6 py-8 sm:py-10 lg:py-12`}>
        {/* ─── Header row ─── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Studio</p>
            <h1 className="section-title mt-3 text-3xl font-semibold tracking-tight text-slate-900 text-balance sm:text-4xl lg:text-5xl">
              Shape a brief into a polished document workspace.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Draftly keeps the generation loop tight: pick a document type, describe
              the outcome, and export a clean Word or PDF file when it is ready.
              {session?.user?.name ? (
                <span className="text-slate-800">
                  {' '}
                  Welcome back, {session.user.name.split(' ')[0]}.
                </span>
              ) : null}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
            {[
              { label: 'Private', value: 'Google-authenticated' },
              { label: 'Fast', value: 'Local AI' },
              { label: 'Export', value: 'DOCX / PDF' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="panel rounded-2xl px-4 py-3 text-center"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Generation Queue — full width ─── */}
        <section className="panel-strong rounded-[28px] p-5 sm:p-7 lg:p-9">
          <div className="surface-grid rounded-[24px] border border-white/5 bg-white/[0.015] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="glass-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Generation queue
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
                  Ready when you are
                </span>
              </div>

              <DocTypeSelector value={docType} onChange={setDocType} />

              {/* Dynamic Context Fields */}
              {DYNAMIC_FIELDS[docType] && DYNAMIC_FIELDS[docType].length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="col-span-full">
                    <p className="text-sm font-semibold text-slate-900">Document Context (Optional)</p>
                    <p className="text-xs text-slate-500 mt-1 mb-2">Providing this info significantly improves AI accuracy.</p>
                  </div>
                  {DYNAMIC_FIELDS[docType].map((field) => (
                    <div key={field.name}>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {field.name}
                      </label>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={dynamicValues[field.name] || ''}
                        onChange={(e) =>
                          setDynamicValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                        }
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>
              )}

              <PromptBox value={prompt} onChange={setPrompt} disabled={loading} />
              <FormatSelector value={format} onChange={setFormat} />

              {error && (
                <div
                  className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm"
                  id="error-message"
                >
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-rose-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-rose-700">{error}</p>
                </div>
              )}

              <div className="mx-auto w-full max-w-xl space-y-3">
                <GenerateButton
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={!isValid}
                />

                {isValid && !loading && (
                  <p className="text-center text-xs text-slate-500">
                    Press{' '}
                    <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">
                      Ctrl
                    </kbd>{' '}
                    +{' '}
                    <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">
                      Enter
                    </kbd>{' '}
                    to generate.
                  </p>
                )}
              </div>

              {result && (
                <DownloadCard
                  blob={result.blob}
                  filename={result.filename}
                  format={format}
                  onReset={handleReset}
                />
              )}
            </div>
          </div>
        </section>

        {/* ─── Assistant notes — 4-up horizontal helper strip ─── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HELPER_TIPS.map((tip, i) => (
            <div
              key={tip.title}
              className="panel rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[11px] font-semibold text-sky-700">
                  0{i + 1}
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  {tip.title}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{tip.body}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
              Shortcut
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The result card appears in place so the generate-download loop stays
              on one screen.
            </p>
          </div>
        </section>

        {/* ─── Workflow + Output quality — 2-col panel row ─── */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="panel rounded-[28px] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Workflow</p>
                <h2 className="section-title mt-2 text-xl font-semibold text-slate-900">
                  The Draftly loop
                </h2>
              </div>
              <span className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                Local-first
              </span>
            </div>

            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {WORKFLOW_STEPS.map((step, i) => (
                <li
                  key={step}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-900">
                    0{i + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="panel rounded-[28px] p-5 sm:p-6">
            <p className="section-kicker">Output quality</p>
            <h2 className="section-title mt-2 text-xl font-semibold text-slate-900">
              Designed to read like a product, not a form.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Draftly keeps the interface calm and editorial, with enough structure
              to feel like a serious workbench and enough motion to feel alive.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {OUTPUT_TILES.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

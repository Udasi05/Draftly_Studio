'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DOC_TYPES } from '@/types/document';
import { DocTypeIcon } from '@/components/icons';

const FEATURES = [
  {
    title: 'Fast by design',
    description: 'Move from idea to export in a single, focused flow with no extra setup.',
  },
  {
    title: 'Private workflow',
    description: 'Auth-gated access, local AI generation, and no unnecessary file persistence.',
  },
  {
    title: 'Structured output',
    description: 'The model is asked to return clean JSON so formatting stays predictable.',
  },
  {
    title: 'Export ready',
    description: 'Download polished DOCX or PDF files that are ready to share immediately.',
  },
];

const WORKFLOW = [
  {
    title: 'Choose a document type',
    description: 'Pick the shape of the document first so Draftly can frame the right structure.',
  },
  {
    title: 'Describe the outcome',
    description: 'Write in natural language and include any sections, tone, or constraints you want.',
  },
  {
    title: 'Export the finished file',
    description: 'Review the generated result and download a Word or PDF version in one click.',
  },
];

const STATS = [
  { label: 'Document types', value: '8+' },
  { label: 'Export formats', value: '2' },
  { label: 'Core flow', value: '1 screen' },
];

const OUTPUT_QUALITY = [
  'Structured JSON keeps formatting predictable.',
  'Polished DOCX and PDF exports are ready to share.',
  'Typography, spacing, and rhythm stay consistent.',
];

const SNAPSHOT_POINTS = [
  'Built for academic work, resumes, and professional docs.',
  'Local-first generation keeps the workflow tight and predictable.',
  'A studio-style interface makes the app feel like a real product.',
];

const SHOWCASE_TYPES = DOC_TYPES.slice(0, 8);

// ─── Shared section shell ───
const SHELL = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';
const SECTION = 'relative py-20 lg:py-28';

// Reusable section header — kicker + h2 + optional lede
function SectionHeader({
  kicker,
  title,
  lede,
  align = 'left',
}: {
  kicker: string;
  title: string;
  lede?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div
      className={
        align === 'center'
          ? 'mx-auto max-w-2xl text-center'
          : 'max-w-2xl'
      }
    >
      <p className="section-kicker">{kicker}</p>
      <h2 className="section-title mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {lede ? (
        <p className="mt-4 text-base leading-7 text-slate-600">{lede}</p>
      ) : null}
    </div>
  );
}

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleCTA = () => {
    if (session) {
      router.push('/generate');
    } else {
      signIn('google', { callbackUrl: '/generate' });
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* ─── Hero ─── */}
      <section className={`relative ${SECTION}`}>
        <div className={SHELL}>
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            {/* Left: copy */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm text-slate-700 animate-slide-up">
                Draftly Studio — AI document platform
              </div>

              <h1 className="section-title mt-6 text-4xl font-semibold tracking-tight text-slate-900 text-balance sm:text-5xl lg:text-6xl animate-slide-up delay-100">
                Build documents like a modern product team, not a generic form.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg animate-slide-up delay-200">
                Draftly turns a brief into a structured document with strong typography,
                local AI generation, and polished exports. It feels like a studio because
                that is exactly what it is.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center animate-slide-up delay-300">
                <button
                  onClick={handleCTA}
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition-transform hover:-translate-y-0.5"
                  id="hero-cta"
                >
                  {session ? 'Open Studio' : 'Start for free'}
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Secure Google sign in
                </div>
              </div>
            </div>

            {/* Right: preview card */}
            <div className="relative animate-slide-up delay-300">
              <div className="panel-strong relative overflow-hidden rounded-[32px] p-5 sm:p-7">

                <div className="relative flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex h-7 flex-1 items-center rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-400">
                    draftly.local/studio
                  </div>
                </div>

                <div className="relative mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <p className="section-kicker">Preview</p>
                  <h3 className="section-title mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                    A document surface that feels deliberate.
                  </h3>

                  <div className="mt-5 space-y-3">
                    <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                    <div className="h-3 w-1/2 rounded-full bg-slate-200" />
                    <div className="h-24 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                      Build a software requirements specification for a food delivery
                      platform with functional requirements, non-functional notes, and a
                      concise architecture overview.
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <div className="h-10 rounded-2xl bg-slate-100" />
                      <div className="h-10 w-28 rounded-full bg-slate-900" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats band — full width below the hero */}
          <div className="mt-12 grid gap-3 sm:mt-16 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="panel rounded-2xl px-5 py-5"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Workflow + Output quality ─── */}
      <section className={`relative ${SECTION}`}>
        <div className={SHELL}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="panel rounded-[28px] p-6 sm:p-8">
              <SectionHeader
                kicker="Workflow"
                title="A clean path from prompt to export."
              />
              <div className="mt-6 space-y-3">
                {WORKFLOW.map((item, index) => (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-900">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel rounded-[28px] p-6 sm:p-8">
              <SectionHeader
                kicker="Output quality"
                title="Output that feels finished, not assembled."
              />
              <div className="mt-6 space-y-3">
                {OUTPUT_QUALITY.map((point) => (
                  <div
                    key={point}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                      0{OUTPUT_QUALITY.indexOf(point) + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className={`relative ${SECTION}`}>
        <div className={SHELL}>
          <SectionHeader
            kicker="Why it stands out"
            title="A tighter loop, a cleaner surface, and less noise."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="panel group relative overflow-hidden rounded-[24px] p-6"
                style={{ animationDelay: `${i * 100}ms` }}
                id={`feature-card-${i}`}
              >
                <div className="h-2 w-14 rounded-full bg-slate-200" />
                <h3 className="mt-6 text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Document types showcase ─── */}
      <section className={`relative ${SECTION}`} id="features">
        <div className={SHELL}>
          <SectionHeader
            kicker="Document types"
            title="Academic, professional, and general use cases."
            lede="Eight pre-tuned document shapes, each with its own prompt structure and formatting rules."
          />

          <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {SHOWCASE_TYPES.map((docType) => (
              <div
                key={docType.value}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50"
                id={`showcase-${docType.value}`}
              >
                <div className="flex items-center gap-2">
                  <DocTypeIcon value={docType.value} className="h-4 w-4 text-slate-700" />
                  <span className="text-sm font-medium text-slate-900">
                    {docType.label}
                  </span>
                </div>
                <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  {docType.category}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm leading-6 text-slate-600">
              {SNAPSHOT_POINTS.join(' ')}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className={`relative ${SECTION}`}>
        <div className={SHELL}>
          <div className="mx-auto max-w-5xl">
            <div className="panel-strong relative overflow-hidden rounded-[32px] p-8 text-center sm:p-14">
              <div className="relative">
                <p className="section-kicker">Ready when you are</p>
                <h2 className="section-title mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Open Draftly Studio and start with a single sentence.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Sign in with Google and move into the studio. Draftly keeps the
                  experience calm, structured, and built for actual work.
                </p>
                <button
                  onClick={handleCTA}
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition-transform hover:-translate-y-0.5"
                  id="bottom-cta"
                >
                  {session ? 'Open Studio' : 'Start for free'}
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative border-t border-slate-200">
        <div className={`${SHELL} py-12`}>
          <div className="grid gap-10 md:grid-cols-3">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M8 12h8M8 16h8" />
                  </svg>
                </div>
                <p className="font-display text-base font-semibold tracking-tight text-slate-900">
                  Draftly Studio
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                AI-powered document generation that respects your time and your
                privacy. Built and maintained by Anish Udasi.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Product
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                <li>
                  <Link
                    href="/generate"
                    className="transition-colors hover:text-slate-900"
                  >
                    Studio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#features"
                    className="transition-colors hover:text-slate-900"
                  >
                    Capabilities
                  </Link>
                </li>
                <li>
                  <a
                    href="https://ollama.com"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-slate-900"
                  >
                    Powered by Ollama
                  </a>
                </li>
              </ul>
            </div>

            {/* Stack */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Stack
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                <li>Next.js 16 · React 19</li>
                <li>Express API · Ollama local LLM</li>
                <li>Google OAuth · Auth.js</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Draftly Studio. All rights reserved.</p>
            <p>Local-first generation. No cloud LLM keys required.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

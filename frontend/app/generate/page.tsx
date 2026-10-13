"use client";

import { KeyboardEvent, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DocTypeSelector from "@/components/DocTypeSelector";
import PromptBox from "@/components/PromptBox";
import FormatSelector from "@/components/FormatSelector";
import GenerateButton from "@/components/GenerateButton";
import DownloadCard from "@/components/DownloadCard";
import DocumentPreview from "@/components/DocumentPreview";
import GenerationProgress from "@/components/GenerationProgress";
import AiStatusBadge from "@/components/AiStatusBadge";
import DocumentHistory from "@/components/DocumentHistory";
import { generateDocument, generateDocumentJSON, compileDocument } from "@/lib/apiClient";
import type {
  DocTypeValue,
  ExportFormat,
  DocumentJSON,
  DocumentHistoryItem,
} from "@/types/document";

type AxiosErrorLike = {
  response?: {
    status?: number;
    data?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const DYNAMIC_FIELDS: Record<
  DocTypeValue,
  { name: string; placeholder: string }[]
> = {
  meeting_minutes: [
    { name: "Date & Time", placeholder: "e.g., Oct 12, 10:00 AM" },
    { name: "Location", placeholder: "e.g., Conference Room B or Zoom" },
    { name: "Attendees", placeholder: "e.g., Alice, Bob, Charlie" },
  ],
  assignment: [
    { name: "Subject", placeholder: "e.g., Computer Science" },
    { name: "Topic", placeholder: "e.g., Data Structures" },
    { name: "Class/Grade", placeholder: "e.g., CS101 or 12th Grade" },
  ],
  lab_experiment: [
    { name: "Experiment Name", placeholder: "e.g., Titration Analysis" },
    { name: "Objective", placeholder: "e.g., Determine concentration of HCl" },
    {
      name: "Materials Used",
      placeholder: "e.g., Burette, Pipette, Indicator",
    },
  ],
  srs: [
    { name: "Project Name", placeholder: "e.g., Draftly Web App" },
    {
      name: "Target Audience",
      placeholder: "e.g., Students and Professionals",
    },
    { name: "Main Features", placeholder: "e.g., Auth, PDF Export, AI Gen" },
  ],
  project_report: [
    { name: "Project Title", placeholder: "e.g., E-Commerce Platform" },
    { name: "Team Members", placeholder: "e.g., John Doe, Jane Smith" },
    { name: "Tech Stack", placeholder: "e.g., Next.js, Node.js, MongoDB" },
  ],
  resume: [
    { name: "Full Name", placeholder: "e.g., Alex Johnson" },
    { name: "Target Role", placeholder: "e.g., Senior Frontend Engineer" },
    { name: "Experience Level", placeholder: "e.g., 5 Years" },
  ],
  cover_letter: [
    { name: "Applicant Name", placeholder: "e.g., Alex Johnson" },
    { name: "Target Company", placeholder: "e.g., Google or Startup Inc" },
    { name: "Job Role", placeholder: "e.g., Product Manager" },
  ],
  general: [
    { name: "Target Audience", placeholder: "e.g., General Public, Experts" },
    { name: "Document Purpose", placeholder: "e.g., Informative, Persuasive" },
  ],
};

const TONE_OPTIONS = ["Professional", "Academic", "Executive", "Creative", "Concise"];
const FONT_OPTIONS = [
  { value: "Times New Roman", label: "Times New Roman (Classic Serif)" },
  { value: "Helvetica", label: "Helvetica / Arial (Modern Clean)" },
  { value: "Georgia", label: "Georgia (Editorial Serif)" },
];

const HELPER_TIPS = [
  {
    title: "Add target audience and tone.",
    body: "Tell Draftly who will read this — recruiter, professor, board — so the language matches.",
  },
  {
    title: "Mention tables or lists.",
    body: 'A short hint like "include a 4-row action items table" shapes the structure automatically.',
  },
  {
    title: "Describe constraints.",
    body: 'Specify "2 pages", "ATS-friendly", or "executive summary" to keep output focused.',
  },
];

const WORKFLOW_STEPS = [
  "Choose a document category & tone.",
  "Describe your brief in plain English.",
  "Preview live and export Word or PDF in seconds.",
];

const OUTPUT_TILES = [
  { label: "AI Engine", value: "Local Llama 3.1" },
  { label: "Privacy", value: "In-memory / Zero leak" },
  { label: "Speed", value: "<50ms re-export" },
  { label: "Dual Format", value: "DOCX + PDF" },
];

const SHELL = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
const STORAGE_KEY = "draftly_recent_drafts";

export default function GeneratePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [docType, setDocType] = useState<DocTypeValue>("general");
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<ExportFormat>("docx");
  const [tone, setTone] = useState("Professional");
  const [font, setFont] = useState("Times New Roman");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [generatedDoc, setGeneratedDoc] = useState<DocumentJSON | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [history, setHistory] = useState<DocumentHistoryItem[]>([]);

  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});

  // Auth redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 8));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToHistory = (item: DocumentHistoryItem) => {
    try {
      const nextHistory = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 8);
      setHistory(nextHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
    } catch {
      // ignore
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  if (status === "loading") {
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

  const handleDocTypeChange = (nextDocType: DocTypeValue) => {
    setDocType(nextDocType);
    setDynamicValues({});
  };

  const handleGenerate = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setGeneratedDoc(null);

    let finalPrompt = prompt;
    const currentFields = DYNAMIC_FIELDS[docType];
    const contextLines: string[] = [];

    if (currentFields && currentFields.length > 0) {
      currentFields.forEach((f) => {
        const val = dynamicValues[f.name];
        if (val) contextLines.push(`${f.name}: ${val}`);
      });
    }

    if (tone) {
      contextLines.push(`Desired Tone: ${tone}`);
    }

    if (contextLines.length > 0) {
      finalPrompt = `Context & Style:\n${contextLines.join("\n")}\n\nTask:\n${prompt}`;
    }

    try {
      // 1. Generate document JSON for live preview & structured caching
      const jsonRes = await generateDocumentJSON({
        prompt: finalPrompt,
        docType,
      });

      const doc = jsonRes.document;
      if (font) {
        doc.metadata = { ...doc.metadata, font };
      }
      setGeneratedDoc(doc);

      // Save to session history
      const historyItem: DocumentHistoryItem = {
        id: `${Date.now()}`,
        title: doc.title,
        docType,
        createdAt: new Date().toISOString(),
        document: doc,
        promptSnippet: prompt.substring(0, 60),
      };
      saveToHistory(historyItem);

      // 2. Also compile requested format for immediate download card
      try {
        const fileRes = await compileDocument({
          document: doc,
          format,
        });
        setResult(fileRes);
      } catch (compileErr) {
        console.warn("[Generate] Immediate binary compilation postponed to preview:", compileErr);
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosErrorLike;
      const respStatus = axiosErr.response?.status;
      let data = axiosErr.response?.data;

      // Robust Blob error parsing (handling application/json; charset=utf-8)
      if (data instanceof Blob && (data.type.includes("json") || data.type === "")) {
        try {
          data = JSON.parse(await data.text());
        } catch {
          data = undefined;
        }
      }

      if (respStatus === 429) {
        setError("You have hit the rate limit. Please wait a minute before generating again.");
      } else if (respStatus === 401) {
        setError("Your session has expired. Please sign in again.");
        setTimeout(() => {
          signOut({ callbackUrl: "/" });
        }, 3000);
      } else if (isRecord(data)) {
        const details = data.details;

        if (Array.isArray(details)) {
          const validationErrors = details
            .map((item) => {
              if (!isRecord(item)) return null;
              const field = typeof item.field === "string" ? item.field : "field";
              const message = typeof item.message === "string" ? item.message : "Invalid value";
              return `${field}: ${message}`;
            })
            .filter((item): item is string => Boolean(item))
            .join(", ");

          setError(
            validationErrors
              ? `Validation error: ${validationErrors}`
              : "Validation error: please review your prompt."
          );
        } else {
          const message = typeof data.message === "string" ? data.message : undefined;
          const apiError = typeof data.error === "string" ? data.error : undefined;
          setError(message || apiError || "Something went wrong. Please try again.");
        }
      } else {
        setError("Failed to generate document. Is Ollama running on your machine?");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setGeneratedDoc(null);
    setError(null);
    setPrompt("");
    setDynamicValues({});
  };

  const handleSelectHistoryItem = (item: DocumentHistoryItem) => {
    setGeneratedDoc(item.document);
    setDocType(item.docType);
    setResult(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && isValid && !loading) {
      handleGenerate();
    }
  };

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-10%] h-[420px] w-[420px] rounded-full bg-sky-200/35 blur-[120px]" />
        <div className="absolute right-[-10%] top-[8%] h-[380px] w-[380px] rounded-full bg-amber-100/70 blur-[140px]" />
        <div className="absolute bottom-[-8%] left-[18%] h-[360px] w-[360px] rounded-full bg-cyan-100/40 blur-[120px]" />
      </div>

      <div className={`relative ${SHELL} flex flex-col gap-6 py-8 sm:py-10 lg:py-12`}>
        {/* ─── Header row ─── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <Image src="/logo.png" alt="Draftly" width={28} height={28} className="h-6 w-6 object-contain" />
              </div>
              <p className="section-kicker">Studio Workspace</p>
              <AiStatusBadge />
            </div>
            <h1 className="section-title mt-3 text-3xl font-semibold tracking-tight text-slate-900 text-balance sm:text-4xl lg:text-5xl">
              Turn a brief into a professional document.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Draftly generates clean Word and PDF exports in memory via local AI.
              {session?.user?.name ? (
                <span className="text-slate-800">
                  {" "}Welcome back, {session.user.name.split(" ")[0]}.
                </span>
              ) : null}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
            {[
              { label: "Private", value: "In-memory AI" },
              { label: "Inference", value: "Local Llama 3.1" },
              { label: "Exports", value: "DOCX & PDF" },
            ].map((stat) => (
              <div key={stat.label} className="panel rounded-2xl px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Document History Drawer (if drafts exist) ─── */}
        {history.length > 0 && !generatedDoc && (
          <DocumentHistory
            items={history}
            onSelect={handleSelectHistoryItem}
            onClear={clearHistory}
          />
        )}

        {/* ─── Generation Studio Section ─── */}
        <section className="panel-strong rounded-[28px] p-5 sm:p-7 lg:p-9">
          <div className="surface-grid rounded-[24px] border border-white/5 bg-white/[0.015] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="glass-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Generation studio
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
                    Ready
                  </span>
                </div>

                {/* Tone selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Tone:</span>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-sky-300"
                  >
                    {TONE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <DocTypeSelector value={docType} onChange={handleDocTypeChange} />

              {/* Dynamic Context Fields */}
              {DYNAMIC_FIELDS[docType] && DYNAMIC_FIELDS[docType].length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="col-span-full">
                    <p className="text-sm font-semibold text-slate-900">
                      Document Context (Optional)
                    </p>
                    <p className="text-xs text-slate-500 mt-1 mb-2">
                      Providing specific details helps the model shape realistic sections.
                    </p>
                  </div>
                  {DYNAMIC_FIELDS[docType].map((field) => (
                    <div key={field.name}>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {field.name}
                      </label>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={dynamicValues[field.name] || ""}
                        onChange={(e) =>
                          setDynamicValues((prev) => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }))
                        }
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>
              )}

              <PromptBox value={prompt} onChange={setPrompt} disabled={loading} />

              {/* Format & Font Controls */}
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                <FormatSelector value={format} onChange={setFormat} />

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Typography
                  </label>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-[22px] border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-800 shadow-sm focus:outline-none focus:border-sky-300"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Progress Bar */}
              <GenerationProgress loading={loading} docType={docType} />

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

              {!loading && (
                <div className="mx-auto w-full max-w-xl space-y-3">
                  <GenerateButton
                    onClick={handleGenerate}
                    loading={loading}
                    disabled={!isValid}
                  />

                  {isValid && (
                    <p className="text-center text-xs text-slate-500">
                      Press{" "}
                      <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">
                        Ctrl
                      </kbd>{" "}
                      +{" "}
                      <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">
                        Enter
                      </kbd>{" "}
                      to generate.
                    </p>
                  )}
                </div>
              )}

              {/* Immediate Download Card (fallback / quick download) */}
              {result && !generatedDoc && (
                <DownloadCard
                  blob={result.blob}
                  filename={result.filename}
                  format={format}
                  onReset={handleReset}
                />
              )}

              {/* ─── Live Interactive Document Studio Preview ─── */}
              {generatedDoc && (
                <DocumentPreview
                  document={generatedDoc}
                  docType={docType}
                  onReset={handleReset}
                />
              )}
            </div>
          </div>
        </section>

        {/* ─── Assistant notes — helper strip ─── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HELPER_TIPS.map((tip, i) => (
            <div key={tip.title} className="panel rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[11px] font-semibold text-sky-700">
                  0{i + 1}
                </span>
                <p className="text-sm font-semibold text-slate-900">{tip.title}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{tip.body}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
              Instant Re-Export
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Once generated, switch between Word and PDF in &lt;50ms without waiting for local AI to re-run.
            </p>
          </div>
        </section>

        {/* ─── Workflow & Quality panels ─── */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="panel rounded-[28px] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Architecture</p>
                <h2 className="section-title mt-2 text-xl font-semibold text-slate-900">
                  The Draftly pipeline
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
            <p className="section-kicker">Production standard</p>
            <h2 className="section-title mt-2 text-xl font-semibold text-slate-900">
              Engineered for enterprise reliability.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Hardened with Zod validation, defensive schema normalization, and in-memory streams.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {OUTPUT_TILES.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
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

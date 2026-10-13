'use client';

import { useState } from 'react';
import type { DocumentJSON, ExportFormat } from '@/types/document';
import { compileDocument, downloadBlob } from '@/lib/apiClient';
import { FormatIcon } from '@/components/icons';

interface DocumentPreviewProps {
  document: DocumentJSON;
  docType: string;
  onReset: () => void;
}

export default function DocumentPreview({
  document: doc,
  docType,
  onReset,
}: DocumentPreviewProps) {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [copiedType, setCopiedType] = useState<'markdown' | 'text' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const wordCount =
    doc.stats?.wordCount ||
    doc.sections.reduce((acc, s) => {
      const text = typeof s.content === 'string' ? s.content : Array.isArray(s.content) ? s.content.join(' ') : '';
      return acc + text.trim().split(/\s+/).filter(Boolean).length;
    }, 0);

  const handleExport = async (format: ExportFormat) => {
    setExportingFormat(format);
    setExportError(null);
    try {
      const { blob, filename } = await compileDocument({
        document: doc,
        format,
      });
      downloadBlob(blob, filename);
    } catch (err: unknown) {
      console.error('[Preview] Export compilation failed:', err);
      setExportError('Failed to compile file. Please try again.');
    } finally {
      setExportingFormat(null);
    }
  };

  const copyToClipboard = async (type: 'markdown' | 'text') => {
    let output = '';

    if (type === 'markdown') {
      output += `# ${doc.title}\n\n`;
      for (const s of doc.sections) {
        if (s.heading) {
          const prefix = s.level === 1 ? '## ' : s.level === 2 ? '### ' : '#### ';
          output += `${prefix}${s.heading}\n\n`;
        }
        if (s.type === 'paragraph' && s.content) {
          output += `${s.content}\n\n`;
        } else if (s.type === 'bullets' && Array.isArray(s.content)) {
          output += s.content.map((item) => `- ${item}`).join('\n') + '\n\n';
        } else if (s.type === 'numbered' && Array.isArray(s.content)) {
          output += s.content.map((item, idx) => `${idx + 1}. ${item}`).join('\n') + '\n\n';
        } else if (s.type === 'table' && s.headers && s.rows) {
          output += `| ${s.headers.join(' | ')} |\n`;
          output += `| ${s.headers.map(() => '---').join(' | ')} |\n`;
          output += s.rows.map((row) => `| ${row.join(' | ')} |`).join('\n') + '\n\n';
        }
      }
    } else {
      output += `${doc.title.toUpperCase()}\n\n`;
      for (const s of doc.sections) {
        if (s.heading) output += `${s.heading}\n`;
        if (s.type === 'paragraph' && s.content) output += `${s.content}\n\n`;
        else if (Array.isArray(s.content)) output += s.content.map((c) => `• ${c}`).join('\n') + '\n\n';
      }
    }

    try {
      await navigator.clipboard.writeText(output.trim());
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" id="document-preview-section">
      {/* ─── Studio Toolbar ─── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Generated & Ready</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {doc.sections.length} sections · {wordCount} words
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 line-clamp-1">{doc.title}</h3>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('docx')}
            disabled={exportingFormat !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            id="preview-export-docx-btn"
          >
            {exportingFormat === 'docx' ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <FormatIcon value="docx" className="h-4 w-4" />
            )}
            Download DOCX
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={exportingFormat !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            id="preview-export-pdf-btn"
          >
            {exportingFormat === 'pdf' ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-700 border-t-transparent" />
            ) : (
              <FormatIcon value="pdf" className="h-4 w-4 text-rose-500" />
            )}
            Download PDF
          </button>

          <button
            onClick={() => copyToClipboard('markdown')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            title="Copy as Markdown"
            id="preview-copy-markdown-btn"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copiedType === 'markdown' ? 'Copied MD!' : 'Copy MD'}
          </button>

          <button
            onClick={onReset}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            id="preview-new-doc-btn"
          >
            New Document
          </button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {exportError}
        </div>
      )}

      {/* ─── Document Paper Preview ─── */}
      <div className="relative mx-auto max-w-4xl rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10 lg:p-14">
        {/* Paper top accent bar */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-5 text-xs text-slate-400">
          <span className="font-mono uppercase tracking-widest text-slate-500">Draftly Studio Document Preview</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-600">
            {doc.metadata?.font || 'Times New Roman'} · {doc.metadata?.fontSize || 12}pt
          </span>
        </div>

        {/* Title */}
        <h1 className="text-center font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {doc.title}
        </h1>

        {/* Content Sections */}
        <div className="mt-8 space-y-6 text-slate-800">
          {doc.sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              {section.heading && (
                <div
                  className={`font-semibold text-slate-900 ${
                    section.level === 1
                      ? 'border-b border-slate-200 pb-1 text-lg'
                      : section.level === 2
                      ? 'text-base text-slate-800'
                      : 'text-sm text-slate-700'
                  }`}
                >
                  {section.heading}
                </div>
              )}

              {section.type === 'paragraph' && section.content && (
                <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                  {String(section.content)
                    .split(/\n\n+/)
                    .map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                </div>
              )}

              {section.type === 'bullets' && Array.isArray(section.content) && (
                <ul className="space-y-1.5 pl-5 text-sm text-slate-700 list-disc marker:text-sky-600">
                  {section.content.map((item, bIdx) => (
                    <li key={bIdx} className="leading-relaxed">
                      {String(item)}
                    </li>
                  ))}
                </ul>
              )}

              {section.type === 'numbered' && Array.isArray(section.content) && (
                <ol className="space-y-1.5 pl-5 text-sm text-slate-700 list-decimal marker:font-semibold marker:text-slate-600">
                  {section.content.map((item, nIdx) => (
                    <li key={nIdx} className="leading-relaxed">
                      {String(item)}
                    </li>
                  ))}
                </ol>
              )}

              {section.type === 'table' && section.headers && section.rows && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-800">
                      <tr>
                        {section.headers.map((h, hIdx) => (
                          <th key={hIdx} className="px-3 py-2.5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {section.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Paper bottom note */}
        <div className="mt-12 border-t border-slate-100 pt-6 text-center text-[11px] text-slate-400">
          Generated via Draftly AI Engine · Export to DOCX or PDF for fully formatted print-ready files
        </div>
      </div>
    </div>
  );
}

'use client';

import { downloadBlob } from '@/lib/apiClient';
import { FormatIcon } from '@/components/icons';

interface DownloadCardProps {
  blob: Blob;
  filename: string;
  format: 'docx' | 'pdf';
  onReset: () => void;
}

export default function DownloadCard({ blob, filename, format, onReset }: DownloadCardProps) {
  const fileSizeKB = (blob.size / 1024).toFixed(1);
  const formatLabel = format === 'docx' ? 'Word Document' : 'PDF Document';

  return (
    <div
      className="mt-6 rounded-[26px] border border-emerald-200 bg-emerald-50/50 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
      id="download-card"
    >
      {/* Success header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-5 w-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Document ready</h3>
          <p className="text-sm text-slate-500">Your file has been generated successfully.</p>
        </div>
      </div>

      {/* File info */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <FormatIcon value={format} className="h-6 w-6 text-slate-700" />
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{filename}</p>
          <p className="text-xs text-slate-500">
            {formatLabel} · {fileSizeKB} KB
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => downloadBlob(blob, filename)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          id="download-btn"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download
        </button>
        <button
          onClick={onReset}
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          id="generate-another-btn"
        >
          Generate Another
        </button>
      </div>
    </div>
  );
}

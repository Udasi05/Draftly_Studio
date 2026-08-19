// ─────────────────────────────────────────────────────────────────────────────
//  Inline monoline icon set
//  All icons are 24×24, stroke="currentColor", stroke-width="1.5",
//  stroke-linecap="round", stroke-linejoin="round", fill="none".
//  Sized via the parent className — e.g. <Assignment className="h-5 w-5" />.
// ─────────────────────────────────────────────────────────────────────────────

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const baseProps: IconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// ─── Document-type icons ───

export function Assignment(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h6M8 9h3" />
    </svg>
  );
}

export function LabFlask(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M9 3h6" />
      <path d="M10 3v6.5L5.5 18a2 2 0 0 0 1.7 3h9.6a2 2 0 0 0 1.7-3L14 9.5V3" />
      <path d="M7.5 14h9" />
    </svg>
  );
}

export function Srs(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M8.5 12.5l1.5 1.5 3-3" />
      <path d="M8.5 17.5l1.5 1.5 3-3" />
    </svg>
  );
}

export function Project(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M8 16v-3" />
      <path d="M11.5 16v-5" />
      <path d="M15 16v-2" />
    </svg>
  );
}

export function Resume(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2.5" />
      <path d="M6 17c.8-1.7 2.5-2.5 3-2.5s2.2.8 3 2.5" />
      <path d="M14 9h4" />
      <path d="M14 13h4" />
      <path d="M14 16h2.5" />
    </svg>
  );
}

export function CoverLetter(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export function Minutes(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V2.5M15 4V2.5" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M9 18h4" />
    </svg>
  );
}

export function General(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
    </svg>
  );
}

// ─── File-format icons ───

export function Docx(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M8 14h2.5M8 17h2.5" />
      <path d="M14 13v4M16 15h-2.5" />
    </svg>
  );
}

export function Pdf(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M8 14v3" />
      <path d="M8 14h1.5a1 1 0 0 1 0 2H8" />
      <path d="M13 14h1.5a1.5 1.5 0 0 1 0 3H13" />
    </svg>
  );
}

// ─── Lookup by document type / format value ───

import type React from 'react';
import type { DocTypeValue, ExportFormat } from '@/types/document';

const DOC_TYPE_ICONS: Record<DocTypeValue, (p: IconProps) => React.ReactElement> = {
  assignment: Assignment,
  lab_experiment: LabFlask,
  srs: Srs,
  project_report: Project,
  resume: Resume,
  cover_letter: CoverLetter,
  meeting_minutes: Minutes,
  general: General,
};

const FORMAT_ICONS: Record<ExportFormat, (p: IconProps) => React.ReactElement> = {
  docx: Docx,
  pdf: Pdf,
};

export function DocTypeIcon({ value, ...rest }: { value: DocTypeValue } & IconProps) {
  const C = DOC_TYPE_ICONS[value];
  return <C {...rest} />;
}

export function FormatIcon({ value, ...rest }: { value: ExportFormat } & IconProps) {
  const C = FORMAT_ICONS[value];
  return <C {...rest} />;
}

// ─── Document Types ───
export const DOC_TYPES = [
  // Academic
  { value: 'assignment', label: 'Assignment', icon: 'Assignment', category: 'Academic' },
  { value: 'lab_experiment', label: 'Lab Experiment Report', icon: 'LabFlask', category: 'Academic' },
  { value: 'srs', label: 'Software Requirements Specification', icon: 'Srs', category: 'Academic' },
  { value: 'project_report', label: 'Project Report', icon: 'Project', category: 'Academic' },

  // Professional
  { value: 'resume', label: 'Resume / CV', icon: 'Resume', category: 'Professional' },
  { value: 'cover_letter', label: 'Cover Letter', icon: 'CoverLetter', category: 'Professional' },
  { value: 'meeting_minutes', label: 'Meeting Minutes', icon: 'Minutes', category: 'Professional' },

  // General
  { value: 'general', label: 'General Purpose Document', icon: 'General', category: 'General' },
] as const;

export type DocTypeValue = (typeof DOC_TYPES)[number]['value'];

// ─── Export Formats ───
export type ExportFormat = 'docx' | 'pdf';

export interface ExportFormatOption {
  value: ExportFormat;
  label: string;
  icon: 'Docx' | 'Pdf';
  description: string;
}

export const EXPORT_FORMATS: ExportFormatOption[] = [
  {
    value: 'docx',
    label: 'Word (.docx)',
    icon: 'Docx',
    description: 'Microsoft Word document — editable',
  },
  {
    value: 'pdf',
    label: 'PDF (.pdf)',
    icon: 'Pdf',
    description: 'Portable Document Format — universal',
  },
];

// ─── Document Generation Request ───
export interface GenerateRequest {
  prompt: string;
  docType: DocTypeValue;
  format: ExportFormat;
}

// ─── Claude JSON Output Schema (for reference) ───
export interface DocumentSection {
  heading: string;
  level: 1 | 2 | 3;
  type: 'paragraph' | 'bullets' | 'numbered' | 'table' | 'heading_only';
  content?: string | string[];
  headers?: string[];
  rows?: string[][];
}

export interface DocumentJSON {
  title: string;
  metadata: {
    font: string;
    fontSize: number;
    lineSpacing: number;
  };
  sections: DocumentSection[];
}

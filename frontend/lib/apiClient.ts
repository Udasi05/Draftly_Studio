import axios from 'axios';
import { getSession } from 'next-auth/react';
import type {
  GenerateRequest,
  CompileRequest,
  GenerateJsonResponse,
  AiEngineHealth,
} from '@/types/document';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 0, // wait for local AI model generation
});

// ─── Attach auth token to every request ───
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idToken = (session as any)?.idToken;
  if (idToken) {
    config.headers.Authorization = `Bearer ${idToken}`;
  }

  return config;
});

// ─── API Methods ───

/**
 * Generate structured document JSON directly for live preview and offline persistence.
 */
export async function generateDocumentJSON(
  request: Omit<GenerateRequest, 'format'>
): Promise<GenerateJsonResponse> {
  const response = await apiClient.post<GenerateJsonResponse>(
    '/api/generate',
    {
      ...request,
      format: 'json',
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

/**
 * Generate a document directly as a binary download Blob.
 */
export async function generateDocument(request: GenerateRequest): Promise<{
  blob: Blob;
  filename: string;
}> {
  const response = await apiClient.post('/api/generate', request, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] || '';
  const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
  const rawTitle = response.headers['x-document-title'];
  const decodedTitle = rawTitle ? decodeURIComponent(rawTitle) : null;

  const fallbackName = decodedTitle
    ? `${decodedTitle.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_')}.${request.format}`
    : `Draftly_Document.${request.format}`;

  const filename = filenameMatch?.[1] || fallbackName;

  return {
    blob: response.data,
    filename,
  };
}

/**
 * Instantly compile an already generated document JSON into DOCX or PDF without re-running Ollama.
 * Latency is typically <50ms.
 */
export async function compileDocument(request: CompileRequest): Promise<{
  blob: Blob;
  filename: string;
}> {
  const response = await apiClient.post('/api/generate/compile', request, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] || '';
  const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
  const rawTitle = response.headers['x-document-title'];
  const decodedTitle = rawTitle ? decodeURIComponent(rawTitle) : request.document.title;

  const safeTitle = (decodedTitle || 'Draftly_Document')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const filename = filenameMatch?.[1] || `${safeTitle || 'Draftly_Document'}.${request.format}`;

  return {
    blob: response.data,
    filename,
  };
}

/**
 * Check backend and AI engine health.
 */
export async function checkHealth(): Promise<AiEngineHealth> {
  const response = await apiClient.get<AiEngineHealth>('/api/health');
  return response.data;
}

/**
 * Trigger a file download in the browser from a Blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default apiClient;

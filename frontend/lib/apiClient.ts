import axios from 'axios';
import { getSession } from 'next-auth/react';
import type { GenerateRequest } from '@/types/document';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 0, // 0 means no timeout (wait forever)
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
 * Generate a document via the backend.
 * Returns a Blob for file download.
 */
export async function generateDocument(request: GenerateRequest): Promise<{
  blob: Blob;
  filename: string;
}> {
  const response = await apiClient.post('/api/generate', request, {
    responseType: 'blob',
  });

  // Extract filename from Content-Disposition header
  const disposition = response.headers['content-disposition'] || '';
  const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
  const filename = filenameMatch?.[1] || `Draftly_Document.${request.format}`;

  return {
    blob: response.data,
    filename,
  };
}

/**
 * Check backend health.
 */
export async function checkHealth(): Promise<{ status: string }> {
  const response = await apiClient.get('/api/health');
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

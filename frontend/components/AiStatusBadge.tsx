'use client';

import { useEffect, useState } from 'react';
import { checkHealth } from '@/lib/apiClient';
import type { AiEngineHealth } from '@/types/document';

export default function AiStatusBadge() {
  const [health, setHealth] = useState<AiEngineHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
        <span className="h-2 w-2 rounded-full bg-slate-300 animate-pulse" />
        Checking AI...
      </div>
    );
  }

  const isConnected = health?.aiEngine?.status === 'connected';
  const modelName = health?.aiEngine?.configuredModel || 'llama3.1';

  return (
    <div
      onClick={fetchHealth}
      className={`group cursor-pointer flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        isConnected
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60'
          : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/60'
      }`}
      title={isConnected ? `Ollama active with model: ${modelName}` : 'Local AI not responding. Click to retry.'}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
        }`}
      />
      <span>
        {isConnected ? `AI: ${modelName}` : 'Local AI Offline'}
      </span>
    </div>
  );
}

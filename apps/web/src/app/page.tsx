'use client';

import { useEffect, useState } from 'react';
import { HealthResponseData } from '@potionpulse/contracts';
import {
  Activity,
  Layers,
  Server,
  Smartphone,
  Sparkles,
  Database,
  RefreshCw,
} from 'lucide-react';

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      setHealth(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to backend';
      setError(msg);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <main className="min-h-screen bg-[#171321] text-[#F4F0FA] flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-25"
        style={{ background: 'radial-gradient(circle, #7046C8 0%, #241638 70%, transparent 100%)' }}
      />

      {/* Header */}
      <header className="flex justify-between items-center z-10 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-potionPurple to-violetGlow flex items-center justify-center shadow-lg shadow-potionPurple/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              PotionPulse
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-potionPurple/20 text-violetGlow border border-potionPurple/30">
                Phase 0 Bootstrap
              </span>
            </h1>
            <p className="text-xs text-mutedText">Predict. Manage. Thrive.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={checkHealth}
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Check API
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <section className="my-auto py-12 z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-potionPurple/15 border border-potionPurple/30 text-violetGlow text-xs font-medium mb-6">
          <Activity className="w-3.5 h-3.5" />
          Multi-Tenant Inventory Intelligence Platform
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Never run out of essential stock tomorrow.
        </h2>
        <p className="mt-4 text-base md:text-lg text-mutedText max-w-2xl">
          PotionPulse unifies stock ledgers, explainable time-series demand forecasting, stockout risk
          scoring, and event-aware intelligence across Web and Android.
        </p>

        {/* System Diagnostics Card */}
        <div className="mt-10 w-full bg-midnightPlum/80 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Server className="w-4 h-4 text-violetGlow" />
              Environment & Monorepo Diagnostics
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.status === 'healthy'
                    ? 'bg-successGreen animate-pulse'
                    : loading
                    ? 'bg-warningAmber'
                    : 'bg-dangerRed'
                }`}
              />
              <span className="font-mono text-mutedText">
                {loading
                  ? 'Connecting...'
                  : health
                  ? `Backend ${health.status.toUpperCase()}`
                  : 'Backend Disconnected (Port 4000)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-ink/70 border border-white/5">
              <div className="flex items-center gap-2 text-xs text-mutedText uppercase font-semibold">
                <Layers className="w-3.5 h-3.5 text-potionPurple" />
                Web Client
              </div>
              <div className="mt-2 text-sm font-semibold text-white">Next.js 14 App Router</div>
              <div className="text-xs text-successGreen mt-1 flex items-center gap-1">
                ● Port 3000 Active
              </div>
            </div>

            <div className="p-4 rounded-xl bg-ink/70 border border-white/5">
              <div className="flex items-center gap-2 text-xs text-mutedText uppercase font-semibold">
                <Database className="w-3.5 h-3.5 text-violetGlow" />
                API Service
              </div>
              <div className="mt-2 text-sm font-semibold text-white">NestJS Modular Monolith</div>
              <div className="text-xs mt-1">
                {health ? (
                  <span className="text-successGreen">● Up: {health.uptimeSeconds}s (v{health.version})</span>
                ) : (
                  <span className="text-mutedText">Run: npm run dev:api</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-ink/70 border border-white/5">
              <div className="flex items-center gap-2 text-xs text-mutedText uppercase font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-emberOrange" />
                Mobile Client
              </div>
              <div className="mt-2 text-sm font-semibold text-white">Expo React Native</div>
              <div className="text-xs text-mutedText mt-1">Run: npm run dev:android</div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-dangerRed/10 border border-dangerRed/30 text-dangerRed text-xs">
              Backend probe notice: {error}. Start the backend via <code className="bg-black/30 px-1 py-0.5 rounded">npm run dev:api</code> to establish live synchronization.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="z-10 border-t border-white/10 pt-4 flex flex-col md:flex-row justify-between items-center text-xs text-mutedText gap-2">
        <div>MSOT Track 01 — The Witch's Potion Pantry</div>
        <div className="flex items-center gap-4">
          <span className="hover:text-white transition-colors">Shared Contracts: @potionpulse/contracts</span>
          <span>•</span>
          <span className="hover:text-white transition-colors">Design Tokens: @potionpulse/ui-tokens</span>
        </div>
      </footer>
    </main>
  );
}


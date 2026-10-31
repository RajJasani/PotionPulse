'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Layers,
  ShoppingCart,
  AlertTriangle,
  Zap,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink text-paleLavender flex flex-col justify-between selection:bg-potionPurple selection:text-white">
      {/* Mystical Atmospheric Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[160px] opacity-25 bg-gradient-to-br from-potionPurple via-midnight to-pumpkin" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[400px] rounded-full blur-[140px] opacity-15 bg-pumpkin" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-potionPurple/15 backdrop-blur-md bg-ink/70 sticky top-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-potionPurple to-pumpkin flex items-center justify-center text-white shadow-lg shadow-potionPurple/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block">
                PotionPulse
              </span>
              <span className="text-[10px] tracking-widest uppercase text-pumpkin font-mono block">
                Predict. Manage. Thrive.
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-paleLavender/70">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#intelligence" className="hover:text-white transition-colors">
              Forecasting
            </a>
            <a href="#pos" className="hover:text-white transition-colors">
              Point of Sale
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-potionPurple hover:bg-potionPurple/90 text-white text-xs flex items-center gap-1.5 shadow-md shadow-potionPurple/25">
                <span>Enter Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-midnight/90 border border-potionPurple/30 text-xs font-medium text-pumpkin animate-pulse">
          <Flame className="w-3.5 h-3.5 fill-pumpkin" />
          <span>The Midnight Curse is Active &bull; 3.0x Demand Surge Applied</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Next-Generation Inventory Intelligence for{' '}
          <span className="bg-gradient-to-r from-potionPurple via-amethyst to-pumpkin bg-clip-text text-transparent">
            Apothecaries & Magical SaaS
          </span>
        </h1>

        <p className="text-base sm:text-lg text-paleLavender/70 max-w-2xl">
          Say goodbye to stockouts and cauldron spoilage. PotionPulse combines immutable double-entry ledger mechanics, probabilistic demand curves, and automated restock triggers into an enterprise-grade platform.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <Link href="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-potionPurple to-amethyst hover:opacity-95 text-white font-bold px-8 py-3.5 text-sm shadow-xl shadow-potionPurple/30 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Launch Live Dashboard
            </Button>
          </Link>
          <Link href="/sales/new">
            <Button size="lg" variant="outline" className="border-pumpkin/40 text-pumpkin hover:bg-pumpkin/10 px-8 py-3.5 text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Open POS Register
            </Button>
          </Link>
        </div>

        {/* Live Dashboard Preview Card */}
        <div className="w-full pt-12">
          <Card className="p-6 bg-midnight/70 border-2 border-potionPurple/30 shadow-2xl rounded-2xl text-left space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-potionPurple/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cauldronGreen animate-ping" />
                <span className="text-xs uppercase font-mono tracking-widest text-paleLavender/70">
                  PotionPulse Live Core v1.0.0 &bull; Connected to NestJS Realtime Gateway
                </span>
              </div>
              <div className="flex gap-2">
                <Link href="/inventory">
                  <Badge variant="outline" className="hover:bg-potionPurple/20 cursor-pointer">
                    View Catalog
                  </Badge>
                </Link>
                <Link href="/forecasting">
                  <Badge variant="warning" className="cursor-pointer">
                    Forecast Models
                  </Badge>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-ink/70 border border-potionPurple/15">
                <span className="text-[11px] uppercase tracking-wider text-paleLavender/50 block">
                  Catalogued Ingredients
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">18 Active</span>
                <span className="text-[11px] text-cauldronGreen font-mono">100% Ledger Audited</span>
              </div>

              <div className="p-4 rounded-xl bg-ink/70 border border-potionPurple/15">
                <span className="text-[11px] uppercase tracking-wider text-paleLavender/50 block">
                  Stockout Risk Alerts
                </span>
                <span className="text-2xl font-bold text-crimson mt-1 block">3 Critical</span>
                <span className="text-[11px] text-pumpkin font-mono">&le; 48h cover</span>
              </div>

              <div className="p-4 rounded-xl bg-ink/70 border border-potionPurple/15">
                <span className="text-[11px] uppercase tracking-wider text-paleLavender/50 block">
                  Seasonal Surge Multiplier
                </span>
                <span className="text-2xl font-bold text-pumpkin mt-1 block">3.0x Apex</span>
                <span className="text-[11px] text-paleLavender/60 font-mono">Midnight Curse</span>
              </div>

              <div className="p-4 rounded-xl bg-ink/70 border border-potionPurple/15">
                <span className="text-[11px] uppercase tracking-wider text-paleLavender/50 block">
                  Ledger Transactions
                </span>
                <span className="text-2xl font-bold text-cauldronGreen mt-1 block">Zero Discrepancy</span>
                <span className="text-[11px] text-cauldronGreen font-mono">ACID Enforced</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Grid Section */}
        <section id="features" className="w-full pt-16 space-y-8 text-left">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Engineered for Precision, Speed and Scale
            </h2>
            <p className="text-xs sm:text-sm text-paleLavender/60 max-w-xl mx-auto">
              Every workflow conforms strictly to enterprise SaaS standards with full tenant isolation and zero fake metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3 bg-midnight/50 border border-potionPurple/20 hover:border-potionPurple/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-potionPurple/20 border border-potionPurple/30 flex items-center justify-center text-potionPurple">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Immutable Inventory Ledger</h3>
              <p className="text-xs text-paleLavender/70 leading-relaxed">
                Stock balances are never overwritten in place. Every receipt, sale, and adjustment is recorded as an immutable ledger movement with idempotency keys.
              </p>
              <Link href="/inventory/movements" className="text-xs text-potionPurple hover:underline flex items-center gap-1 font-semibold pt-2">
                <span>Inspect Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Card>

            <Card className="p-6 space-y-3 bg-midnight/50 border border-pumpkin/20 hover:border-pumpkin/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-pumpkin/20 border border-pumpkin/30 flex items-center justify-center text-pumpkin">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Probabilistic Demand Curves</h3>
              <p className="text-xs text-paleLavender/70 leading-relaxed">
                7-day, 14-day, and 30-day horizons with dynamic seasonal surge multipliers for high-velocity ingredients like Bat Wings and Mandrake Root.
              </p>
              <Link href="/forecasting" className="text-xs text-pumpkin hover:underline flex items-center gap-1 font-semibold pt-2">
                <span>View Forecasts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Card>

            <Card className="p-6 space-y-3 bg-midnight/50 border border-cauldronGreen/20 hover:border-cauldronGreen/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-cauldronGreen/20 border border-cauldronGreen/30 flex items-center justify-center text-cauldronGreen">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Point of Sale & Atomicity</h3>
              <p className="text-xs text-paleLavender/70 leading-relaxed">
                Front-line cashier terminal with live stock level checks, quantity steppers, negative balance prevention, and instant customer receipt generation.
              </p>
              <Link href="/sales" className="text-xs text-cauldronGreen hover:underline flex items-center gap-1 font-semibold pt-2">
                <span>Manage Transactions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Card>

            <Card className="p-6 space-y-3 bg-midnight/50 border border-potionPurple/20 hover:border-potionPurple/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-potionPurple/20 border border-potionPurple/30 flex items-center justify-center text-potionPurple">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Stockout Risk & Reorders</h3>
              <p className="text-xs text-paleLavender/70 leading-relaxed">
                Deterministic calculation: (Lead Time Demand + Safety Stock + Horizon Coverage) - (On Hand + Incoming), rounded to vendor pack sizes.
              </p>
              <Link href="/restock" className="text-xs text-potionPurple hover:underline flex items-center gap-1 font-semibold pt-2">
                <span>Run Reorder Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Card>

            <Card className="p-6 space-y-3 bg-midnight/50 border border-crimson/20 hover:border-crimson/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-crimson/20 border border-crimson/30 flex items-center justify-center text-crimson">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Anomaly Detection Guard</h3>
              <p className="text-xs text-paleLavender/70 leading-relaxed">
                Flags unexplained shrinkage, consumption spikes (&gt;3.5&sigma;), and blocked negative balance attempts with full resolution workflows.
              </p>
              <Link href="/anomalies" className="text-xs text-crimson hover:underline flex items-center gap-1 font-semibold pt-2">
                <span>Open Anomaly Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Card>

            <Card className="p-6 space-y-3 bg-midnight/50 border border-amethyst/20 hover:border-amethyst/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-amethyst/20 border border-amethyst/30 flex items-center justify-center text-amethyst">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Multi-Tenant RBAC</h3>
              <p className="text-xs text-paleLavender/70 leading-relaxed">
                Strict multi-tenant security guarantees. Shop owners, managers, staff, and analysts only access their isolated workspace resources.
              </p>
              <Link href="/team" className="text-xs text-amethyst hover:underline flex items-center gap-1 font-semibold pt-2">
                <span>Manage Team & Roles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Card>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="w-full pt-12 pb-6 space-y-6 text-left">
          <Card className="p-6 bg-midnight/40 border border-potionPurple/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-potionPurple font-mono font-bold">
                Monorepo Tech Stack
              </span>
              <h3 className="text-xl font-bold text-white">Built for High Concurrency & Portability</h3>
              <p className="text-xs text-paleLavender/60 max-w-xl">
                Next.js 14 Web + Expo Android + NestJS Monolithic Core + MongoDB Atlas + WebSocket Realtime Gateway.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <span className="px-3 py-1.5 rounded-lg bg-ink border border-potionPurple/20 text-xs font-mono">
                TypeScript Strict
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-ink border border-potionPurple/20 text-xs font-mono">
                MongoDB Sharded
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-ink border border-potionPurple/20 text-xs font-mono">
                Socket.io Realtime
              </span>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-potionPurple/15 bg-midnight/80 px-6 py-6 text-xs text-paleLavender/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">PotionPulse</span> &mdash; Predictive Inventory Intelligence for Modern Alchemists.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/inventory" className="hover:text-white transition-colors">
              Inventory
            </Link>
            <Link href="/sales" className="hover:text-white transition-colors">
              Sales
            </Link>
            <Link href="/settings" className="hover:text-white transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

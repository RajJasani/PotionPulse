'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Anomaly {
  id: string;
  title: string;
  ingredientName: string;
  type: 'CONSUMPTION_SPIKE' | 'SHRINKAGE' | 'NEGATIVE_PREVENTION' | 'OFF_HOURS_MOVEMENT';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  detectedAt: string;
  expectedValue: string;
  observedValue: string;
  deviation: string;
  description: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: 'anom-001',
      title: 'Sudden Consumption Surge Detected',
      ingredientName: 'Bat Wings',
      type: 'CONSUMPTION_SPIKE',
      severity: 'CRITICAL',
      status: 'OPEN',
      detectedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      expectedValue: '12 units / day',
      observedValue: '68 units / 4 hours',
      deviation: '+466% (3.8σ spike)',
      description:
        'Consumption rate exceeded 3.5 standard deviations above 30-day baseline without corresponding purchase orders recorded.',
    },
    {
      id: 'anom-002',
      title: 'Unexplained Stock Shrinkage',
      ingredientName: 'Phoenix Feather',
      type: 'SHRINKAGE',
      severity: 'WARNING',
      status: 'OPEN',
      detectedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
      expectedValue: '25 units (ledger)',
      observedValue: '18 units (shelf audit)',
      deviation: '-28% discrepancy',
      description:
        'Physical count on Vault Shelf A-1 was lower than ledger balance by 7 units. Possible unaccounted spill or shrinkage.',
    },
    {
      id: 'anom-003',
      title: 'Negative Balance Attempt Blocked',
      ingredientName: 'Ghost Pepper Essence',
      type: 'NEGATIVE_PREVENTION',
      severity: 'CRITICAL',
      status: 'ACKNOWLEDGED',
      detectedAt: new Date(Date.now() - 3600000 * 28).toISOString(),
      expectedValue: '>= 0 balance constraint',
      observedValue: 'Deduction of 15 from 4 on-hand',
      deviation: 'Enforced Atomically',
      description:
        'An API sale request attempted to dispense 15 units when only 4 remained. The transaction was rejected safely by ACID transaction safeguards.',
    },
    {
      id: 'anom-004',
      title: 'Off-Hours Manual Stock Adjustment',
      ingredientName: 'Mandrake Root',
      type: 'OFF_HOURS_MOVEMENT',
      severity: 'INFO',
      status: 'RESOLVED',
      detectedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      expectedValue: 'Business hours (08:00 - 20:00)',
      observedValue: 'Adjustment at 03:14 AM',
      deviation: 'Temporal anomaly',
      description: 'Stock increase adjustment entered during closed hours. Verified as emergency shipment receipt.',
      resolvedBy: 'Archmage Theron (Owner)',
      resolutionNote: 'Emergency delivery received from Northern Foragers Guild.',
    },
  ]);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');

  const handleAcknowledge = (id: string) => {
    setAnomalies(
      anomalies.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)),
    );
  };

  const handleResolve = (id: string) => {
    if (!resolutionInput.trim()) return;
    setAnomalies(
      anomalies.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'RESOLVED',
              resolvedBy: 'Active User',
              resolutionNote: resolutionInput.trim(),
            }
          : a,
      ),
    );
    setSelectedAnomaly(null);
    setResolutionInput('');
  };

  const filtered = anomalies.filter((a) => (statusFilter === 'ALL' ? true : a.status === statusFilter));

  const openCount = anomalies.filter((a) => a.status === 'OPEN').length;
  const criticalCount = anomalies.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <AlertOctagon className="w-7 h-7 text-crimson" />
              Anomaly Monitoring & Integrity Guard
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Statistical detection engine flagging sudden consumption spikes, shrinkage, and ledger divergences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Re-scan Ledger
            </Button>
          </div>
        </div>

        {/* Status Ribbons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-crimson/20 border border-crimson/30 flex items-center justify-center text-crimson">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Active Critical Alerts</p>
              <p className="text-2xl font-bold text-crimson">{criticalCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pumpkin/20 border border-pumpkin/30 flex items-center justify-center text-pumpkin">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Unresolved Open Anomalies</p>
              <p className="text-2xl font-bold text-white">{openCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cauldronGreen/20 border border-cauldronGreen/30 flex items-center justify-center text-cauldronGreen">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Ledger Protection Status</p>
              <p className="text-2xl font-bold text-cauldronGreen">Enforcing</p>
            </div>
          </Card>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {(['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === filter
                  ? 'bg-potionPurple text-white shadow-sm'
                  : 'bg-midnight/60 text-paleLavender/70 hover:bg-midnight hover:text-white border border-potionPurple/15'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Anomaly Cards List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card className="p-12 text-center text-paleLavender/50">
              No anomalies found in this category. All ledger checks passing normal thresholds.
            </Card>
          ) : (
            filtered.map((item) => (
              <Card
                key={item.id}
                className={`p-5 transition-all border ${
                  item.severity === 'CRITICAL'
                    ? 'border-crimson/40 bg-crimson/5'
                    : item.severity === 'WARNING'
                    ? 'border-pumpkin/40 bg-pumpkin/5'
                    : 'border-potionPurple/20 bg-midnight/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-white">{item.title}</h3>
                      <Badge variant="outline" className="text-xs font-mono">
                        {item.ingredientName}
                      </Badge>
                      {item.severity === 'CRITICAL' && <Badge variant="danger">Critical</Badge>}
                      {item.severity === 'WARNING' && <Badge variant="warning">Warning</Badge>}
                      {item.severity === 'INFO' && <Badge variant="outline">Info</Badge>}
                      <Badge
                        variant={
                          item.status === 'OPEN'
                            ? 'danger'
                            : item.status === 'ACKNOWLEDGED'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-paleLavender/80">{item.description}</p>

                    {/* Evidence Comparison Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-midnight/70 border border-potionPurple/15">
                        <span className="text-paleLavender/50 block text-[10px] uppercase">
                          Expected Value
                        </span>
                        <span className="font-mono text-white font-medium">{item.expectedValue}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-midnight/70 border border-potionPurple/15">
                        <span className="text-paleLavender/50 block text-[10px] uppercase">
                          Observed Value
                        </span>
                        <span className="font-mono text-pumpkin font-semibold">
                          {item.observedValue}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-midnight/70 border border-potionPurple/15">
                        <span className="text-paleLavender/50 block text-[10px] uppercase">
                          Deviation / Significance
                        </span>
                        <span className="font-mono text-crimson font-bold">{item.deviation}</span>
                      </div>
                    </div>

                    {item.resolutionNote && (
                      <div className="p-2.5 rounded-lg bg-cauldronGreen/10 border border-cauldronGreen/20 text-xs">
                        <span className="font-semibold text-cauldronGreen block">
                          Resolved by {item.resolvedBy}:
                        </span>
                        <span className="text-paleLavender/80">{item.resolutionNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex flex-col items-end justify-between shrink-0 space-y-3">
                    <span className="text-[11px] text-paleLavender/50 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(item.detectedAt)}
                    </span>

                    <div className="flex items-center gap-2">
                      {item.status === 'OPEN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledge(item.id)}
                          className="h-8 px-2.5 text-xs border-potionPurple/40"
                        >
                          Acknowledge
                        </Button>
                      )}
                      {item.status !== 'RESOLVED' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAnomaly(item);
                            setResolutionInput('');
                          }}
                          className="h-8 px-2.5 text-xs bg-cauldronGreen hover:bg-cauldronGreen/90 text-black font-semibold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Resolution Modal */}
        {selectedAnomaly && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 bg-ink border border-cauldronGreen/40 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cauldronGreen" />
                  Resolve Anomaly
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAnomaly(null)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div>
                <p className="text-xs text-paleLavender/70 mb-2">
                  Resolving <strong className="text-white">{selectedAnomaly.title}</strong> for{' '}
                  <span className="text-pumpkin">{selectedAnomaly.ingredientName}</span>.
                </p>
                <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                  Resolution / Investigation Note
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this occurred (e.g. verified recipe batch, vendor correction)..."
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  className="w-full p-2.5 bg-midnight/70 border border-potionPurple/25 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-cauldronGreen"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedAnomaly(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!resolutionInput.trim()}
                  onClick={() => handleResolve(selectedAnomaly.id)}
                  className="bg-cauldronGreen hover:bg-cauldronGreen/90 text-black font-semibold"
                >
                  Mark as Resolved
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

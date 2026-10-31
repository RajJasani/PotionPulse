'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import {
  ShieldAlert,
  Search,
  Eye,
  Lock,
} from 'lucide-react';

interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'BLOCKED';
  ipAddress: string;
  timestamp: string;
  details: Record<string, any>;
}

export default function AuditPage() {
  const [records] = useState<AuditRecord[]>([
    {
      id: 'aud-001',
      actor: 'Archmage Theron (Owner)',
      action: 'STOCK_ADJUSTMENT_POSTED',
      resource: 'Ingredient #BatWings',
      status: 'SUCCESS',
      ipAddress: '192.168.1.104',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      details: {
        movementType: 'MANUAL_ADJUSTMENT',
        quantityDelta: +20,
        reason: 'Physical cycle count adjustment',
      },
    },
    {
      id: 'aud-002',
      actor: 'Apprentice Lyra (Staff)',
      action: 'SALE_COMPLETED',
      resource: 'Sale #SALE-2026-004',
      status: 'SUCCESS',
      ipAddress: '192.168.1.112',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      details: {
        totalAmount: 185.5,
        itemsCount: 3,
        paymentMethod: 'CRYSTAL_CREDIT',
      },
    },
    {
      id: 'aud-003',
      actor: 'Unknown Client',
      action: 'NEGATIVE_BALANCE_ATTEMPT',
      resource: 'Ingredient #GhostPepper',
      status: 'BLOCKED',
      ipAddress: '10.0.4.88',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      details: {
        requestedQty: 15,
        onHandAvailable: 4,
        enforcement: 'ACID_TRANSACTION_ABORTED',
      },
    },
    {
      id: 'aud-004',
      actor: 'Archmage Theron (Owner)',
      action: 'TENANT_MEMBERSHIP_INVITE',
      resource: 'User #ScholarVane',
      status: 'SUCCESS',
      ipAddress: '192.168.1.104',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      details: {
        roleAssigned: 'ANALYST',
        permissions: ['READ_ONLY'],
      },
    },
  ]);

  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = records.filter(
    (r) =>
      r.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.resource.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-potionPurple" />
              Security Audit History & Immutable Trail
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Append-only audit trail logging administrative changes, access events, and constraint enforcements.
            </p>
          </div>

          <Badge variant="outline" className="border-cauldronGreen/40 text-cauldronGreen flex items-center gap-1.5 py-1 px-3">
            <Lock className="w-3.5 h-3.5" />
            Append-Only Integrity Enforced
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-paleLavender/40" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-midnight/60 border border-potionPurple/20 rounded-lg text-sm text-paleLavender placeholder:text-paleLavender/30 focus:outline-none focus:border-potionPurple"
          />
        </div>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-paleLavender">
              <thead className="bg-midnight/70 text-xs uppercase tracking-wider text-paleLavender/60 border-b border-potionPurple/15">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-potionPurple/10">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-potionPurple/5 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-paleLavender/70">
                      {formatDateTime(r.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{r.actor}</td>
                    <td className="py-3 px-4 font-mono text-xs text-pumpkin">{r.action}</td>
                    <td className="py-3 px-4 text-xs text-paleLavender/80">{r.resource}</td>
                    <td className="py-3 px-4">
                      {r.status === 'SUCCESS' ? (
                        <Badge variant="success" className="text-[10px]">
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="text-[10px]">
                          Blocked
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-paleLavender/50">{r.ipAddress}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecord(r)}
                        className="h-7 px-2 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal Payload Inspector */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 bg-ink border border-potionPurple/40 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-potionPurple" />
                  Audit Event Payload
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-midnight/40 rounded-lg border border-potionPurple/15 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-paleLavender/50 block">Action:</span>
                    <span className="font-mono text-pumpkin font-semibold">{selectedRecord.action}</span>
                  </div>
                  <div>
                    <span className="text-paleLavender/50 block">Actor:</span>
                    <span className="text-white font-medium">{selectedRecord.actor}</span>
                  </div>
                </div>

                <div>
                  <span className="text-paleLavender/60 uppercase font-semibold text-[10px] block mb-1">
                    Structured Diff / Context Payload
                  </span>
                  <pre className="p-3 bg-midnight/80 rounded-lg border border-potionPurple/20 font-mono text-[11px] text-paleLavender overflow-x-auto">
                    {JSON.stringify(selectedRecord.details, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

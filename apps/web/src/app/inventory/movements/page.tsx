'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeftRight, ArrowLeft, RefreshCw, Filter, PlusCircle } from 'lucide-react';

export default function StockMovementsPage() {
  const { activeTenant, accessToken } = useAuth();
  const [movements, setMovements] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchMovements = async () => {
    if (!activeTenant?.id || !accessToken) return;
    setLoading(true);
    try {
      const res = await apiClient<any[]>('/inventory/movements', {
        token: accessToken,
        tenantId: activeTenant.id,
        params: {
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          page,
          limit: 15,
        },
      });

      setMovements(res.data || []);
      if (res.meta?.totalPages) {
        setTotalPages(res.meta.totalPages);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [activeTenant?.id, accessToken, typeFilter, page]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/inventory">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Inventory
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <ArrowLeftRight className="w-6 h-6 text-violetGlow" />
                Immutable Stock Ledger
              </h1>
              <p className="text-xs text-mutedText mt-0.5">
                Auditable transactional log of all receipts, sales deductions, and adjustments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/inventory/adjust">
              <Button size="sm" variant="primary" className="text-xs flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                Post Movement
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMovements}
              className="text-xs text-mutedText"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="p-3">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[10px] font-bold uppercase text-mutedText flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              Movement Type:
            </span>
            {['ALL', 'RECEIPT', 'SALE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURN', 'WASTAGE'].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => {
                    setTypeFilter(type);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                    typeFilter === type
                      ? 'bg-potionPurple text-white font-semibold'
                      : 'bg-white/5 text-mutedText hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
        </Card>

        {/* Movements Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-mutedText uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Delta</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                  <th className="py-3 px-4">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-mutedText">
                      {loading ? 'Loading ledger records...' : 'No ledger movements found.'}
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-mutedText font-mono whitespace-nowrap">
                        {formatDateTime(m.occurredAt)}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        <Link href={`/inventory/${m.ingredientId}`} className="hover:text-violetGlow">
                          {m.ingredientName}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-mutedText font-mono">
                        {m.locationCode || 'Shelf'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            m.type === 'RECEIPT'
                              ? 'success'
                              : m.type === 'SALE'
                              ? 'purple'
                              : m.type === 'RETURN'
                              ? 'orange'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {m.type}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 px-4 font-mono font-bold ${
                          m.quantityDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">
                        {m.balanceAfter} {m.unit}
                      </td>
                      <td className="py-3 px-4 text-mutedText max-w-xs truncate" title={m.reason}>
                        {m.reason}
                      </td>
                      <td className="py-3 px-4 text-mutedText">
                        {m.actor?.displayName || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-mutedText">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 text-xs"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

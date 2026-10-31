'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useSocket } from '@/lib/socket-context';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  Flame,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { activeTenant, accessToken } = useAuth();
  const { lastEvent } = useSocket();

  const [metrics, setMetrics] = useState<{
    totalIngredients: number;
    lowStockItems: number;
    past30DaysOrders: number;
    past30DaysRevenue: number;
  }>({
    totalIngredients: 0,
    lowStockItems: 0,
    past30DaysOrders: 0,
    past30DaysRevenue: 0,
  });

  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!activeTenant?.id || !accessToken) return;
    setLoading(true);
    try {
      const [overviewRes, movementsRes] = await Promise.all([
        apiClient<any>('/analytics/overview', {
          token: accessToken,
          tenantId: activeTenant.id,
        }),
        apiClient<any>('/inventory/movements', {
          token: accessToken,
          tenantId: activeTenant.id,
          params: { limit: 6 },
        }),
      ]);

      if (overviewRes.data) {
        setMetrics(overviewRes.data);
      }
      if (movementsRes.data) {
        setRecentMovements(movementsRes.data);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTenant?.id, accessToken]);

  // Real-time refresh when a socket event arrives
  useEffect(() => {
    if (lastEvent) {
      fetchDashboardData();
    }
  }, [lastEvent]);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Inventory Intelligence Overview
            </h1>
            <p className="text-xs text-mutedText mt-1">
              Active ledger diagnostics, demand forecasting, and operational status for{' '}
              <span className="text-white font-semibold">{activeTenant?.name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDashboardData}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Link href="/sales/new">
              <Button size="sm" variant="primary" className="text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Record Sale
              </Button>
            </Link>
          </div>
        </div>

        {/* Midnight Curse Operational Banner */}
        <div className="rounded-2xl border border-emberOrange/30 bg-gradient-to-r from-emberOrange/15 via-[#241638] to-[#171321] p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emberOrange/20 border border-emberOrange/40 flex items-center justify-center text-emberOrange shrink-0">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Midnight Curse Event Intelligence</h3>
                  <Badge variant="orange">3x Demand Multiplier</Badge>
                </div>
                <p className="text-xs text-mutedText mt-1 max-w-2xl">
                  Official full-moon surge scenario active: Bat Wings, Mandrake Root, and Ghost Pepper
                  demand is multiplied by 3.0 during event horizon dates.
                </p>
              </div>
            </div>

            <Link href="/events">
              <Button variant="outline" size="sm" className="text-xs text-emberOrange border-emberOrange/40 hover:bg-emberOrange/10 shrink-0">
                Inspect Event Impact
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                Total Ingredients
              </span>
              <div className="w-8 h-8 rounded-lg bg-potionPurple/20 text-violetGlow flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">{metrics.totalIngredients}</div>
              <p className="text-[11px] text-mutedText mt-1">Catalog items tracked</p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                Low Stock Risk
              </span>
              <div className="w-8 h-8 rounded-lg bg-dangerRed/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-rose-400">{metrics.lowStockItems}</div>
              <p className="text-[11px] text-mutedText mt-1">Below reorder threshold</p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                30-Day Orders
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">{metrics.past30DaysOrders}</div>
              <p className="text-[11px] text-mutedText mt-1">Sales fulfilled</p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                30-Day Volume
              </span>
              <div className="w-8 h-8 rounded-lg bg-emberOrange/20 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">
                {formatCurrency(metrics.past30DaysRevenue)}
              </div>
              <p className="text-[11px] text-mutedText mt-1">Ledger gross revenue</p>
            </div>
          </Card>
        </div>

        {/* Quick Hub Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/forecasting" className="block group">
            <Card className="h-full p-5 hover:border-potionPurple/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-potionPurple/20 text-violetGlow flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Demand Forecasting</h4>
              </div>
              <p className="text-xs text-mutedText leading-relaxed">
                Statistical time-series predictions, stockout crossing dates, and risk levels.
              </p>
            </Card>
          </Link>

          <Link href="/restock" className="block group">
            <Card className="h-full p-5 hover:border-potionPurple/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emberOrange/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Restock Engine</h4>
              </div>
              <p className="text-xs text-mutedText leading-relaxed">
                Recommended reorder quantities based on lead time, safety stock, and coverage.
              </p>
            </Card>
          </Link>

          <Link href="/anomalies" className="block group">
            <Card className="h-full p-5 hover:border-potionPurple/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-dangerRed/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Anomaly Center</h4>
              </div>
              <p className="text-xs text-mutedText leading-relaxed">
                Consumption spikes and ledger discrepancy flags with evidence breakdown.
              </p>
            </Card>
          </Link>
        </div>

        {/* Recent Stock Movements Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-violetGlow" />
                Recent Stock Ledger Movements
              </CardTitle>
              <CardDescription>
                Immutable chronological ledger of recent inventory transactions
              </CardDescription>
            </div>

            <Link href="/inventory/movements">
              <Button variant="ghost" size="sm" className="text-xs">
                View Full Ledger
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentMovements.length === 0 ? (
              <div className="text-center py-10 text-mutedText text-xs">
                No stock movements posted yet. Use{' '}
                <Link href="/inventory/adjust" className="text-violetGlow font-semibold underline">
                  Receive / Adjust
                </Link>{' '}
                to intake initial stock.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-mutedText uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ingredient</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Delta</th>
                      <th className="py-2.5 px-3">Balance After</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentMovements.map((m: any) => (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 text-mutedText font-mono">
                          {formatDateTime(m.occurredAt)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">
                          {m.ingredientName || 'Ingredient'}
                        </td>
                        <td className="py-3 px-3">
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
                          >
                            {m.type}
                          </Badge>
                        </td>
                        <td
                          className={`py-3 px-3 font-bold font-mono ${
                            m.quantityDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                        </td>
                        <td className="py-3 px-3 font-mono text-white">
                          {m.balanceAfter} {m.unit}
                        </td>
                        <td className="py-3 px-3 text-mutedText max-w-[200px] truncate">
                          {m.reason}
                        </td>
                        <td className="py-3 px-3 text-mutedText">
                          {m.actor?.displayName || 'System'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

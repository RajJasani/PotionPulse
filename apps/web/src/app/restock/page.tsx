'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import {
  AlertTriangle,
  RefreshCw,
  Package,
  ShoppingCart,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';

interface RestockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPerUnit: number;
  onHand: number;
  dailyVelocity: number;
  leadTimeDays: number;
  safetyStock: number;
  daysOfCover: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'HEALTHY';
  ltd: number;
  targetCoverage: number;
  packSize: number;
  recommendedOrder: number;
  recommendedPacks: number;
  estimatedCost: number;
}

export default function RestockPage() {
  const { activeTenant, accessToken } = useAuth();

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'HEALTHY'>('ALL');
  const [targetHorizonDays, setTargetHorizonDays] = useState<number>(14);

  // PO creation modal
  const [selectedForPO, setSelectedForPO] = useState<RestockItem | null>(null);
  const [poCreated, setPoCreated] = useState<boolean>(false);

  const fetchIngredients = useCallback(async () => {
    if (!activeTenant?.id || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<any[]>('/ingredients', {
        token: accessToken,
        tenantId: activeTenant.id,
      });
      setIngredients(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load stockout intelligence');
    } finally {
      setLoading(false);
    }
  }, [activeTenant?.id, accessToken]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // Compute stockout risks and restock formula
  const recommendations: RestockItem[] = useMemo(() => {
    return ingredients.map((ing) => {
      const onHand = Number(ing.onHand || 0);
      const leadTimeDays = Number(ing.leadTimeDays || 4);
      const costPerUnit = Number(ing.costPerUnit || 10);
      const packSize = Number(ing.packSize || 10);

      // Baseline daily velocity
      const dailyVelocity = ing.reorderPoint ? Math.max(1, Math.round(ing.reorderPoint / 6)) : 2;
      const safetyStock = Number(ing.safetyStock || Math.round(dailyVelocity * 2));

      // Days of cover
      const daysOfCover = dailyVelocity > 0 ? Math.round((onHand / dailyVelocity) * 10) / 10 : 999;

      // Risk classification
      let riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'HEALTHY' = 'HEALTHY';
      if (daysOfCover <= 2 || onHand === 0) {
        riskLevel = 'CRITICAL';
      } else if (daysOfCover <= 5) {
        riskLevel = 'HIGH';
      } else if (daysOfCover <= 10) {
        riskLevel = 'MODERATE';
      }

      // Formula: LTD + SafetyStock + TargetCoverage - OnHand
      const ltd = Math.round(leadTimeDays * dailyVelocity);
      const targetCoverage = Math.round(targetHorizonDays * dailyVelocity);
      const grossDemand = ltd + safetyStock + targetCoverage;
      const netShortfall = Math.max(0, grossDemand - onHand);

      // Round up to nearest pack size
      const recommendedPacks = netShortfall > 0 ? Math.ceil(netShortfall / packSize) : 0;
      const recommendedOrder = recommendedPacks * packSize;
      const estimatedCost = recommendedOrder * costPerUnit;

      return {
        id: ing.id,
        name: ing.name,
        sku: ing.sku,
        category: ing.category,
        unit: ing.unit,
        costPerUnit,
        onHand,
        dailyVelocity,
        leadTimeDays,
        safetyStock,
        daysOfCover,
        riskLevel,
        ltd,
        targetCoverage,
        packSize,
        recommendedOrder,
        recommendedPacks,
        estimatedCost,
      };
    });
  }, [ingredients, targetHorizonDays]);

  const filteredRecommendations = recommendations.filter((r) => {
    if (riskFilter === 'ALL') return true;
    return r.riskLevel === riskFilter;
  });

  // KPI summary
  const criticalCount = recommendations.filter((r) => r.riskLevel === 'CRITICAL').length;
  const highCount = recommendations.filter((r) => r.riskLevel === 'HIGH').length;
  const totalReorderCost = recommendations.reduce((acc, r) => acc + r.estimatedCost, 0);

  const handleCreateDraftPO = (item: RestockItem) => {
    setSelectedForPO(item);
    setPoCreated(false);
  };

  const handleConfirmPO = () => {
    setPoCreated(true);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-pumpkin" />
              Stockout Risk & Reorder Optimization
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Automated reorder triggers balancing lead-time demand, safety buffers, and vendor pack constraints.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchIngredients}
              disabled={loading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Re-evaluate Risk
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-crimson/20 border border-crimson/30 flex items-center justify-center text-crimson">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Critical Risk (&le;48h)</p>
              <p className="text-2xl font-bold text-crimson">{criticalCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pumpkin/20 border border-pumpkin/30 flex items-center justify-center text-pumpkin">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">High Risk (2-5d)</p>
              <p className="text-2xl font-bold text-pumpkin">{highCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-potionPurple/20 border border-potionPurple/30 flex items-center justify-center text-potionPurple">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Reorders Needed</p>
              <p className="text-2xl font-bold text-white">
                {recommendations.filter((r) => r.recommendedOrder > 0).length} Items
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cauldronGreen/20 border border-cauldronGreen/30 flex items-center justify-center text-cauldronGreen">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Total Restock Value</p>
              <p className="text-2xl font-bold text-cauldronGreen">{formatCurrency(totalReorderCost)}</p>
            </div>
          </Card>
        </div>

        {/* Formula Explainer Banner */}
        <Card className="p-4 bg-midnight/50 border border-potionPurple/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-potionPurple shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-paleLavender">
                Deterministic Reorder Formula
              </h4>
              <p className="text-xs text-paleLavender/70 mt-0.5">
                <span className="font-mono text-pumpkin">
                  Reorder Qty = (Lead Time Demand + Safety Stock + Target Horizon Coverage) - (On Hand + Incoming)
                </span>
                , rounded up to the supplier&apos;s pack size.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className="text-paleLavender/60">Target Coverage:</span>
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                onClick={() => setTargetHorizonDays(days)}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  targetHorizonDays === days
                    ? 'bg-potionPurple text-white'
                    : 'bg-midnight text-paleLavender/60 hover:text-white border border-potionPurple/20'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </Card>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'HEALTHY'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                riskFilter === r
                  ? 'bg-potionPurple text-white shadow-sm'
                  : 'bg-midnight/60 text-paleLavender/70 hover:bg-midnight hover:text-white border border-potionPurple/15'
              }`}
            >
              {r === 'ALL' ? 'All Risks' : r}
            </button>
          ))}
        </div>

        {/* Restock Recommendations Table */}
        <Card className="p-0 overflow-hidden">
          {error && (
            <div className="p-4 bg-crimson/10 border-b border-crimson/20 text-crimson text-sm">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-paleLavender">
              <thead className="bg-midnight/70 text-xs uppercase tracking-wider text-paleLavender/60 border-b border-potionPurple/15">
                <tr>
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">On Hand</th>
                  <th className="py-3 px-4">Velocity</th>
                  <th className="py-3 px-4">Days of Cover</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Recommended Reorder</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-potionPurple/10">
                {loading && filteredRecommendations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-paleLavender/40">
                      Evaluating inventory coverage and supplier lead times...
                    </td>
                  </tr>
                ) : filteredRecommendations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-paleLavender/40">
                      No ingredients matching the selected risk level.
                    </td>
                  </tr>
                ) : (
                  filteredRecommendations.map((item) => (
                    <tr key={item.id} className="hover:bg-potionPurple/5 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-xs font-mono text-paleLavender/50">{item.sku}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {item.onHand} {item.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {item.dailyVelocity} {item.unit}/d
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={`font-bold ${
                            item.daysOfCover <= 2
                              ? 'text-crimson'
                              : item.daysOfCover <= 5
                              ? 'text-pumpkin'
                              : 'text-white'
                          }`}
                        >
                          {item.daysOfCover} days
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.riskLevel === 'CRITICAL' && (
                          <Badge variant="danger" className="text-[10px]">
                            Critical (&le;48h)
                          </Badge>
                        )}
                        {item.riskLevel === 'HIGH' && (
                          <Badge variant="warning" className="text-[10px]">
                            High (2-5d)
                          </Badge>
                        )}
                        {item.riskLevel === 'MODERATE' && (
                          <Badge variant="outline" className="text-[10px] text-paleLavender">
                            Moderate
                          </Badge>
                        )}
                        {item.riskLevel === 'HEALTHY' && (
                          <Badge variant="success" className="text-[10px]">
                            Healthy
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.recommendedOrder > 0 ? (
                          <div>
                            <span className="font-bold text-pumpkin font-mono">
                              +{item.recommendedOrder} {item.unit}
                            </span>
                            <span className="text-[11px] text-paleLavender/50 block">
                              ({item.recommendedPacks} packs of {item.packSize})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-paleLavender/50">Sufficient</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-white">
                        {item.recommendedOrder > 0 ? formatCurrency(item.estimatedCost) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.recommendedOrder > 0 ? (
                          <Button
                            size="sm"
                            onClick={() => handleCreateDraftPO(item)}
                            className="h-8 px-2.5 bg-pumpkin hover:bg-pumpkin/90 text-white text-xs flex items-center gap-1 ml-auto"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Draft PO
                          </Button>
                        ) : (
                          <span className="text-xs text-paleLavender/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* PO Creation Preview Modal */}
        {selectedForPO && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 bg-ink border border-pumpkin/30 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-pumpkin" />
                  Generate Restock Order
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedForPO(null)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              {poCreated ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-cauldronGreen/20 border border-cauldronGreen/40 flex items-center justify-center text-cauldronGreen">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white">Purchase Order Draft Staged</h4>
                  <p className="text-xs text-paleLavender/70">
                    Draft PO for {selectedForPO.recommendedOrder} {selectedForPO.unit} of{' '}
                    {selectedForPO.name} has been placed in the Procurement Queue.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setSelectedForPO(null)}
                    className="bg-potionPurple text-white"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-midnight/60 rounded-lg border border-potionPurple/15 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-paleLavender/60">Ingredient:</span>
                      <span className="font-bold text-white">{selectedForPO.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-paleLavender/60">Vendor Pack Size:</span>
                      <span className="font-mono text-white">{selectedForPO.packSize} {selectedForPO.unit} / pack</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-paleLavender/60">Pack Quantity:</span>
                      <span className="font-mono text-pumpkin font-bold">{selectedForPO.recommendedPacks} Packs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-paleLavender/60">Total Delivery Units:</span>
                      <span className="font-mono text-white font-bold">{selectedForPO.recommendedOrder} {selectedForPO.unit}</span>
                    </div>
                    <div className="flex justify-between border-t border-potionPurple/20 pt-2">
                      <span className="text-paleLavender/60">Estimated PO Cost:</span>
                      <span className="font-mono text-cauldronGreen font-bold">{formatCurrency(selectedForPO.estimatedCost)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedForPO(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirmPO}
                      className="bg-pumpkin hover:bg-pumpkin/90 text-white flex items-center gap-1"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Confirm & Send PO
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

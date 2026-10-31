'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, PlusCircle, CheckCircle2 } from 'lucide-react';
import { StockMovementType } from '@potionpulse/contracts';

function AdjustStockPageContent() {
  const searchParams = useSearchParams();
  const preselectedIngredientId = searchParams.get('ingredientId') || '';
  const { activeTenant, accessToken } = useAuth();

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState(preselectedIngredientId);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType>(StockMovementType.RECEIPT);
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  useEffect(() => {
    if (!activeTenant?.id || !accessToken) return;
    setLoading(true);

    Promise.all([
      apiClient<any[]>('/ingredients', { token: accessToken, tenantId: activeTenant.id }),
      apiClient<any[]>('/locations', { token: accessToken, tenantId: activeTenant.id }),
    ])
      .then(([ingRes, locRes]) => {
        setIngredients(ingRes.data || []);
        setLocations(locRes.data || []);

        if (!selectedIngredientId && (ingRes.data || []).length > 0) {
          setSelectedIngredientId(ingRes.data[0].id);
        }

        const defLoc = (locRes.data || []).find((l) => l.isDefault) || (locRes.data || [])[0];
        if (defLoc) {
          setSelectedLocationId(defLoc.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTenant?.id, accessToken]);

  const selectedIngredient = ingredients.find((i) => i.id === selectedIngredientId);
  const isNegativeOperation =
    movementType === StockMovementType.WASTAGE ||
    movementType === StockMovementType.ADJUSTMENT_OUT;

  const signedQuantityDelta = isNegativeOperation ? -Math.abs(quantity) : Math.abs(quantity);
  const projectedBalance = selectedIngredient
    ? selectedIngredient.onHand + signedQuantityDelta
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientId || !reason) {
      setError('Please select an ingredient and specify an audit reason.');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const idempotencyKey = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await apiClient<any>('/inventory/movements', {
        method: 'POST',
        token: accessToken || undefined,
        tenantId: activeTenant?.id,
        idempotencyKey,
        body: JSON.stringify({
          ingredientId: selectedIngredientId,
          locationId: selectedLocationId || undefined,
          type: movementType,
          quantityDelta: signedQuantityDelta,
          reason,
        }),
      });

      setSuccess(res.data);
      setReason('');

      // Refresh local ingredient list
      const updatedList = await apiClient<any[]>('/ingredients', {
        token: accessToken || undefined,
        tenantId: activeTenant?.id,
      });
      setIngredients(updatedList.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to post stock movement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-violetGlow" />
              Receive & Adjust Inventory
            </h1>
            <p className="text-xs text-mutedText">
              Post an immutable transactional ledger movement to update physical on-hand balances.
            </p>
          </div>
        </div>

        {success && (
          <div className="p-4 rounded-xl bg-successGreen/20 border border-successGreen/40 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Movement committed! New balance for <strong>{success.ingredientName}</strong>:{' '}
                <strong>{success.balanceAfter} {success.unit}</strong>.
              </span>
            </div>
            <Link href="/inventory/movements" className="underline font-semibold text-white ml-2">
              View in Ledger
            </Link>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movement Parameters</CardTitle>
            <CardDescription>
              Every stock change generates an immutable ledger record with balance versioning and actor audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-dangerRed/15 border border-dangerRed/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-mutedText">
                  Target Ingredient
                </label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-[#171321] px-4 text-sm text-white focus:outline-none focus:border-potionPurple"
                  disabled={loading}
                  required
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.sku || 'No SKU'}) — Current On-Hand: {ing.onHand} {ing.baseUnit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mutedText">
                    Operation Type
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as StockMovementType)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-[#171321] px-4 text-sm text-white focus:outline-none focus:border-potionPurple"
                  >
                    <option value={StockMovementType.RECEIPT}>Receipt (Stock Intake from Supplier)</option>
                    <option value={StockMovementType.ADJUSTMENT_IN}>Manual Adjustment (+) Increase</option>
                    <option value={StockMovementType.ADJUSTMENT_OUT}>Manual Adjustment (-) Decrease</option>
                    <option value={StockMovementType.WASTAGE}>Wastage / Spoilage Deduction (-)</option>
                    <option value={StockMovementType.RETURN}>Customer Return / Restock (+)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mutedText">
                    Target Shelf / Location
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-[#171321] px-4 text-sm text-white focus:outline-none focus:border-potionPurple"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code}) {loc.isDefault ? '— Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={`Quantity (${selectedIngredient?.baseUnit || 'units'})`}
                  type="number"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />

                <Input
                  label="Audit Reason (Required)"
                  placeholder="e.g. Delivery PO-401 from Ravenwood Herbs"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              {/* Balance Impact Preview */}
              {selectedIngredient && (
                <div className="p-4 rounded-xl bg-ink/70 border border-white/10 flex items-center justify-between">
                  <span className="text-mutedText">Projected Physical Balance:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-mutedText font-mono">
                      {selectedIngredient.onHand} {selectedIngredient.baseUnit}
                    </span>
                    <span className="text-mutedText">→</span>
                    <span
                      className={`text-base font-black font-mono ${
                        (projectedBalance ?? 0) < 0 ? 'text-dangerRed' : 'text-emerald-400'
                      }`}
                    >
                      {projectedBalance} {selectedIngredient.baseUnit}
                    </span>
                    {(projectedBalance ?? 0) < 0 && (
                      <Badge variant="danger">Negative Stock Blocked</Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <Link href="/inventory">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  disabled={(projectedBalance ?? 0) < 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Post Movement to Ledger
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default function AdjustStockPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink flex items-center justify-center text-paleLavender/50">Loading adjustment form...</div>}>
      <AdjustStockPageContent />
    </Suspense>
  );
}

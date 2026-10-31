'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Layers,
  PlusCircle,
  Archive,
  RefreshCw,
} from 'lucide-react';

export default function IngredientDetailPage() {
  const { id } = useParams() as { id: string };
  const { activeTenant, accessToken } = useAuth();
  const router = useRouter();

  const [ingredient, setIngredient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const fetchIngredient = async () => {
    if (!id || !activeTenant?.id || !accessToken) return;
    setLoading(true);
    try {
      const res = await apiClient<any>(`/ingredients/${id}`, {
        token: accessToken,
        tenantId: activeTenant.id,
      });
      setIngredient(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ingredient.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredient();
  }, [id, activeTenant?.id, accessToken]);

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this ingredient? Historical sales and ledger movements will remain intact.')) {
      return;
    }

    setArchiving(true);
    try {
      await apiClient(`/ingredients/${id}`, {
        method: 'DELETE',
        token: accessToken || undefined,
        tenantId: activeTenant?.id,
      });
      router.push('/inventory');
    } catch (err: any) {
      alert(err.message || 'Failed to archive ingredient');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-mutedText text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-potionPurple" />
          Loading ingredient details...
        </div>
      </AppShell>
    );
  }

  if (error || !ingredient) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <p className="text-dangerRed text-sm">{error || 'Ingredient not found'}</p>
          <Link href="/inventory">
            <Button variant="secondary" size="sm">
              Return to Catalog
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/inventory">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{ingredient.name}</h1>
                <Badge variant={ingredient.isLowStock ? 'danger' : 'success'}>
                  {ingredient.isLowStock ? 'Low Stock' : 'Healthy Balance'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-mutedText mt-0.5">
                <span>SKU: {ingredient.sku || 'None'}</span>
                <span>•</span>
                <span>Category: {ingredient.category}</span>
                <span>•</span>
                <span>Base Unit: {ingredient.baseUnit}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href={`/inventory/adjust?ingredientId=${ingredient.id}`}>
              <Button size="sm" variant="primary" className="text-xs flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                Adjust / Intake Stock
              </Button>
            </Link>

            <Button
              size="sm"
              variant="outline"
              onClick={handleArchive}
              isLoading={archiving}
              className="text-xs text-dangerRed hover:bg-dangerRed/10 border-dangerRed/40"
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              Archive
            </Button>
          </div>
        </div>

        {/* Stock Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
              On-Hand Physical Stock
            </span>
            <div className="mt-3 text-3xl font-black text-white">
              {ingredient.onHand}{' '}
              <span className="text-sm font-normal text-mutedText">{ingredient.baseUnit}</span>
            </div>
            <p className="text-[11px] text-mutedText mt-1">Verified on physical shelves</p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
              Reserved / In-Process
            </span>
            <div className="mt-3 text-3xl font-black text-amber-400">
              {ingredient.reserved}{' '}
              <span className="text-sm font-normal text-mutedText">{ingredient.baseUnit}</span>
            </div>
            <p className="text-[11px] text-mutedText mt-1">Committed to active orders</p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
              Available to Promise
            </span>
            <div className="mt-3 text-3xl font-black text-violetGlow">
              {ingredient.available}{' '}
              <span className="text-sm font-normal text-mutedText">{ingredient.baseUnit}</span>
            </div>
            <p className="text-[11px] text-mutedText mt-1">Usable for immediate sales</p>
          </Card>
        </div>

        {/* Thresholds & Procurement Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Procurement & Buffer Parameters</CardTitle>
            <CardDescription>
              Inventory intelligence inputs used for stockout risk prediction and reorder quantity calculation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
              <div className="p-3 rounded-xl bg-ink/50 border border-white/5">
                <span className="text-mutedText">Reorder Point:</span>
                <div className="text-base font-bold text-white mt-1">
                  {ingredient.reorderPoint} {ingredient.baseUnit}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-ink/50 border border-white/5">
                <span className="text-mutedText">Safety Stock Buffer:</span>
                <div className="text-base font-bold text-white mt-1">
                  {ingredient.safetyStock} {ingredient.baseUnit}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-ink/50 border border-white/5">
                <span className="text-mutedText">Supplier Lead Time:</span>
                <div className="text-base font-bold text-white mt-1">
                  {ingredient.leadTimeDays} days
                </div>
              </div>

              <div className="p-3 rounded-xl bg-ink/50 border border-white/5">
                <span className="text-mutedText">Cost per Unit:</span>
                <div className="text-base font-bold text-white mt-1">
                  {formatCurrency(ingredient.costPerUnit || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shelf & Location Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-violetGlow" />
              Shelf & Location Distribution
            </CardTitle>
            <CardDescription>
              Multi-shelf inventory breakdown for physical stock audits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ingredient.locationBalances?.length === 0 ? (
              <div className="text-center py-6 text-xs text-mutedText">
                No storage locations assigned yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-mutedText uppercase text-[10px]">
                      <th className="py-2.5 px-3">Location Name</th>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">On-Hand Quantity</th>
                      <th className="py-2.5 px-3">Reserved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ingredient.locationBalances?.map((b: any) => (
                      <tr key={b.locationId}>
                        <td className="py-3 px-3 font-semibold text-white">
                          {b.locationName || 'Main Shelf'}
                        </td>
                        <td className="py-3 px-3 font-mono text-mutedText">{b.locationCode}</td>
                        <td className="py-3 px-3 font-bold font-mono text-white">
                          {b.onHand} {ingredient.baseUnit}
                        </td>
                        <td className="py-3 px-3 font-mono text-mutedText">
                          {b.reserved} {ingredient.baseUnit}
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

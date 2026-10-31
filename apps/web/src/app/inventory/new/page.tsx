'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewIngredientPage() {
  const { activeTenant, accessToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Magical Flora');
  const [baseUnit, setBaseUnit] = useState('piece');
  const [reorderPoint, setReorderPoint] = useState(20);
  const [safetyStock, setSafetyStock] = useState(10);
  const [leadTimeDays, setLeadTimeDays] = useState(3);
  const [costPerUnit, setCostPerUnit] = useState(5.0);
  const [defaultLocationId, setDefaultLocationId] = useState('');
  const [locations, setLocations] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTenant?.id || !accessToken) return;
    apiClient<any[]>('/locations', { token: accessToken, tenantId: activeTenant.id })
      .then((res) => {
        setLocations(res.data || []);
        const def = (res.data || []).find((l) => l.isDefault);
        if (def) setDefaultLocationId(def.id);
      })
      .catch(() => {});
  }, [activeTenant?.id, accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !baseUnit) {
      setError('Please provide at least a name and base measurement unit.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient('/ingredients', {
        method: 'POST',
        token: accessToken || undefined,
        tenantId: activeTenant?.id,
        body: JSON.stringify({
          name,
          sku: sku || undefined,
          category,
          baseUnit,
          reorderPoint: Number(reorderPoint) || 0,
          safetyStock: Number(safetyStock) || 0,
          leadTimeDays: Number(leadTimeDays) || 1,
          costPerUnit: Number(costPerUnit) || 0,
          defaultLocationId: defaultLocationId || undefined,
        }),
      });

      router.push('/inventory');
    } catch (err: any) {
      setError(err.message || 'Failed to create ingredient.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Catalog
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Add New Ingredient</h1>
            <p className="text-xs text-mutedText">Configure inventory tracking parameters and reorder rules.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingredient Specifications</CardTitle>
            <CardDescription>
              Backend requires unique SKU within shop, explicit base measurement unit, and non-negative thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-dangerRed/15 border border-dangerRed/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Ingredient Name"
                  placeholder="e.g. Mandrake Root"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="SKU Code"
                  placeholder="e.g. ING-MND-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  helperText="Optional, unique per shop"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mutedText">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-[#171321] px-4 text-sm text-white focus:outline-none focus:border-potionPurple"
                  >
                    <option value="Magical Flora">Magical Flora</option>
                    <option value="Animal Parts">Animal Parts</option>
                    <option value="Minerals & Crystals">Minerals & Crystals</option>
                    <option value="Liquids & Essences">Liquids & Essences</option>
                    <option value="Spices & Seasoning">Spices & Seasoning</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mutedText">
                    Base Measurement Unit
                  </label>
                  <select
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-[#171321] px-4 text-sm text-white focus:outline-none focus:border-potionPurple"
                  >
                    <option value="piece">Piece (individual items)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="oz">Ounce (oz)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Input
                  label="Reorder Threshold"
                  type="number"
                  min="0"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(Number(e.target.value))}
                  helperText="Triggers low-stock warning"
                />

                <Input
                  label="Safety Stock Buffer"
                  type="number"
                  min="0"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(Number(e.target.value))}
                  helperText="Buffer for demand spikes"
                />

                <Input
                  label="Supplier Lead Time (Days)"
                  type="number"
                  min="0"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                  helperText="Days from order to delivery"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Estimated Cost per Unit ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(Number(e.target.value))}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mutedText">
                    Default Storage Shelf / Location
                  </label>
                  <select
                    value={defaultLocationId}
                    onChange={(e) => setDefaultLocationId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-[#171321] px-4 text-sm text-white focus:outline-none focus:border-potionPurple"
                  >
                    <option value="">Select location...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code}) {loc.isDefault ? '— Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <Link href="/inventory">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="primary" isLoading={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Ingredient
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

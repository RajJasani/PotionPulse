'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import { Layers, Plus, ArrowLeft, RefreshCw } from 'lucide-react';

export default function LocationsPage() {
  const { activeTenant, accessToken } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('shelf');
  const [isDefault, setIsDefault] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    if (!activeTenant?.id || !accessToken) return;
    setLoading(true);
    try {
      const res = await apiClient<any[]>('/locations', {
        token: accessToken,
        tenantId: activeTenant.id,
      });
      setLocations(res.data || []);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [activeTenant?.id, accessToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      setError('Please provide location name and code.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiClient('/locations', {
        method: 'POST',
        token: accessToken || undefined,
        tenantId: activeTenant?.id,
        body: JSON.stringify({
          name,
          code: code.toUpperCase(),
          type,
          isDefault,
        }),
      });

      setName('');
      setCode('');
      setIsDefault(false);
      fetchLocations();
    } catch (err: any) {
      setError(err.message || 'Failed to create location.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/inventory">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Layers className="w-6 h-6 text-violetGlow" />
                Shelves & Storage Locations
              </h1>
              <p className="text-xs text-mutedText mt-0.5">
                Organize stock across physical shelves, cold storage, and apothecary bins.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLocations}
            className="text-xs text-mutedText"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Location Card */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-violetGlow" />
                Add Shelf / Location
              </CardTitle>
              <CardDescription>
                Define new physical storage zones with a unique code within this shop.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-dangerRed/15 border border-dangerRed/40 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <Input
                  label="Location Name"
                  placeholder="e.g. Cauldron Storage Shelf B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="Location Code"
                  placeholder="e.g. SHELF-B2"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  helperText="Unique uppercase identifier"
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mutedText">
                    Storage Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-[#171321] px-4 text-sm text-white focus:outline-none focus:border-potionPurple"
                  >
                    <option value="shelf">Shelf</option>
                    <option value="room">Storage Room</option>
                    <option value="bin">Ingredient Bin</option>
                    <option value="refrigerator">Cold Storage / Refrigerator</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-white/20 bg-[#171321] text-potionPurple focus:ring-potionPurple"
                  />
                  <span className="text-white text-xs">Set as default intake shelf</span>
                </label>

                <Button type="submit" variant="primary" className="w-full mt-2" isLoading={submitting}>
                  Create Storage Location
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Locations List */}
          <div className="lg:col-span-2">
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white">Active Storage Shelves</h3>
                <p className="text-xs text-mutedText">Locations configured for physical balance tracking.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-mutedText uppercase text-[10px]">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Default</th>
                      <th className="py-3 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {locations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-mutedText">
                          No locations configured yet.
                        </td>
                      </tr>
                    ) : (
                      locations.map((loc) => (
                        <tr key={loc.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{loc.name}</td>
                          <td className="py-3 px-4 font-mono text-violetGlow">{loc.code}</td>
                          <td className="py-3 px-4 text-mutedText capitalize">{loc.type}</td>
                          <td className="py-3 px-4">
                            {loc.isDefault ? (
                              <Badge variant="purple">Default Shelf</Badge>
                            ) : (
                              <span className="text-mutedText">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-mutedText">{formatDateTime(loc.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

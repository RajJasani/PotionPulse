'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

export default function InventoryListPage() {
  const { activeTenant, accessToken } = useAuth();
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchIngredients = async () => {
    if (!activeTenant?.id || !accessToken) return;
    setLoading(true);
    try {
      const res = await apiClient<any[]>('/ingredients', {
        token: accessToken,
        tenantId: activeTenant.id,
        params: {
          search: search || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          lowStockOnly: lowStockOnly ? true : undefined,
        },
      });
      setIngredients(res.data || []);
    } catch {
      // Gracefully handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [activeTenant?.id, accessToken, selectedCategory, lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIngredients();
  };

  const categories = ['ALL', ...Array.from(new Set(ingredients.map((i) => i.category).filter(Boolean)))];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Package className="w-6 h-6 text-violetGlow" />
              Ingredient Catalog
            </h1>
            <p className="text-xs text-mutedText mt-1">
              Live stock levels, storage shelf assignments, and reorder point thresholds.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/inventory/adjust">
              <Button variant="secondary" size="sm" className="text-xs flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                Receive / Adjust Stock
              </Button>
            </Link>

            <Link href="/inventory/new">
              <Button variant="primary" size="sm" className="text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Ingredient
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-mutedText absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by ingredient name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-white/10 bg-[#171321] text-xs text-white placeholder:text-mutedText focus:outline-none focus:border-potionPurple"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm" className="h-10 text-xs">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-mutedText hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded border-white/20 bg-[#171321] text-potionPurple focus:ring-potionPurple"
                />
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-dangerRed" />
                  Low stock only
                </span>
              </label>

              <Button
                variant="ghost"
                size="sm"
                onClick={fetchIngredients}
                className="text-xs flex items-center gap-1 text-mutedText"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 overflow-x-auto">
              <span className="text-[10px] uppercase font-bold text-mutedText flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" />
                Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-potionPurple text-white font-semibold shadow-sm'
                      : 'bg-white/5 text-mutedText hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Ingredients Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-mutedText uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">On-Hand</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Reorder Point</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ingredients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-mutedText">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-potionPurple" />
                          <span>Loading ingredient catalog...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p>No ingredients found matching the criteria.</p>
                          <Link href="/inventory/new">
                            <Button size="sm" variant="primary" className="text-xs">
                              Add First Ingredient
                            </Button>
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  ingredients.map((ing) => (
                    <tr key={ing.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        <Link
                          href={`/inventory/${ing.id}`}
                          className="hover:text-violetGlow transition-colors"
                        >
                          {ing.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-mutedText">{ing.sku || '—'}</td>
                      <td className="py-3 px-4 text-mutedText">{ing.category}</td>
                      <td className="py-3 px-4 font-bold font-mono text-white">
                        {ing.onHand} {ing.baseUnit}
                      </td>
                      <td className="py-3 px-4 font-mono text-mutedText">
                        {ing.available} {ing.baseUnit}
                      </td>
                      <td className="py-3 px-4 font-mono text-mutedText">
                        {ing.reorderPoint} {ing.baseUnit}
                      </td>
                      <td className="py-3 px-4 font-mono text-mutedText">
                        {formatCurrency(ing.costPerUnit || 0)}
                      </td>
                      <td className="py-3 px-4">
                        {ing.isLowStock ? (
                          <Badge variant="danger" className="text-[10px]">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Healthy
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/inventory/${ing.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5">
                            Details
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

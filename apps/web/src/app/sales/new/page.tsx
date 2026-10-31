'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface CartItem {
  ingredientId: string;
  name: string;
  sku: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

export default function NewSalePage() {
  const { activeTenant, accessToken } = useAuth();
  const router = useRouter();

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleNumber, setSaleNumber] = useState(`SALE-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState<any | null>(null);

  // Fetch ingredients
  useEffect(() => {
    if (!activeTenant?.id || !accessToken) return;
    setLoading(true);
    apiClient<any[]>('/ingredients', { token: accessToken, tenantId: activeTenant.id })
      .then((res) => {
        setIngredients(res.data || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load catalog');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeTenant?.id, accessToken]);

  // Cart operations
  const addToCart = (ing: any) => {
    const existing = cart.find((item) => item.ingredientId === ing.id);
    const available = Number(ing.onHand || 0);

    if (existing) {
      if (existing.quantity + 1 > available) {
        alert(`Cannot add more. Only ${available} ${ing.unit} in stock.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.ingredientId === ing.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );
    } else {
      if (available <= 0) {
        alert('This ingredient is out of stock.');
        return;
      }
      // Potion retail price formula: costPerUnit * 1.5 markup or minimum $5
      const retailPrice = Number(ing.costPerUnit || 10) * 1.5;
      setCart([
        ...cart,
        {
          ingredientId: ing.id,
          name: ing.name,
          sku: ing.sku,
          unit: ing.unit,
          unitPrice: Math.round(retailPrice * 100) / 100,
          quantity: 1,
          availableStock: available,
        },
      ]);
    }
  };

  const updateQuantity = (ingredientId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(ingredientId);
      return;
    }
    const item = cart.find((i) => i.ingredientId === ingredientId);
    if (item && newQty > item.availableStock) {
      alert(`Cannot exceed on-hand balance of ${item.availableStock} ${item.unit}.`);
      return;
    }
    setCart(
      cart.map((i) => (i.ingredientId === ingredientId ? { ...i, quantity: newQty } : i)),
    );
  };

  const removeFromCart = (ingredientId: string) => {
    setCart(cart.filter((item) => item.ingredientId !== ingredientId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    [cart],
  );
  const tax = subtotal * 0.05; // 5% mystical apothecary levy
  const grandTotal = subtotal + tax;

  // Submit sale
  const handleCompleteSale = async () => {
    if (cart.length === 0 || !activeTenant?.id || !accessToken) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      saleNumber: saleNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      items: cart.map((i) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      idempotencyKey: `pos-${saleNumber}-${Date.now()}`,
    };

    try {
      const res = await apiClient<any>('/sales', {
        method: 'POST',
        token: accessToken,
        tenantId: activeTenant.id,
        body: payload,
      });
      setSaleSuccess(res.data);
      setCart([]);
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch =
      ing.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ing.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || ing.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['ALL', 'BOTANICAL', 'MINERAL', 'CREATURE', 'ESSENCE', 'SOLVENT'];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/sales">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-paleLavender/70" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <ShoppingCart className="w-7 h-7 text-potionPurple" />
                Point of Sale Terminal
              </h1>
              <p className="text-sm text-paleLavender/60">
                Dispense potions & raw alchemy ingredients with instant ledger deduction.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-pumpkin/40 text-pumpkin flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Register Active
            </Badge>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-crimson/10 border border-crimson/20 rounded-lg text-crimson text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* POS Grid: Catalog on Left (8 cols), Cart on Right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Catalog Section */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-4 space-y-4">
              {/* Category pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-potionPurple text-white shadow-md'
                        : 'bg-midnight/60 text-paleLavender/70 hover:bg-midnight hover:text-white border border-potionPurple/15'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-paleLavender/40" />
                <input
                  type="text"
                  placeholder="Search catalog by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-midnight/60 border border-potionPurple/20 rounded-lg text-sm text-paleLavender placeholder:text-paleLavender/30 focus:outline-none focus:border-potionPurple"
                />
              </div>
            </Card>

            {/* Ingredients Grid */}
            {loading ? (
              <div className="py-12 text-center text-paleLavender/50">Loading ingredients catalog...</div>
            ) : filteredIngredients.length === 0 ? (
              <div className="py-12 text-center text-paleLavender/50 bg-midnight/30 rounded-xl border border-potionPurple/10">
                No matching ingredients found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredIngredients.map((ing) => {
                  const onHand = Number(ing.onHand || 0);
                  const isOutOfStock = onHand <= 0;
                  const estimatedRetail = Math.round(Number(ing.costPerUnit || 10) * 1.5 * 100) / 100;

                  return (
                    <Card
                      key={ing.id}
                      className={`p-4 flex flex-col justify-between transition-all hover:border-potionPurple/40 ${
                        isOutOfStock ? 'opacity-60 bg-midnight/30' : 'bg-midnight/60'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-sm text-white line-clamp-1">{ing.name}</h4>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {ing.category}
                          </Badge>
                        </div>
                        <p className="text-xs font-mono text-paleLavender/50">SKU: {ing.sku}</p>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-paleLavender/70">Stock:</span>
                          <span
                            className={`font-semibold ${
                              isOutOfStock
                                ? 'text-crimson'
                                : onHand <= (ing.safetyStock || 5)
                                ? 'text-pumpkin'
                                : 'text-cauldronGreen'
                            }`}
                          >
                            {onHand} {ing.unit}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-potionPurple/15 flex items-center justify-between">
                        <span className="text-base font-bold text-pumpkin">
                          {formatCurrency(estimatedRetail)}
                        </span>
                        <Button
                          size="sm"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(ing)}
                          className="h-8 px-2.5 bg-potionPurple hover:bg-potionPurple/80 text-white text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Cart / Order Ticket */}
          <div className="lg:col-span-4">
            <Card className="p-5 space-y-5 sticky top-20 bg-ink border border-potionPurple/25">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-pumpkin" />
                  <h3 className="font-bold text-white">Current Ticket</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-crimson hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Order Meta */}
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-paleLavender/60 block mb-1">
                    Sale Reference
                  </label>
                  <input
                    type="text"
                    value={saleNumber}
                    onChange={(e) => setSaleNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-midnight/70 border border-potionPurple/20 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-paleLavender/60 block mb-1">
                    Customer / Note
                  </label>
                  <input
                    type="text"
                    placeholder="Walk-in, potion order..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-midnight/70 border border-potionPurple/20 rounded text-xs text-paleLavender placeholder:text-paleLavender/30"
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-xs text-paleLavender/40 border border-dashed border-potionPurple/20 rounded-lg">
                    Ticket is empty.
                    <br />
                    Select ingredients from the catalog.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.ingredientId}
                      className="p-2.5 bg-midnight/40 rounded-lg border border-potionPurple/15 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-paleLavender/50 font-mono">
                            {formatCurrency(item.unitPrice)} / {item.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.ingredientId)}
                          className="text-paleLavender/40 hover:text-crimson p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-potionPurple/30 rounded bg-midnight/60">
                          <button
                            onClick={() => updateQuantity(item.ingredientId, item.quantity - 1)}
                            className="px-2 py-0.5 text-paleLavender/80 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.ingredientId, item.quantity + 1)}
                            className="px-2 py-0.5 text-paleLavender/80 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-white font-mono">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Summary Calculations */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-potionPurple/20 space-y-2 text-xs">
                  <div className="flex justify-between text-paleLavender/70">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-paleLavender/70">
                    <span>Apothecary Levy (5%)</span>
                    <span className="font-mono">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-potionPurple/15">
                    <span>Total Due</span>
                    <span className="text-pumpkin font-mono">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              )}

              {/* Complete Checkout Button */}
              <Button
                disabled={cart.length === 0 || submitting}
                onClick={handleCompleteSale}
                className="w-full py-3 bg-cauldronGreen hover:bg-cauldronGreen/90 text-black font-bold flex items-center justify-center gap-2"
              >
                {submitting ? (
                  'Deducting Inventory...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Sale ({formatCurrency(grandTotal)})
                  </>
                )}
              </Button>
            </Card>
          </div>
        </div>

        {/* Receipt Success Dialog */}
        {saleSuccess && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 bg-ink border border-cauldronGreen/40 space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-cauldronGreen/20 border border-cauldronGreen/40 flex items-center justify-center text-cauldronGreen">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Sale Completed Successfully!</h3>
                <p className="text-xs text-paleLavender/70 mt-1 font-mono">
                  Receipt #{saleSuccess.saleNumber || saleNumber}
                </p>
                <p className="text-xs text-cauldronGreen mt-1">
                  Inventory balances automatically deducted in real time.
                </p>
              </div>

              <div className="bg-midnight/60 rounded-xl p-4 border border-potionPurple/20 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between text-paleLavender/70">
                  <span>Total Amount Paid:</span>
                  <span className="font-bold text-pumpkin">
                    {formatCurrency(saleSuccess.totalAmount || grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-paleLavender/70">
                  <span>Items Dispensed:</span>
                  <span className="text-white font-semibold">
                    {saleSuccess.items?.length || 1} line item(s)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSaleSuccess(null);
                    setSaleNumber(`SALE-${Date.now().toString().slice(-6)}`);
                  }}
                >
                  New Transaction
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/sales')}
                  className="bg-potionPurple hover:bg-potionPurple/90 text-white"
                >
                  View in Sales Ledger
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

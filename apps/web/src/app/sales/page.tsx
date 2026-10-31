'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useSocket } from '@/lib/socket-context';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ShoppingCart,
  PlusCircle,
  RefreshCw,
  Search,
  Eye,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  XCircle,
} from 'lucide-react';

interface SaleItem {
  ingredientId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  ingredient?: {
    name: string;
    sku: string;
    unit: string;
  };
}

interface Sale {
  id: string;
  saleNumber: string;
  status: 'COMPLETED' | 'REFUNDED' | 'CANCELLED';
  totalAmount: number;
  itemCount: number;
  items: SaleItem[];
  notes?: string;
  refundReason?: string;
  createdAt: string;
}

export default function SalesPage() {
  const { activeTenant, accessToken } = useAuth();
  const { socket } = useSocket();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected sale for detail modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Refund modal state
  const [refundingSale, setRefundingSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [restockInventory, setRestockInventory] = useState(true);
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const fetchSales = useCallback(async () => {
    if (!activeTenant?.id || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<Sale[]>(`/sales?page=${page}&limit=15`, {
        token: accessToken,
        tenantId: activeTenant.id,
      });
      setSales(res.data || []);
      if (res.meta) {
        setTotalPages(Math.ceil((res.meta.total || 0) / (res.meta.limit || 15)) || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [activeTenant?.id, accessToken, page]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Live WebSocket updates
  useEffect(() => {
    if (!socket) return;
    const handleSaleEvent = () => {
      fetchSales();
    };
    socket.on('sale.created', handleSaleEvent);
    socket.on('sale.refunded', handleSaleEvent);
    return () => {
      socket.off('sale.created', handleSaleEvent);
      socket.off('sale.refunded', handleSaleEvent);
    };
  }, [socket, fetchSales]);

  // Open detail view
  const handleViewDetails = async (saleId: string) => {
    if (!activeTenant?.id || !accessToken) return;
    setDetailLoading(true);
    try {
      const res = await apiClient<Sale>(`/sales/${saleId}`, {
        token: accessToken,
        tenantId: activeTenant.id,
      });
      setSelectedSale(res.data);
    } catch (err: any) {
      alert(`Could not load sale detail: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  // Submit refund
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingSale || !activeTenant?.id || !accessToken) return;
    setRefundSubmitting(true);
    try {
      await apiClient(`/sales/${refundingSale.id}/refunds`, {
        method: 'POST',
        token: accessToken,
        tenantId: activeTenant.id,
        body: {
          restock: restockInventory,
          reason: refundReason || 'Customer return',
        },
      });
      setRefundingSale(null);
      setRefundReason('');
      fetchSales();
    } catch (err: any) {
      alert(`Refund failed: ${err.message}`);
    } finally {
      setRefundSubmitting(false);
    }
  };

  // KPI calculations
  const totalRevenue = sales.reduce((acc, s) => acc + (s.status === 'COMPLETED' ? s.totalAmount : 0), 0);
  const completedCount = sales.filter((s) => s.status === 'COMPLETED').length;
  const refundedCount = sales.filter((s) => s.status === 'REFUNDED').length;

  const filteredSales = sales.filter(
    (s) =>
      s.saleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-potionPurple" />
              Sales & POS Transactions
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Live transaction ledger with atomic stock deduction and refund processing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSales}
              disabled={loading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Link href="/sales/new">
              <Button size="sm" className="flex items-center gap-1.5 bg-pumpkin hover:bg-pumpkin/90 text-white">
                <PlusCircle className="w-4 h-4" />
                Point of Sale (POS)
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-potionPurple/20 border border-potionPurple/30 flex items-center justify-center text-potionPurple">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Batch Revenue (Page)</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cauldronGreen/20 border border-cauldronGreen/30 flex items-center justify-center text-cauldronGreen">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Completed Sales</p>
              <p className="text-2xl font-bold text-white">{completedCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amethyst/20 border border-amethyst/30 flex items-center justify-center text-amethyst">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Refunded Orders</p>
              <p className="text-2xl font-bold text-white">{refundedCount}</p>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-paleLavender/40" />
            <input
              type="text"
              placeholder="Search by sale number or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-midnight/60 border border-potionPurple/20 rounded-lg text-sm text-paleLavender placeholder:text-paleLavender/30 focus:outline-none focus:border-potionPurple"
            />
          </div>
        </div>

        {/* Sales Table */}
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
                  <th className="py-3 px-4">Sale Number</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-potionPurple/10">
                {loading && sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-paleLavender/40">
                      Loading sales ledger...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-paleLavender/40">
                      No sales recorded yet. Click &apos;Point of Sale&apos; to process your first order.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-potionPurple/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        {sale.saleNumber}
                      </td>
                      <td className="py-3 px-4 text-paleLavender/70">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">{sale.itemCount || sale.items?.length || 1}</span> items
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        {sale.status === 'COMPLETED' && (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </Badge>
                        )}
                        {sale.status === 'REFUNDED' && (
                          <Badge variant="warning" className="flex items-center gap-1 w-fit">
                            <RotateCcw className="w-3 h-3" />
                            Refunded
                          </Badge>
                        )}
                        {sale.status === 'CANCELLED' && (
                          <Badge variant="danger" className="flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Cancelled
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(sale.id)}
                          className="h-8 px-2 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        {sale.status === 'COMPLETED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRefundingSale(sale);
                              setRefundReason('');
                              setRestockInventory(true);
                            }}
                            className="h-8 px-2 text-xs border-crimson/30 text-crimson hover:bg-crimson/10"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Refund
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-potionPurple/15 flex items-center justify-between text-xs text-paleLavender/60">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>

        {/* Order Details Drawer / Modal */}
        {selectedSale && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 bg-ink border border-potionPurple/30 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-potionPurple" />
                    Sale Details
                  </h3>
                  <p className="text-xs font-mono text-paleLavender/60">{selectedSale.saleNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSale(null)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              {detailLoading ? (
                <div className="py-8 text-center text-paleLavender/50">Loading order details...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs bg-midnight/40 p-3 rounded-lg border border-potionPurple/15">
                    <div>
                      <span className="text-paleLavender/60 block">Date</span>
                      <span className="text-white font-medium">{formatDateTime(selectedSale.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-paleLavender/60 block">Status</span>
                      <Badge variant={selectedSale.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {selectedSale.status}
                      </Badge>
                    </div>
                    {selectedSale.notes && (
                      <div className="col-span-2 mt-1">
                        <span className="text-paleLavender/60 block">Notes</span>
                        <span className="text-white">{selectedSale.notes}</span>
                      </div>
                    )}
                    {selectedSale.refundReason && (
                      <div className="col-span-2 mt-1 text-crimson">
                        <span className="font-semibold block">Refund Reason:</span>
                        <span>{selectedSale.refundReason}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase text-paleLavender/60 mb-2">Line Items</h4>
                    <div className="border border-potionPurple/15 rounded-lg divide-y divide-potionPurple/10 overflow-hidden">
                      {selectedSale.items?.map((item, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs bg-midnight/20">
                          <div>
                            <p className="font-semibold text-white">
                              {item.ingredient?.name || `Ingredient #${item.ingredientId.slice(-6)}`}
                            </p>
                            <p className="text-paleLavender/50 font-mono">
                              {item.quantity} × {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                          <span className="font-bold text-white font-mono">
                            {formatCurrency(item.subtotal || item.quantity * item.unitPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-potionPurple/20 flex items-center justify-between text-base font-bold text-white">
                    <span>Total Amount</span>
                    <span className="text-pumpkin">{formatCurrency(selectedSale.totalAmount)}</span>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Refund Processing Modal */}
        {refundingSale && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 bg-ink border border-crimson/30 space-y-4">
              <div className="flex items-center justify-between border-b border-crimson/20 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-crimson" />
                  Refund Sale #{refundingSale.saleNumber}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRefundingSale(null)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleProcessRefund} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-paleLavender/80 mb-1">
                    Refund Reason
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe reason for returning items..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full p-2.5 bg-midnight/60 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-crimson"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="restockCheckbox"
                    checked={restockInventory}
                    onChange={(e) => setRestockInventory(e.target.checked)}
                    className="w-4 h-4 rounded border-potionPurple/30 bg-midnight accent-potionPurple"
                  />
                  <label htmlFor="restockCheckbox" className="text-xs text-paleLavender cursor-pointer">
                    Restock inventory ledger with returned items
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-potionPurple/15">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRefundingSale(null)}
                    disabled={refundSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={refundSubmitting || !refundReason.trim()}
                    className="bg-crimson hover:bg-crimson/90 text-white"
                  >
                    {refundSubmitting ? 'Processing...' : 'Confirm Refund'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

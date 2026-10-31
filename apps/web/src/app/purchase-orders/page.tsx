'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
} from 'lucide-react';

interface PurchaseOrderItem {
  ingredientName: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  orderedAt: string;
  expectedDelivery: string;
  totalCost: number;
  items: PurchaseOrderItem[];
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: 'po-001',
      poNumber: 'PO-2026-081',
      supplierName: 'Northern Foragers Guild',
      status: 'ORDERED',
      orderedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      expectedDelivery: '2026-11-03',
      totalCost: 1450.0,
      items: [
        { ingredientName: 'Mandrake Root', quantity: 50, unit: 'g', unitCost: 12.0 },
        { ingredientName: 'Nightshade Berries', quantity: 85, unit: 'pcs', unitCost: 10.0 },
      ],
    },
    {
      id: 'po-002',
      poNumber: 'PO-2026-080',
      supplierName: 'Midnight Aviary & Chiroptera',
      status: 'ORDERED',
      orderedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      expectedDelivery: '2026-11-02',
      totalCost: 3200.0,
      items: [
        { ingredientName: 'Bat Wings', quantity: 200, unit: 'pairs', unitCost: 16.0 },
      ],
    },
    {
      id: 'po-003',
      poNumber: 'PO-2026-079',
      supplierName: 'Obsidian Cavern Miners Co.',
      status: 'RECEIVED',
      orderedAt: new Date(Date.now() - 3600000 * 120).toISOString(),
      expectedDelivery: '2026-10-29',
      totalCost: 2800.0,
      items: [
        { ingredientName: 'Obsidian Dust', quantity: 100, unit: 'g', unitCost: 28.0 },
      ],
    },
    {
      id: 'po-004',
      poNumber: 'PO-2026-078',
      supplierName: 'Alchemical Distillates Syndicate',
      status: 'DRAFT',
      orderedAt: new Date().toISOString(),
      expectedDelivery: '2026-11-06',
      totalCost: 950.0,
      items: [
        { ingredientName: 'Distilled Aether', quantity: 25, unit: 'ml', unitCost: 38.0 },
      ],
    },
  ]);

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New PO state
  const [newSupplier, setNewSupplier] = useState('Northern Foragers Guild');
  const [newIngredient, setNewIngredient] = useState('Dragon Scale');
  const [newQty, setNewQty] = useState(20);
  const [newCost, setNewCost] = useState(45);

  const handleReceivePO = (poId: string) => {
    setPurchaseOrders(
      purchaseOrders.map((po) =>
        po.id === poId ? { ...po, status: 'RECEIVED' } : po,
      ),
    );
    if (selectedPO?.id === poId) {
      setSelectedPO({ ...selectedPO, status: 'RECEIVED' });
    }
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: newSupplier,
      status: 'ORDERED',
      orderedAt: new Date().toISOString(),
      expectedDelivery: new Date(Date.now() + 3600000 * 24 * 4).toISOString().slice(0, 10),
      totalCost: newQty * newCost,
      items: [
        {
          ingredientName: newIngredient,
          quantity: Number(newQty),
          unit: 'units',
          unitCost: Number(newCost),
        },
      ],
    };
    setPurchaseOrders([po, ...purchaseOrders]);
    setShowCreateModal(false);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileText className="w-7 h-7 text-potionPurple" />
              Purchase Orders & Procurement
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Track vendor replenishment orders from draft authorization to inventory receiving.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-pumpkin hover:bg-pumpkin/90 text-white"
          >
            <PlusCircle className="w-4 h-4" />
            New Purchase Order
          </Button>
        </div>

        {/* PO Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-paleLavender">
              <thead className="bg-midnight/70 text-xs uppercase tracking-wider text-paleLavender/60 border-b border-potionPurple/15">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Ordered Date</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-potionPurple/10">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-potionPurple/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">{po.poNumber}</td>
                    <td className="py-3 px-4 text-white font-medium">{po.supplierName}</td>
                    <td className="py-3 px-4 text-xs text-paleLavender/70">{formatDateTime(po.orderedAt)}</td>
                    <td className="py-3 px-4 text-xs font-mono text-white">{po.expectedDelivery}</td>
                    <td className="py-3 px-4 font-mono font-bold text-pumpkin">{formatCurrency(po.totalCost)}</td>
                    <td className="py-3 px-4">
                      {po.status === 'RECEIVED' && (
                        <Badge variant="success" className="flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Received
                        </Badge>
                      )}
                      {po.status === 'ORDERED' && (
                        <Badge variant="warning" className="flex items-center gap-1 w-fit">
                          <Truck className="w-3 h-3" />
                          In Transit
                        </Badge>
                      )}
                      {po.status === 'DRAFT' && (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          Draft
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPO(po)}
                        className="h-8 px-2 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Button>
                      {po.status === 'ORDERED' && (
                        <Button
                          size="sm"
                          onClick={() => handleReceivePO(po.id)}
                          className="h-8 px-2.5 bg-cauldronGreen hover:bg-cauldronGreen/90 text-black text-xs font-semibold"
                        >
                          Receive Stock
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* PO Details Modal */}
        {selectedPO && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 bg-ink border border-potionPurple/30 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-potionPurple" />
                    Purchase Order Details
                  </h3>
                  <p className="text-xs font-mono text-paleLavender/60">{selectedPO.poNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPO(null)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 bg-midnight/40 rounded-lg border border-potionPurple/15">
                  <div>
                    <span className="text-paleLavender/60 block">Vendor:</span>
                    <span className="font-semibold text-white">{selectedPO.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-paleLavender/60 block">Status:</span>
                    <Badge variant={selectedPO.status === 'RECEIVED' ? 'success' : 'warning'}>
                      {selectedPO.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-paleLavender/60 block">Expected Arrival:</span>
                    <span className="font-mono text-white">{selectedPO.expectedDelivery}</span>
                  </div>
                  <div>
                    <span className="text-paleLavender/60 block">Total Cost:</span>
                    <span className="font-mono text-pumpkin font-bold">{formatCurrency(selectedPO.totalCost)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-paleLavender/80 uppercase text-[11px] mb-2">
                    Line Items
                  </h4>
                  <div className="divide-y divide-potionPurple/15 border border-potionPurple/20 rounded-lg overflow-hidden">
                    {selectedPO.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-midnight/30 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">{item.ingredientName}</p>
                          <p className="text-[11px] text-paleLavender/50 font-mono">
                            {item.quantity} {item.unit} &times; {formatCurrency(item.unitCost)}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-white">
                          {formatCurrency(item.quantity * item.unitCost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-potionPurple/20">
                  {selectedPO.status === 'ORDERED' && (
                    <Button
                      size="sm"
                      onClick={() => handleReceivePO(selectedPO.id)}
                      className="bg-cauldronGreen hover:bg-cauldronGreen/90 text-black font-semibold"
                    >
                      Receive & Post to Ledger
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPO(null)}
                    className="ml-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Create PO Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 bg-ink border border-pumpkin/30 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-pumpkin" />
                  New Purchase Order
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleCreatePO} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Select Supplier
                  </label>
                  <select
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                  >
                    <option value="Northern Foragers Guild">Northern Foragers Guild</option>
                    <option value="Midnight Aviary & Chiroptera">Midnight Aviary & Chiroptera</option>
                    <option value="Obsidian Cavern Miners Co.">Obsidian Cavern Miners Co.</option>
                    <option value="Alchemical Distillates Syndicate">Alchemical Distillates Syndicate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Ingredient Item
                  </label>
                  <input
                    type="text"
                    required
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      Order Units
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newQty}
                      onChange={(e) => setNewQty(Number(e.target.value))}
                      className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      required
                      value={newCost}
                      onChange={(e) => setNewCost(Number(e.target.value))}
                      className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-midnight/40 rounded-lg border border-potionPurple/15 text-xs flex justify-between font-mono">
                  <span className="text-paleLavender/60">Estimated Total:</span>
                  <span className="font-bold text-pumpkin">{formatCurrency(newQty * newCost)}</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-potionPurple/15">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-pumpkin hover:bg-pumpkin/90 text-white flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Place Order
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

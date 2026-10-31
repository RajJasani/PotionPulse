'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Truck,
  PlusCircle,
  Search,
  Star,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone: string;
  leadTimeDays: number;
  rating: number;
  paymentTerms: string;
  categories: string[];
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 'sup-001',
      name: 'Northern Foragers Guild',
      code: 'NFG-01',
      contactEmail: 'orders@northernforagers.realm',
      contactPhone: '+1 (555) 482-9102',
      leadTimeDays: 4,
      rating: 4.8,
      paymentTerms: 'Net 30',
      categories: ['BOTANICAL', 'ESSENCE'],
    },
    {
      id: 'sup-002',
      name: 'Obsidian Cavern Miners Co.',
      code: 'OCM-02',
      contactEmail: 'supply@obsidianminers.realm',
      contactPhone: '+1 (555) 392-1144',
      leadTimeDays: 7,
      rating: 4.5,
      paymentTerms: 'Net 15',
      categories: ['MINERAL'],
    },
    {
      id: 'sup-003',
      name: 'Midnight Aviary & Chiroptera',
      code: 'MAC-03',
      contactEmail: 'batwings@midnightaviary.realm',
      contactPhone: '+1 (555) 902-8819',
      leadTimeDays: 3,
      rating: 4.9,
      paymentTerms: 'Due on Receipt',
      categories: ['CREATURE'],
    },
    {
      id: 'sup-004',
      name: 'Alchemical Distillates Syndicate',
      code: 'ADS-04',
      contactEmail: 'orders@alchemicalsyndicate.realm',
      contactPhone: '+1 (555) 203-9941',
      leadTimeDays: 5,
      rating: 4.7,
      paymentTerms: 'Net 30',
      categories: ['SOLVENT', 'ESSENCE'],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leadTime, setLeadTime] = useState(4);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      contactEmail: email,
      contactPhone: phone,
      leadTimeDays: Number(leadTime),
      rating: 5.0,
      paymentTerms,
      categories: ['BOTANICAL'],
    };
    setSuppliers([newSup, ...suppliers]);
    setShowAddModal(false);
    setName('');
    setCode('');
    setEmail('');
    setPhone('');
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Truck className="w-7 h-7 text-potionPurple" />
              Supplier Management & Vendor Directory
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Maintain supplier SLAs, lead times, reliability ratings, and procurement terms.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-pumpkin hover:bg-pumpkin/90 text-white"
          >
            <PlusCircle className="w-4 h-4" />
            Add Supplier
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-paleLavender/40" />
          <input
            type="text"
            placeholder="Search suppliers by name or vendor code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-midnight/60 border border-potionPurple/20 rounded-lg text-sm text-paleLavender placeholder:text-paleLavender/30 focus:outline-none focus:border-potionPurple"
          />
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sup) => (
            <Card key={sup.id} className="p-5 space-y-4 hover:border-potionPurple/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{sup.name}</h3>
                  <span className="text-xs font-mono text-pumpkin">{sup.code}</span>
                </div>
                <div className="flex items-center gap-1 bg-midnight/80 px-2 py-1 rounded border border-potionPurple/20 text-xs font-semibold text-yellow-400">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  <span>{sup.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-midnight/40 p-3 rounded-lg border border-potionPurple/15">
                <div className="flex items-center gap-2 text-paleLavender/80">
                  <Clock className="w-3.5 h-3.5 text-potionPurple" />
                  <span>Lead Time: <strong className="text-white">{sup.leadTimeDays} days</strong></span>
                </div>
                <div className="text-paleLavender/80">
                  <span>Terms: <strong className="text-white">{sup.paymentTerms}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-paleLavender/80 col-span-2">
                  <Mail className="w-3.5 h-3.5 text-potionPurple" />
                  <span className="truncate">{sup.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-paleLavender/80 col-span-2">
                  <Phone className="w-3.5 h-3.5 text-potionPurple" />
                  <span>{sup.contactPhone}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-wrap gap-1">
                  {sup.categories.map((c) => (
                    <Badge key={c} variant="outline" className="text-[10px]">
                      {c}
                    </Badge>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-potionPurple hover:underline h-7 px-2">
                  View Contracts
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Supplier Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 bg-ink border border-potionPurple/30 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-potionPurple" />
                  Add New Supplier
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleAddSupplier} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starfall Reagents Ltd."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      Vendor Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SRL-05"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-xs text-paleLavender focus:outline-none focus:border-potionPurple font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      required
                      value={leadTime}
                      onChange={(e) => setLeadTime(Number(e.target.value))}
                      className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-xs text-paleLavender focus:outline-none focus:border-potionPurple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="orders@starfall.realm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 019-2831"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-xs text-paleLavender focus:outline-none focus:border-potionPurple"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-potionPurple/15">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-potionPurple hover:bg-potionPurple/90 text-white flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save Supplier
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

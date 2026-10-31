'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  Settings,
  Store,
  User,
  Key,
  CheckCircle2,
  Copy,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, activeTenant } = useAuth();

  const [activeTab, setActiveTab] = useState<'SHOP' | 'PROFILE' | 'DEVELOPER'>('SHOP');

  // Shop settings state
  const [shopName, setShopName] = useState(activeTenant?.name || 'Apothecary Guild Apex');
  const [currency, setCurrency] = useState('USD');
  const [defaultSafetyStock, setDefaultSafetyStock] = useState(10);
  const [autoReorderAlerts, setAutoReorderAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // User profile state
  const [userName, setUserName] = useState(user?.displayName || 'Archmage Theron');
  const [userEmail] = useState(user?.email || 'owner@potionpulse.io');

  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Settings className="w-7 h-7 text-potionPurple" />
              Settings & Workspace Preferences
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Configure tenant parameters, notification policies, and developer API connectivity.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-potionPurple/20 gap-2">
          <button
            onClick={() => setActiveTab('SHOP')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'SHOP'
                ? 'border-potionPurple text-white'
                : 'border-transparent text-paleLavender/60 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            Shop & Apothecary
          </button>
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'PROFILE'
                ? 'border-potionPurple text-white'
                : 'border-transparent text-paleLavender/60 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            User Profile
          </button>
          <button
            onClick={() => setActiveTab('DEVELOPER')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'DEVELOPER'
                ? 'border-potionPurple text-white'
                : 'border-transparent text-paleLavender/60 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            Developer & API
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-cauldronGreen/15 border border-cauldronGreen/30 rounded-lg text-xs text-cauldronGreen flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        {/* Tab 1: Shop Settings */}
        {activeTab === 'SHOP' && (
          <form onSubmit={handleSaveShopSettings} className="space-y-6 max-w-2xl">
            <Card className="p-6 space-y-4 bg-midnight/50 border border-potionPurple/25">
              <h3 className="font-bold text-white text-base">Shop Identity</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Shop / Tenant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full p-2.5 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-white focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      Operating Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full p-2.5 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CRYSTAL">Crystal Shards (✦)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      Default Safety Stock Buffer
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={defaultSafetyStock}
                      onChange={(e) => setDefaultSafetyStock(Number(e.target.value))}
                      className="w-full p-2.5 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-potionPurple/15 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Automated Restock Notifications</h4>
                  <p className="text-[11px] text-paleLavender/60">
                    Send high-priority alerts when an ingredient has less than 48 hours of cover.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoReorderAlerts}
                  onChange={(e) => setAutoReorderAlerts(e.target.checked)}
                  className="w-4 h-4 rounded border-potionPurple/30 accent-potionPurple"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="bg-potionPurple hover:bg-potionPurple/90 text-white">
                  Save Changes
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* Tab 2: User Profile */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-6 max-w-2xl">
            <Card className="p-6 space-y-4 bg-midnight/50 border border-potionPurple/25">
              <h3 className="font-bold text-white text-base">Account Credentials</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-2.5 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-white focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userEmail}
                    className="w-full p-2.5 bg-midnight/30 border border-potionPurple/10 rounded-lg text-sm text-paleLavender/50 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button className="bg-potionPurple hover:bg-potionPurple/90 text-white">
                  Update Profile
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Developer & API */}
        {activeTab === 'DEVELOPER' && (
          <div className="space-y-6 max-w-3xl">
            <Card className="p-6 space-y-4 bg-midnight/50 border border-potionPurple/25">
              <h3 className="font-bold text-white text-base">Apothecary Integration Endpoints</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-paleLavender/60 mb-1">
                    REST API Base URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="http://localhost:4000/api/v1"
                      className="w-full p-2.5 bg-midnight/70 border border-potionPurple/20 rounded-lg text-white font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('http://localhost:4000/api/v1')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-paleLavender/60 mb-1">
                    WebSocket Gateway URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="ws://localhost:4000/realtime"
                      className="w-full p-2.5 bg-midnight/70 border border-potionPurple/20 rounded-lg text-white font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('ws://localhost:4000/realtime')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-paleLavender/60 mb-1">
                    Active Tenant ID Header
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={activeTenant?.id || '672416380000000000000001'}
                      className="w-full p-2.5 bg-midnight/70 border border-potionPurple/20 rounded-lg text-white font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(activeTenant?.id || '672416380000000000000001')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

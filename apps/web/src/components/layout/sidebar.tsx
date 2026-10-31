'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Layers,
  ArrowLeftRight,
  PlusCircle,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Flame,
  Truck,
  FileText,
  FlaskConical,
  BarChart3,
  Bell,
  Users,
  Database,
  History,
  Settings,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'Core Operations',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Inventory Catalog', href: '/inventory', icon: Package },
      { label: 'Shelves & Locations', href: '/inventory/locations', icon: Layers },
      { label: 'Stock Movements', href: '/inventory/movements', icon: ArrowLeftRight },
      { label: 'Receive / Adjust', href: '/inventory/adjust', icon: PlusCircle },
      { label: 'Sales Orders', href: '/sales', icon: ShoppingCart },
      { label: 'Point of Sale', href: '/sales/new', icon: PlusCircle },
    ],
  },
  {
    title: 'Inventory Intelligence',
    items: [
      { label: 'Demand Forecasting', href: '/forecasting', icon: TrendingUp },
      { label: 'Restock Engine', href: '/restock', icon: Package },
      { label: 'Anomaly Center', href: '/anomalies', icon: AlertTriangle },
      { label: 'Midnight Curse', href: '/events', icon: Flame, badge: '3x Event' },
    ],
  },
  {
    title: 'Procurement & Recipes',
    items: [
      { label: 'Suppliers', href: '/suppliers', icon: Truck },
      { label: 'Purchase Orders', href: '/purchase-orders', icon: FileText },
      { label: 'Potion Recipes', href: '/recipes', icon: FlaskConical },
    ],
  },
  {
    title: 'System & Platform',
    items: [
      { label: 'Analytics & Reports', href: '/analytics', icon: BarChart3 },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Team & RBAC', href: '/team', icon: Users },
      { label: 'Import / Export', href: '/import-export', icon: Database },
      { label: 'Audit Trail', href: '/audit', icon: History },
      { label: 'Shop Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { activeTenant, memberships, switchTenant } = useAuth();

  return (
    <aside
      className={cn(
        'w-64 bg-[#171321] border-r border-white/10 flex flex-col h-screen sticky top-0 overflow-y-auto selection:bg-potionPurple',
        className,
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-potionPurple to-violetGlow flex items-center justify-center shadow-lg shadow-potionPurple/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              PotionPulse
            </h1>
            <p className="text-[10px] text-mutedText font-medium">Predict. Manage. Thrive.</p>
          </div>
        </Link>
      </div>

      {/* Tenant Switcher Selector */}
      <div className="p-3 border-b border-white/5 bg-[#241638]/40">
        <div className="text-[10px] font-bold uppercase tracking-wider text-mutedText px-2 mb-1.5 flex justify-between items-center">
          <span>Active Shop</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-potionPurple/20 text-violetGlow font-semibold uppercase">
            {activeTenant?.role || 'Staff'}
          </span>
        </div>
        <div className="relative">
          <select
            value={activeTenant?.id || ''}
            onChange={(e) => switchTenant(e.target.value)}
            className="w-full text-xs font-semibold bg-[#171321] border border-white/10 text-white rounded-lg px-2.5 py-1.5 appearance-none focus:outline-none focus:border-potionPurple cursor-pointer"
          >
            {memberships.map((m) => (
              <option key={m.tenantId} value={m.tenantId}>
                {m.tenantName} ({m.role})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-mutedText absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-mutedText/80 px-2 mb-2">
              {section.title}
            </h3>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-potionPurple/25 text-white border border-potionPurple/40 shadow-sm font-semibold'
                      : 'text-mutedText hover:text-white hover:bg-white/5',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('w-4 h-4', isActive ? 'text-violetGlow' : 'text-mutedText')} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emberOrange/20 text-emberOrange border border-emberOrange/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/10 text-[10px] text-mutedText flex justify-between items-center">
        <span>MSOT Track 01 Baseline</span>
        <span className="text-emerald-400 flex items-center gap-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>
    </aside>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSocket } from '@/lib/socket-context';
import { Button } from '@/components/ui/button';
import {
  Bell,
  LogOut,
  User,
  Radio,
  ExternalLink,
  Plus,
} from 'lucide-react';

export function Header() {
  const { user, activeTenant, logout } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="h-16 border-b border-white/10 bg-[#171321]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Workspace Quick Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-tight">
            {activeTenant?.name || 'Potion Shop Workspace'}
          </span>
          <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-mutedText px-2 py-0.5 rounded">
            {activeTenant?.slug || 'workspace'}
          </span>
        </div>

        {/* Live WebSocket Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
          <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-[10px] font-medium text-mutedText">
            {isConnected ? 'Real-Time Sync Active' : 'Connecting Sync...'}
          </span>
        </div>
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center gap-3">
        <Link href="/sales/new">
          <Button size="sm" variant="primary" className="hidden md:flex items-center gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Record Sale
          </Button>
        </Link>

        <Link href="/inventory/adjust">
          <Button size="sm" variant="secondary" className="hidden md:flex items-center gap-1.5 text-xs">
            Receive Stock
          </Button>
        </Link>

        <Link
          href="http://localhost:4000/api/docs"
          target="_blank"
          className="text-xs text-mutedText hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
        >
          <span>OpenAPI Docs</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <Link href="/notifications" className="relative p-2 text-mutedText hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-potionPurple" />
        </Link>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-potionPurple/20 border border-potionPurple/40 flex items-center justify-center text-xs font-bold text-violetGlow">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-white leading-tight">
              {user?.displayName || 'Alchemist'}
            </div>
            <div className="text-[10px] text-mutedText leading-tight">
              {user?.email || 'user@potionpulse.dev'}
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-mutedText hover:text-dangerRed rounded-lg hover:bg-dangerRed/10 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

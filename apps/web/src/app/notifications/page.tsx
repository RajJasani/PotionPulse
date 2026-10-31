'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import {
  Bell,
  AlertTriangle,
  FileText,
  ShieldCheck,
  CheckCheck,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'STOCK_ALERT' | 'PO_STATUS' | 'SECURITY_AUDIT' | 'SEASONAL_SPIKE';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkHref?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-001',
      type: 'STOCK_ALERT',
      title: 'Critical Stockout Risk: Ghost Pepper Essence',
      message: 'On-hand balance is down to 4 ml (&le;24 hours of cover). Recommended reorder: 40 ml.',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      isRead: false,
      linkHref: '/restock',
    },
    {
      id: 'notif-002',
      type: 'SEASONAL_SPIKE',
      title: 'Midnight Curse 3.0x Multiplier Engaged',
      message: 'Demand models have recalculated safety stock targets for Bat Wings and Mandrake Root.',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      isRead: false,
      linkHref: '/forecasting',
    },
    {
      id: 'notif-003',
      type: 'PO_STATUS',
      title: 'Purchase Order Delivered: PO-2026-079',
      message: 'Obsidian Cavern Miners Co. fulfilled 100g Obsidian Dust. Ledger updated automatically.',
      timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
      isRead: true,
      linkHref: '/purchase-orders',
    },
    {
      id: 'notif-004',
      type: 'SECURITY_AUDIT',
      title: 'New Staff Member Onboarded',
      message: 'User Apprentice Lyra was granted INVENTORY_STAFF permissions by Shop Owner.',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      isRead: true,
      linkHref: '/team',
    },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Bell className="w-7 h-7 text-potionPurple" />
              Intelligence Notifications & Real-Time Alerts
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Active alerts from stockout monitors, anomaly heuristics, and procurement pipelines.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-cauldronGreen" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <Card className="p-0 overflow-hidden divide-y divide-potionPurple/15">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`p-4 flex items-start gap-4 transition-colors cursor-pointer ${
                notif.isRead ? 'bg-midnight/30 hover:bg-midnight/50' : 'bg-potionPurple/10 hover:bg-potionPurple/15'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {notif.type === 'STOCK_ALERT' && (
                  <div className="w-9 h-9 rounded-lg bg-crimson/20 border border-crimson/30 flex items-center justify-center text-crimson">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                {notif.type === 'SEASONAL_SPIKE' && (
                  <div className="w-9 h-9 rounded-lg bg-pumpkin/20 border border-pumpkin/30 flex items-center justify-center text-pumpkin">
                    <Flame className="w-4 h-4" />
                  </div>
                )}
                {notif.type === 'PO_STATUS' && (
                  <div className="w-9 h-9 rounded-lg bg-cauldronGreen/20 border border-cauldronGreen/30 flex items-center justify-center text-cauldronGreen">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                {notif.type === 'SECURITY_AUDIT' && (
                  <div className="w-9 h-9 rounded-lg bg-potionPurple/20 border border-potionPurple/30 flex items-center justify-center text-potionPurple">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-white">{notif.title}</h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-pumpkin animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] text-paleLavender/50 font-mono">
                    {formatDateTime(notif.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-paleLavender/70">{notif.message}</p>

                {notif.linkHref && (
                  <div className="pt-2">
                    <Link
                      href={notif.linkHref}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-potionPurple hover:text-amethyst"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}

'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@potionpulse/contracts';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  Mail,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INVITED';
  joinedAt: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'mem-001',
      name: 'Archmage Theron',
      email: 'owner@potionpulse.io',
      role: UserRole.OWNER,
      status: 'ACTIVE',
      joinedAt: '2026-10-01',
    },
    {
      id: 'mem-002',
      name: 'Elder Alchemist Morgana',
      email: 'morgana@potionpulse.io',
      role: UserRole.MANAGER,
      status: 'ACTIVE',
      joinedAt: '2026-10-12',
    },
    {
      id: 'mem-003',
      name: 'Apprentice Lyra',
      email: 'lyra@potionpulse.io',
      role: UserRole.STAFF,
      status: 'ACTIVE',
      joinedAt: '2026-10-25',
    },
    {
      id: 'mem-004',
      name: 'Scholar Vane',
      email: 'vane@potionpulse.io',
      role: UserRole.ANALYST,
      status: 'INVITED',
      joinedAt: '2026-10-31',
    },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.STAFF);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: inviteEmail.split('@')[0] || 'New Member',
      email: inviteEmail,
      role: inviteRole,
      status: 'INVITED',
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setMembers([...members, newMember]);
    setShowInviteModal(false);
    setInviteEmail('');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-potionPurple" />
              Team Members & Role-Based Access Control
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Enforce least-privilege security policies across your apothecary staff and analysts.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 bg-pumpkin hover:bg-pumpkin/90 text-white"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        </div>

        {/* Members Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-paleLavender">
              <thead className="bg-midnight/70 text-xs uppercase tracking-wider text-paleLavender/60 border-b border-potionPurple/15">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-potionPurple/10">
                {members.map((mem) => (
                  <tr key={mem.id} className="hover:bg-potionPurple/5 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{mem.name}</td>
                    <td className="py-3 px-4 text-xs font-mono text-paleLavender/80">{mem.email}</td>
                    <td className="py-3 px-4">
                      {mem.role === UserRole.OWNER && (
                        <Badge variant="warning" className="bg-pumpkin text-black font-bold">
                          Owner
                        </Badge>
                      )}
                      {mem.role === UserRole.MANAGER && (
                        <Badge variant="success">Manager</Badge>
                      )}
                      {mem.role === UserRole.STAFF && (
                        <Badge variant="outline">Inventory Staff</Badge>
                      )}
                      {mem.role === UserRole.ANALYST && (
                        <Badge variant="outline" className="border-paleLavender/30">
                          Analyst (Read-Only)
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={mem.status === 'ACTIVE' ? 'success' : 'outline'}>
                        {mem.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-paleLavender/60">{mem.joinedAt}</td>
                    <td className="py-3 px-4 text-right">
                      {mem.role !== UserRole.OWNER && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-crimson hover:bg-crimson/10">
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Role Privileges Cards */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-potionPurple" />
            Role Permission Matrix
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 space-y-2 bg-midnight/40 border border-pumpkin/30">
              <span className="font-bold text-sm text-pumpkin">Shop Owner</span>
              <p className="text-xs text-paleLavender/70">
                Complete administrative authority. Billing, shop deletion, role promotions, and ledger reconciliation overrides.
              </p>
            </Card>

            <Card className="p-4 space-y-2 bg-midnight/40 border border-potionPurple/25">
              <span className="font-bold text-sm text-white">Shop Manager</span>
              <p className="text-xs text-paleLavender/70">
                Purchase order approvals, supplier contracts, inventory catalog CRUD, stock transfers, and customer sale refunds.
              </p>
            </Card>

            <Card className="p-4 space-y-2 bg-midnight/40 border border-potionPurple/25">
              <span className="font-bold text-sm text-white">Inventory Staff</span>
              <p className="text-xs text-paleLavender/70">
                Point of Sale terminal cashier, stock receiving, daily count adjustments, and shelf location movements.
              </p>
            </Card>

            <Card className="p-4 space-y-2 bg-midnight/40 border border-potionPurple/25">
              <span className="font-bold text-sm text-white">Read-Only Analyst</span>
              <p className="text-xs text-paleLavender/70">
                Dashboard monitoring, demand forecasting curves, executive analytics, and data export. Zero write permissions.
              </p>
            </Card>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 bg-ink border border-potionPurple/30 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-pumpkin" />
                  Invite Team Member
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-paleLavender/40" />
                    <input
                      type="email"
                      required
                      placeholder="alchemist@shop.realm"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Select Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                  >
                    <option value={UserRole.STAFF}>Inventory Staff</option>
                    <option value={UserRole.MANAGER}>Shop Manager</option>
                    <option value={UserRole.ANALYST}>Read-Only Analyst</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-potionPurple/15">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-pumpkin hover:bg-pumpkin/90 text-white flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Send Invitation
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

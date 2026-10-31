'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#171321] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-potionPurple to-violetGlow flex items-center justify-center animate-pulse mb-4 shadow-xl shadow-potionPurple/40">
          <div className="w-4 h-4 rounded-full bg-white" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-paleLavender">
          Resolving PotionPulse Workspace...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#171321] flex text-paleLavender selection:bg-potionPurple selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

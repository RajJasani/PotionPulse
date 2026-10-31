'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('hexley@potionpulse.dev');
    setPassword('HexleyMagic2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#171321] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[130px] pointer-events-none opacity-25"
        style={{ background: 'radial-gradient(circle, #7046C8 0%, #241638 70%, transparent 100%)' }}
      />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-potionPurple to-violetGlow flex items-center justify-center shadow-lg shadow-potionPurple/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">PotionPulse</span>
          </Link>
          <p className="text-xs text-mutedText">Multi-Tenant Inventory Intelligence Platform</p>
        </div>

        <Card className="border-white/10 bg-[#241638]/70 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Sign in to your shop</CardTitle>
            <CardDescription>
              Enter your credentials to access your inventory and demand intelligence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-dangerRed/15 border border-dangerRed/40 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="hexley@potionpulse.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
                Access Shop Workspace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#241638] px-3 text-xs uppercase text-mutedText font-semibold">
                Evaluation Options
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 text-xs"
              onClick={fillDemoAccount}
            >
              <Zap className="w-3.5 h-3.5 text-emberOrange" />
              Fill Demo Credentials (Madam Hexley)
            </Button>

            <div className="mt-6 text-center text-xs text-mutedText">
              Don't have a shop workspace yet?{' '}
              <Link href="/auth/register" className="text-violetGlow hover:underline font-semibold">
                Create new shop
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-mutedText flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Tenant-isolated server session with encrypted RBAC</span>
        </div>
      </div>
    </div>
  );
}

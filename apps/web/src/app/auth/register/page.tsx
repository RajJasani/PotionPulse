'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, Store } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError('Please provide name, email, and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register(email, password, displayName, shopName || undefined);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
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
            <CardTitle className="text-xl">Set up your Potion Shop</CardTitle>
            <CardDescription>
              Create an owner account and provision your isolated shop workspace.
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
                label="Your Full Name"
                placeholder="Madam Hexley"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              <Input
                label="Shop / Business Name"
                placeholder="Hexley's Potion Pantry"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                helperText="Leave empty to use default name"
              />

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
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
                Provision Shop Workspace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-mutedText">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-violetGlow hover:underline font-semibold">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-mutedText flex items-center justify-center gap-1.5">
          <Store className="w-4 h-4 text-violetGlow" />
          <span>Includes sample shelf location & transactional ledger initialization</span>
        </div>
      </div>
    </div>
  );
}

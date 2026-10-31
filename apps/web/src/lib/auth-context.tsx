'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api-client';
import { UserRole } from '@potionpulse/contracts';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  isSuperAdmin?: boolean;
}

export interface ActiveTenant {
  id: string;
  name: string;
  slug: string;
  role: UserRole;
}

export interface TenantMembership {
  id?: string;
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  activeTenant: ActiveTenant | null;
  memberships: TenantMembership[];
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, shopName?: string) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'potionpulse_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTenant, setActiveTenant] = useState<ActiveTenant | null>(null);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setActiveTenant(parsed.activeTenant);
        setMemberships(parsed.memberships || []);
        setAccessToken(parsed.accessToken);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (
    userData: UserProfile,
    tenantData: ActiveTenant | null,
    members: TenantMembership[],
    token: string,
    refreshTok?: string,
  ) => {
    setUser(userData);
    setActiveTenant(tenantData);
    setMemberships(members);
    setAccessToken(token);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: userData,
        activeTenant: tenantData,
        memberships: members,
        accessToken: token,
        refreshToken: refreshTok,
      }),
    );
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient<{
        user: UserProfile;
        activeTenant: ActiveTenant;
        memberships: TenantMembership[];
        accessToken: string;
        refreshToken: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { user, activeTenant, memberships, accessToken, refreshToken } = res.data;
      saveSession(user, activeTenant, memberships, accessToken, refreshToken);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string, shopName?: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient<{
        user: UserProfile;
        activeTenant: ActiveTenant;
        accessToken: string;
        refreshToken: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName, shopName }),
      });

      const { user, activeTenant, accessToken, refreshToken } = res.data;
      const initialMembership: TenantMembership = {
        tenantId: activeTenant.id,
        tenantName: activeTenant.name,
        tenantSlug: activeTenant.slug,
        role: activeTenant.role,
      };

      saveSession(user, activeTenant, [initialMembership], accessToken, refreshToken);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setActiveTenant(null);
    setMemberships([]);
    setAccessToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/auth/login');
  };

  const switchTenant = (tenantId: string) => {
    const target = memberships.find((m) => m.tenantId === tenantId);
    if (target) {
      const updatedTenant: ActiveTenant = {
        id: target.tenantId,
        name: target.tenantName,
        slug: target.tenantSlug || '',
        role: target.role,
      };
      setActiveTenant(updatedTenant);
      if (user && accessToken) {
        saveSession(user, updatedTenant, memberships, accessToken);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeTenant,
        memberships,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

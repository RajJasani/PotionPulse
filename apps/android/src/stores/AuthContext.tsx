import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserRole } from '@potionpulse/contracts';
import { api } from '../services/api';
import { storage } from '../services/storage';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  isSuperAdmin?: boolean;
}

export interface TenantMembership {
  id: string;
  name: string;
  slug: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  activeTenant: TenantMembership | null;
  tenants: TenantMembership[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, shopName?: string) => Promise<void>;
  loginWithGoogle: (idToken?: string) => Promise<void>;
  selectTenant: (tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTenant, setActiveTenant] = useState<TenantMembership | null>(null);
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore stored session on launch
  const bootstrapSession = useCallback(async () => {
    try {
      const storedToken = await storage.getItem('pp_access_token');
      const storedTenantId = await storage.getItem('pp_tenant_id');

      if (storedToken) {
        setAccessToken(storedToken);
        // Verify token with me endpoint
        const res = await api.request<any>('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          const userTenants: TenantMembership[] = (res.data.tenants || []).map((t: any) => ({
            id: t.tenantId || t.id,
            name: t.name || t.tenantName || 'Apothecary Shop',
            slug: t.slug || 'shop',
            role: t.role || UserRole.STAFF,
          }));
          setTenants(userTenants);

          const matching = userTenants.find((t) => t.id === storedTenantId) || userTenants[0];
          if (matching) {
            setActiveTenant(matching);
            await storage.setItem('pp_tenant_id', matching.id);
          }
        }
      }
    } catch {
      // Token expired or invalid
      await storage.removeItem('pp_access_token');
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.request<any>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      const { token, user: authedUser, tenants: userTenants } = res.data;
      setAccessToken(token);
      setUser(authedUser);
      await storage.setItem('pp_access_token', token);

      const parsedTenants: TenantMembership[] = (userTenants || []).map((t: any) => ({
        id: t.tenantId || t.id,
        name: t.name || t.tenantName || 'My Apothecary',
        slug: t.slug || 'shop',
        role: t.role || UserRole.STAFF,
      }));
      setTenants(parsedTenants);

      if (parsedTenants.length > 0) {
        setActiveTenant(parsedTenants[0]);
        await storage.setItem('pp_tenant_id', parsedTenants[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string, shopName?: string) => {
    setIsLoading(true);
    try {
      const res = await api.request<any>('/auth/register', {
        method: 'POST',
        body: { email, password, displayName, shopName },
      });
      const { token, user: newUser, tenant } = res.data;
      setAccessToken(token);
      setUser(newUser);
      await storage.setItem('pp_access_token', token);

      if (tenant) {
        const tenantObj: TenantMembership = {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          role: UserRole.OWNER,
        };
        setTenants([tenantObj]);
        setActiveTenant(tenantObj);
        await storage.setItem('pp_tenant_id', tenant.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken?: string) => {
    setIsLoading(true);
    try {
      const res = await api.request<any>('/auth/google', {
        method: 'POST',
        body: { idToken: idToken || 'simulated-google-oauth-token-android' },
      });
      const { token, user: gUser, tenants: userTenants } = res.data;
      setAccessToken(token);
      setUser(gUser);
      await storage.setItem('pp_access_token', token);

      const parsed: TenantMembership[] = (userTenants || []).map((t: any) => ({
        id: t.tenantId || t.id,
        name: t.name || 'Google Apothecary',
        slug: t.slug || 'g-shop',
        role: t.role || UserRole.OWNER,
      }));
      setTenants(parsed);
      if (parsed.length > 0) {
        setActiveTenant(parsed[0]);
        await storage.setItem('pp_tenant_id', parsed[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectTenant = async (tenantId: string) => {
    const selected = tenants.find((t) => t.id === tenantId);
    if (selected) {
      setActiveTenant(selected);
      await storage.setItem('pp_tenant_id', selected.id);
    }
  };

  const logout = async () => {
    try {
      await api.request('/auth/logout', { method: 'POST', skipOfflineCheck: true }).catch(() => {});
    } finally {
      await storage.removeItem('pp_access_token');
      await storage.removeItem('pp_tenant_id');
      setAccessToken(null);
      setUser(null);
      setActiveTenant(null);
      setTenants([]);
      api.clearCache();
    }
  };

  const hasRole = (...requiredRoles: UserRole[]): boolean => {
    if (!activeTenant) return false;
    if (user?.isSuperAdmin) return true;
    return requiredRoles.includes(activeTenant.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        activeTenant,
        tenants,
        isAuthenticated: !!accessToken && !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        selectTenant,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

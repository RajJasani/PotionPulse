import { networkService } from './network';
import { storage } from './storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: any;

  constructor(status: number, message: string, code: string = 'API_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class OfflineWriteError extends Error {
  constructor(message = 'Inventory mutations require an active internet connection. Operation blocked by Online-Only Policy.') {
    super(message);
    this.name = 'OfflineWriteError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  skipOfflineCheck?: boolean;
}

interface CachedResponse<T> {
  data: T;
  meta?: any;
  cachedAt: string;
}

class ApiService {
  private cache: Map<string, CachedResponse<any>> = new Map();

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; meta?: any; fromCache?: boolean; cachedAt?: string }> {
    const {
      method = 'GET',
      body,
      params,
      headers = {},
      idempotencyKey,
      skipOfflineCheck = false,
    } = options;

    const isMutation = method !== 'GET';

    // Strict Online-Only Policy enforcement:
    // "Inventory mutations require an active internet connection.
    // When offline: Disable write operations. Do not silently queue inventory mutations."
    if (isMutation && !networkService.isOnline && !skipOfflineCheck) {
      throw new OfflineWriteError();
    }

    let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }

    // Retrieve active session token and tenant ID from secure storage
    const token = await storage.getItem('pp_access_token');
    const tenantId = await storage.getItem('pp_tenant_id');

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (tenantId) {
      reqHeaders['x-tenant-id'] = tenantId;
    }

    if (idempotencyKey) {
      reqHeaders['Idempotency-Key'] = idempotencyKey;
    }

    // If offline and request is GET, return cached data if available
    if (!networkService.isOnline && method === 'GET') {
      const cached = this.cache.get(url);
      if (cached) {
        return {
          data: cached.data,
          meta: cached.meta,
          fromCache: true,
          cachedAt: cached.cachedAt,
        };
      }
      throw new Error(`Device is offline and no cached summary is available for: ${endpoint}`);
    }

    try {
      const response = await fetch(url, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        let errJson: any;
        try {
          errJson = await response.json();
        } catch {
          // ignore
        }
        const message = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        const code = errJson?.error?.code || 'UNKNOWN_ERROR';
        throw new ApiError(response.status, message, code, errJson?.error?.details);
      }

      const json = await response.json();
      networkService.setOnlineStatus(true);

      // Cache GET responses
      if (method === 'GET') {
        this.cache.set(url, {
          data: json.data,
          meta: json.meta,
          cachedAt: new Date().toISOString(),
        });
      }

      return {
        data: json.data,
        meta: json.meta,
        fromCache: false,
      };
    } catch (err: any) {
      if (err instanceof ApiError || err instanceof OfflineWriteError) {
        throw err;
      }
      // Network transport failure -> mark offline
      networkService.setOnlineStatus(false);

      if (method === 'GET') {
        const cached = this.cache.get(url);
        if (cached) {
          return {
            data: cached.data,
            meta: cached.meta,
            fromCache: true,
            cachedAt: cached.cachedAt,
          };
        }
      }
      throw new Error(err.message || 'Network connection failed');
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export const api = new ApiService();


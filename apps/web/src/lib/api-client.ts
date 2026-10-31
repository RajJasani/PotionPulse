import { ApiErrorEnvelope } from '@potionpulse/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: Array<{ field?: string; message: string }>;
  public requestId?: string;

  constructor(status: number, envelope?: ApiErrorEnvelope) {
    const message = envelope?.error?.message || `API request failed with status ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope?.error?.code || 'UNKNOWN_ERROR';
    this.details = envelope?.error?.details;
    this.requestId = envelope?.error?.requestId;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  token?: string;
  tenantId?: string;
  idempotencyKey?: string;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: Record<string, any> }> {
  const { params, token, tenantId, idempotencyKey, headers = {}, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
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

  const response = await fetch(url, {
    ...customConfig,
    headers: reqHeaders,
  });

  if (!response.ok) {
    let errorData: ApiErrorEnvelope | undefined;
    try {
      errorData = await response.json();
    } catch {
      // Body is not JSON
    }
    throw new ApiError(response.status, errorData);
  }

  return response.json();
}

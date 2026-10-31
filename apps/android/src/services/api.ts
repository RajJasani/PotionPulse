/**
 * Mobile API Service for Madam Hexley's Potion Pantry
 * Supports runtime-configurable backend URLs for physical devices and Android emulators.
 */

import {
  Ingredient,
  ProphecyStockout,
  ReorderRecommendation,
  Anomaly,
  PotionEvent,
  SaleCreate,
  SaleResponse,
  StockAdjustCreate,
  StockMovement,
  ForecastResponse,
  DemandHistoryResponse,
  EventCreate,
  Shelf,
} from '../types/api.types';
import { networkService } from './network';

export class OfflineWriteError extends Error {
  constructor(message = 'Network write error: backend unreachable.') {
    super(message);
    this.name = 'OfflineWriteError';
  }
}

// Default: 10.0.2.2 is Android Emulator host loopback; on physical device, use Wi-Fi LAN IP (e.g. 192.168.1.X:8000)
let currentBaseUrl = 'http://10.0.2.2:8000';

export const setMobileApiBaseUrl = (url: string) => {
  currentBaseUrl = url.replace(/\/$/, '');
};

export const getMobileApiBaseUrl = () => currentBaseUrl;

const request = async <T>(endpoint: string, options: any = {}): Promise<T> => {
  const method = (options.method || 'GET').toUpperCase();
  if (!networkService.isOnline && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    throw new OfflineWriteError('Device is offline. Mutation operations are blocked.');
  }

  const url = `${currentBaseUrl}/api${endpoint}`;
  let bodyData = options.body;
  if (bodyData && typeof bodyData === 'object' && !(bodyData instanceof FormData)) {
    bodyData = JSON.stringify(bodyData);
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(url, {
      ...options,
      body: bodyData,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `Arcane error: ${response.status} ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.detail) {
          errorDetail = errJson.detail;
        }
      } catch {
        // fallback
      }
      throw new Error(errorDetail);
    }
    return (await response.json()) as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new OfflineWriteError(`Connection timed out reaching ${currentBaseUrl}.`);
    }
    console.error(`Mobile API Error [${endpoint}]:`, err.message);
    throw err;
  }
};

export const mobileApi = {
  // Shelves
  getShelves: () => request<Shelf[]>('/shelves'),

  // Ingredients
  getIngredients: (params?: { shelf_id?: string; category?: string; low_stock_only?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.shelf_id) query.append('shelf_id', params.shelf_id);
    if (params?.category) query.append('category', params.category);
    if (params?.low_stock_only) query.append('low_stock_only', 'true');
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Ingredient[]>(`/ingredients${qs}`);
  },

  getIngredient: (id: string) => request<Ingredient>(`/ingredients/${id}`),

  // Sales & Stock
  recordSale: (data: SaleCreate) =>
    request<SaleResponse>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adjustStock: (data: StockAdjustCreate) =>
    request<StockMovement>('/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDemandHistory: (ingredientId: string, days: number = 30) =>
    request<DemandHistoryResponse>(`/sales/history/${ingredientId}?days=${days}`),

  // ML Intelligence
  getForecast: (ingredientId: string, horizonDays: number = 14) =>
    request<ForecastResponse>(`/forecasts/${ingredientId}?horizon_days=${horizonDays}`),

  getStockoutProphecies: () => request<ProphecyStockout[]>('/prophecies/stockouts'),

  getReorderRecommendations: () => request<ReorderRecommendation[]>('/recommendations/reorder'),

  // Anomalies
  getAnomalies: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<Anomaly[]>(`/anomalies${qs}`);
  },

  resolveAnomaly: (id: string, notes?: string) =>
    request<Anomaly>(`/anomalies/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status: 'RESOLVED', notes: notes || 'Resolved via Android App.' }),
    }),

  scanAnomalies: () =>
    request<{ status: string; total_anomalies_detected: number; new_anomalies_recorded: number }>(
      '/anomalies/scan',
      { method: 'POST' }
    ),

  // Events
  getEvents: (activeOnly: boolean = false) => {
    const qs = activeOnly ? '?active_only=true' : '';
    return request<PotionEvent[]>(`/events${qs}`);
  },

  createEvent: (data: EventCreate) =>
    request<PotionEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEvent: (id: string, data: EventCreate) =>
    request<PotionEvent>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  testConnection: async () => {
    return request<{ status: string; service: string }>('/');
  },

  request: <T>(endpoint: string, options: any = {}) => request<T>(endpoint, options),

  clearCache: () => {
    // Cache clearing hook for mobile offline layer
  },
};

export const api = mobileApi;

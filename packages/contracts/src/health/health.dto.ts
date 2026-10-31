export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthResponseData {
  status: HealthStatus;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'mocked' | 'pending';
    api: 'ok';
  };
}


import { Injectable } from '@nestjs/common';
import { HealthResponseData } from '@potionpulse/contracts';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  getHealth(): HealthResponseData {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      status: 'healthy',
      version: '0.1.0',
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: process.env.MONGODB_URI ? 'connected' : 'pending',
        api: 'ok',
      },
    };
  }
}


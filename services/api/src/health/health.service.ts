import { Injectable, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { HealthResponseData } from '@potionpulse/contracts';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(@Optional() @InjectConnection() private readonly connection?: Connection) {}

  getHealth(): HealthResponseData {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const isDbConnected = this.connection ? this.connection.readyState === 1 : false;

    return {
      status: 'healthy',
      version: '0.1.0',
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: isDbConnected ? 'connected' : process.env.MONGODB_URI ? 'connected' : 'pending',
        api: 'ok',
      },
    };
  }
}

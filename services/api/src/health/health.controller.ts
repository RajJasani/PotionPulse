import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiSuccessEnvelope, HealthResponseData } from '@potionpulse/contracts';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'System health check and uptime probe' })
  @ApiResponse({
    status: 200,
    description: 'Service is operational',
    schema: {
      example: {
        data: {
          status: 'healthy',
          version: '0.1.0',
          uptimeSeconds: 42,
          timestamp: '2026-10-31T23:50:00.000Z',
          environment: 'development',
          services: {
            database: 'connected',
            api: 'ok',
          },
        },
      },
    },
  })
  getHealth(): ApiSuccessEnvelope<HealthResponseData> {
    const data = this.healthService.getHealth();
    return {
      data,
      meta: {
        timestamp: data.timestamp,
      },
    };
  }
}


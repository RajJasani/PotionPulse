import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AnomaliesService } from './anomalies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';

@ApiTags('Anomalies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory anomalies and alerts' })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'acknowledged', 'resolved', 'false_positive'] })
  async listAnomalies(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('status') status?: string,
  ) {
    const data = await this.anomaliesService.listAnomalies(tenant.tenantId, status);
    return { data };
  }

  @Post('scan')
  @ApiOperation({ summary: 'Trigger an on-demand statistical anomaly scan across inventory' })
  async scanAnomalies(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.anomaliesService.scanAnomaliesForTenant(tenant.tenantId);
    return { data, count: data.length };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status of an anomaly (acknowledge, resolve, or mark false positive)' })
  @ApiParam({ name: 'id', description: 'Anomaly record ID' })
  async updateStatus(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
    @Body() body: { status: 'acknowledged' | 'resolved' | 'false_positive'; resolutionNotes?: string },
  ) {
    const data = await this.anomaliesService.updateAnomalyStatus(
      tenant.tenantId,
      id,
      body.status,
      body.resolutionNotes,
    );
    return { data };
  }
}

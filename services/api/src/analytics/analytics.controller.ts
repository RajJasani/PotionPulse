import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overview dashboard KPIs (low stock, orders, inventory totals)' })
  async getOverview(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.analyticsService.getOverviewMetrics(tenant.tenantId);
    return { data };
  }

  @Get('demand')
  @ApiOperation({ summary: 'Get aggregated historical sales demand series per day and ingredient' })
  @ApiQuery({ name: 'ingredientId', required: false })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getDemand(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('ingredientId') ingredientId?: string,
    @Query('days') days?: number,
  ) {
    const data = await this.analyticsService.getDemandSeries(tenant.tenantId, {
      ingredientId,
      days,
    });
    return { data };
  }
}

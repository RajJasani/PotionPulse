import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';

@ApiTags('Analytics & Reports')
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

  @Get('wastage')
  @ApiOperation({ summary: 'Get comprehensive inventory wastage and brewing loss report' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Evaluation window in days (default 30)' })
  async getWastage(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('days') days?: number,
  ) {
    const data = await this.analyticsService.getWastageAnalysis(tenant.tenantId, days || 30);
    return { data };
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Get supplier performance report, fulfillment rates, and lead times' })
  async getSupplierPerformance(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.analyticsService.getSupplierPerformanceReport(tenant.tenantId);
    return { data };
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Period-over-period comparative analytics (current vs previous window)' })
  @ApiQuery({ name: 'periodDays', required: false, type: Number, description: 'Comparison period in days (default 7)' })
  async getComparison(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('periodDays') periodDays?: number,
  ) {
    const data = await this.analyticsService.getPeriodOverPeriodComparison(tenant.tenantId, periodDays || 7);
    return { data };
  }
}

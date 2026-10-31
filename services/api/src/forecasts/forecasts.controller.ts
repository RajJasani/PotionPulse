import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ForecastsService } from './forecasts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';

@ApiTags('Forecasts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('forecasts')
export class ForecastsController {
  constructor(private readonly forecastsService: ForecastsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get multi-ingredient inventory forecast summary and stockout risks' })
  async getSummary(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.forecastsService.getTenantForecastSummary(tenant.tenantId);
    return { data };
  }

  @Get('ingredient/:id')
  @ApiOperation({ summary: 'Generate detailed statistical forecast and replenishment recommendation' })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiQuery({ name: 'horizon', required: false, description: 'Forecast horizon in days (e.g. 7, 14, 30)' })
  async getIngredientForecast(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') ingredientId: string,
    @Query('horizon') horizon = '14',
  ) {
    const horizonDays = parseInt(horizon, 10) || 14;
    const data = await this.forecastsService.generateIngredientForecast(
      tenant.tenantId,
      ingredientId,
      horizonDays,
    );
    return { data };
  }
}

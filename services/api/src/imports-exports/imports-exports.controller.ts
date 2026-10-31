import { Body, Controller, Get, Header, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImportsExportsService } from './imports-exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImportCsvDto } from './dto/import-export.dto';

@ApiTags('Import & Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('imports-exports')
export class ImportsExportsController {
  constructor(private readonly importExportService: ImportsExportsService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview and validate CSV import without committing changes' })
  async previewImport(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: any,
    @Body() dto: ImportCsvDto,
  ) {
    const data = await this.importExportService.processIngredientCsv(
      tenant.tenantId,
      user?.userId || 'unknown',
      { ...dto, dryRun: true },
    );
    return { data };
  }

  @Post('import')
  @ApiOperation({ summary: 'Execute CSV import of ingredients and initial stock positions' })
  async executeImport(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: any,
    @Body() dto: ImportCsvDto,
  ) {
    const data = await this.importExportService.processIngredientCsv(
      tenant.tenantId,
      user?.userId || 'unknown',
      { ...dto, dryRun: false },
    );
    return { data };
  }

  @Get('inventory.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="inventory-overview.csv"')
  @ApiOperation({ summary: 'Download CSV export of active inventory and stock positions' })
  async exportInventory(@ActiveTenant() tenant: ActiveTenantContext) {
    return this.importExportService.exportInventoryCsv(tenant.tenantId);
  }

  @Get('forecasts.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="demand-forecasts.csv"')
  @ApiOperation({ summary: 'Download CSV export of AI demand forecasts and replenishment recommendations' })
  async exportForecasts(@ActiveTenant() tenant: ActiveTenantContext) {
    return this.importExportService.exportForecastsCsv(tenant.tenantId);
  }
}

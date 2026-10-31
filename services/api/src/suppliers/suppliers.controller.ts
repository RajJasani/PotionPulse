import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { CatalogItemDto, CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'List suppliers for active tenant' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  async listSuppliers(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('status') status?: string,
  ) {
    const data = await this.suppliersService.listSuppliers(tenant.tenantId, status);
    return { data };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new supplier profile with catalog items' })
  async createSupplier(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Body() dto: CreateSupplierDto,
  ) {
    const data = await this.suppliersService.createSupplier(tenant.tenantId, dto);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific supplier' })
  @ApiParam({ name: 'id', description: 'Supplier record ID' })
  async getSupplier(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.suppliersService.getSupplier(tenant.tenantId, id);
    return { data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier details or performance indicators' })
  @ApiParam({ name: 'id', description: 'Supplier record ID' })
  async updateSupplier(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    const data = await this.suppliersService.updateSupplier(tenant.tenantId, id, dto);
    return { data };
  }

  @Post(':id/catalog')
  @ApiOperation({ summary: 'Add or update catalog item (price, MOQ, pack size) for a supplier' })
  @ApiParam({ name: 'id', description: 'Supplier record ID' })
  async addOrUpdateCatalogItem(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
    @Body() dto: CatalogItemDto,
  ) {
    const data = await this.suppliersService.addOrUpdateCatalogItem(tenant.tenantId, id, dto);
    return { data };
  }
}

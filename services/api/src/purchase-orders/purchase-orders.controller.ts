import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreatePurchaseOrderDto,
  CreateRecommendedPODto,
  ReceivePurchaseOrderDto,
} from './dto/purchase-order.dto';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase orders for active tenant' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'submitted', 'partially_received', 'received', 'cancelled'] })
  async listPOs(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('status') status?: string,
  ) {
    const data = await this.poService.listPOs(tenant.tenantId, status);
    return { data };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new purchase order' })
  async createPO(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: any,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    const data = await this.poService.createPO(tenant.tenantId, user?.userId || user?._id || 'unknown', dto);
    return { data };
  }

  @Post('recommended')
  @ApiOperation({ summary: 'Generate a recommended purchase order directly from AI forecast & restock deficits' })
  async createRecommendedPO(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: any,
    @Body() dto: CreateRecommendedPODto,
  ) {
    const data = await this.poService.createRecommendedPO(
      tenant.tenantId,
      user?.userId || user?._id || 'unknown',
      dto,
    );
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific purchase order' })
  @ApiParam({ name: 'id', description: 'Purchase order record ID' })
  async getPO(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.poService.getPO(tenant.tenantId, id);
    return { data };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft purchase order to the vendor' })
  @ApiParam({ name: 'id', description: 'Purchase order record ID' })
  async submitPO(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.poService.submitPO(tenant.tenantId, id);
    return { data };
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive delivered stock against a purchase order and update inventory balance' })
  @ApiParam({ name: 'id', description: 'Purchase order record ID' })
  async receiveStock(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    const data = await this.poService.receiveStock(
      tenant.tenantId,
      user?.userId || user?._id || 'unknown',
      id,
      dto,
    );
    return { data };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an unfulfilled purchase order' })
  @ApiParam({ name: 'id', description: 'Purchase order record ID' })
  async cancelPO(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.poService.cancelPO(tenant.tenantId, id);
    return { data };
  }
}

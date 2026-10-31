import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateCustomerDto, CreateSaleDto, RefundSaleDto, UpdateCustomerDto } from './dto/sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Sales & Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new potion/ingredient sale and deduct stock' })
  @ApiHeader({
    name: 'x-idempotency-key',
    required: false,
    description: 'Unique client-supplied idempotency key',
  })
  async createSale(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: any,
    @Body() dto: CreateSaleDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    const data = await this.salesService.createSale(
      tenant.tenantId,
      user.userId,
      dto,
      idempotencyKey,
    );
    return { data };
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated sales history with optional date and customer filters' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getSales(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customerId') customerId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const res = await this.salesService.getSales(tenant.tenantId, {
      startDate,
      endDate,
      customerId,
      limit,
      offset,
    });
    return { data: res.data, meta: res.meta };
  }

  // --- Customer Endpoints ---

  @Get('customers/insights')
  @ApiOperation({ summary: 'Get customer analytics, top spenders, and repeat purchase rates' })
  async getCustomerInsights(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.salesService.getCustomerInsights(tenant.tenantId);
    return { data };
  }

  @Get('customers')
  @ApiOperation({ summary: 'List customer profiles for active tenant' })
  @ApiQuery({ name: 'tier', required: false, enum: ['standard', 'vip', 'guild', 'wholesale'] })
  async listCustomers(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('tier') tier?: string,
  ) {
    const data = await this.salesService.listCustomers(tenant.tenantId, tier);
    return { data };
  }

  @Post('customers')
  @ApiOperation({ summary: 'Create a new customer profile' })
  async createCustomer(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Body() dto: CreateCustomerDto,
  ) {
    const data = await this.salesService.createCustomer(tenant.tenantId, dto);
    return { data };
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer profile details and recent purchase orders' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async getCustomer(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ): Promise<{ data: any }> {
    const data = await this.salesService.getCustomer(tenant.tenantId, id);
    return { data };
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async updateCustomer(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const data = await this.salesService.updateCustomer(tenant.tenantId, id, dto);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale details by ID including line items and customer' })
  @ApiParam({ name: 'id', description: 'Sale record ID' })
  async getSaleById(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ): Promise<{ data: any }> {
    const data = await this.salesService.getSaleById(tenant.tenantId, id);
    return { data };
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process a full refund with optional restock of returned ingredients' })
  @ApiParam({ name: 'id', description: 'Sale record ID' })
  async refundSale(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RefundSaleDto,
  ) {
    const data = await this.salesService.refundSale(
      tenant.tenantId,
      user.userId,
      id,
      dto,
    );
    return { data };
  }
}

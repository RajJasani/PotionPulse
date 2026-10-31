import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto, RefundSaleDto } from './dto/sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { UserRole } from '@potionpulse/contracts';

@ApiTags('Sales & Deductions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Record sale and automatically deduct inventory balances atomically' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Unique client operation key preventing duplicate writes',
  })
  async createSale(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSaleDto,
    @Headers('idempotency-key') headerIdempotencyKey?: string,
  ) {
    const data = await this.salesService.createSale(
      tenant.tenantId,
      user.userId,
      dto,
      headerIdempotencyKey,
    );
    return { data };
  }

  @Get()
  @ApiOperation({ summary: 'List tenant sales with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSales(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const res = await this.salesService.getSales(tenant.tenantId, { page, limit });
    return { data: res.items, meta: res.meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale detail with line items and movement references' })
  async getSaleById(@ActiveTenant() tenant: ActiveTenantContext, @Param('id') id: string) {
    const data = await this.salesService.getSaleById(tenant.tenantId, id);
    return { data };
  }

  @Post(':id/refunds')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Record sale refund with optional inventory restocking' })
  async refundSale(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RefundSaleDto,
  ) {
    const data = await this.salesService.refundSale(tenant.tenantId, user.userId, id, dto);
    return { data };
  }
}

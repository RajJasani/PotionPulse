import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateLocationDto } from './dto/location.dto';
import { CreateMovementDto } from './dto/movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { StockMovementType, UserRole } from '@potionpulse/contracts';

@ApiTags('Inventory & Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('locations')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a storage location/shelf in active workspace' })
  async createLocation(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Body() dto: CreateLocationDto,
  ) {
    const data = await this.inventoryService.createLocation(tenant.tenantId, dto);
    return { data };
  }

  @Get('locations')
  @ApiOperation({ summary: 'List all storage locations and shelves in active workspace' })
  async getLocations(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.inventoryService.getLocations(tenant.tenantId);
    return { data };
  }

  @Get('inventory/balances')
  @ApiOperation({ summary: 'Get current on-hand and reserved balances across locations' })
  @ApiQuery({ name: 'ingredientId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  async getBalances(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('ingredientId') ingredientId?: string,
    @Query('locationId') locationId?: string,
  ) {
    const data = await this.inventoryService.getBalances(tenant.tenantId, {
      ingredientId,
      locationId,
    });
    return { data };
  }

  @Post('inventory/movements')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Post an immutable stock movement (receipt, adjustment, transfer)' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Unique client operation key preventing duplicate writes',
  })
  async recordMovement(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMovementDto,
    @Headers('idempotency-key') headerIdempotencyKey?: string,
  ) {
    const data = await this.inventoryService.recordMovement(
      tenant.tenantId,
      user.userId,
      dto,
      headerIdempotencyKey,
    );
    return { data };
  }

  @Get('inventory/movements')
  @ApiOperation({ summary: 'List immutable stock movement ledger history' })
  @ApiQuery({ name: 'ingredientId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: StockMovementType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMovements(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('ingredientId') ingredientId?: string,
    @Query('locationId') locationId?: string,
    @Query('type') type?: StockMovementType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const res = await this.inventoryService.getMovements(tenant.tenantId, {
      ingredientId,
      locationId,
      type,
      page,
      limit,
    });
    return { data: res.items, meta: res.meta };
  }
}

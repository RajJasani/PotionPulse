import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { UserRole } from '@potionpulse/contracts';

@ApiTags('Ingredients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create an ingredient in tenant catalog' })
  async create(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Body() dto: CreateIngredientDto,
  ) {
    const data = await this.ingredientsService.create(tenant.tenantId, dto);
    return { data };
  }

  @Get()
  @ApiOperation({ summary: 'List ingredients with search, category filtering, and stock counts' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'lowStockOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('lowStockOnly') lowStockOnly?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const res = await this.ingredientsService.findAll(tenant.tenantId, {
      search,
      category,
      lowStockOnly,
      page,
      limit,
    });
    return { data: res.items, meta: res.meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ingredient detail and balances by location' })
  async findOne(@ActiveTenant() tenant: ActiveTenantContext, @Param('id') id: string) {
    const data = await this.ingredientsService.findOne(tenant.tenantId, id);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Update ingredient details' })
  async update(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    const data = await this.ingredientsService.update(tenant.tenantId, id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Archive an ingredient (soft-delete, ledger history is preserved)' })
  async archive(@ActiveTenant() tenant: ActiveTenantContext, @Param('id') id: string) {
    const data = await this.ingredientsService.archive(tenant.tenantId, id);
    return { data };
  }
}

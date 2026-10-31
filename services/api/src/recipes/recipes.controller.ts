import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateRecipeDto, ExecuteProductionBatchDto, UpdateRecipeDto } from './dto/recipe.dto';

@ApiTags('Recipes & Formulation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'List potion recipes for active tenant' })
  @ApiQuery({ name: 'category', required: false })
  async listRecipes(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('category') category?: string,
  ) {
    const data = await this.recipesService.listRecipes(tenant.tenantId, category);
    return { data };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new potion recipe with ingredient requirements' })
  async createRecipe(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Body() dto: CreateRecipeDto,
  ) {
    const data = await this.recipesService.createRecipe(tenant.tenantId, dto);
    return { data };
  }

  @Get('batches')
  @ApiOperation({ summary: 'List historical production brewing batches' })
  async listBatches(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.recipesService.listBatches(tenant.tenantId);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific recipe' })
  @ApiParam({ name: 'id', description: 'Recipe record ID' })
  async getRecipe(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.recipesService.getRecipe(tenant.tenantId, id);
    return { data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update recipe formulation or instructions (increments version)' })
  @ApiParam({ name: 'id', description: 'Recipe record ID' })
  async updateRecipe(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    const data = await this.recipesService.updateRecipe(tenant.tenantId, id, dto);
    return { data };
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check real-time stock availability for scaled production batch' })
  @ApiParam({ name: 'id', description: 'Recipe record ID' })
  @ApiQuery({ name: 'scale', required: false, type: Number, description: 'Scale factor (default 1.0)' })
  async checkAvailability(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
    @Query('scale') scale = '1.0',
  ) {
    const scaleFactor = parseFloat(scale) || 1.0;
    const data = await this.recipesService.checkBatchAvailability(tenant.tenantId, id, scaleFactor);
    return { data };
  }

  @Post(':id/brew')
  @ApiOperation({ summary: 'Execute production batch brewing and deduct ingredients from inventory' })
  @ApiParam({ name: 'id', description: 'Recipe record ID' })
  async brewBatch(
    @ActiveTenant() tenant: ActiveTenantContext,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ExecuteProductionBatchDto,
  ) {
    const data = await this.recipesService.executeProductionBatch(
      tenant.tenantId,
      user?.userId || user?._id || 'unknown',
      id,
      dto,
    );
    return { data };
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { CreateDemandEventDto, MidnightCurseSetupDto, UpdateDemandEventDto } from './dto/event.dto';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List seasonal demand events for active tenant' })
  @ApiQuery({ name: 'status', required: false, enum: ['scheduled', 'active', 'expired', 'archived'] })
  async listEvents(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('status') status?: string,
  ) {
    const data = await this.eventsService.listEvents(tenant.tenantId, status);
    return { data };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new seasonal demand event' })
  async createEvent(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Body() dto: CreateDemandEventDto,
  ) {
    const data = await this.eventsService.createEvent(tenant.tenantId, dto);
    return { data };
  }

  @Post('midnight-curse/setup')
  @ApiOperation({
    summary: 'Configure official Midnight Curse scenario with 3x surge across 3 configurable ingredients',
  })
  async setupMidnightCurse(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Body() dto: MidnightCurseSetupDto,
  ) {
    const data = await this.eventsService.setupMidnightCurseScenario(tenant.tenantId, dto);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a seasonal event' })
  @ApiParam({ name: 'id', description: 'Event record ID' })
  async getEvent(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.eventsService.getEvent(tenant.tenantId, id);
    return { data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing seasonal event' })
  @ApiParam({ name: 'id', description: 'Event record ID' })
  async updateEvent(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateDemandEventDto,
  ) {
    const data = await this.eventsService.updateEvent(tenant.tenantId, id, dto);
    return { data };
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Explicitly activate a scheduled event' })
  @ApiParam({ name: 'id', description: 'Event record ID' })
  async activateEvent(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.eventsService.activateEvent(tenant.tenantId, id);
    return { data };
  }

  @Post(':id/expire')
  @ApiOperation({ summary: 'Explicitly expire an active event' })
  @ApiParam({ name: 'id', description: 'Event record ID' })
  async expireEvent(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.eventsService.expireEvent(tenant.tenantId, id);
    return { data };
  }

  @Get(':id/impact')
  @ApiOperation({ summary: 'Calculate baseline vs event-adjusted demand impact and stockout delta' })
  @ApiParam({ name: 'id', description: 'Event record ID' })
  async getImpact(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.eventsService.calculateEventImpact(tenant.tenantId, id);
    return { data };
  }
}

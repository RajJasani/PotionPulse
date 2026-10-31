import { Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';

@ApiTags('Notifications & Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications and alerts for active tenant' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listNotifications(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const isUnread = unreadOnly === 'true' || unreadOnly === '1';
    const data = await this.notificationsService.listNotifications(tenant.tenantId, {
      unreadOnly: isUnread,
      limit,
      offset,
    });
    return { data: data.data, meta: data.meta };
  }

  @Post('generate-alerts')
  @ApiOperation({ summary: 'Trigger an automated evaluation scan and generate in-app alerts' })
  async generateAlerts(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.notificationsService.generateAlertsForTenant(tenant.tenantId);
    return { data };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark an in-app notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') id: string,
  ) {
    const data = await this.notificationsService.markAsRead(tenant.tenantId, id);
    return { data };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for active tenant' })
  async markAllAsRead(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.notificationsService.markAllAsRead(tenant.tenantId);
    return { data };
  }
}

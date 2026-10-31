import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  UpdateTenantSettingsDto,
  InviteMemberDto,
  UpdateRoleDto,
} from './dto/tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ActiveTenant, ActiveTenantContext } from '../auth/decorators/active-tenant.decorator';
import { UserRole } from '@potionpulse/contracts';

@ApiTags('Tenants & Membership')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('tenants')
  @ApiOperation({ summary: 'Create a new independent shop workspace' })
  async createTenant(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTenantDto) {
    const data = await this.tenantsService.createTenant(user.userId, dto);
    return { data };
  }

  @UseGuards(TenantGuard)
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
  @Get('tenants/current')
  @ApiOperation({ summary: 'Get current active tenant workspace profile and configuration' })
  async getCurrentTenant(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.tenantsService.getCurrentTenant(tenant.tenantId);
    return { data };
  }

  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
  @Patch('tenants/current')
  @ApiOperation({ summary: 'Update active tenant workspace settings (Owner / Manager only)' })
  async updateTenant(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    const data = await this.tenantsService.updateTenantSettings(tenant.tenantId, dto);
    return { data };
  }

  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
  @Get('members')
  @ApiOperation({ summary: 'List all team members of the active workspace' })
  async getMembers(@ActiveTenant() tenant: ActiveTenantContext) {
    const data = await this.tenantsService.getMembers(tenant.tenantId);
    return { data };
  }

  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
  @Post('members/invitations')
  @ApiOperation({ summary: 'Invite a team member to the active workspace' })
  async inviteMember(@ActiveTenant() tenant: ActiveTenantContext, @Body() dto: InviteMemberDto) {
    const data = await this.tenantsService.inviteMember(tenant.tenantId, dto);
    return { data };
  }

  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target tenant workspace ID' })
  @Patch('members/:id/role')
  @ApiOperation({ summary: 'Change a member role in the active workspace (Owner only)' })
  async updateMemberRole(
    @ActiveTenant() tenant: ActiveTenantContext,
    @Param('id') memberId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const data = await this.tenantsService.updateMemberRole(tenant.tenantId, memberId, dto);
    return { data };
  }
}

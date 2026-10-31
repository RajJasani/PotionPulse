import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { Membership, MembershipDocument } from './schemas/membership.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Location, LocationDocument } from '../inventory/schemas/location.schema';
import { CreateTenantDto, UpdateTenantSettingsDto, InviteMemberDto, UpdateRoleDto } from './dto/tenant.dto';
import { UserRole } from '@potionpulse/contracts';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Membership.name) private membershipModel: Model<MembershipDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 6)
    );
  }

  async createTenant(userId: string, dto: CreateTenantDto) {
    const slug = this.generateSlug(dto.name);
    const tenant = await this.tenantModel.create({
      name: dto.name,
      slug,
      timezone: dto.timezone || 'UTC',
      currency: dto.currency || 'USD',
      unitSystem: dto.unitSystem || 'metric',
      settings: {
        allowNegativeStock: false,
        defaultSafetyStockDays: 7,
      },
    });

    const membership = await this.membershipModel.create({
      tenantId: tenant._id,
      userId: new Types.ObjectId(userId),
      role: UserRole.OWNER,
      status: 'active',
    });

    await this.locationModel.create({
      tenantId: tenant._id,
      name: 'Main Shelf A',
      code: 'SHELF-A1',
      type: 'shelf',
      isDefault: true,
    });

    return {
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        timezone: tenant.timezone,
        currency: tenant.currency,
        settings: tenant.settings,
      },
      membership: {
        id: membership._id.toString(),
        role: membership.role,
      },
    };
  }

  async getCurrentTenant(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return {
      id: tenant._id.toString(),
      name: tenant.name,
      slug: tenant.slug,
      timezone: tenant.timezone,
      currency: tenant.currency,
      unitSystem: tenant.unitSystem,
      settings: tenant.settings,
      createdAt: tenant.createdAt,
    };
  }

  async updateTenantSettings(tenantId: string, dto: UpdateTenantSettingsDto) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (dto.name) tenant.name = dto.name;
    if (dto.timezone) tenant.timezone = dto.timezone;
    if (dto.currency) tenant.currency = dto.currency;
    if (dto.allowNegativeStock !== undefined) {
      tenant.settings.allowNegativeStock = dto.allowNegativeStock;
    }
    if (dto.defaultSafetyStockDays !== undefined) {
      tenant.settings.defaultSafetyStockDays = dto.defaultSafetyStockDays;
    }

    await tenant.save();
    return this.getCurrentTenant(tenantId);
  }

  async getMembers(tenantId: string) {
    const memberships = await this.membershipModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .populate('userId', 'email displayName isSuperAdmin status');

    return memberships.map((m) => {
      const user = m.userId as any;
      return {
        id: m._id.toString(),
        userId: user?._id?.toString(),
        email: user?.email,
        displayName: user?.displayName,
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
      };
    });
  }

  async inviteMember(tenantId: string, dto: InviteMemberDto) {
    let user = await this.userModel.findOne({ email: dto.email.toLowerCase() });

    if (!user) {
      // Create invited user stub
      user = await this.userModel.create({
        email: dto.email.toLowerCase(),
        displayName: dto.email.split('@')[0],
        status: 'invited',
      });
    }

    const existingMembership = await this.membershipModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      userId: user._id,
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const membership = await this.membershipModel.create({
      tenantId: new Types.ObjectId(tenantId),
      userId: user._id,
      role: dto.role,
      status: 'active',
    });

    return {
      id: membership._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: membership.role,
      status: membership.status,
    };
  }

  async updateMemberRole(tenantId: string, membershipId: string, dto: UpdateRoleDto) {
    const membership = await this.membershipModel.findOne({
      _id: new Types.ObjectId(membershipId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!membership) {
      throw new NotFoundException('Member record not found in this workspace');
    }

    membership.role = dto.role;
    await membership.save();

    return {
      id: membership._id.toString(),
      userId: membership.userId.toString(),
      role: membership.role,
      updatedAt: membership.updatedAt,
    };
  }
}

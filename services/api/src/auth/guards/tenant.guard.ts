import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Membership, MembershipDocument } from '../../tenants/schemas/membership.schema';
import { Tenant, TenantDocument } from '../../tenants/schemas/tenant.schema';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectModel(Membership.name) private membershipModel: Model<MembershipDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if client explicitly requested a tenant
    const requestedTenantId = request.headers['x-tenant-id'] as string | undefined;

    let membership: MembershipDocument | null = null;

    if (requestedTenantId && Types.ObjectId.isValid(requestedTenantId)) {
      membership = await this.membershipModel.findOne({
        userId: new Types.ObjectId(user.userId),
        tenantId: new Types.ObjectId(requestedTenantId),
        status: 'active',
      });

      if (!membership && !user.isSuperAdmin) {
        throw new ForbiddenException('You do not have active access to the specified tenant');
      }
    } else {
      // Find the user's primary/first active membership
      membership = await this.membershipModel
        .findOne({
          userId: new Types.ObjectId(user.userId),
          status: 'active',
        })
        .sort({ createdAt: 1 });
    }

    if (!membership && !user.isSuperAdmin) {
      throw new ForbiddenException('User has no active tenant workspaces. Please create or join a shop.');
    }

    const tenantId = membership ? membership.tenantId : new Types.ObjectId(requestedTenantId);
    const tenant = await this.tenantModel.findById(tenantId);

    if (!tenant) {
      throw new ForbiddenException('Tenant workspace not found');
    }

    request.activeTenant = {
      tenantId: tenant._id.toString(),
      role: membership ? membership.role : 'SUPER_ADMIN',
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
    };

    return true;
  }
}

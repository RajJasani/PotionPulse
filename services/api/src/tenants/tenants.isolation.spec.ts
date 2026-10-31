import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Membership } from './schemas/membership.schema';
import { Tenant } from './schemas/tenant.schema';
import { Types } from 'mongoose';
import { UserRole } from '@potionpulse/contracts';

describe('Tenant Isolation & Authorization Boundary', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  const tenantAId = new Types.ObjectId().toString();
  const tenantBId = new Types.ObjectId().toString();
  const userAId = new Types.ObjectId().toString();

  const mockMembershipModel = {
    findOne: jest.fn(),
  };

  const mockTenantModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    reflector = new Reflector();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        { provide: Reflector, useValue: reflector },
        { provide: getModelToken(Membership.name), useValue: mockMembershipModel },
        { provide: getModelToken(Tenant.name), useValue: mockTenantModel },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
  });

  const createExecutionContext = (requestedTenantId?: string): { ctx: ExecutionContext; req: any } => {
    const req: any = {
      user: { userId: userAId, email: 'usera@potionpulse.dev', isSuperAdmin: false },
      headers: requestedTenantId ? { 'x-tenant-id': requestedTenantId } : {},
    };

    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;

    return { ctx, req };
  };

  it('should successfully resolve active tenant when user has active membership', async () => {
    const mockMembership = {
      tenantId: new Types.ObjectId(tenantAId),
      userId: new Types.ObjectId(userAId),
      role: UserRole.OWNER,
      status: 'active',
    };

    const mockTenant = {
      _id: new Types.ObjectId(tenantAId),
      name: 'Potion Pantry A',
      slug: 'potion-pantry-a',
    };

    mockMembershipModel.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockMembership),
    });
    mockTenantModel.findById.mockResolvedValue(mockTenant);

    const { ctx, req } = createExecutionContext();
    const canActivate = await guard.canActivate(ctx);

    expect(canActivate).toBe(true);
    expect(req.activeTenant).toBeDefined();
    expect(req.activeTenant.tenantId).toBe(tenantAId);
    expect(req.activeTenant.role).toBe(UserRole.OWNER);
  });

  it('CRITICAL ISOLATION: should throw ForbiddenException when user attempts to access foreign Tenant B', async () => {
    // User A has NO membership in Tenant B
    mockMembershipModel.findOne.mockResolvedValue(null);

    const { ctx } = createExecutionContext(tenantBId);

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@potionpulse/contracts';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (userRole?: UserRole, isSuperAdmin = false): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId: 'u1', email: 'test@potionpulse.dev', isSuperAdmin },
          activeTenant: userRole ? { role: userRole } : null,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const ctx = createMockContext(UserRole.STAFF);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow super-admin even if role is lower', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER]);
    const ctx = createMockContext(UserRole.STAFF, true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow owner to access manager-only endpoint due to hierarchy', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MANAGER]);
    const ctx = createMockContext(UserRole.OWNER);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny staff from accessing owner-only endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER]);
    const ctx = createMockContext(UserRole.STAFF);
    expect(() => guard.canActivate(ctx)).toThrow();
  });
});

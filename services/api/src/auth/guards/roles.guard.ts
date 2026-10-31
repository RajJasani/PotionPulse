import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@potionpulse/contracts';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const activeTenant = request.activeTenant;

    if (user?.isSuperAdmin) {
      return true;
    }

    if (!activeTenant || !activeTenant.role) {
      throw new ForbiddenException('No active role found in tenant context');
    }

    // Role hierarchy check
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.SUPER_ADMIN]: 5,
      [UserRole.OWNER]: 4,
      [UserRole.MANAGER]: 3,
      [UserRole.STAFF]: 2,
      [UserRole.ANALYST]: 1,
    };

    const userLevel = roleHierarchy[activeTenant.role as UserRole] || 0;
    const hasRole = requiredRoles.some((role) => {
      // Direct match or hierarchically sufficient
      if (activeTenant.role === role) return true;
      // If endpoint permits STAFF, MANAGER and OWNER also qualify
      const requiredLevel = roleHierarchy[role] || 0;
      return userLevel >= requiredLevel;
    });

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required one of: [${requiredRoles.join(', ')}]. Current role: ${activeTenant.role}`,
      );
    }

    return true;
  }
}

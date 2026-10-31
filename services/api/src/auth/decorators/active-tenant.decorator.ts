import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@potionpulse/contracts';

export interface ActiveTenantContext {
  tenantId: string;
  role: UserRole;
  tenantSlug: string;
  tenantName: string;
}

export const ActiveTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActiveTenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.activeTenant;
  },
);

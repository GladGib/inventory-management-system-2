import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No roles or permissions required — allow
    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // Administrator has access to everything
    if (user.role === 'Administrator') {
      return true;
    }

    // Check role-based access
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        return false;
      }
    }

    // Check permission-based access
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions: string[] = user.permissions || [];
      const hasPermission = requiredPermissions.every((required) =>
        this.matchPermission(userPermissions, required),
      );
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  private matchPermission(
    userPermissions: string[],
    required: string,
  ): boolean {
    // Check for global wildcard
    if (userPermissions.includes('*')) {
      return true;
    }

    // Check for exact match
    if (userPermissions.includes(required)) {
      return true;
    }

    // Check for module wildcard (e.g., "sales:*" matches "sales:view")
    const [module] = required.split(':');
    if (userPermissions.includes(`${module}:*`)) {
      return true;
    }

    return false;
  }
}

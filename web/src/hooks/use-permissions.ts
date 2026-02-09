import { useAuthStore } from '@/stores/auth-store';
import { useCallback, useMemo } from 'react';

export function usePermissions() {
  const { user } = useAuthStore();

  const permissions: string[] = useMemo(
    () => (user as any)?.permissions || [],
    [user],
  );

  const hasPermission = useCallback(
    (required: string): boolean => {
      // Administrator always has access
      if (user?.role === 'Administrator') {
        return true;
      }

      // Global wildcard
      if (permissions.includes('*')) {
        return true;
      }

      // Exact match
      if (permissions.includes(required)) {
        return true;
      }

      // Module wildcard (e.g., "sales:*" matches "sales:view")
      const [module] = required.split(':');
      if (permissions.includes(`${module}:*`)) {
        return true;
      }

      return false;
    },
    [user?.role, permissions],
  );

  const hasAnyPermission = useCallback(
    (...required: string[]): boolean => {
      return required.some((p) => hasPermission(p));
    },
    [hasPermission],
  );

  const hasAllPermissions = useCallback(
    (...required: string[]): boolean => {
      return required.every((p) => hasPermission(p));
    },
    [hasPermission],
  );

  return { hasPermission, hasAnyPermission, hasAllPermissions, permissions };
}

import { useAuth } from './useAuth';
import type { AdminRole, Permission } from '@/types';

/**
 * RBAC abstraction. The backend exposes only a single `admin` role, so every
 * authenticated admin is treated as SUPER_ADMIN with all permissions. The
 * sub-role → permission matrix below is UI-only scaffolding, ready for when the
 * backend returns a granular role/permission claim.
 * TODO(backend): no sub-role or permission claims in the JWT.
 */
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    'venues:view',
    'venues:approve',
    'venues:reject',
    'venues:suspend',
    'reports:view',
    'settings:manage',
  ],
  OPERATIONS_ADMIN: ['venues:view', 'venues:approve', 'venues:reject', 'reports:view'],
  SUPPORT_ADMIN: ['venues:view', 'reports:view'],
  READ_ONLY: ['venues:view', 'reports:view'],
};

export function usePermissions() {
  const { user } = useAuth();
  // Until the backend distinguishes sub-roles, any admin === SUPER_ADMIN.
  const adminRole: AdminRole = user?.role === 'admin' ? 'SUPER_ADMIN' : 'READ_ONLY';
  const permissions = ROLE_PERMISSIONS[adminRole];

  return {
    adminRole,
    permissions,
    can: (permission: Permission) => permissions.includes(permission),
  };
}

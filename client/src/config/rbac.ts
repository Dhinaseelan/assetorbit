/**
 * Assetorbit Role-Based Access Control (RBAC) Matrix
 * Single source of truth used across frontend & backend
 *
 * Roles:
 *  ADMIN     - Full control: all pages, all actions, create employees
 *  IT_DEPT   - Hardware lifecycle: assets, maintenance, tickets, assignments, audit
 *  HR_DEPT   - People ops: assign/return assets, create employees, view assets
 *  MANAGER   - Read-only analytics: dashboard, assets, assignments, audit, maintenance
 *  EMPLOYEE  - Self-service: my equipment, file tickets
 */

export type Role = 'ADMIN' | 'IT_DEPT' | 'HR_DEPT' | 'MANAGER' | 'EMPLOYEE';

// ─── Navigation pages each role can access ───────────────────────────────────
export const PAGE_ACCESS: Record<string, Role[]> = {
  dashboard:    ['ADMIN', 'IT_DEPT', 'HR_DEPT', 'MANAGER', 'EMPLOYEE'],
  assets:       ['ADMIN', 'IT_DEPT', 'HR_DEPT', 'MANAGER'],
  assignments:  ['ADMIN', 'IT_DEPT', 'HR_DEPT', 'MANAGER'],
  maintenance:  ['ADMIN', 'IT_DEPT', 'MANAGER'],
  tickets:      ['ADMIN', 'IT_DEPT', 'HR_DEPT'],
  audit:        ['ADMIN', 'IT_DEPT', 'MANAGER'],
  'my-portal':  ['ADMIN', 'IT_DEPT', 'HR_DEPT', 'MANAGER', 'EMPLOYEE'],
};

// ─── Action-level permissions ─────────────────────────────────────────────────
export const ACTIONS = {
  // Assets
  asset_create:     ['ADMIN', 'IT_DEPT'] as Role[],
  asset_edit:       ['ADMIN', 'IT_DEPT', 'HR_DEPT'] as Role[],
  asset_delete:     ['ADMIN'] as Role[],
  asset_retire:     ['ADMIN', 'IT_DEPT'] as Role[],
  asset_view:       ['ADMIN', 'IT_DEPT', 'HR_DEPT', 'MANAGER', 'EMPLOYEE'] as Role[],
  asset_export_csv: ['ADMIN', 'IT_DEPT', 'MANAGER'] as Role[],

  // Assignments
  assign_checkout:  ['ADMIN', 'IT_DEPT', 'HR_DEPT'] as Role[],
  assign_return:    ['ADMIN', 'IT_DEPT', 'HR_DEPT'] as Role[],

  // Maintenance
  maintenance_log:  ['ADMIN', 'IT_DEPT'] as Role[],
  maintenance_view: ['ADMIN', 'IT_DEPT', 'MANAGER'] as Role[],

  // Tickets
  ticket_create:    ['ADMIN', 'IT_DEPT', 'HR_DEPT', 'EMPLOYEE'] as Role[],
  ticket_resolve:   ['ADMIN', 'IT_DEPT'] as Role[],

  // Audit
  audit_view:       ['ADMIN', 'IT_DEPT', 'MANAGER'] as Role[],

  // Users / Employee management
  user_create:      ['ADMIN', 'HR_DEPT'] as Role[],
  user_list:        ['ADMIN', 'IT_DEPT', 'HR_DEPT'] as Role[],

  // Dashboard
  dashboard_stats:  ['ADMIN', 'IT_DEPT', 'HR_DEPT', 'MANAGER'] as Role[],
  dashboard_employee_view: ['EMPLOYEE'] as Role[],
} as const;

// ─── Helper ───────────────────────────────────────────────────────────────────
export function can(role: Role, action: keyof typeof ACTIONS): boolean {
  return (ACTIONS[action] as Role[]).includes(role);
}

export function canAccessPage(role: Role, page: string): boolean {
  return (PAGE_ACCESS[page] ?? []).includes(role);
}

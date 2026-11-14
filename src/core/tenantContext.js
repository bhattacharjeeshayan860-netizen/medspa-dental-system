/**
 * Aurevia Practice OS — Multi-Tenant Isolation & Role Engine
 *
 * Manages Organizations, Clinics, and User Roles with strict tenant isolation
 * and permission enforcement across the entire application.
 */

import { USER_ROLES, hasPermission, SPECIALTIES } from './types.js';
import { getClinicConfig, listSupportedClinics, resolveClinicId } from './clinicRegistry.js';

export const ORGANIZATIONS = [
  {
    id: 'org-aurevia-premier',
    name: 'Aurevia Aesthetics Group',
    slug: 'aurevia-aesthetics',
    tier: 'STANDARD_MED_SPA',
    clinics: ['aurevia-beverly-hills', 'aurevia-spa-wellness']
  },
  {
    id: 'org-downtown-health',
    name: 'Downtown Dental Partners',
    slug: 'downtown-dental-partners',
    tier: 'STANDARD_DENTAL',
    clinics: ['aurevia-dental-downtown']
  }
];

export const DEMO_USERS = [
  {
    id: 'usr-001',
    name: 'Dr. Alexis Vance',
    email: 'alexis.vance@example.invalid',
    role: USER_ROLES.CLINIC_OWNER,
    orgId: 'org-aurevia-premier',
    clinicId: 'aurevia-beverly-hills'
  },
  {
    id: 'usr-002',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.invalid',
    role: USER_ROLES.PRACTICE_MANAGER,
    orgId: 'org-aurevia-premier',
    clinicId: 'aurevia-beverly-hills'
  },
  {
    id: 'usr-003',
    name: 'Chloe Kim',
    email: 'chloe.kim@example.invalid',
    role: USER_ROLES.STAFF,
    orgId: 'org-aurevia-premier',
    clinicId: 'aurevia-beverly-hills'
  },
  {
    id: 'usr-004',
    name: 'Marcus Brody',
    email: 'marcus.brody@example.invalid',
    role: USER_ROLES.REPORTING,
    orgId: 'org-aurevia-premier',
    clinicId: 'aurevia-beverly-hills'
  },
  {
    id: 'usr-000',
    name: 'System Administrator',
    email: 'admin@example.invalid',
    role: USER_ROLES.PLATFORM_ADMIN,
    orgId: 'org-aurevia-premier',
    clinicId: 'aurevia-beverly-hills'
  }
];

let currentActiveUser = DEMO_USERS[0]; // Interactive prototype default
let currentActiveClinicId = 'aurevia-beverly-hills';

export function getActiveUser() {
  return { ...currentActiveUser };
}

export function setActiveUser(userId) {
  const user = DEMO_USERS.find(u => u.id === userId);
  if (!user) {
    throw new Error(`Unknown user ID: ${userId}`);
  }
  currentActiveUser = user;
  currentActiveClinicId = user.clinicId;
  return { ...currentActiveUser };
}

export function setActiveUserByRole(role) {
  const user = DEMO_USERS.find(u => u.role === role);
  if (!user) {
    throw new Error(`No user found with role: ${role}`);
  }
  currentActiveUser = user;
  return { ...currentActiveUser };
}

export function getActiveClinicId() {
  return currentActiveClinicId;
}

export function setActiveClinicId(clinicId) {
  const resolved = resolveClinicId(clinicId);
  const supported = listSupportedClinics();
  const exists = supported.some(c => c.id === resolved);
  if (!exists) {
    throw new Error(`Unsupported clinic ID: ${clinicId}`);
  }
  currentActiveClinicId = resolved;
  return currentActiveClinicId;
}

export function getActiveClinicConfig(options = {}) {
  return getClinicConfig(currentActiveClinicId, options);
}

export function getActiveOrganization(options = {}) {
  const org = ORGANIZATIONS.find(o => o.clinics.includes(currentActiveClinicId));
  if (!org && (options.failClosed || options.production)) {
    const err = new Error(`TENANT_NOT_FOUND: No organization mapped to clinic '${currentActiveClinicId}'`);
    err.code = 'TENANT_NOT_FOUND';
    throw err;
  }
  return org || ORGANIZATIONS[0];
}

export function checkTenantPermission(permissionName) {
  return hasPermission(currentActiveUser.role, permissionName);
}

export function assertTenantPermission(permissionName) {
  if (!checkTenantPermission(permissionName)) {
    const error = new Error(`Permission Denied: User role ${currentActiveUser.role} cannot perform '${permissionName}'`);
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }
  return true;
}

export function validateTenantIsolation(targetClinicId) {
  if (!targetClinicId) {
    throw new Error('Tenant isolation check failed: targetClinicId is required');
  }
  if (currentActiveUser.role === USER_ROLES.PLATFORM_ADMIN) {
    return true; // Platform Admin has cross-tenant audit access
  }
  const activeOrg = getActiveOrganization();
  if (!activeOrg.clinics.includes(targetClinicId)) {
    const error = new Error(`Tenant Isolation Violation: Active organization '${activeOrg.id}' cannot access clinic '${targetClinicId}'`);
    error.statusCode = 403;
    error.code = 'TENANT_MISMATCH';
    throw error;
  }
  return true;
}

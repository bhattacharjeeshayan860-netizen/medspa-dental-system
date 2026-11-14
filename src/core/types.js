/**
 * Aurevia Practice OS — Core Domain Types and Schemas
 *
 * Defines typed entities, schemas, and role permissions for multi-tenant
 * B2B SaaS operation ($997/mo Med Spa & $797/mo Dental).
 */

export const USER_ROLES = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  CLINIC_OWNER: 'CLINIC_OWNER',
  PRACTICE_MANAGER: 'PRACTICE_MANAGER',
  STAFF: 'STAFF',
  REPORTING: 'REPORTING'
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.PLATFORM_ADMIN]: {
    canManageOrganizations: true,
    canEditBilling: true,
    canSignCompliance: true,
    canConfigureProviders: true,
    canLaunchCampaigns: true,
    canTriggerRecoveries: true,
    canManageTakeover: true,
    canViewPatientPii: true,
    canViewFinancials: true,
    canExportAuditLogs: true
  },
  [USER_ROLES.CLINIC_OWNER]: {
    canManageOrganizations: false,
    canEditBilling: true,
    canSignCompliance: true,
    canConfigureProviders: true,
    canLaunchCampaigns: true,
    canTriggerRecoveries: true,
    canManageTakeover: true,
    canViewPatientPii: true,
    canViewFinancials: true,
    canExportAuditLogs: true
  },
  [USER_ROLES.PRACTICE_MANAGER]: {
    canManageOrganizations: false,
    canEditBilling: false,
    canSignCompliance: false,
    canConfigureProviders: true,
    canLaunchCampaigns: true,
    canTriggerRecoveries: true,
    canManageTakeover: true,
    canViewPatientPii: true,
    canViewFinancials: true,
    canExportAuditLogs: false
  },
  [USER_ROLES.STAFF]: {
    canManageOrganizations: false,
    canEditBilling: false,
    canSignCompliance: false,
    canConfigureProviders: false,
    canLaunchCampaigns: false,
    canTriggerRecoveries: true,
    canManageTakeover: true,
    canViewPatientPii: true,
    canViewFinancials: false,
    canExportAuditLogs: false
  },
  [USER_ROLES.REPORTING]: {
    canManageOrganizations: false,
    canEditBilling: false,
    canSignCompliance: false,
    canConfigureProviders: false,
    canLaunchCampaigns: false,
    canTriggerRecoveries: false,
    canManageTakeover: false,
    canViewPatientPii: false,
    canViewFinancials: true,
    canExportAuditLogs: false
  }
};

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return Boolean(perms[permission]);
}

export const SPECIALTIES = {
  MED_SPA: 'MED_SPA',
  DENTAL: 'DENTAL'
};

export const PRICING_PLANS = {
  FOUNDING_MEMBER: {
    name: 'Founding Member',
    setupFee: 1500,
    monthlyFee: 497,
    specialty: SPECIALTIES.MED_SPA,
    minAttendedAppointmentsForRoi: 1
  },
  STANDARD_MED_SPA: {
    name: 'Standard Med Spa',
    setupFee: 2500,
    monthlyFee: 997,
    specialty: SPECIALTIES.MED_SPA,
    minAttendedAppointmentsForRoi: 2
  },
  STANDARD_DENTAL: {
    name: 'Standard Dental',
    setupFee: 2500,
    monthlyFee: 797,
    specialty: SPECIALTIES.DENTAL,
    minAttendedAppointmentsForRoi: 3
  }
};


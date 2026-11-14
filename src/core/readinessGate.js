/**
 * Production Readiness Gate & Compliance Evaluation Engine
 * 
 * Assesses whether a clinic configuration has satisfied all technical,
 * legal, telephony, and regulatory dependencies required to exit demo mode.
 */

import { getClinicConfig } from './clinicRegistry.js';
import { isFakeDataModeActive } from './fakeDataMode.js';

export const READINESS_STATUSES = {
  DEMO_ONLY: 'DEMO_ONLY',
  BLOCKED_CONFIGURATION_REQUIRED: 'BLOCKED_CONFIGURATION_REQUIRED',
  READY_FOR_PILOT: 'READY_FOR_PILOT',
  PRODUCTION_ENABLED: 'PRODUCTION_ENABLED'
};

export const MANDATORY_CORE_WORKFLOW_FILES = [
  'AI Reactivation — Incoming Conversation.json',
  'AI Reactivation — Outgoing Conversation.json',
  'missed_call_recovery_workflow.json',
  'weekly_report_workflow.json',
  'error_trigger_workflow.json',
  'PATCH patients.json',
  'PATCH handoff status.json'
];

let globalWorkflowValidator = null;

/**
 * Registers an ambient or test-time workflow file validator.
 */
export function setWorkflowValidator(validatorFn) {
  globalWorkflowValidator = validatorFn;
}

/**
 * Dynamically verifies presence of mandatory core workflow exports.
 * Adheres to Gravitas Invariant 6: Say what you cannot verify.
 */
export function verifyWorkflowExports(envOverrides = {}) {
  // 1. Explicit checker function passed in overrides
  if (typeof envOverrides.workflowFilesChecker === 'function') {
    const res = envOverrides.workflowFilesChecker(MANDATORY_CORE_WORKFLOW_FILES);
    return typeof res === 'boolean' ? { passed: res, details: res ? 'All mandatory workflows verified via checker' : 'Checker failed verification' } : res;
  }

  // 2. Explicit list of present workflows passed in overrides
  if (Array.isArray(envOverrides.existingWorkflows)) {
    const missing = MANDATORY_CORE_WORKFLOW_FILES.filter(
      (file) => !envOverrides.existingWorkflows.includes(file)
    );
    return {
      passed: missing.length === 0,
      missing,
      details: missing.length === 0
        ? `All ${MANDATORY_CORE_WORKFLOW_FILES.length} required workflow files verified`
        : `Missing ${missing.length} workflow file(s): ${missing.join(', ')}`
    };
  }

  // 3. Registered global validator function
  if (typeof globalWorkflowValidator === 'function') {
    const res = globalWorkflowValidator(MANDATORY_CORE_WORKFLOW_FILES);
    return typeof res === 'boolean' ? { passed: res, details: res ? 'All mandatory workflows verified via registered validator' : 'Validator failed' } : res;
  }

  // 4. Global runtime manifest if registered in browser window or globalThis
  const manifest = (typeof window !== 'undefined' && window.__AUREVIA_WORKFLOWS_MANIFEST__) ||
                   (typeof globalThis !== 'undefined' && globalThis.__AUREVIA_WORKFLOWS_MANIFEST__) || null;
  if (Array.isArray(manifest)) {
    const missing = MANDATORY_CORE_WORKFLOW_FILES.filter((file) => !manifest.includes(file));
    return {
      passed: missing.length === 0,
      missing,
      details: missing.length === 0
        ? `All ${MANDATORY_CORE_WORKFLOW_FILES.length} core workflow manifests verified`
        : `Manifest missing: ${missing.join(', ')}`
    };
  }

  // 5. Ambient Node.js file check if registered
  if (typeof globalThis !== 'undefined' && typeof globalThis.__AUREVIA_CHECK_FILE_EXISTS__ === 'function') {
    const missing = MANDATORY_CORE_WORKFLOW_FILES.filter(
      (file) => !globalThis.__AUREVIA_CHECK_FILE_EXISTS__(file)
    );
    return {
      passed: missing.length === 0,
      missing,
      details: missing.length === 0
        ? `All ${MANDATORY_CORE_WORKFLOW_FILES.length} core workflow files verified on disk`
        : `Missing on disk: ${missing.join(', ')}`
    };
  }

  // 6. Say what you cannot verify: Unverified runtime cannot assume files exist.
  // In demo simulation mode without explicit verification, flag missing verification.
  return {
    passed: false,
    missing: ['UNVERIFIED_WORKFLOW_FILES'],
    details: 'Unverified workflow files: Dynamic check required via workflowFilesChecker or existingWorkflows'
  };
}

/**
 * Evaluates the full production readiness checklist for a given clinic.
 * 
 * @param {string} clinicId - The clinic ID to evaluate
 * @param {Object} envOverrides - Optional environment or state overrides
 * @returns {Object} { status, label, score, passed, total, checklist, blockers }
 */
export function evaluateClinicReadiness(clinicId = 'aurevia-beverly-hills', envOverrides = {}) {
  const clinic = getClinicConfig(clinicId);
  const isDemo = envOverrides.demoMode !== undefined ? envOverrides.demoMode : isFakeDataModeActive();
  const forceProduction = envOverrides.forceProduction || false;

  const workflowCheck = verifyWorkflowExports(envOverrides);

  const checklist = [
    {
      id: 'clinic_timezone',
      name: 'Clinic Timezone Configured',
      passed: Boolean(clinic.timezone && clinic.timezone.includes('/')),
      details: clinic.timezone || 'Missing timezone',
      blocker: true
    },
    {
      id: 'quiet_hours',
      name: 'Quiet Hours Enforced in Timezone',
      passed: Boolean(clinic.quiet_hours && clinic.quiet_hours.enabled && clinic.quiet_hours.start && clinic.quiet_hours.end),
      details: clinic.quiet_hours ? `${clinic.quiet_hours.start} – ${clinic.quiet_hours.end}` : 'Disabled',
      blocker: true
    },
    {
      id: 'frequency_cap',
      name: '24-Hour Outreach Frequency Cap',
      passed: Boolean(clinic.frequency_cap_hours && clinic.frequency_cap_hours >= 24),
      details: `${clinic.frequency_cap_hours || 0} hours`,
      blocker: true
    },
    {
      id: 'approved_templates',
      name: 'PHI-Minimal Message Templates Whitelisted',
      passed: Boolean(clinic.approved_templates && clinic.approved_templates.missed_call && clinic.approved_templates.outreach_nudge),
      details: 'Missed Call, Outreach Nudge, Opt-Out Ack',
      blocker: true
    },
    {
      id: 'relevant_workflows_exported',
      name: 'Relevant n8n Core & PATCH Workflows Exported',
      passed: workflowCheck.passed,
      details: workflowCheck.details,
      blocker: true
    },
    {
      id: 'calendar_provider',
      name: 'Calendar & Booking Interface Bound',
      passed: Boolean(clinic.booking_provider && ['google_calendar', 'calendly', 'cal_com'].includes(clinic.booking_provider)),
      details: clinic.booking_provider || 'None',
      blocker: true
    },
    {
      id: 'legal_review_ack',
      name: 'TCPA Missed-Call Legal Review Acknowledged',
      passed: Boolean(clinic.legal_review_acknowledged || envOverrides.legal_review_acknowledged),
      details: (clinic.legal_review_acknowledged || envOverrides.legal_review_acknowledged) ? 'Acknowledged by Clinic Counsel' : 'Pending Clinic Counsel Signoff',
      blocker: true
    },
    {
      id: 'retention_policy',
      name: 'Data Retention & Redaction Policy Defined',
      passed: Boolean(clinic.retention_policy_days && clinic.retention_policy_days <= 90),
      details: `${clinic.retention_policy_days || 30} days with PII scrub`,
      blocker: false
    },
    {
      id: 'production_credentials',
      name: 'Production Telephony & CRM Credentials in n8n',
      passed: Boolean(envOverrides.hasProductionCredentials || false),
      details: envOverrides.hasProductionCredentials ? 'Active in n8n credential vault' : 'Unconfigured (Running on Mock Adapters)',
      blocker: true
    },
    {
      id: 'webhook_secrets',
      name: 'Webhook Signature Secrets Configured',
      passed: Boolean(envOverrides.hasWebhookSecrets || false),
      details: envOverrides.hasWebhookSecrets ? 'HMAC SHA-256 configured' : 'Pending production webhook secret',
      blocker: true
    }
  ];

  const total = checklist.length;
  const passedCount = checklist.filter(item => item.passed).length;
  const blockers = checklist.filter(item => !item.passed && item.blocker);

  let status = READINESS_STATUSES.DEMO_ONLY;
  let label = 'DEMO ONLY (SIMULATED)';
  let color = '#d4af37'; // Brushed Gold

  if (!isDemo || forceProduction) {
    if (blockers.length > 0) {
      status = READINESS_STATUSES.BLOCKED_CONFIGURATION_REQUIRED;
      label = 'BLOCKED: CONFIGURATION REQUIRED';
      color = '#e15241'; // Warning Rose / Red
    } else if (passedCount === total) {
      status = READINESS_STATUSES.PRODUCTION_ENABLED;
      label = 'PRODUCTION ENABLED';
      color = '#2d6a4f'; // Forest Green
    } else {
      status = READINESS_STATUSES.READY_FOR_PILOT;
      label = 'READY FOR PILOT';
      color = '#3b82f6'; // Cobalt Blue
    }
  } else {
    // In demo mode
    status = READINESS_STATUSES.DEMO_ONLY;
    label = 'DEMO ONLY (SIMULATED)';
    color = '#d4af37';
  }

  return {
    status,
    label,
    color,
    score: Math.round((passedCount / total) * 100),
    passedCount,
    total,
    checklist,
    blockers,
    isDemo,
    clinicId
  };
}


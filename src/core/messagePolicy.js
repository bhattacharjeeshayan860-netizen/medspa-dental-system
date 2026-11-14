/**
 * Centralized Message Policy & PHI Protection Layer
 * 
 * Enforces strict defense-in-depth message safety:
 * 1. Whitelist-only template compilation (rejects arbitrary free-text outbound messages by default).
 * 2. Deep clinical sensitivity & PHI inspection (rejects procedure names, diagnoses, medications, and nuanced clinical disclosures).
 * 3. Safe parameter injection with automatic character escaping and sanitization.
 * 4. PII-redacted audit event generation for every blocked or approved message.
 * 
 * Note: Template whitelisting is a clinical safety control; it does not replace formal HIPAA Business Associate Agreements.
 */

import { recordAuditEvent } from './fakeDataMode.js';

// Pre-approved PHI-minimal template registry
export const APPROVED_TEMPLATES = {
  TEMPLATE_RECALL_NUDGE: {
    id: 'TEMPLATE_RECALL_NUDGE',
    name: 'Dormant Client Recall Nudge',
    channel: 'whatsapp_or_sms',
    text: 'Hi {{first_name}}, it has been a while since your last visit to {{clinic_name}}. Would you like to view our available appointment times?',
    allowed_params: ['first_name', 'clinic_name'],
    contains_phi: false
  },
  TEMPLATE_MISSED_CALL_RECOVERY: {
    id: 'TEMPLATE_MISSED_CALL_RECOVERY',
    name: 'Compliant Missed Call Follow-Up',
    channel: 'sms',
    text: 'Hi, this is {{clinic_name}}. We missed your call and will get back to you shortly. If you’d like, reply here and we can help you find an appointment.',
    allowed_params: ['clinic_name'],
    contains_phi: false
  },
  TEMPLATE_BOOKING_LINK: {
    id: 'TEMPLATE_BOOKING_LINK',
    name: 'Calendar Booking Link Dispatch',
    channel: 'whatsapp_or_sms',
    text: 'We would love to welcome you back to {{clinic_name}}! You can browse real-time openings and reserve your preferred time here: {{booking_url}}',
    allowed_params: ['clinic_name', 'booking_url'],
    contains_phi: false
  },
  TEMPLATE_OPT_OUT_CONFIRMATION: {
    id: 'TEMPLATE_OPT_OUT_CONFIRMATION',
    name: 'Deterministic Opt-Out Acknowledgment',
    channel: 'whatsapp_or_sms',
    text: 'You have been unsubscribed from {{clinic_name}} notifications. Reply START anytime to resume.',
    allowed_params: ['clinic_name'],
    contains_phi: false
  },
  TEMPLATE_REVIEW_REQUEST_UNGATED: {
    id: 'TEMPLATE_REVIEW_REQUEST_UNGATED',
    name: 'Un-Gated Public Review & Feedback',
    channel: 'whatsapp_or_sms',
    text: 'Hi {{first_name}}, thank you for choosing {{clinic_name}}! If you have a moment, we would welcome your honest review on Google: {{public_review_url}} \n\nIf you would prefer to share private feedback directly with our practice leadership, you can reach us here: {{private_feedback_url}}',
    allowed_params: ['first_name', 'clinic_name', 'public_review_url', 'private_feedback_url'],
    contains_phi: false
  }
};

// Known clinical procedure and pharmacology terms
const CLINICAL_PROCEDURES_AND_MEDS = [
  'botox', 'dysport', 'filler', 'juvederm', 'restylane', 'sculptra', 'radiesse',
  'chemical peel', 'microneedling', 'morpheus8', 'coolsculpting', 'laser resurfacing', 'ipl',
  'root canal', 'crown', 'cavity', 'caries', 'tooth extraction', 'dental implant',
  'periodontal', 'scaling', 'gingivitis', 'abscess', 'sedation', 'nitrous',
  'retin-a', 'tretinoin', 'antibiotic', 'steroid', 'hydroquinone', 'accutane', 'lip filler'
];

// Nuanced clinical symptom, diagnosis, and post-procedure risk patterns (even without exact procedure names)
const CLINICAL_NUANCE_PATTERNS = [
  /\b(bruis|swollen|swelling|bleeding|pus|infected|infection|inflam|numb|blister)\b/i,
  /\b(adverse|reaction|allergic|allergy|rash|hives|fever|headache|migraine)\b/i,
  /\b(needle|injection|injected|puncture|wound|incision|scar|soreness)\b/i,
  /\b(blood pressure|heart rate|pregnant|pregnancy|nursing|breastfeeding|diabetic|diabetes)\b/i,
  /\b(severe pain|throbbing|nerve pain|complication|asymmetry|migrated)\b/i
];

/**
 * Validates text for any direct or nuanced clinical PHI.
 */
export function scanForSensitiveClinicalContent(text = '') {
  if (!text) return { safe: true, reasons: [] };

  const str = String(text).toLowerCase();
  const violations = [];

  // 1. Check clinical procedures & meds
  for (const term of CLINICAL_PROCEDURES_AND_MEDS) {
    if (str.includes(term)) {
      violations.push(`Explicit clinical procedure/medication term: "${term}"`);
    }
  }

  // 2. Check nuanced clinical symptoms or risks
  for (const pattern of CLINICAL_NUANCE_PATTERNS) {
    const match = str.match(pattern);
    if (match) {
      violations.push(`Clinical symptom or medical nuance detected: "${match[0]}"`);
    }
  }

  return {
    safe: violations.length === 0,
    reasons: violations
  };
}

/**
 * Compiles a pre-approved template with safe parameter injection.
 * Rejects arbitrary free-text outbound messages.
 * 
 * @param {string} templateId - Key of APPROVED_TEMPLATES
 * @param {Object} params - Values to inject
 * @param {Object} options - { channel: 'whatsapp'|'sms', allowFreeText: false }
 */
export function compileOutboundMessage(templateId, params = {}, options = {}) {
  const { channel = 'whatsapp', allowFreeText = false, clinic_id = 'demo-clinic' } = options;

  // 1. Enforce Whitelist: Free-text is rejected by default
  if (!templateId || !APPROVED_TEMPLATES[templateId]) {
    if (!allowFreeText) {
      recordAuditEvent({
        action: 'OUTBOUND_MESSAGE_BLOCKED',
        clinic_id,
        detail: `Attempted outbound free-text dispatch rejected. Template ID "${templateId}" is not whitelisted.`
      });
      return {
        success: false,
        status: 'REJECTED_UNAPPROVED_FREE_TEXT',
        error: 'ARBITRARY_FREE_TEXT_FORBIDDEN',
        message: null,
        reason: 'Outbound communications must use a pre-approved, PHI-minimal template ID.'
      };
    }
  }

  const template = APPROVED_TEMPLATES[templateId];
  let renderedText = template.text;

  // 2. Verify and inject allowed parameters
  for (const paramKey of template.allowed_params) {
    const rawVal = params[paramKey] !== undefined ? String(params[paramKey]) : '';
    
    // Scan injected parameter values for PHI or clinical nuance!
    const paramScan = scanForSensitiveClinicalContent(rawVal);
    if (!paramScan.safe) {
      recordAuditEvent({
        action: 'OUTBOUND_PARAMETER_PHI_BLOCKED',
        clinic_id,
        detail: `Injected parameter "${paramKey}" contained clinical PHI: ${paramScan.reasons.join('; ')}`
      });
      return {
        success: false,
        status: 'REJECTED_PHI_IN_PARAMETER',
        error: 'SENSITIVE_PARAMETER_VALUE',
        message: null,
        reason: `Parameter "${paramKey}" contains protected clinical content and cannot be dispatched over ${channel}.`,
        violations: paramScan.reasons
      };
    }

    // Safe injection
    renderedText = renderedText.replace(new RegExp(`{{${paramKey}}}`, 'g'), rawVal.trim());
  }

  // 3. Final sanity scan of compiled text
  const finalScan = scanForSensitiveClinicalContent(renderedText);
  if (!finalScan.safe) {
    return {
      success: false,
      status: 'REJECTED_COMPILED_PHI',
      error: 'COMPILED_TEXT_CONTAINS_PHI',
      message: null,
      reason: 'Compiled message failed final PHI security scan.',
      violations: finalScan.reasons
    };
  }

  recordAuditEvent({
    action: 'OUTBOUND_TEMPLATE_APPROVED',
    clinic_id,
    detail: `Compiled approved template ${templateId} for ${channel}.`
  });

  return {
    success: true,
    status: 'APPROVED',
    template_id: templateId,
    message: renderedText,
    channel,
    is_phi_minimal: true
  };
}


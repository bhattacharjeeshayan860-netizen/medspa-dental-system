/**
 * Conversational Intent Engine & Clinical Guardrail Classifier
 * Enforces deterministic opt-outs, medical escalation, pricing verification,
 * Zero-PHI WhatsApp compliance, and FTC Anti-Review-Gating rules.
 */

import { getClinicConfig } from './clinicRegistry.js';
import { shouldAutonomousAIReply, createEscalation } from './humanTakeover.js';
import { recordOptOut } from './missedCallEngine.js';
import { recordAuditEvent } from './fakeDataMode.js';
import { compileOutboundMessage, scanForSensitiveClinicalContent } from './messagePolicy.js';

// Deterministic Opt-Out keywords
const OPT_OUT_REGEX = /\b(stop|unsubscribe|cancel|quit|end|remove me|opt out|do not contact|para|detener)\b/i;

// Clinical & Safety risk keywords (must never provide medical diagnosis or treatment advice)
const MEDICAL_RISK_REGEX = /\b(reaction|allergic|allergy|rash|swelling|infection|pain|bleed|pregnant|pregnancy|doctor|hospital|complication|bruis|filler migrated|burn)\b/i;

// Angry / Complaint keywords
const COMPLAINT_REGEX = /\b(angry|upset|terrible|horrible|lawyer|sue|complaint|unacceptable|awful|worst|manager|refund)\b/i;

// Booking Intent keywords
const BOOKING_INTENT_REGEX = /\b(book|appointment|schedule|time|slot|reserve|openings|calendar|availability|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday)\b/i;

// Pricing / Offer inquiry keywords
const PRICING_REGEX = /\b(price|cost|how much|discount|deal|offer|package|rate|fee|promotion|special)\b/i;

// Protected Health Information (PHI) clinical terms that must NEVER be sent over WhatsApp
const CLINICAL_PHI_TERMS = [
  'botox', 'dysport', 'filler', 'juvederm', 'restylane', 'sculptra',
  'chemical peel', 'microneedling', 'morpheus8', 'coolsculpting', 'laser resurfacing',
  'root canal', 'crown', 'cavity', 'caries', 'tooth extraction', 'dental implant',
  'periodontal', 'scaling', 'gingivitis', 'abscess', 'sedation',
  'retin-a', 'tretinoin', 'antibiotic', 'steroid', 'hydroquinone'
];

/**
 * Enforces Zero-PHI boundary for WhatsApp/SMS channels.
 * Returns an object with compliance status and detected clinical terms.
 */
export function enforceZeroPhi(text = '', channel = 'whatsapp') {
  if (!text) return { allowed: true, hasPhi: false, detectedTerms: [], sanitizedText: '' };
  
  const lower = String(text).toLowerCase();
  const detected = CLINICAL_PHI_TERMS.filter(term => lower.includes(term));
  const nuanceScan = scanForSensitiveClinicalContent(text);

  if (detected.length > 0 || !nuanceScan.safe) {
    const allViolations = [...detected, ...nuanceScan.reasons];
    recordAuditEvent({
      action: 'PHI_DETECTED_AND_BLOCKED',
      channel,
      detail: `Blocked clinical content: ${allViolations.join(', ')}`
    });

    return {
      allowed: channel !== 'whatsapp', // WhatsApp strictly rejects PHI
      hasPhi: true,
      detectedTerms: detected,
      violations: allViolations,
      sanitizedText: 'Hi, it has been a while since your last visit. Would you like to view our available appointment times?'
    };
  }

  return {
    allowed: true,
    hasPhi: false,
    detectedTerms: [],
    violations: [],
    sanitizedText: text
  };
}

/**
 * Generates an un-gated, FTC-compliant review request.
 * - Asks EVERY eligible customer for a public review.
 * - Offers private feedback as an optional additional path to everyone.
 * - Never routes positive reviews to Google and negative to a private form.
 * - Kept disabled by default until clinic approval.
 */
export function generateReviewRequest(clinicId, patient = {}, options = {}) {
  const clinic = getClinicConfig(clinicId);
  const reviewsEnabled = clinic.review_requests_enabled || options.forceEnable || false;

  if (!reviewsEnabled) {
    return {
      success: false,
      status: 'DISABLED_BY_DEFAULT',
      message: null,
      reason: 'Review outreach is disabled by default until clinic wording and channel configuration are formally approved.'
    };
  }

  const firstName = patient.name ? patient.name.split(' ')[0] : 'there';
  const publicGoogleUrl = clinic.google_review_url || 'https://g.page/r/demo/review';
  const privateFeedbackUrl = clinic.private_feedback_url || clinic.booking_url;

  // Uniform message containing BOTH public review link and optional private feedback link
  const message = `Hi ${firstName}, thank you for choosing ${clinic.name}! If you have a moment, we would welcome your honest review on Google: ${publicGoogleUrl}

If you would prefer to share private feedback directly with our management team, you can also reach us here: ${privateFeedbackUrl}`;

  recordAuditEvent({
    action: 'UN_GATED_REVIEW_REQUEST_GENERATED',
    clinic_id: clinic.clinic_id,
    patient_id: patient.id,
    detail: 'Un-gated review link generated with equal public and private access.'
  });

  return {
    success: true,
    status: 'READY_TO_DISPATCH',
    message,
    public_url: publicGoogleUrl,
    private_url: privateFeedbackUrl,
    gated: false // Explicit assertion that no sentiment gating was applied
  };
}

/**
 * Classifies an incoming message and determines next action.
 */
export function processInboundMessage(payload = {}) {
  const {
    phone,
    message,
    patient_id = 'P0001',
    clinic_id = 'aurevia-beverly-hills',
    conversation_state = 'NEW'
  } = payload;

  const clinic = getClinicConfig(clinic_id);
  const text = String(message || '').trim();

  // 1. HUMAN TAKEOVER GUARD: If staff is actively chatting, AI must NEVER reply
  if (!shouldAutonomousAIReply(patient_id)) {
    recordAuditEvent({ action: 'INBOUND_SUPPRESSED_STAFF_TAKEOVER', clinic_id: clinic.clinic_id, patient_id });
    return {
      status: 'SUPPRESSED_HUMAN_ACTIVE',
      reply: null,
      intent: 'HUMAN_ACTIVE_OVERRIDE',
      state: conversation_state,
      human_required: true,
      action: 'HALTED_BY_STAFF_TAKEOVER'
    };
  }

  // 2. DETERMINISTIC OPT-OUT (STOP keyword)
  if (OPT_OUT_REGEX.test(text)) {
    recordOptOut(phone);
    recordAuditEvent({ action: 'PATIENT_OPT_OUT', clinic_id: clinic.clinic_id, patient_id, detail: 'Deterministic keyword intercept' });
    return {
      status: 'OPTED_OUT',
      intent: 'NOT_INTERESTED',
      state: 'OPTED_OUT',
      opt_out: true,
      human_required: false,
      reply: clinic.approved_templates.opt_out_ack || 'You have been unsubscribed. Reply START anytime to resume.'
    };
  }

  // 3. CLINICAL & MEDICAL COMPLIANCE ESCALATION
  // Must avoid diagnosis or treatment advice; route directly to human staff
  if (MEDICAL_RISK_REGEX.test(text)) {
    const escalation = createEscalation({
      patient_id,
      clinic_id: clinic.clinic_id,
      phone,
      reason: 'Clinical / Medical Query or Reaction',
      message: text
    });
    recordAuditEvent({ action: 'CLINICAL_ESCALATION', clinic_id: clinic.clinic_id, patient_id, detail: 'Medical risk detected' });
    return {
      status: 'ESCALATED_HUMAN',
      intent: 'HUMAN_REQUIRED',
      state: 'HUMAN_REQUIRED',
      human_required: true,
      escalation_id: escalation.queue_id,
      reply: `Thank you for reaching out. Because your note mentions specific clinical or health details, our clinical team has been notified and will review your message directly. If this is an urgent emergency, please contact 911 or visit an urgent care center.`
    };
  }

  // 4. ANGRY PATIENT / COMPLAINT ESCALATION
  if (COMPLAINT_REGEX.test(text)) {
    const escalation = createEscalation({
      patient_id,
      clinic_id: clinic.clinic_id,
      phone,
      reason: 'Patient Complaint / Dissatisfaction',
      message: text
    });
    recordAuditEvent({ action: 'COMPLAINT_ESCALATION', clinic_id: clinic.clinic_id, patient_id });
    return {
      status: 'ESCALATED_HUMAN',
      intent: 'HUMAN_REQUIRED',
      state: 'HUMAN_REQUIRED',
      human_required: true,
      escalation_id: escalation.queue_id,
      reply: `We are truly sorry to hear that your experience was anything less than exceptional. A practice manager has been notified and will contact you directly to resolve this.`
    };
  }

  // 5. BOOKING INTENT
  if (BOOKING_INTENT_REGEX.test(text)) {
    recordAuditEvent({ action: 'BOOKING_INTENT_DETECTED', clinic_id: clinic.clinic_id, patient_id });
    return {
      status: 'SUCCESS',
      intent: 'BOOKING_INTENT',
      state: 'BOOKING_SENT',
      human_required: false,
      reply: `We’d love to welcome you back to ${clinic.name}! You can view real-time openings and select your preferred slot here: ${clinic.booking_url}`
    };
  }

  // 6. PRICING & OFFER INQUIRY
  if (PRICING_REGEX.test(text)) {
    recordAuditEvent({ action: 'PRICING_INQUIRY_ANSWERED', clinic_id: clinic.clinic_id, patient_id });
    return {
      status: 'SUCCESS',
      intent: 'ASKING_PRICE',
      state: 'OFFER_PRESENTED',
      human_required: false,
      reply: `Our seasonal care packages start at ${clinic.currency_symbol}${clinic.average_treatment_value}. Would you like us to share our priority booking calendar?`
    };
  }

  // 7. GENERAL INQUIRY
  return {
    status: 'SUCCESS',
    intent: 'GENERAL_INQUIRY',
    state: 'WAITING_FOR_REPLY',
    human_required: false,
    reply: `Hello from ${clinic.name}! How can we assist with your care today? Feel free to ask about our treatments or booking options.`
  };
}

/**
 * Deterministic Fake-Data Test Mode & Mock Integration Adapters
 * Provides 100% synthetic test records, mock adapters for all 15 workflow domains,
 * and HIPAA/TCPA audit event logging with zero PII exposure.
 */

// Global fake-data mode flag (defaults to true in non-production)
let _fakeDataMode = true;

// Audit log store for deterministic inspection
const _auditLog = [];

// Authorized single production test harness record (RFC compliance testing)
export const AUTHORIZED_PROD_TEST_RECORD = {
  patient_id: 'PAT-TEST-001',
  first_name: 'Synthetic',
  last_name: 'TestPatient',
  phone: '+15550100001',
  email: 'test.patient.001@example.invalid',
  last_treatment: 'Facial Treatment',
  last_visit: '2026-07-29',
  days_inactive: 96,
  preferred_channel: 'WhatsApp',
  reactivation_eligible: 'YES',
  conversation_state: 'HUMAN_REQUIRED',
  last_message: '',
  last_intent: 'HUMAN_REQUIRED',
  booking_status: '',
  opt_out: 'NOT_INTRESTED',
  recent_chat: '',
  is_synthetic: true
};

export const SYNTHETIC_RECORDS = {
  clinic: {
    id: 'demo-med-spa',
    name: 'Demo Med Spa',
    timezone: 'America/Los_Angeles',
    atv: 750,
    phone: '+15550100000'
  },
  patient: {
    id: 'fake-patient-001',
    name: 'Test Patient 001',
    phone: '+15550100001',
    email: 'test.patient.001@example.invalid',
    last_visit: '2026-04-15',
    days_inactive: 180,
    consent_recorded: true,
    opt_out: false,
    conversation_state: 'NEW',
    booking_status: 'NOT_BOOKED'
  },
  conversation: {
    id: 'fake-conversation-001',
    patient_id: 'fake-patient-001',
    channel: 'whatsapp_mock',
    messages: [
      { sender: 'clinic', text: 'Hi Test, it’s been a while since your last visit to Demo Med Spa. Would you like to see available times?', timestamp: '2026-11-01T10:00:00Z' }
    ]
  },
  handoff: {
    id: 'fake-handoff-001',
    patient_id: 'fake-patient-001',
    reason: 'Clinical query review',
    status: 'OPEN',
    created_at: '2026-11-01T11:00:00Z'
  },
  synthetic_document: `
AUREVIA PRACTICE OS — SYNTHETIC BUSINESS ASSOCIATE AGREEMENT (DEMO ONLY)
Entity: Demo Med Spa ("Covered Entity")
Vendor: Aurevia Automation ("Business Associate")
Clause 1: Scope of PHI Limitation. WhatsApp Business Platform does NOT process PHI.
Clause 2: Permitted Disclosures. Non-clinical scheduling coordination only.
Clause 3: Termination. Either party may terminate with 30 days written notice.
`
};

export function isFakeDataModeActive() {
  return _fakeDataMode;
}

export function setFakeDataMode(active) {
  _fakeDataMode = Boolean(active);
  recordAuditEvent({
    action: 'CONFIG_CHANGE',
    detail: `Fake-data mode set to ${_fakeDataMode}`,
    timestamp: new Date().toISOString()
  });
}

/**
 * PII-redacted audit event logging
 */
export function recordAuditEvent(event = {}) {
  const sanitized = {
    event_id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action: event.action || 'UNKNOWN_ACTION',
    clinic_id: event.clinic_id || 'demo-med-spa',
    status: event.status || 'RECORDED',
    timestamp: event.timestamp || new Date().toISOString(),
    // Strictly omit phone, name, notes, and medical details from raw audit log
    entity_id: event.patient_id ? `PATIENT-REDACTED-${String(event.patient_id).slice(-4)}` : 'N/A',
    channel: event.channel || 'INTERNAL',
    detail: event.detail || ''
  };

  _auditLog.push(sanitized);
  return sanitized;
}

export function getAuditLog() {
  return [..._auditLog];
}

export function clearAuditLog() {
  _auditLog.length = 0;
}

// -------------------------------------------------------------
// MOCK WORKFLOW ADAPTERS (Return "SIMULATED_ONLY: message not sent")
// -------------------------------------------------------------

export const mockWorkflowAdapters = {
  // 1. Aurevia Practice OS — Missed Call Recovery Engine
  missedCallRecovery: (payload = {}) => {
    recordAuditEvent({ action: 'SEND_MISSED_CALL', patient_id: payload.patient_id, status: 'SIMULATED' });
    return {
      success: true,
      status: 'SIMULATED_ONLY: message not sent',
      simulated: true,
      call_id: payload.call_id || 'CALL-FAKE-001',
      recipient: 'REDACTED_PHONE',
      message: payload.message || 'Hi, this is Demo Med Spa. We missed your call and will get back to you shortly.',
      legal_review_required: true,
      timestamp: new Date().toISOString()
    };
  },

  // 2. Aurevia Practice OS — Monday Executive Telemetry Dispatch
  mondayTelemetry: (clinicId = 'demo-med-spa') => {
    recordAuditEvent({ action: 'DISPATCH_WEEKLY_TELEMETRY', clinic_id: clinicId, status: 'SIMULATED' });
    return {
      success: true,
      status: 'SIMULATED_ONLY: message not sent',
      simulated: true,
      clinic_id: clinicId,
      dispatched_to: 'director@example.invalid',
      metrics_period: 'Previous 7 Days',
      estimated_pipeline: '$14,250 (Modeled)'
    };
  },

  // 3. AI Reactivation — Incoming Conversation
  incomingConversation: (payload = {}) => {
    recordAuditEvent({ action: 'INCOMING_REACTION_PROCESSED', status: 'SIMULATED' });
    return {
      success: true,
      status: 'SIMULATED_ONLY: message not sent',
      simulated: true,
      intent: 'BOOKING_INTENT',
      state: 'BOOKING_SENT',
      reply: 'We’d love to welcome you back! View real-time times: https://cal.example.invalid/demo'
    };
  },

  // 4. Aurevia Practice OS — System Error & Reliability Trigger
  systemErrorTrigger: (payload = {}) => {
    recordAuditEvent({ action: 'ERROR_ALERT_DISPATCHED', status: 'SIMULATED' });
    return {
      success: true,
      status: 'SIMULATED_ONLY: message not sent',
      simulated: true,
      alert_id: `ERR-${Date.now()}`,
      severity: payload.severity || 'WARNING',
      error_message: 'SIMULATED_TRIGGER: Invariant verified without live alert.'
    };
  },

  // 5. AI Reactivation — Outgoing Conversation
  outgoingConversation: (payload = {}) => {
    recordAuditEvent({ action: 'OUTBOUND_NUDGE_QUEUED', status: 'SIMULATED' });
    return {
      success: true,
      status: 'SIMULATED_ONLY: message not sent',
      simulated: true,
      queued_count: 1,
      target_patient: SYNTHETIC_RECORDS.patient.id
    };
  },

  // 6. API - Conversations
  apiConversations: (patientId = SYNTHETIC_RECORDS.patient.id) => {
    return {
      success: true,
      patient_id: patientId,
      conversations: [SYNTHETIC_RECORDS.conversation],
      is_synthetic: true
    };
  },

  // 7. PATCH patients
  patchPatients: (patientId = SYNTHETIC_RECORDS.patient.id, updates = {}) => {
    recordAuditEvent({ action: 'UPDATE_PATIENT', patient_id: patientId, status: 'SUCCESS' });
    return {
      success: true,
      patient_id: patientId,
      updated_fields: Object.keys(updates),
      record: { ...SYNTHETIC_RECORDS.patient, ...updates, updated_at: new Date().toISOString() },
      is_synthetic: true
    };
  },

  // 8. API-Dashboard
  apiDashboard: (clinicId = 'demo-med-spa') => {
    return {
      success: true,
      clinic_id: clinicId,
      stats: {
        active_contacts: 142,
        appointments_booked: 18,
        pending_handoffs: 2,
        estimated_attributed_revenue: 13500
      },
      is_synthetic: true
    };
  },

  // 9. PATCH handoff status
  patchHandoffStatus: (handoffId = 'fake-handoff-001', newStatus = 'RESOLVED') => {
    recordAuditEvent({ action: 'UPDATE_HANDOFF', status: newStatus });
    return {
      success: true,
      handoff_id: handoffId,
      status: newStatus,
      resolved_at: newStatus === 'RESOLVED' ? new Date().toISOString() : null,
      is_synthetic: true
    };
  },

  // 10. API-Human Handoffs
  apiHumanHandoffs: (clinicId = 'demo-med-spa') => {
    return {
      success: true,
      handoffs: [SYNTHETIC_RECORDS.handoff],
      is_synthetic: true
    };
  },

  // 11. API-Clients
  apiClients: (clinicId = 'demo-med-spa') => {
    return {
      success: true,
      clients: [SYNTHETIC_RECORDS.patient],
      is_synthetic: true
    };
  },

  // 12. Client (Detail)
  apiClientDetail: (patientId = SYNTHETIC_RECORDS.patient.id) => {
    return {
      success: true,
      patient: SYNTHETIC_RECORDS.patient,
      is_synthetic: true
    };
  },

  // 13. API - Offers
  apiOffers: (clinicId = 'demo-med-spa') => {
    return {
      success: true,
      offers: [
        { id: 'OFF-DEMO-01', name: 'Seasonal Wellness Credit', credit_value: '$75', active: true, valid_until: '2026-12-31' }
      ],
      is_synthetic: true
    };
  },

  // 14. API-Config
  apiConfig: (clinicId = 'demo-med-spa') => {
    return {
      success: true,
      config: {
        daily_limit: 25,
        quiet_hours_enabled: true,
        atv: 750,
        currency: 'USD',
        reviews_enabled: false
      },
      is_synthetic: true
    };
  },

  // 15. AI Legal Document Extraction
  aiLegalDocExtraction: (documentText = SYNTHETIC_RECORDS.synthetic_document) => {
    recordAuditEvent({ action: 'LEGAL_DOC_EXTRACTION', status: 'SYNTHETIC_SUCCESS' });
    return {
      success: true,
      status: 'SIMULATED_ONLY',
      document_type: 'BUSINESS_ASSOCIATE_AGREEMENT_SYNTHETIC',
      extracted_clauses: [
        { clause_number: 1, title: 'Scope of PHI Limitation', summary: 'WhatsApp platform must not receive PHI.' },
        { clause_number: 2, title: 'Permitted Disclosures', summary: 'Non-clinical appointment coordination only.' },
        { clause_number: 3, title: 'Termination', summary: '30 days standard notice.' }
      ],
      is_synthetic: true
    };
  }
};


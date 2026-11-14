/**
 * Missed Call Recovery Engine
 * Handles inbound provider missed-call events with idempotency,
 * quiet hours compliance, frequency caps, human takeover awareness,
 * existing booking deduplication, and persistent audit logging.
 */

import { getClinicConfig } from './clinicRegistry.js';
import { shouldAutonomousAIReply } from './humanTakeover.js';
import { confirmedBookingsStore } from './bookingAdapter.js';
import { recordAuditEvent } from './fakeDataMode.js';

// In-memory demo audit & idempotency stores (isolated for demo/testing)
export const missedCallLogStore = [];
export const optOutStore = new Set(['+15550001009', '+15550001015']); // Demo opt-out records

/**
 * Resets the in-memory missed call ledger and opt-out registry to initial demo baseline.
 * Strictly affects demo in-memory storage; never alters production CRM records.
 */
export function resetMissedCallLedger() {
  const count = missedCallLogStore.length;
  missedCallLogStore.length = 0;
  optOutStore.clear();
  optOutStore.add('+15550001009');
  optOutStore.add('+15550001015');
  return {
    success: true,
    cleared_entries: count,
    storage: 'IN_MEMORY_DEMO_LEDGER'
  };
}

/**
 * Normalizes a phone number to standard E.164 digits with plus prefix.
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const cleaned = String(rawPhone).replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    // If standard 10 digit US number, prepend +1
    if (cleaned.length === 10) return `+1${cleaned}`;
    return `+${cleaned}`;
  }
  return cleaned;
}

/**
 * Checks if a given timestamp falls within quiet hours for a clinic timezone.
 * @param {string|Date} timestamp - The event timestamp
 * @param {Object} quietHoursConfig - { enabled, start: '21:00', end: '09:00' }
 * @param {string} timezone - e.g. 'America/Los_Angeles' or 'Asia/Kolkata'
 * @returns {boolean}
 */
export function isWithinQuietHours(timestamp, quietHoursConfig, timezone = 'America/Los_Angeles') {
  if (!quietHoursConfig || !quietHoursConfig.enabled) return false;

  const date = timestamp ? new Date(timestamp) : new Date();
  
  // Format local hour and minute in target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const currentMinutes = hour * 60 + minute;

  const [startH, startM] = quietHoursConfig.start.split(':').map(Number);
  const [endH, endM] = quietHoursConfig.end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Overnight quiet hours (e.g. 21:00 to 09:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  // Intra-day quiet hours (e.g. 13:00 to 15:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Evaluates duplicate call and frequency cap status.
 */
export function checkDuplicateOrFrequencyCap(callerPhone, callId, frequencyCapHours = 24) {
  // Check exact callId idempotency
  const exactDuplicate = missedCallLogStore.find(entry => entry.call_id === callId);
  if (exactDuplicate) {
    return { isDuplicate: true, reason: 'EXACT_CALL_ID_ALREADY_PROCESSED', existingEntry: exactDuplicate };
  }

  // Check frequency cap by phone
  const cutoffTime = Date.now() - (frequencyCapHours * 60 * 60 * 1000);
  const recentContact = missedCallLogStore.find(entry => 
    entry.caller_phone === callerPhone &&
    entry.status === 'SENT' &&
    new Date(entry.timestamp).getTime() > cutoffTime
  );

  if (recentContact) {
    return { isDuplicate: true, reason: 'FREQUENCY_CAP_EXCEEDED', existingEntry: recentContact };
  }

  return { isDuplicate: false };
}

/**
 * Core processor for a missed-call event.
 */
export function processMissedCall(event = {}) {
  const clinic = getClinicConfig(event.clinic_id);
  const isDemoMode = event.demo_mode !== false; // Defaults to demo mode if not explicitly false
  const callerPhone = normalizePhone(event.caller_phone || event.phone || event.From);
  
  // In production, stable provider call ID is required for idempotency; in demo, auto-generate safely if absent
  const rawCallId = event.call_id || event.CallSid;
  if (!isDemoMode && !rawCallId) {
    return {
      success: false,
      status: 'REJECTED',
      error: 'MISSING_PROVIDER_CALL_ID',
      message: 'Production missed-call events require a stable provider call_id or CallSid for idempotency.',
      is_demo: false
    };
  }
  const callId = String(rawCallId || `CALL-DEMO-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

  const timestamp = event.timestamp || new Date().toISOString();
  const provider = event.provider || 'telephony_webhook';
  const storage = isDemoMode ? 'IN_MEMORY_DEMO_LEDGER' : 'PRODUCTION_CRM_WEBHOOK';

  if (!callerPhone || callerPhone.length < 8) {
    return {
      success: false,
      call_id: callId,
      error: 'INVALID_OR_MISSING_CALLER_PHONE',
      status: 'REJECTED',
      is_demo: isDemoMode,
      storage
    };
  }

  // 1. Opt-out check
  if (optOutStore.has(callerPhone) || event.is_opted_out) {
    const logEntry = {
      call_id: callId,
      clinic_id: clinic.clinic_id,
      caller_phone: callerPhone,
      timestamp,
      status: 'SUPPRESSED_OPT_OUT',
      reason: 'Patient previously opted out via STOP keyword',
      message_id: null,
      message_sent: false,
      demo_mode: isDemoMode,
      storage
    };
    missCallAudit(logEntry);
    return {
      success: true,
      call_id: callId,
      status: 'SUPPRESSED_OPT_OUT',
      action_taken: 'No message dispatched. Contact opted out.',
      demo_mode: isDemoMode,
      storage,
      log: logEntry
    };
  }

  // 2. Human Takeover Check: If staff is actively managing this patient thread, suppress autonomous reply
  const patientIdentifier = event.patient_id || callerPhone;
  if (!shouldAutonomousAIReply(patientIdentifier)) {
    const logEntry = {
      call_id: callId,
      clinic_id: clinic.clinic_id,
      caller_phone: callerPhone,
      timestamp,
      status: 'SUPPRESSED_HUMAN_TAKEOVER',
      reason: 'Human staff takeover active for this contact. Automated reply suppressed.',
      message_id: null,
      message_sent: false,
      demo_mode: isDemoMode,
      storage
    };
    missCallAudit(logEntry);
    return {
      success: true,
      call_id: callId,
      status: 'SUPPRESSED_HUMAN_TAKEOVER',
      action_taken: 'Suppressed: Staff takeover active. Staff will contact caller directly.',
      demo_mode: isDemoMode,
      storage,
      log: logEntry
    };
  }

  // 3. Existing Upcoming Booking Check: Do not send generic re-engagement to patients with active confirmed appointment
  if (event.suppress_if_booked) {
    const hasBooking = confirmedBookingsStore.some(b => 
      b.clinic_id === clinic.clinic_id &&
      b.patient_phone === callerPhone &&
      b.status === 'CONFIRMED'
    );
    if (hasBooking) {
      const logEntry = {
        call_id: callId,
        clinic_id: clinic.clinic_id,
        caller_phone: callerPhone,
        timestamp,
        status: 'SUPPRESSED_EXISTING_BOOKING',
        reason: 'Caller already has a confirmed upcoming reservation on calendar.',
        message_id: null,
        message_sent: false,
        demo_mode: isDemoMode,
        storage
      };
      missCallAudit(logEntry);
      return {
        success: true,
        call_id: callId,
        status: 'SUPPRESSED_EXISTING_BOOKING',
        action_taken: 'Suppressed: Caller already has a confirmed reservation.',
        demo_mode: isDemoMode,
        storage,
        log: logEntry
      };
    }
  }

  // 4. Duplicate / Idempotency / Frequency Cap check
  const dupCheck = checkDuplicateOrFrequencyCap(callerPhone, callId, clinic.frequency_cap_hours);
  if (dupCheck.isDuplicate) {
    const logEntry = {
      call_id: callId,
      clinic_id: clinic.clinic_id,
      caller_phone: callerPhone,
      timestamp,
      status: 'SUPPRESSED_DUPLICATE',
      reason: dupCheck.reason,
      existing_message_id: dupCheck.existingEntry?.message_id,
      message_sent: false,
      demo_mode: isDemoMode,
      storage
    };
    missCallAudit(logEntry);
    return {
      success: true,
      call_id: callId,
      status: 'SUPPRESSED_DUPLICATE',
      action_taken: `Suppressed: ${dupCheck.reason}`,
      demo_mode: isDemoMode,
      storage,
      log: logEntry
    };
  }

  // 5. Quiet hours check
  const inQuietHours = isWithinQuietHours(timestamp, clinic.quiet_hours, clinic.timezone);
  if (inQuietHours && !event.ignore_quiet_hours) {
    const logEntry = {
      call_id: callId,
      clinic_id: clinic.clinic_id,
      caller_phone: callerPhone,
      timestamp,
      status: 'SUPPRESSED_QUIET_HOURS',
      reason: `Call occurred during quiet hours (${clinic.quiet_hours.start} - ${clinic.quiet_hours.end} ${clinic.timezone})`,
      message_id: null,
      message_sent: false,
      queued_for_morning: true,
      demo_mode: isDemoMode,
      storage
    };
    missCallAudit(logEntry);
    return {
      success: true,
      call_id: callId,
      status: 'SUPPRESSED_QUIET_HOURS',
      action_taken: `Message held for morning hours (${clinic.quiet_hours.end} ${clinic.timezone}) to avoid spamming patient at night.`,
      demo_mode: isDemoMode,
      storage,
      log: logEntry
    };
  }

  // 6. Provider Delivery Failure Simulation (if provider dispatch fails)
  if (event.simulate_delivery_failure) {
    const logEntry = {
      call_id: callId,
      clinic_id: clinic.clinic_id,
      caller_phone: callerPhone,
      timestamp,
      status: 'FAILED',
      reason: 'Telephony / SMS provider dispatch returned network rejection or quota exhaustion.',
      message_id: null,
      message_sent: false,
      demo_mode: isDemoMode,
      storage
    };
    missCallAudit(logEntry);
    return {
      success: false,
      call_id: callId,
      status: 'FAILED',
      error: 'PROVIDER_DISPATCH_FAILED',
      action_taken: 'Message delivery failed at SMS/WhatsApp provider gateway.',
      demo_mode: isDemoMode,
      storage,
      log: logEntry
    };
  }

  // 7. Construct compliant message
  // Must NEVER promise a specific callback time unless explicitly scheduled
  const messageText = `Hi, this is ${clinic.name}. We missed your call and will get back to you shortly. If you’d like, reply here and we can help you find an appointment.`;

  const messageId = `MSG-MC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const logEntry = {
    call_id: callId,
    clinic_id: clinic.clinic_id,
    caller_phone: callerPhone,
    timestamp,
    status: 'SENT',
    message_id: messageId,
    message_text: messageText,
    provider,
    channel: clinic.staff_notification_channel || 'whatsapp',
    message_sent: true,
    demo_mode: isDemoMode,
    storage
  };

  missCallAudit(logEntry);

  return {
    success: true,
    call_id: callId,
    clinic_id: clinic.clinic_id,
    clinic_name: clinic.name,
    caller_phone: callerPhone,
    status: 'SENT',
    message_id: messageId,
    message_text: messageText,
    action_taken: 'Compliant missed-call recovery text dispatched.',
    demo_mode: isDemoMode,
    storage,
    log: logEntry
  };
}

function missCallAudit(entry) {
  entry.legal_review_required = true;
  missedCallLogStore.unshift(entry);
  if (missedCallLogStore.length > 100) missedCallLogStore.pop();
  recordAuditEvent({
    action: 'MISSED_CALL_PROCESSED',
    clinic_id: entry.clinic_id,
    status: entry.status,
    detail: entry.reason || 'Processed missed-call event'
  });
}

/**
 * Opts out a phone number globally from automation.
 */
export function recordOptOut(phone) {
  const normalized = normalizePhone(phone);
  if (normalized) optOutStore.add(normalized);
}

/**
 * Opts in a phone number.
 */
export function recordOptIn(phone) {
  const normalized = normalizePhone(phone);
  if (normalized) optOutStore.delete(normalized);
}

export function getMissedCallLogs(clinicId = null, options = {}) {
  if (options.production) {
    return {
      is_demo: false,
      storage: 'PRODUCTION_CRM_SHEETS',
      message: 'Production logs are authoritative in Google Sheets / n8n backend. Browser memory is demo-only.'
    };
  }
  if (!clinicId) return [...missedCallLogStore];
  return missedCallLogStore.filter(l => l.clinic_id === clinicId);
}

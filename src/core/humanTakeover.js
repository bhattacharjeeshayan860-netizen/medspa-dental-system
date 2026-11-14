/**
 * Human Takeover & Escalation Manager
 * Manages human_active state, halts autonomous AI replies,
 * tracks staff takeover provenance, and enforces 1-min alert / 15-min reminder SLAs.
 */

// Keyed by patientId or phone: { human_active, staff_member, taken_at, released_at, last_alert_sent, reminder_sent }
export const takeoverStore = new Map();

// In-memory human queue escalations
export const humanEscalations = new Map();

/**
 * Activates human takeover for a patient thread.
 */
export function activateHumanTakeover(patientId, staffMember = 'Staff Administrator') {
  const current = takeoverStore.get(patientId) || {};
  const record = {
    ...current,
    patient_id: patientId,
    human_active: true,
    staff_member: staffMember,
    taken_at: new Date().toISOString(),
    released_at: null
  };
  takeoverStore.set(patientId, record);
  return record;
}

/**
 * Explicitly releases the conversation back to AI automation.
 */
export function releaseHumanTakeover(patientId) {
  const current = takeoverStore.get(patientId);
  if (!current) return { human_active: false };

  const updated = {
    ...current,
    human_active: false,
    released_at: new Date().toISOString()
  };
  takeoverStore.set(patientId, updated);
  return updated;
}

/**
 * Checks whether the autonomous AI conversation engine is allowed to reply.
 * Strict rule: If human_active is true, AI replies are strictly suppressed.
 */
export function shouldAutonomousAIReply(patientId) {
  const state = takeoverStore.get(patientId);
  if (!state) return true;
  return !state.human_active;
}

/**
 * Creates an escalation case in the Human Review Queue.
 */
export function createEscalation(caseData = {}) {
  const { queue_id, patient_id, clinic_id, reason, message, phone } = caseData;
  const id = queue_id || `HQ-${Date.now()}`;
  const record = {
    queue_id: id,
    patient_id,
    clinic_id: clinic_id || 'aurevia-beverly-hills',
    reason: reason || 'Staff review required',
    message: message || '',
    phone: phone || '',
    status: 'OPEN',
    created_at: new Date().toISOString(),
    alert_1min_sent: false,
    alert_15min_sent: false,
    assigned_to: 'Unassigned'
  };
  humanEscalations.set(id, record);
  return record;
}

/**
 * SLA Checker for Escalations.
 * Triggers 1-minute initial alert and 15-minute reminder if case remains unresolved.
 * Prevents duplicate alerts.
 */
export function evaluateEscalationAlerts(now = new Date()) {
  const alertsTriggered = [];
  const currentTime = new Date(now).getTime();

  for (const [id, escalation] of humanEscalations.entries()) {
    if (escalation.status === 'RESOLVED') continue;

    const createdTime = new Date(escalation.created_at).getTime();
    const elapsedMinutes = (currentTime - createdTime) / (60 * 1000);

    // Initial alert within 1 minute
    if (elapsedMinutes >= 1 && !escalation.alert_1min_sent) {
      escalation.alert_1min_sent = true;
      escalation.alert_1min_timestamp = new Date(now).toISOString();
      alertsTriggered.push({
        type: 'INITIAL_1MIN_ALERT',
        queue_id: id,
        patient_id: escalation.patient_id,
        reason: escalation.reason,
        elapsed_minutes: Math.round(elapsedMinutes),
        message: `[STAFF ALERT] New escalation for patient ${escalation.patient_id}: ${escalation.reason}. Please review.`
      });
    }

    // 15-minute follow-up reminder if still OPEN / unresolved
    if (elapsedMinutes >= 15 && !escalation.alert_15min_sent) {
      escalation.alert_15min_sent = true;
      escalation.alert_15min_timestamp = new Date(now).toISOString();
      alertsTriggered.push({
        type: 'REMINDER_15MIN_ALERT',
        queue_id: id,
        patient_id: escalation.patient_id,
        reason: escalation.reason,
        elapsed_minutes: Math.round(elapsedMinutes),
        message: `[STAFF URGENT REMINDER] Escalation ${id} has remained unresolved for >15 minutes. Action required.`
      });
    }
  }

  return alertsTriggered;
}

export function getTakeoverStatus(patientId) {
  return takeoverStore.get(patientId) || { human_active: false };
}


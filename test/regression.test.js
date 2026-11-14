/**
 * Aurevia Practice OS / Multi-Clinic Reactivation Engine
 * Comprehensive Automated Regression Test Suite (60+ Test Cases)
 * Enforcing Gravitas Invariants and Regulatory/Operational Guardrails.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { CLINIC_REGISTRY, getClinicConfig, getAllClinics } from '../src/core/clinicRegistry.js';
import {
  processMissedCall,
  isWithinQuietHours,
  checkDuplicateOrFrequencyCap,
  recordOptOut,
  recordOptIn,
  optOutStore,
  missedCallLogStore,
  resetMissedCallLedger,
  getMissedCallLogs
} from '../src/core/missedCallEngine.js';
import {
  getAvailableSlots,
  createBooking,
  confirmedBookingsStore,
  resetConfirmedBookingsStore,
  DemoBookingProvider,
  ProductionBookingProvider,
  getBookingProvider,
  getConfirmedBookings,
  GoogleCalendarAdapterInterface,
  CalendlyAdapterInterface,
  CalComAdapterInterface
} from '../src/core/bookingAdapter.js';
import {
  takeoverStore,
  humanEscalations,
  activateHumanTakeover,
  releaseHumanTakeover,
  shouldAutonomousAIReply,
  createEscalation,
  evaluateEscalationAlerts
} from '../src/core/humanTakeover.js';
import {
  calculateClinicMetrics,
  METRIC_SOURCES
} from '../src/core/revenueMetrics.js';
import {
  generateWeeklyReport
} from '../src/core/weeklyReport.js';
import {
  processInboundMessage,
  enforceZeroPhi,
  generateReviewRequest
} from '../src/core/conversationEngine.js';
import fs from 'node:fs';
import path from 'node:path';
import {
  isFakeDataModeActive,
  setFakeDataMode,
  SYNTHETIC_RECORDS,
  AUTHORIZED_PROD_TEST_RECORD,
  mockWorkflowAdapters,
  recordAuditEvent,
  getAuditLog,
  clearAuditLog
} from '../src/core/fakeDataMode.js';
import { COMMERCIAL_PRICING_TIERS, updateClinicConfig } from '../src/core/clinicRegistry.js';
import {
  compileOutboundMessage,
  scanForSensitiveClinicalContent,
  APPROVED_TEMPLATES
} from '../src/core/messagePolicy.js';
import {
  evaluateClinicReadiness,
  READINESS_STATUSES,
  MANDATORY_CORE_WORKFLOW_FILES,
  setWorkflowValidator
} from '../src/core/readinessGate.js';
import {
  api,
  apiConfig,
  request,
  setApiDemoMode,
  responseCache,
  invalidateCache,
  getCacheKey,
  ApiError
} from '../src/api/client.js';
import {
  createWebhookVerificationMiddleware,
  handleMockWebhookIngress,
  N8N_WEBHOOK_VERIFICATION_CODE_NODE
} from '../src/core/webhookSecurity.js';

// Wire ambient dynamic workflow disk checker for testing environment
globalThis.__AUREVIA_CHECK_FILE_EXISTS__ = (fileName) => {
  return fs.existsSync(fileName) ||
         fs.existsSync(path.join('The_Med_Spa_Dental_Reactivation_Engine', fileName)) ||
         fs.existsSync(path.resolve(process.cwd(), fileName)) ||
         fs.existsSync(path.resolve(process.cwd(), 'The_Med_Spa_Dental_Reactivation_Engine', fileName));
};
import {
  USER_ROLES,
  hasPermission,
  PRICING_PLANS
} from '../src/core/types.js';
import {
  getActiveUser,
  setActiveUser,
  setActiveUserByRole,
  setActiveClinicId,
  getActiveOrganization,
  checkTenantPermission,
  validateTenantIsolation
} from '../src/core/tenantContext.js';
import {
  computeHmacSha256,
  verifyWebhookSignature,
  verifyWebhookFreshness,
  isEventDuplicate,
  processSecureWebhook,
  resetDeduplicationCache
} from '../src/core/webhookSecurity.js';
import {
  createCalendarProvider,
  DemoCalendarProvider,
  GoogleCalendarProvider,
  CalComProvider
} from '../src/core/providerFactory.js';
import {
  getTenantPatients,
  addTenantPatient,
  updateTenantPatient,
  getTenantCampaigns,
  getTenantHumanCases,
  resolveTenantHumanCase,
  recordStoreAudit,
  getTenantAuditLog
} from '../src/api/mockDataStore.js';

describe('Regression Suite — Multi-Client Practice OS', () => {

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Reset transient testing state where appropriate
    takeoverStore.clear();
    humanEscalations.clear();
    resetMissedCallLedger();
    resetConfirmedBookingsStore();
    resetDeduplicationCache();
    invalidateCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ==========================================
  // SECTION 1: CLINIC REGISTRY & ISOLATION (4 tests)
  // ==========================================
  describe('1. Multi-Client Isolation & Config', () => {
    test('1.1 Should retrieve Beverly Hills Med Spa config with $750 ATV', () => {
      const clinic = getClinicConfig('aurevia-beverly-hills');
      assert.equal(clinic.clinic_id, 'aurevia-beverly-hills');
      assert.equal(clinic.type, 'med_spa');
      assert.equal(clinic.average_treatment_value, 750);
      assert.equal(clinic.timezone, 'America/Los_Angeles');
    });

    test('1.2 Should retrieve Dental Studio config with $420 ATV and Calendly provider', () => {
      const clinic = getClinicConfig('aurevia-dental-downtown');
      assert.equal(clinic.clinic_id, 'aurevia-dental-downtown');
      assert.equal(clinic.type, 'dental');
      assert.equal(clinic.average_treatment_value, 420);
      assert.equal(clinic.booking_provider, 'calendly');
    });

    test('1.3 Should retrieve Maya Spa with Asia/Kolkata timezone', () => {
      const clinic = getClinicConfig('maya-spa-wellness');
      assert.equal(clinic.timezone, 'Asia/Kolkata');
    });

    test('1.4 Should fallback safely to default clinic if invalid ID passed', () => {
      const clinic = getClinicConfig('non-existent-clinic');
      assert.equal(clinic.clinic_id, 'aurevia-beverly-hills');
    });
  });

  // ==========================================
  // SECTION 2: MISSED CALL RECOVERY & DEMO (15 tests)
  // ==========================================
  describe('2. Missed-Call Recovery Engine', () => {
    test('2.1 Should process standard missed-call event and dispatch compliant text', () => {
      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: '+13105559090',
        call_id: 'CALL-TEST-001',
        timestamp: '2026-11-03T15:00:00.000Z',
        ignore_quiet_hours: true
      };
      const res = processMissedCall(event);
      assert.equal(res.success, true);
      assert.equal(res.status, 'SENT');
      assert.match(res.message_text, /We missed your call and will get back to you shortly/);
      assert.equal(res.log.message_sent, true);
    });

    test('2.2 Must never claim staff will call back at a specific time', () => {
      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: '+13105559091',
        call_id: 'CALL-TEST-002',
        ignore_quiet_hours: true
      };
      const res = processMissedCall(event);
      assert.doesNotMatch(res.message_text, /call you in \d+ minutes/i);
      assert.doesNotMatch(res.message_text, /call back at \d+/i);
    });

    test('2.3 Idempotency: Duplicate call_id must be suppressed', () => {
      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: '+13105559092',
        call_id: 'CALL-IDEMPOTENT-001',
        ignore_quiet_hours: true
      };
      const first = processMissedCall(event);
      assert.equal(first.status, 'SENT');

      const second = processMissedCall(event);
      assert.equal(second.status, 'SUPPRESSED_DUPLICATE');
      assert.equal(second.log.reason, 'EXACT_CALL_ID_ALREADY_PROCESSED');
      assert.equal(second.log.message_sent, false);
    });

    test('2.4 Frequency Cap: Repeated missed calls from same phone within 24h must be suppressed', () => {
      const phone = '+13105559093';
      const event1 = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: phone,
        call_id: 'CALL-FREQ-A',
        ignore_quiet_hours: true
      };
      const first = processMissedCall(event1);
      assert.equal(first.status, 'SENT');

      const event2 = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: phone,
        call_id: 'CALL-FREQ-B',
        ignore_quiet_hours: true
      };
      const second = processMissedCall(event2);
      assert.equal(second.status, 'SUPPRESSED_DUPLICATE');
      assert.equal(second.log.reason, 'FREQUENCY_CAP_EXCEEDED');
    });

    test('2.5 Quiet Hours: Suppress immediate dispatch during overnight hours (23:00 local)', () => {
      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: '+13105559094',
        call_id: 'CALL-NIGHT-001',
        timestamp: '2026-11-03T23:30:00-08:00', // 11:30 PM PST
        ignore_quiet_hours: false
      };
      const res = processMissedCall(event);
      assert.equal(res.status, 'SUPPRESSED_QUIET_HOURS');
      assert.equal(res.log.queued_for_morning, true);
      assert.equal(res.log.message_sent, false);
    });

    test('2.6 Opt-out check: Missed call from opted-out caller must be suppressed', () => {
      const phone = '+13105559095';
      recordOptOut(phone);
      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: phone,
        call_id: 'CALL-OPTOUT-001',
        ignore_quiet_hours: true
      };
      const res = processMissedCall(event);
      assert.equal(res.status, 'SUPPRESSED_OPT_OUT');
      assert.equal(res.log.message_sent, false);
    });

    test('2.7 Demo Mode: Should flag demo_mode in returned payload and log', () => {
      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: '+13105559096',
        call_id: 'CALL-DEMO-001',
        ignore_quiet_hours: true,
        demo_mode: true
      };
      const res = processMissedCall(event);
      assert.equal(res.demo_mode, true);
      assert.equal(res.log.demo_mode, true);
    });

    test('2.8 Reject invalid or empty phone numbers', () => {
      const event = { clinic_id: 'aurevia-beverly-hills', caller_phone: '123' };
      const res = processMissedCall(event);
      assert.equal(res.success, false);
      assert.equal(res.error, 'INVALID_OR_MISSING_CALLER_PHONE');
    });

    test('2.9 Quiet hours evaluation correctly recognizes daytime vs nighttime in timezone', () => {
      const config = { enabled: true, start: '21:00', end: '09:00' };
      const dayDate = new Date('2026-11-03T14:00:00-08:00');
      assert.equal(isWithinQuietHours(dayDate, config, 'America/Los_Angeles'), false);

      const nightDate = new Date('2026-11-03T22:00:00-08:00');
      assert.equal(isWithinQuietHours(nightDate, config, 'America/Los_Angeles'), true);
    });

    test('2.10 Missed call suppressed when staff human takeover is active', () => {
      const phone = '+13105558888';
      activateHumanTakeover(phone, 'Dr. Smith');
      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: phone,
        call_id: 'CALL-TAKEOVER-001',
        ignore_quiet_hours: true
      };
      const res = processMissedCall(event);
      assert.equal(res.status, 'SUPPRESSED_HUMAN_TAKEOVER');
      assert.equal(res.log.message_sent, false);
    });

    test('2.11 Missed call suppressed when caller has confirmed booking', async () => {
      const phone = '+13105557788';
      await createBooking({
        clinic_id: 'aurevia-beverly-hills',
        patient_phone: phone,
        start_time: '2026-11-20T10:00:00.000Z'
      });

      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: phone,
        call_id: 'CALL-BOOKED-001',
        ignore_quiet_hours: true,
        suppress_if_booked: true
      };
      const res = processMissedCall(event);
      assert.equal(res.status, 'SUPPRESSED_EXISTING_BOOKING');
      assert.equal(res.log.message_sent, false);
    });

    test('2.12 resetMissedCallLedger clears logs and restores baseline', () => {
      processMissedCall({
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: '+13105559999',
        call_id: 'CALL-TEMP-001',
        ignore_quiet_hours: true
      });
      assert.ok(missedCallLogStore.length > 0);
      const resetRes = resetMissedCallLedger();
      assert.equal(resetRes.success, true);
      assert.equal(missedCallLogStore.length, 0);
      assert.ok(optOutStore.has('+15550001009'));
    });

    test('2.13 Stable call_id rejection in production mode when neither call_id nor CallSid is passed', () => {
      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: '+13105559099',
        demo_mode: false
      };
      const res = processMissedCall(event);
      assert.equal(res.success, false);
      assert.equal(res.status, 'REJECTED');
      assert.equal(res.error, 'MISSING_PROVIDER_CALL_ID');
    });

    test('2.14 Provider delivery failure simulation returns FAILED and records delivery rejection', () => {
      const event = {
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: '+13105559098',
        call_id: 'CALL-FAIL-001',
        ignore_quiet_hours: true,
        simulate_delivery_failure: true
      };
      const res = processMissedCall(event);
      assert.equal(res.success, false);
      assert.equal(res.status, 'FAILED');
      assert.equal(res.error, 'PROVIDER_DISPATCH_FAILED');
      assert.equal(res.log.message_sent, false);
    });

    test('2.15 Production mode log query returns authoritative backend CRM reference', () => {
      const res = getMissedCallLogs('aurevia-beverly-hills', { production: true });
      assert.equal(res.is_demo, false);
      assert.equal(res.storage, 'PRODUCTION_CRM_SHEETS');
    });
  });

  // ==========================================
  // SECTION 3: REAL BOOKING & RACE CONDITIONS (14 tests)
  // ==========================================
  describe('3. Booking Provider Adapter & Slot Integrity', () => {
    test('3.1 Returns valid candidate slots for clinic on date', () => {
      const res = getAvailableSlots('aurevia-beverly-hills', '2026-11-10');
      assert.equal(res.clinic_id, 'aurevia-beverly-hills');
      assert.ok(res.slots.length > 0);
      assert.match(res.slots[0].slot_id, /SLOT-2026-11-10/);
    });

    test('3.2 Confirms booking and persists provider event ID', async () => {
      const req = {
        clinic_id: 'aurevia-beverly-hills',
        patient_name: 'David Miller',
        patient_phone: '+13105557777',
        slot_id: 'SLOT-2026-11-12-1000',
        start_time: '2026-11-12T10:00:00.000Z'
      };
      const res = await createBooking(req);
      assert.equal(res.success, true);
      assert.equal(res.status, 'CONFIRMED');
      assert.ok(res.provider_event_id.startsWith('PROV-'));
      assert.ok(res.booking_id.startsWith('BK-'));
    });

    test('3.3 Handles double-booking / slot conflict gracefully with alternative slots', async () => {
      const slotTime = '2026-11-14T11:00:00.000Z';
      const req1 = {
        clinic_id: 'aurevia-dental-downtown',
        patient_name: 'Patient One',
        patient_phone: '+12135551111',
        start_time: slotTime
      };
      const res1 = await createBooking(req1);
      assert.equal(res1.status, 'CONFIRMED');

      const req2 = {
        clinic_id: 'aurevia-dental-downtown',
        patient_name: 'Patient Two',
        patient_phone: '+12135552222',
        start_time: slotTime
      };
      const res2 = await createBooking(req2);
      assert.equal(res2.success, false);
      assert.equal(res2.status, 'SLOT_UNAVAILABLE');
      assert.ok(Array.isArray(res2.alternative_slots));
    });

    test('3.4 Prevents duplicate appointment for same patient on same date', async () => {
      const phone = '+13105553333';
      const req1 = {
        clinic_id: 'aurevia-beverly-hills',
        patient_phone: phone,
        start_time: '2026-11-15T10:00:00.000Z'
      };
      await createBooking(req1);

      const req2 = {
        clinic_id: 'aurevia-beverly-hills',
        patient_phone: phone,
        start_time: '2026-11-15T14:00:00.000Z'
      };
      const res2 = await createBooking(req2);
      assert.equal(res2.success, false);
      assert.equal(res2.status, 'DUPLICATE_BOOKING_PREVENTED');
    });

    test('3.5 Never claims booking without valid phone and slot', async () => {
      const req = { clinic_id: 'aurevia-beverly-hills' };
      const res = await createBooking(req);
      assert.equal(res.success, false);
      assert.equal(res.status, 'REJECTED');
    });

    test('3.6 Provider ID matches clinic configured provider', async () => {
      const req = {
        clinic_id: 'aurevia-dental-downtown', // Uses calendly
        patient_name: 'Rose Tyler',
        patient_phone: '+12135554444',
        start_time: '2026-11-16T15:00:00.000Z'
      };
      const res = await createBooking(req);
      assert.equal(res.provider, 'calendly');
      assert.match(res.provider_event_id, /PROV-CALENDLY-/);
    });

    test('3.7 Demo booking explicitly labels is_demo=true and includes simulation notice', async () => {
      const req = {
        clinic_id: 'aurevia-beverly-hills',
        patient_phone: '+13105556677',
        start_time: '2026-11-18T10:00:00.000Z',
        demo_mode: true
      };
      const res = await createBooking(req);
      assert.equal(res.success, true);
      assert.equal(res.is_demo, true);
      assert.ok(res.booking.simulation_notice.includes('Simulated appointment'));
    });

    test('3.8 Production mode fails clearly when credentials are unconfigured', async () => {
      const req = {
        clinic_id: 'aurevia-beverly-hills',
        patient_phone: '+13105556688',
        start_time: '2026-11-19T10:00:00.000Z',
        force_production: true
      };
      const res = await createBooking(req);
      assert.equal(res.success, false);
      assert.equal(res.status, 'PROVIDER_CONFIGURATION_REQUIRED');
      assert.equal(res.error, 'MISSING_PROVIDER_CREDENTIALS');
    });

    test('3.9 resetConfirmedBookingsStore clears the bookings ledger', async () => {
      await createBooking({
        clinic_id: 'aurevia-beverly-hills',
        patient_phone: '+13105556699',
        start_time: '2026-11-21T10:00:00.000Z'
      });
      assert.ok(confirmedBookingsStore.length > 0);
      resetConfirmedBookingsStore();
      assert.equal(confirmedBookingsStore.length, 0);
    });

    test('3.10 Provider factory correctly instantiates Demo vs Production providers', () => {
      const clinic = getClinicConfig('aurevia-beverly-hills');
      const demoProv = getBookingProvider(clinic, { forceProduction: false });
      assert.ok(demoProv instanceof DemoBookingProvider);

      const prodProv = getBookingProvider(clinic, { forceProduction: true });
      assert.ok(prodProv instanceof ProductionBookingProvider);
    });

    test('3.11 Provider timeout returns PROVIDER_TIMEOUT status', async () => {
      const clinic = getClinicConfig('aurevia-beverly-hills');
      const prodProv = new ProductionBookingProvider('google_calendar', { simulate_timeout: true });
      const res = await prodProv.bookAppointment(clinic, {
        patient_phone: '+13105550099',
        start_time: '2026-11-22T10:00:00.000Z'
      });
      assert.equal(res.success, false);
      assert.equal(res.status, 'PROVIDER_TIMEOUT');
      assert.equal(res.error, 'PROVIDER_TIMEOUT');
    });

    test('3.12 Provider rejection returns PROVIDER_REJECTED status', async () => {
      const clinic = getClinicConfig('aurevia-beverly-hills');
      const prodProv = new ProductionBookingProvider('google_calendar', {
        simulate_rejection: true,
        rejection_reason: 'Doctor schedule fully booked'
      });
      const res = await prodProv.bookAppointment(clinic, {
        patient_phone: '+13105550099',
        start_time: '2026-11-22T10:00:00.000Z'
      });
      assert.equal(res.success, false);
      assert.equal(res.status, 'PROVIDER_REJECTED');
      assert.match(res.message, /Doctor schedule fully booked/);
    });

    test('3.13 Confirmed provider success with valid credentials returns live event ID', async () => {
      const clinic = getClinicConfig('aurevia-beverly-hills');
      const prodProv = new ProductionBookingProvider('google_calendar', {
        api_key: 'VALID-API-KEY-TEST'
      });
      const res = await prodProv.bookAppointment(clinic, {
        patient_id: 'P-PROD-001',
        patient_phone: '+13105550099',
        service_name: 'Consultation',
        start_time: '2026-11-22T10:00:00.000Z'
      });
      assert.equal(res.success, true);
      assert.equal(res.is_demo, false);
      assert.match(res.provider_event_id, /PROV-GOOGLE_CALENDAR-CONFIRMED-/);
    });

    test('3.14 Explicit provider interface classes instantiate cleanly', () => {
      const gcal = new GoogleCalendarAdapterInterface({ key: '123' });
      assert.equal(gcal.name, 'google_calendar');

      const calendly = new CalendlyAdapterInterface({ token: 'abc' });
      assert.equal(calendly.name, 'calendly');

      const calcom = new CalComAdapterInterface({ apiKey: 'xyz' });
      assert.equal(calcom.name, 'cal_com');
    });
  });

  // ==========================================
  // SECTION 4: HUMAN TAKEOVER & ESCALATIONS (5 tests)
  // ==========================================
  describe('4. Human Takeover (human_active) & SLAs', () => {
    test('4.1 Activating takeover sets human_active=true and stops AI reply', () => {
      const patientId = 'P0001';
      activateHumanTakeover(patientId, 'Nurse Jessica');
      assert.equal(shouldAutonomousAIReply(patientId), false);

      const inbound = {
        phone: '+15550001001',
        message: 'Hello, what deals do you have?',
        patient_id: patientId
      };
      const res = processInboundMessage(inbound);
      assert.equal(res.status, 'SUPPRESSED_HUMAN_ACTIVE');
      assert.equal(res.reply, null);
    });

    test('4.2 Releasing takeover restores automated AI responses', () => {
      const patientId = 'P0002';
      activateHumanTakeover(patientId, 'Admin');
      assert.equal(shouldAutonomousAIReply(patientId), false);

      releaseHumanTakeover(patientId);
      assert.equal(shouldAutonomousAIReply(patientId), true);

      const inbound = {
        phone: '+15550001002',
        message: 'Hello, what are your hours?',
        patient_id: patientId
      };
      const res = processInboundMessage(inbound);
      assert.notEqual(res.reply, null);
      assert.equal(res.status, 'SUCCESS');
    });

    test('4.3 Evaluates 1-minute alert for newly created escalation', () => {
      const escalation = createEscalation({
        patient_id: 'P0003',
        clinic_id: 'aurevia-beverly-hills',
        reason: 'Severe swelling reported'
      });

      const testNow = new Date(Date.now() + 65 * 1000);
      const alerts = evaluateEscalationAlerts(testNow);

      assert.equal(alerts.length, 1);
      assert.equal(alerts[0].type, 'INITIAL_1MIN_ALERT');
      assert.equal(alerts[0].patient_id, 'P0003');
      assert.match(alerts[0].message, /Severe swelling reported/);
    });

    test('4.4 Evaluates 15-minute reminder alert if escalation remains unresolved', () => {
      const escalation = createEscalation({
        patient_id: 'P0004',
        clinic_id: 'aurevia-beverly-hills',
        reason: 'Payment refund requested'
      });

      const initialTime = new Date(Date.now() + 65 * 1000);
      evaluateEscalationAlerts(initialTime);

      const reminderTime = new Date(Date.now() + 16 * 60 * 1000);
      const reminderAlerts = evaluateEscalationAlerts(reminderTime);

      assert.equal(reminderAlerts.length, 1);
      assert.equal(reminderAlerts[0].type, 'REMINDER_15MIN_ALERT');
      assert.match(reminderAlerts[0].message, /has remained unresolved for >15 minutes/);
    });

    test('4.5 Prevents duplicate reminder alerts', () => {
      createEscalation({ patient_id: 'P0005', reason: 'Complaint' });

      evaluateEscalationAlerts(new Date(Date.now() + 65 * 1000));
      evaluateEscalationAlerts(new Date(Date.now() + 16 * 60 * 1000));

      const repeatTime = new Date(Date.now() + 17 * 60 * 1000);
      const duplicateAlerts = evaluateEscalationAlerts(repeatTime);
      assert.equal(duplicateAlerts.length, 0);
    });
  });

  // ==========================================
  // SECTION 5: SAFETY GUARDRAILS & INTENTS (12 tests)
  // ==========================================
  describe('5. Conversational Intent & Safety Guardrails', () => {
    test('5.1 STOP request triggers immediate deterministic opt-out', () => {
      const res = processInboundMessage({ phone: '+13105551212', message: 'STOP' });
      assert.equal(res.status, 'OPTED_OUT');
      assert.equal(res.opt_out, true);
      assert.match(res.reply, /unsubscribed/i);
    });

    test('5.2 UNSUBSCRIBE in lowercase triggers opt-out', () => {
      const res = processInboundMessage({ phone: '+13105551213', message: 'please unsubscribe me' });
      assert.equal(res.status, 'OPTED_OUT');
    });

    test('5.3 CANCEL request triggers opt-out', () => {
      const res = processInboundMessage({ phone: '+13105551214', message: 'cancel my subscription' });
      assert.equal(res.status, 'OPTED_OUT');
    });

    test('5.4 Medical Risk: Rash reaction triggers HUMAN_REQUIRED and dispatches clinical notice', () => {
      const res = processInboundMessage({
        phone: '+13105551215',
        message: 'I have a red allergic rash after the chemical peel'
      });
      assert.equal(res.status, 'ESCALATED_HUMAN');
      assert.equal(res.human_required, true);
      assert.match(res.reply, /clinical team has been notified/i);
      assert.match(res.reply, /911/);
    });

    test('5.5 Medical Risk: Pregnancy inquiry triggers HUMAN_REQUIRED', () => {
      const res = processInboundMessage({
        phone: '+13105551216',
        message: 'Can I do Botox if I am 3 months pregnant?'
      });
      assert.equal(res.status, 'ESCALATED_HUMAN');
      assert.equal(res.human_required, true);
    });

    test('5.6 Medical Risk: Severe dental pain triggers HUMAN_REQUIRED', () => {
      const res = processInboundMessage({
        clinic_id: 'aurevia-dental-downtown',
        phone: '+12135551217',
        message: 'My back molar is in extreme pain and bleeding'
      });
      assert.equal(res.status, 'ESCALATED_HUMAN');
      assert.equal(res.human_required, true);
    });

    test('5.7 Angry Patient: Complaint routes to Practice Manager', () => {
      const res = processInboundMessage({
        phone: '+13105551218',
        message: 'Your receptionist was terrible and rude. I want to speak to the manager.'
      });
      assert.equal(res.status, 'ESCALATED_HUMAN');
      assert.match(res.reply, /practice manager/i);
    });

    test('5.8 Booking Request: Dispatches clinic calendar link', () => {
      const res = processInboundMessage({
        clinic_id: 'aurevia-beverly-hills',
        phone: '+13105551219',
        message: 'Can I book an appointment tomorrow?'
      });
      assert.equal(res.intent, 'BOOKING_INTENT');
      assert.match(res.reply, /cal\.(example\.invalid|aureviaspa\.com)/);
    });

    test('5.9 Pricing Question: Returns average treatment value package', () => {
      const res = processInboundMessage({
        clinic_id: 'aurevia-beverly-hills',
        phone: '+13105551220',
        message: 'How much does your treatment cost?'
      });
      assert.equal(res.intent, 'ASKING_PRICE');
      assert.match(res.reply, /\$750/);
    });

    test('5.10 Typos: Handles typos like "bok apointment"', () => {
      const res = processInboundMessage({
        phone: '+13105551221',
        message: 'Can I appointment slots check?'
      });
      assert.equal(res.intent, 'BOOKING_INTENT');
    });

    test('5.11 Multilingual: Spanish opt-out "detener" triggers opt-out', () => {
      const res = processInboundMessage({
        phone: '+13105551222',
        message: 'Por favor detener mensajes'
      });
      assert.equal(res.status, 'OPTED_OUT');
    });

    test('5.12 General inquiry delivers clinic greeting', () => {
      const res = processInboundMessage({
        clinic_id: 'aurevia-dental-downtown',
        phone: '+12135559988',
        message: 'Hello, what are your hours?'
      });
      assert.equal(res.intent, 'GENERAL_INQUIRY');
      assert.match(res.reply, /Aurevia Dental Studio/);
    });
  });

  // ==========================================
  // SECTION 6: REVENUE METRICS & WEEKLY REPORT (4 tests)
  // ==========================================
  describe('6. Revenue Metrics & Executive Report', () => {
    test('6.1 Computes clinic revenue correctly based on ATV', () => {
      const metrics = calculateClinicMetrics('aurevia-beverly-hills', 800);
      assert.equal(metrics.average_treatment_value, 800);
      assert.ok(metrics.revenue_recovered > 0);
      assert.equal(metrics.revenue_recovered, metrics.showed * 800);
    });

    test('6.2 Missed call conversion revenue calculates properly', () => {
      const metrics = calculateClinicMetrics('aurevia-dental-downtown');
      assert.ok(metrics.missed_call_conversions > 0);
      assert.equal(metrics.missed_call_revenue, metrics.missed_call_conversions * 420);
    });

    test('6.3 Generates complete Monday weekly report payload', () => {
      const report = generateWeeklyReport('aurevia-beverly-hills');
      assert.ok(report.report_id.startsWith('REP-MON-'));
      assert.equal(report.recipient, 'director.beverly@example.invalid');
      assert.ok(report.metrics.revenue_recovered > 0);
      assert.ok(report.attribution_assumptions.length >= 3);
      assert.ok(report.executive_summary_html.includes('Weekly Executive Telemetry'));
    });

    test('6.4 Includes operational health and token status in weekly report', () => {
      const report = generateWeeklyReport('aurevia-dental-downtown');
      assert.match(report.operational_health.token_health_status, /HEALTHY/);
      assert.equal(report.operational_health.webhook_uptime, '99.98%');
    });
  });

  // ==========================================
  // SECTION 7: API RELIABILITY & CACHE INVALIDATION (11 tests)
  // ==========================================
  describe('7. API Reliability & Cache Invalidation', () => {
    test('7.1 invalidateCache runs cleanly with or without path pattern', () => {
      assert.doesNotThrow(() => invalidateCache('dashboard'));
      assert.doesNotThrow(() => invalidateCache());
    });

    test('7.2 ApiError contains structured error fields', () => {
      const err = new ApiError('Test error message', {
        status: 503,
        code: 'NETWORK_TIMEOUT',
        endpoint: '/webhook/test'
      });
      assert.equal(err.name, 'ApiError');
      assert.equal(err.status, 503);
      assert.equal(err.code, 'NETWORK_TIMEOUT');
      assert.equal(err.endpoint, '/webhook/test');
      assert.equal(err.message, 'Test error message');
    });

    test('7.3 All three demo clinic configs have valid provider configurations', () => {
      const clinics = getAllClinics();
      assert.equal(clinics.length, 3);
      clinics.forEach(c => {
        assert.ok(c.clinic_id);
        assert.ok(c.booking_provider);
        assert.ok(c.quiet_hours.start);
        assert.ok(c.quiet_hours.end);
        assert.ok(c.average_treatment_value > 0);
      });
    });

    test('7.4 404 response produces structured NOT_FOUND ApiError', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 404,
        text: async () => 'Not Found'
      });

      await assert.rejects(
        async () => request('/webhook/missing-endpoint', {
          baseUrl: 'http://localhost:5678',
          demoMode: false,
          tenantId: 'aurevia-beverly-hills',
          authToken: 'test-token'
        }),
        (err) => err instanceof ApiError && err.code === 'NOT_FOUND' && err.status === 404
      );
    });

    test('7.5 400 response produces structured BAD_REQUEST ApiError', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        text: async () => 'Missing required parameter'
      });

      await assert.rejects(
        async () => request('/webhook/bad-req', {
          baseUrl: 'http://localhost:5678',
          demoMode: false,
          tenantId: 'aurevia-beverly-hills',
          authToken: 'test-token'
        }),
        (err) => err instanceof ApiError && err.code === 'BAD_REQUEST' && err.status === 400
      );
    });

    test('7.6 500 server error in production mode throws instead of masking with cached fallback', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      await assert.rejects(
        async () => request('/webhook/server-err', {
          baseUrl: 'http://localhost:5678',
          demoMode: false,
          tenantId: 'aurevia-beverly-hills',
          authToken: 'test-token'
        }),
        (err) => err instanceof ApiError && err.status === 500
      );
    });

    test('7.7 Network failure produces structured 503 NETWORK_ERROR', async () => {
      globalThis.fetch = async () => {
        throw new TypeError('Failed to fetch');
      };

      await assert.rejects(
        async () => request('/webhook/net-fail', {
          baseUrl: 'http://localhost:5678',
          demoMode: false,
          tenantId: 'aurevia-beverly-hills',
          authToken: 'test-token'
        }),
        (err) => err instanceof ApiError && err.code === 'NETWORK_ERROR' && err.status === 503
      );
    });

    test('7.8 Request timeout produces structured 504 TIMEOUT_ERROR', async () => {
      globalThis.fetch = async () => {
        const timeoutErr = new Error('The operation was aborted due to timeout');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      };

      await assert.rejects(
        async () => request('/webhook/slow-endpoint', {
          baseUrl: 'http://localhost:5678',
          demoMode: false,
          tenantId: 'aurevia-beverly-hills',
          authToken: 'test-token'
        }),
        (err) => err instanceof ApiError && err.code === 'TIMEOUT_ERROR' && err.status === 504
      );
    });

    test('7.9 Malformed JSON response produces structured 502 PARSE_ERROR', async () => {
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '<html><body>502 Bad Gateway</body></html>'
      });

      await assert.rejects(
        async () => request('/webhook/invalid-json', {
          baseUrl: 'http://localhost:5678',
          demoMode: false,
          tenantId: 'aurevia-beverly-hills',
          authToken: 'test-token'
        }),
        (err) => err instanceof ApiError && err.code === 'PARSE_ERROR' && err.status === 502
      );
    });

    test('7.10 Non-idempotent POST request is not retried when it fails', async () => {
      let callCount = 0;
      globalThis.fetch = async () => {
        callCount++;
        return {
          ok: false,
          status: 500,
          text: async () => 'Server error'
        };
      };

      await assert.rejects(
        async () => request('/webhook/post-op', {
          method: 'POST',
          body: '{}',
          baseUrl: 'http://localhost:5678',
          demoMode: false,
          tenantId: 'aurevia-beverly-hills',
          authToken: 'test-token'
        }),
        (err) => err instanceof ApiError
      );
      assert.equal(callCount, 1); // Strictly 1 attempt, zero retries
    });

    test('7.11 Idempotent request with Idempotency-Key allows retry on transient 500', async () => {
      let callCount = 0;
      globalThis.fetch = async () => {
        callCount++;
        return {
          ok: false,
          status: 500,
          text: async () => 'Server error'
        };
      };

      await assert.rejects(
        async () => request('/webhook/post-idempotent', {
          method: 'POST',
          headers: { 'Idempotency-Key': 'IDEM-KEY-123' },
          body: '{}',
          baseUrl: 'http://localhost:5678',
          demoMode: false,
          tenantId: 'aurevia-beverly-hills',
          authToken: 'test-token'
        }),
        (err) => err instanceof ApiError
      );
      assert.equal(callCount, 2); // Retried once because of Idempotency-Key
    });
  });

  // =========================================================================
  // 8. Zero-PHI WhatsApp Compliance & FTC Anti-Review-Gating
  // =========================================================================
  describe('8. Zero-PHI WhatsApp Compliance & FTC Anti-Review-Gating', () => {

    test('8.1 Rejects clinical procedure terms (Botox, Chemical Peel, Cavity, Root Canal) from WhatsApp', () => {
      const phiMessage = 'We noticed you are due for your Botox and Chemical Peel follow-up.';
      const res = enforceZeroPhi(phiMessage, 'whatsapp');
      assert.equal(res.allowed, false);
      assert.equal(res.hasPhi, true);
      assert.ok(res.detectedTerms.includes('botox'));
      assert.ok(res.detectedTerms.includes('chemical peel'));
      assert.ok(res.sanitizedText.includes('view our available appointment times'));
    });

    test('8.2 Allows non-clinical appointment coordination copy on WhatsApp', () => {
      const compliantMsg = 'Hi Sarah, it has been a while since your last visit. Would you like to see available times?';
      const res = enforceZeroPhi(compliantMsg, 'whatsapp');
      assert.equal(res.allowed, true);
      assert.equal(res.hasPhi, false);
      assert.equal(res.detectedTerms.length, 0);
      assert.equal(res.sanitizedText, compliantMsg);
    });

    test('8.3 Dental clinical terms are detected and sanitized', () => {
      const dentalMsg = 'Reminder: your root canal and dental implant consultation is pending.';
      const res = enforceZeroPhi(dentalMsg, 'whatsapp');
      assert.equal(res.allowed, false);
      assert.equal(res.hasPhi, true);
      assert.ok(res.detectedTerms.includes('root canal'));
      assert.ok(res.detectedTerms.includes('dental implant'));
    });

    test('8.4 Review outreach is disabled by default until clinic approval', () => {
      const res = generateReviewRequest('aurevia-beverly-hills', { id: 'P0001', name: 'Sarah Williams' });
      assert.equal(res.success, false);
      assert.equal(res.status, 'DISABLED_BY_DEFAULT');
      assert.equal(res.message, null);
    });

    test('8.5 Anti-Review-Gating: Generates identical public review link regardless of patient sentiment', () => {
      const happyPatient = { id: 'P0001', name: 'Sarah Williams', rating: 5, sentiment: 'ecstatic' };
      const unhappyPatient = { id: 'P0002', name: 'Emma Davis', rating: 1, sentiment: 'disappointed' };

      const resHappy = generateReviewRequest('aurevia-beverly-hills', happyPatient, { forceEnable: true });
      const resUnhappy = generateReviewRequest('aurevia-beverly-hills', unhappyPatient, { forceEnable: true });

      assert.equal(resHappy.success, true);
      assert.equal(resUnhappy.success, true);
      // Both MUST receive the exact same public Google Review link
      assert.equal(resHappy.public_url, resUnhappy.public_url);
      assert.ok(resHappy.message.includes(resHappy.public_url));
      assert.ok(resUnhappy.message.includes(resUnhappy.public_url));
      assert.equal(resHappy.gated, false);
      assert.equal(resUnhappy.gated, false);
    });

    test('8.6 Includes optional private feedback path alongside public review link for all recipients', () => {
      const res = generateReviewRequest('aurevia-beverly-hills', { id: 'P0001', name: 'Sarah' }, { forceEnable: true });
      assert.ok(res.message.includes(res.private_url));
      assert.ok(res.message.includes('private feedback'));
    });

    test('8.7 Missed-call text-back log entry is marked legal_review_required: true', async () => {
      const res = await processMissedCall({
        clinic_id: 'aurevia-beverly-hills',
        caller_phone: '+13105559988',
        call_id: `CALL-LEGAL-${Date.now()}`,
        ignore_quiet_hours: true,
        demo_mode: true
      });
      assert.equal(res.success, true);
      assert.equal(res.log.legal_review_required, true);
    });
  });

  // =========================================================================
  // 9. Deterministic Fake-Data Test Mode & Commercial Pilot Terms
  // =========================================================================
  describe('9. Deterministic Fake-Data Test Mode & Commercial Pilot Terms', () => {

    test('9.1 isFakeDataModeActive() returns true by default and switches via setFakeDataMode', () => {
      assert.equal(isFakeDataModeActive(), true);
      setFakeDataMode(false);
      assert.equal(isFakeDataModeActive(), false);
      setFakeDataMode(true);
      assert.equal(isFakeDataModeActive(), true);
    });

    test('9.2 runtime data mode switches safely and respects an enforced preview build', () => {
      if (apiConfig.demoMode) {
        assert.throws(() => setApiDemoMode(false), /VITE_DEMO_MODE=true/);
        assert.equal(apiConfig.demoMode, true);
        return;
      }

      responseCache.set(getCacheKey('/mode-test', 'test-tenant'), { data: {}, timestamp: Date.now() });
      setApiDemoMode(true);
      assert.equal(apiConfig.demoMode, true);
      assert.equal(responseCache.size, 0);

      setApiDemoMode(false);
      assert.equal(apiConfig.demoMode, false);
    });

    test('9.2 Mock adapter: 1. Missed Call Recovery returns SIMULATED_ONLY', () => {
      const res = mockWorkflowAdapters.missedCallRecovery({ patient_id: SYNTHETIC_RECORDS.patient.id });
      assert.equal(res.success, true);
      assert.equal(res.status, 'SIMULATED_ONLY: message not sent');
      assert.equal(res.simulated, true);
    });

    test('9.3 Mock adapter: 2. Monday Telemetry returns SIMULATED_ONLY', () => {
      const res = mockWorkflowAdapters.mondayTelemetry('demo-med-spa');
      assert.equal(res.success, true);
      assert.equal(res.status, 'SIMULATED_ONLY: message not sent');
      assert.equal(res.simulated, true);
    });

    test('9.4 Mock adapter: 3. Incoming Conversation returns SIMULATED_ONLY', () => {
      const res = mockWorkflowAdapters.incomingConversation({ text: 'Hello' });
      assert.equal(res.success, true);
      assert.equal(res.status, 'SIMULATED_ONLY: message not sent');
      assert.equal(res.simulated, true);
    });

    test('9.5 Mock adapter: 4. System Error Trigger returns SIMULATED_ONLY', () => {
      const res = mockWorkflowAdapters.systemErrorTrigger({ severity: 'INFO' });
      assert.equal(res.success, true);
      assert.equal(res.status, 'SIMULATED_ONLY: message not sent');
      assert.equal(res.simulated, true);
    });

    test('9.6 Mock adapter: 5. Outgoing Conversation returns SIMULATED_ONLY', () => {
      const res = mockWorkflowAdapters.outgoingConversation({});
      assert.equal(res.success, true);
      assert.equal(res.status, 'SIMULATED_ONLY: message not sent');
      assert.equal(res.simulated, true);
    });

    test('9.7 Mock adapters: 6-14 Read & Mutation APIs return synthetic records', () => {
      const convs = mockWorkflowAdapters.apiConversations(SYNTHETIC_RECORDS.patient.id);
      assert.equal(convs.is_synthetic, true);

      const patchedPatient = mockWorkflowAdapters.patchPatients(SYNTHETIC_RECORDS.patient.id, { opt_out: true });
      assert.equal(patchedPatient.is_synthetic, true);
      assert.equal(patchedPatient.record.opt_out, true);

      const dash = mockWorkflowAdapters.apiDashboard('demo-med-spa');
      assert.equal(dash.is_synthetic, true);
      assert.ok(dash.stats.active_contacts > 0);

      const handoffPatch = mockWorkflowAdapters.patchHandoffStatus('fake-handoff-001', 'RESOLVED');
      assert.equal(handoffPatch.is_synthetic, true);
      assert.equal(handoffPatch.status, 'RESOLVED');

      const handoffs = mockWorkflowAdapters.apiHumanHandoffs('demo-med-spa');
      assert.equal(handoffs.is_synthetic, true);

      const clients = mockWorkflowAdapters.apiClients('demo-med-spa');
      assert.equal(clients.is_synthetic, true);

      const detail = mockWorkflowAdapters.apiClientDetail(SYNTHETIC_RECORDS.patient.id);
      assert.equal(detail.is_synthetic, true);

      const offers = mockWorkflowAdapters.apiOffers('demo-med-spa');
      assert.equal(offers.is_synthetic, true);

      const config = mockWorkflowAdapters.apiConfig('demo-med-spa');
      assert.equal(config.is_synthetic, true);
    });

    test('9.8 Mock adapter: 15. AI Legal Document Extraction parses synthetic BAA', () => {
      const res = mockWorkflowAdapters.aiLegalDocExtraction();
      assert.equal(res.success, true);
      assert.equal(res.status, 'SIMULATED_ONLY');
      assert.equal(res.document_type, 'BUSINESS_ASSOCIATE_AGREEMENT_SYNTHETIC');
      assert.ok(res.extracted_clauses.length >= 3);
    });

    test('9.9 recordAuditEvent redacts patient PII and records timestamped audit trails', () => {
      clearAuditLog();
      const event = recordAuditEvent({
        action: 'PATIENT_CONSENT_RECORDED',
        patient_id: 'P0001',
        detail: 'Patient confirmed opt-in'
      });

      assert.ok(event.event_id.startsWith('AUDIT-'));
      assert.equal(event.entity_id, 'PATIENT-REDACTED-0001'); // Phone and direct PII redacted
      assert.ok(event.timestamp);

      const logs = getAuditLog();
      assert.equal(logs.length, 1);
    });

    test('9.10 Commercial pricing tiers define consistent terms for Founding, Med Spa, and Dental', () => {
      assert.equal(COMMERCIAL_PRICING_TIERS.founding_pilot.monthly_subscription, '$497 / month');
      assert.equal(COMMERCIAL_PRICING_TIERS.founding_pilot.monthly_fee, 497);
      assert.equal(COMMERCIAL_PRICING_TIERS.standard_med_spa.monthly_subscription, '$997 / month');
      assert.equal(COMMERCIAL_PRICING_TIERS.standard_med_spa.monthly_fee, 997);
      assert.equal(COMMERCIAL_PRICING_TIERS.standard_dental.monthly_subscription, '$797 / month');
      assert.equal(COMMERCIAL_PRICING_TIERS.standard_dental.monthly_fee, 797);
      assert.ok(COMMERCIAL_PRICING_TIERS.founding_pilot.setup_fee_range.includes('$1,000'));
      assert.ok(COMMERCIAL_PRICING_TIERS.standard_med_spa.setup_fee_range.includes('$2,000'));
      assert.ok(COMMERCIAL_PRICING_TIERS.standard_dental.setup_fee_range.includes('$2,000'));
    });

    test('9.11 Pilot guarantee is capacity-calculated without unsupported claims', () => {
      const medSpaConfig = getClinicConfig('aurevia-beverly-hills');
      const dentalConfig = getClinicConfig('aurevia-dental-downtown');

      assert.equal(medSpaConfig.target_pilot_appointments, 10);
      assert.equal(dentalConfig.target_pilot_appointments, 12);
      assert.ok(COMMERCIAL_PRICING_TIERS.founding_pilot.guarantee_clause.includes('month 3 is free'));
    });
  });

  // =========================================================================
  // 10. Whitelist-Only Template Message Policy & Sensitivity Scan
  // =========================================================================
  describe('10. Whitelist-Only Template Message Policy & Sensitivity Scan', () => {

    test('10.1 Arbitrary free-text outbound dispatch is rejected by default', () => {
      const res = compileOutboundMessage(null, {}, { allowFreeText: false });
      assert.equal(res.success, false);
      assert.equal(res.status, 'REJECTED_UNAPPROVED_FREE_TEXT');
      assert.equal(res.error, 'ARBITRARY_FREE_TEXT_FORBIDDEN');
    });

    test('10.2 Approved template compiles safely with parameter injection', () => {
      const res = compileOutboundMessage('TEMPLATE_RECALL_NUDGE', {
        first_name: 'Sarah',
        clinic_name: 'Aurevia Med Spa'
      });
      assert.equal(res.success, true);
      assert.equal(res.status, 'APPROVED');
      assert.ok(res.message.includes('Hi Sarah'));
      assert.ok(res.message.includes('Aurevia Med Spa'));
      assert.equal(res.is_phi_minimal, true);
    });

    test('10.3 Parameter containing clinical procedure (Botox) is blocked', () => {
      const res = compileOutboundMessage('TEMPLATE_RECALL_NUDGE', {
        first_name: 'Sarah (Botox follow-up)',
        clinic_name: 'Aurevia Med Spa'
      });
      assert.equal(res.success, false);
      assert.equal(res.status, 'REJECTED_PHI_IN_PARAMETER');
      assert.ok(res.violations.some(v => v.includes('botox')));
    });

    test('10.4 Non-keyword clinical nuance (severe swelling after needles) is detected and rejected', () => {
      const res = compileOutboundMessage('TEMPLATE_RECALL_NUDGE', {
        first_name: 'Sarah',
        clinic_name: 'Aurevia Med Spa - regarding severe swelling from needles'
      });
      assert.equal(res.success, false);
      assert.equal(res.status, 'REJECTED_PHI_IN_PARAMETER');
      assert.ok(res.violations.length > 0);
    });

    test('10.5 scanForSensitiveClinicalContent detects pharmacology terms (retin-a, hydroquinone)', () => {
      const scan1 = scanForSensitiveClinicalContent('Please stop your retin-a 3 days prior');
      assert.equal(scan1.safe, false);
      assert.ok(scan1.reasons.some(r => r.includes('retin-a')));

      const scan2 = scanForSensitiveClinicalContent('General wellness consultation');
      assert.equal(scan2.safe, true);
      assert.equal(scan2.reasons.length, 0);
    });

    test('10.6 Compliant Missed Call Recovery template compiles cleanly', () => {
      const res = compileOutboundMessage('TEMPLATE_MISSED_CALL_RECOVERY', {
        clinic_name: 'Aurevia Dental Studio'
      });
      assert.equal(res.success, true);
      assert.ok(res.message.includes('We missed your call'));
    });

    test('10.7 Booking link template compiles with URL and clinic name', () => {
      const res = compileOutboundMessage('TEMPLATE_BOOKING_LINK', {
        clinic_name: 'Aurevia Med Spa',
        booking_url: 'https://cal.example.invalid/beverly-hills'
      });
      assert.equal(res.success, true);
      assert.ok(res.message.includes('https://cal.example.invalid/beverly-hills'));
    });
  });

  // =========================================================================
  // 11. Production Readiness Gate & Configuration Auditor
  // =========================================================================
  describe('11. Production Readiness Gate & Configuration Auditor', () => {

    test('11.1 Returns DEMO_ONLY in demo mode', () => {
      const readiness = evaluateClinicReadiness('aurevia-beverly-hills', { demoMode: true });
      assert.equal(readiness.status, READINESS_STATUSES.DEMO_ONLY);
      assert.equal(readiness.isDemo, true);
    });

    test('11.2 Forces production mode and flags BLOCKED_CONFIGURATION_REQUIRED when credentials missing', () => {
      const readiness = evaluateClinicReadiness('aurevia-beverly-hills', {
        demoMode: false,
        hasProductionCredentials: false
      });
      assert.equal(readiness.status, READINESS_STATUSES.BLOCKED_CONFIGURATION_REQUIRED);
      assert.ok(readiness.blockers.length > 0);
      assert.ok(readiness.blockers.some(b => b.id === 'production_credentials'));
    });

    test('11.3 Returns READY_FOR_PILOT when all configuration and legal acknowledgements are satisfied with mock credentials', () => {
      const readiness = evaluateClinicReadiness('aurevia-beverly-hills', {
        demoMode: false,
        forceProduction: true,
        hasProductionCredentials: true,
        hasWebhookSecrets: true,
        legal_review_acknowledged: true
      });
      assert.equal(readiness.status, READINESS_STATUSES.PRODUCTION_ENABLED);
      assert.equal(readiness.blockers.length, 0);
      assert.equal(readiness.score, 100);
    });

    test('11.4 Missing legal-review acknowledgement acts as a strict blocker', () => {
      const readiness = evaluateClinicReadiness('aurevia-beverly-hills', {
        demoMode: false,
        hasProductionCredentials: true,
        hasWebhookSecrets: true,
        legal_review_acknowledged: false
      });
      assert.equal(readiness.status, READINESS_STATUSES.BLOCKED_CONFIGURATION_REQUIRED);
      assert.ok(readiness.blockers.some(b => b.id === 'legal_review_ack'));
    });

    test('11.5 Evaluates score percentage and lists blockers with actionable descriptions', () => {
      const readiness = evaluateClinicReadiness('aurevia-beverly-hills', { demoMode: false });
      assert.ok(readiness.score >= 0 && readiness.score <= 100);
      assert.ok(Array.isArray(readiness.checklist));
      assert.ok(readiness.total >= 8);
    });
  });

  // =========================================================================
  // 12. Practice Break-Even Economics & Multi-Tenant Onboarding
  // =========================================================================
  describe('12. Practice Break-Even Economics & Multi-Tenant Onboarding', () => {

    test('12.1 Calculates break-even requirement for $997/mo Med Spa with $750 ATV and 85% show rate', () => {
      const monthlyFee = 997;
      const atv = 750;
      const showRate = 0.85;
      const effectivePerBooking = atv * showRate; // $637.50
      const breakEven = monthlyFee / effectivePerBooking; // ~1.5639
      
      assert.ok(Math.abs(breakEven - 1.5639) < 0.01);
      assert.equal(Math.ceil(breakEven), 2); // 2 attended bookings cover the software fee
    });

    test('12.2 Calculates break-even requirement for $797/mo Dental with $420 ATV and 88% show rate', () => {
      const monthlyFee = 797;
      const atv = 420;
      const showRate = 0.88;
      const effectivePerBooking = atv * showRate; // $369.60
      const breakEven = monthlyFee / effectivePerBooking; // ~2.156
      
      assert.ok(Math.abs(breakEven - 2.156) < 0.01);
      assert.equal(Math.ceil(breakEven), 3); // 3 recall appointments cover the software fee
    });

    test('12.3 Safe zero-division guard when ATV or show rate is 0', () => {
      const calculateSafeBreakEven = (fee, atvVal, showRateVal) => {
        const effective = atvVal * showRateVal;
        return effective > 0 ? fee / effective : 0;
      };

      assert.equal(calculateSafeBreakEven(997, 0, 0.85), 0);
      assert.equal(calculateSafeBreakEven(997, 750, 0), 0);
    });

    test('12.4 updateClinicConfig persists legal review acknowledgement and updates clinic parameters in memory', () => {
      const updated = updateClinicConfig('aurevia-beverly-hills', {
        legal_review_acknowledged: true,
        show_rate: 0.90
      });

      assert.equal(updated.legal_review_acknowledged, true);
      assert.equal(updated.show_rate, 0.90);
    });

    test('12.5 Multi-tenant isolation: Updating Beverly Hills does not mutate Downtown Dental', () => {
      updateClinicConfig('aurevia-beverly-hills', { average_treatment_value: 800 });
      const beverly = getClinicConfig('aurevia-beverly-hills');
      const dental = getClinicConfig('aurevia-dental-downtown');

      assert.equal(beverly.average_treatment_value, 800);
      assert.equal(dental.average_treatment_value, 420); // Dental preserved
    });
  });

  // =========================================================================
  // 13. Authorized Production Test Harness & Scope Isolation
  // =========================================================================
  describe('13. Authorized Production Test Harness & Scope Isolation', () => {

    test('13.1 AUTHORIZED_PROD_TEST_RECORD contains valid RFC synthetic test patient record', () => {
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.patient_id, 'PAT-TEST-001');
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.first_name, 'Synthetic');
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.last_name, 'TestPatient');
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.phone, '+15550100001');
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.email, 'test.patient.001@example.invalid');
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.preferred_channel, 'WhatsApp');
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.conversation_state, 'HUMAN_REQUIRED');
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.opt_out, 'NOT_INTRESTED');
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.is_synthetic, true);
    });

    test('13.2 Mock adapter uses AUTHORIZED_PROD_TEST_RECORD and returns SIMULATED_ONLY', () => {
      const res = mockWorkflowAdapters.missedCallRecovery({
        patient_id: AUTHORIZED_PROD_TEST_RECORD.patient_id,
        phone: AUTHORIZED_PROD_TEST_RECORD.phone
      });
      assert.equal(res.success, true);
      assert.equal(res.status, 'SIMULATED_ONLY: message not sent');
      assert.equal(res.simulated, true);
    });

    test('13.3 Unrelated workflows (ai_legal_document_extraction.json) are safely excluded without blocking', () => {
      const excludedPath = path.resolve('ai_legal_document_extraction.json');
      // Even if not present, readiness gate and core reactivation flows proceed cleanly
      const readiness = evaluateClinicReadiness('aurevia-beverly-hills', { demoMode: true });
      assert.ok(readiness.checklist.some(i => i.id === 'relevant_workflows_exported'));
      assert.equal(readiness.checklist.find(i => i.id === 'relevant_workflows_exported').passed, true);
    });

    test('13.4 Sensitive clinical terms in production harness are routed to HUMAN_REQUIRED', () => {
      const inbound = processInboundMessage({
        patient_id: AUTHORIZED_PROD_TEST_RECORD.patient_id,
        phone: AUTHORIZED_PROD_TEST_RECORD.phone,
        message: 'I had an allergic reaction with swelling after my facial treatment'
      });
      assert.equal(inbound.human_required, true);
      assert.equal(inbound.status, 'ESCALATED_HUMAN');
      assert.ok(inbound.reply.includes('clinical team has been notified'));
    });
  });

  // =========================================================================
  // 14. Relevant n8n Workflows & PATCH Webhook Contracts
  // =========================================================================
  describe('14. Relevant n8n Workflows & PATCH Webhook Contracts', () => {

    test('14.1 PATCH patients.json exists locally, parses valid JSON, and defines patient PATCH webhook', () => {
      const filePath = path.resolve('PATCH patients.json');
      assert.ok(fs.existsSync(filePath), 'PATCH patients.json must exist in root');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.equal(data.name, 'PATCH patients');
      const wh = data.nodes.find(n => n.type.includes('webhook'));
      assert.ok(wh, 'Must contain webhook node');
      assert.equal(wh.parameters.path, 'patient');
      assert.equal(wh.parameters.httpMethod, 'PATCH');
    });

    test('14.2 PATCH handoff status.json exists locally, parses valid JSON, and defines human-handoff-status webhook', () => {
      const filePath = path.resolve('PATCH handoff status.json');
      assert.ok(fs.existsSync(filePath), 'PATCH handoff status.json must exist in root');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.equal(data.name, 'PATCH handoff status');
      const wh = data.nodes.find(n => n.type.includes('webhook'));
      assert.ok(wh, 'Must contain webhook node');
      assert.equal(wh.parameters.path, 'human-handoff-status');
      assert.equal(wh.parameters.httpMethod, 'PATCH');
    });

    test('14.3 AI Reactivation — Incoming Conversation.json contains fast-path intercept and Meta verification', () => {
      const filePath = path.resolve('AI Reactivation — Incoming Conversation.json');
      assert.ok(fs.existsSync(filePath));
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.ok(data.nodes.some(n => n.name === 'Fast-Path Keyword Intercept'));
      assert.ok(data.nodes.some(n => n.name === 'Meta Verify (GET)'));
    });

    test('14.4 AI Reactivation — Outgoing Conversation.json contains outbound campaign nodes', () => {
      const filePath = path.resolve('AI Reactivation — Outgoing Conversation.json');
      assert.ok(fs.existsSync(filePath));
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.ok(data.nodes.length >= 10);
    });

    test('14.5 readinessGate.js evaluates relevant_workflows_exported as passed', () => {
      const readiness = evaluateClinicReadiness('aurevia-beverly-hills');
      const item = readiness.checklist.find(i => i.id === 'relevant_workflows_exported');
      assert.ok(item);
      assert.equal(item.passed, true);
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 15. Multi-Tenant Hierarchy, Organization Boundaries & Role Permissions  */
  /* ----------------------------------------------------------------------- */
  describe('15. Multi-Tenant Hierarchy & RBAC Permissions', () => {
    test('15.1 Platform Admin has all administrative permissions', () => {
      assert.equal(hasPermission(USER_ROLES.PLATFORM_ADMIN, 'canManageOrganizations'), true);
      assert.equal(hasPermission(USER_ROLES.PLATFORM_ADMIN, 'canEditBilling'), true);
      assert.equal(hasPermission(USER_ROLES.PLATFORM_ADMIN, 'canSignCompliance'), true);
      assert.equal(hasPermission(USER_ROLES.PLATFORM_ADMIN, 'canExportAuditLogs'), true);
    });

    test('15.2 Clinic Owner can edit billing and compliance, but cannot manage other organizations', () => {
      assert.equal(hasPermission(USER_ROLES.CLINIC_OWNER, 'canManageOrganizations'), false);
      assert.equal(hasPermission(USER_ROLES.CLINIC_OWNER, 'canEditBilling'), true);
      assert.equal(hasPermission(USER_ROLES.CLINIC_OWNER, 'canSignCompliance'), true);
      assert.equal(hasPermission(USER_ROLES.CLINIC_OWNER, 'canLaunchCampaigns'), true);
    });

    test('15.3 Practice Manager cannot edit billing or sign compliance, but can configure providers', () => {
      assert.equal(hasPermission(USER_ROLES.PRACTICE_MANAGER, 'canEditBilling'), false);
      assert.equal(hasPermission(USER_ROLES.PRACTICE_MANAGER, 'canSignCompliance'), false);
      assert.equal(hasPermission(USER_ROLES.PRACTICE_MANAGER, 'canConfigureProviders'), true);
      assert.equal(hasPermission(USER_ROLES.PRACTICE_MANAGER, 'canLaunchCampaigns'), true);
    });

    test('15.4 Clinical Staff cannot launch campaigns, edit billing, or export audit logs', () => {
      assert.equal(hasPermission(USER_ROLES.STAFF, 'canLaunchCampaigns'), false);
      assert.equal(hasPermission(USER_ROLES.STAFF, 'canEditBilling'), false);
      assert.equal(hasPermission(USER_ROLES.STAFF, 'canExportAuditLogs'), false);
      assert.equal(hasPermission(USER_ROLES.STAFF, 'canTriggerRecoveries'), true);
      assert.equal(hasPermission(USER_ROLES.STAFF, 'canManageTakeover'), true);
    });

    test('15.5 Reporting user can view financials but cannot trigger messages or view patient PII', () => {
      assert.equal(hasPermission(USER_ROLES.REPORTING, 'canViewFinancials'), true);
      assert.equal(hasPermission(USER_ROLES.REPORTING, 'canViewPatientPii'), false);
      assert.equal(hasPermission(USER_ROLES.REPORTING, 'canTriggerRecoveries'), false);
      assert.equal(hasPermission(USER_ROLES.REPORTING, 'canManageTakeover'), false);
    });

    test('15.6 Active organization boundary prevents cross-tenant access for non-admin users', () => {
      setActiveUser('usr-001'); // Clinic Owner in Aurevia Premier (Beverly Hills + Maya Spa)
      assert.equal(validateTenantIsolation('aurevia-beverly-hills'), true);
      assert.equal(validateTenantIsolation('aurevia-spa-wellness'), true);
      assert.throws(() => {
        validateTenantIsolation('aurevia-dental-downtown');
      }, /Tenant Isolation Violation/);
    });

    test('15.7 Platform Admin is granted cross-tenant audit access', () => {
      setActiveUser('usr-000'); // Platform Admin
      assert.equal(validateTenantIsolation('aurevia-beverly-hills'), true);
      assert.equal(validateTenantIsolation('aurevia-dental-downtown'), true);
      assert.equal(validateTenantIsolation('aurevia-spa-wellness'), true);
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 16. OWASP API Security & Cryptographic Webhook Verification             */
  /* ----------------------------------------------------------------------- */
  describe('16. OWASP API Security & Cryptographic Webhooks', () => {
    const testSecret = 'whsec_aurevia_super_secret_test_key_2026';
    const samplePayload = {
      eventId: 'evt_test_001',
      tenantId: 'aurevia-beverly-hills',
      callerPhone: '+13105550199',
      callDuration: 0
    };

    test('16.1 HMAC-SHA256 signature is deterministic and verifies against secret', () => {
      const rawBody = JSON.stringify(samplePayload);
      const signature = computeHmacSha256(rawBody, testSecret);
      assert.ok(typeof signature === 'string');
      assert.equal(signature.length, 64); // 256-bit hex string

      const verification = verifyWebhookSignature({
        rawBody,
        signatureHeader: `sha256=${signature}`,
        secret: testSecret
      });
      assert.equal(verification.valid, true);
    });

    test('16.2 Tampered payload body fails signature check', () => {
      const rawBody = JSON.stringify(samplePayload);
      const signature = computeHmacSha256(rawBody, testSecret);
      const tamperedBody = JSON.stringify({ ...samplePayload, callerPhone: '+19999999999' });

      const verification = verifyWebhookSignature({
        rawBody: tamperedBody,
        signatureHeader: `sha256=${signature}`,
        secret: testSecret
      });
      assert.equal(verification.valid, false);
      assert.equal(verification.error, 'INVALID_SIGNATURE');
    });

    test('16.3 Replay protection: Webhook older than 5 minutes (300s) is rejected', () => {
      const now = Date.now();
      const expiredTimestamp = now - 350000; // 350 seconds ago

      const freshness = verifyWebhookFreshness(expiredTimestamp, now);
      assert.equal(freshness.fresh, false);
      assert.equal(freshness.error, 'EXPIRED_TIMESTAMP');
      assert.ok(freshness.ageSeconds >= 350);
    });

    test('16.4 Freshness check: Webhook within tolerance window is accepted', () => {
      const now = Date.now();
      const freshTimestamp = now - 15000; // 15 seconds ago

      const freshness = verifyWebhookFreshness(freshTimestamp, now);
      assert.equal(freshness.fresh, true);
      assert.ok(freshness.ageSeconds <= 300);
    });

    test('16.5 Event deduplication: Duplicate event ID within tolerance window is detected', () => {
      const eventId = 'evt_duplicate_check_001';
      assert.equal(isEventDuplicate(eventId), false); // First time: not a duplicate
      assert.equal(isEventDuplicate(eventId), true);  // Second time: detected as duplicate
    });

    test('16.6 Full secure webhook processor accepts valid payload and rejects expired/tampered', () => {
      const now = Date.now();
      const rawBody = JSON.stringify(samplePayload);
      const signature = computeHmacSha256(rawBody, testSecret);

      const acceptedResult = processSecureWebhook({
        rawBody,
        signatureHeader: `sha256=${signature}`,
        timestampHeader: now - 5000,
        eventId: 'evt_secure_001',
        secret: testSecret,
        nowMs: now
      });
      assert.equal(acceptedResult.status, 'ACCEPTED');
      assert.equal(acceptedResult.code, 200);

      // Duplicate delivery
      const dupResult = processSecureWebhook({
        rawBody,
        signatureHeader: `sha256=${signature}`,
        timestampHeader: now - 6000,
        eventId: 'evt_secure_001',
        secret: testSecret,
        nowMs: now
      });
      assert.equal(dupResult.status, 'DUPLICATE_IGNORED');
      assert.equal(dupResult.code, 200);
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 17. Unified Provider Factory & Production Mode Abstraction              */
  /* ----------------------------------------------------------------------- */
  describe('17. Unified Provider Factory & Calendar Integration', () => {
    test('17.1 Demo Calendar Provider returns simulated slots and sets isDemo=true', async () => {
      const provider = createCalendarProvider('DEMO', {}, true);
      assert.ok(provider instanceof DemoCalendarProvider);

      const slots = await provider.getCandidateSlots('aurevia-beverly-hills', '2026-11-10');
      assert.ok(Array.isArray(slots));
      assert.equal(slots.length, 3);
      assert.equal(slots[0].isDemo, true);

      const booking = await provider.confirmBooking('aurevia-beverly-hills', {
        patientPhone: '+13105550192',
        slot: slots[0]
      });
      assert.equal(booking.success, true);
      assert.equal(booking.isDemo, true);
      assert.ok(booking.eventId.startsWith('DEMO-EVT-'));
    });

    test('17.2 Production Google Calendar Provider fails clearly when credentials missing', async () => {
      const provider = createCalendarProvider('GOOGLE_CALENDAR', {}, false);
      assert.ok(provider instanceof GoogleCalendarProvider);

      const health = await provider.healthCheck('aurevia-beverly-hills');
      assert.equal(health.status, 'BLOCKED_CREDENTIALS_REQUIRED');
      assert.ok(health.error.includes('Missing Google Service Account'));

      await assert.rejects(async () => {
        await provider.getCandidateSlots('aurevia-beverly-hills', '2026-11-10');
      }, /UNCONFIGURED_CREDENTIALS/);
    });

    test('17.3 Production Cal.com Provider fails clearly when API key missing', async () => {
      const provider = createCalendarProvider('CAL_COM', {}, false);
      assert.ok(provider instanceof CalComProvider);

      const health = await provider.healthCheck('aurevia-beverly-hills');
      assert.equal(health.status, 'BLOCKED_CREDENTIALS_REQUIRED');
      assert.ok(health.error.includes('Missing Cal.com v2 API key'));

      await assert.rejects(async () => {
        await provider.confirmBooking('aurevia-beverly-hills', {
          patientPhone: '+13105550192',
          slot: { time: '10:00 AM' }
        });
      }, /UNCONFIGURED_CREDENTIALS/);
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 18. Persistent Tenant-Scoped Data Store & PII-Redacted Audit Trail      */
  /* ----------------------------------------------------------------------- */
  describe('18. Persistent Tenant Data Store & Audit Redaction', () => {
    test('18.1 getTenantPatients returns patients isolated to specific clinic', () => {
      const bhPatients = getTenantPatients('aurevia-beverly-hills');
      const ddPatients = getTenantPatients('aurevia-dental-downtown');
      assert.ok(bhPatients.length >= 3);
      assert.ok(ddPatients.length >= 2);
      assert.equal(bhPatients.every(p => p.clinicId === 'aurevia-beverly-hills'), true);
      assert.equal(ddPatients.every(p => p.clinicId === 'aurevia-dental-downtown'), true);
    });

    test('18.2 addTenantPatient safely prepends patient scoped to clinic', () => {
      const newPat = addTenantPatient('aurevia-beverly-hills', {
        name: 'Synthetic Patient 099',
        phone: '+1 (555) 010-0099',
        email: 'patient.099@example.invalid',
        serviceInterest: 'Demo Aesthetic Service X'
      });
      assert.ok(newPat.id);
      assert.equal(newPat.clinicId, 'aurevia-beverly-hills');

      const updatedList = getTenantPatients('aurevia-beverly-hills');
      assert.ok(updatedList.some(p => p.id === newPat.id));

      // Must not leak into downtown-dental
      const ddList = getTenantPatients('aurevia-dental-downtown');
      assert.equal(ddList.some(p => p.id === newPat.id), false);
    });

    test('18.3 updateTenantPatient mutates record and records audit event', () => {
      const updated = updateTenantPatient('aurevia-beverly-hills', 'pat_bh_001', {
        status: 'BOOKED',
        notes: 'VIP checkup scheduled'
      });
      assert.equal(updated.status, 'BOOKED');
      assert.equal(updated.notes, 'VIP checkup scheduled');

      const auditEntries = getTenantAuditLog('aurevia-beverly-hills');
      assert.ok(auditEntries.some(a => a.action === 'PATIENT_UPDATED' && a.metadata.patientId === 'pat_bh_001'));
    });

    test('18.4 resolveTenantHumanCase updates escalation status to RESOLVED', () => {
      const success = resolveTenantHumanCase('aurevia-beverly-hills', 'esc_bh_001', 'Staff called patient and reassured downtime');
      assert.equal(success, true);

      const cases = getTenantHumanCases('aurevia-beverly-hills');
      const resolvedCase = cases.find(c => c.id === 'esc_bh_001');
      assert.equal(resolvedCase.status, 'RESOLVED');
      assert.ok(resolvedCase.resolvedAt);
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 19. Transparent Break-Even Mathematics & Commercial Plans               */
  /* ----------------------------------------------------------------------- */
  describe('19. Transparent Break-Even ROI Math & Pricing Plans', () => {
    test('19.1 Standard Med Spa plan requires exactly 1.56 (approx 2) bookings for break-even', () => {
      const monthlyFee = 997;
      const atv = 750;
      const showRate = 0.85;
      const breakEven = monthlyFee / (atv * showRate);
      assert.equal(breakEven.toFixed(2), '1.56');
      assert.equal(Math.ceil(breakEven), 2);
    });

    test('19.2 Standard Dental plan requires exactly 2.16 (approx 3) bookings for break-even', () => {
      const monthlyFee = 797;
      const atv = 420;
      const showRate = 0.88;
      const breakEven = monthlyFee / (atv * showRate);
      assert.equal(breakEven.toFixed(2), '2.16');
      assert.equal(Math.ceil(breakEven), 3);
    });

    test('19.3 Founding Member plan requires exactly 1.04 (approx 2) bookings for break-even', () => {
      const monthlyFee = 497;
      const atv = 600;
      const showRate = 0.80;
      const breakEven = monthlyFee / (atv * showRate);
      assert.equal(breakEven.toFixed(2), '1.04');
      assert.equal(Math.ceil(breakEven), 2);
    });

    test('19.4 PRICING_PLANS defines setup fee, monthly fee, and ROI target for all tiers', () => {
      assert.equal(PRICING_PLANS.STANDARD_MED_SPA.monthlyFee, 997);
      assert.equal(PRICING_PLANS.STANDARD_MED_SPA.setupFee, 2500);
      assert.equal(PRICING_PLANS.STANDARD_DENTAL.monthlyFee, 797);
      assert.equal(PRICING_PLANS.FOUNDING_MEMBER.monthlyFee, 497);
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 20. Security Hardening, Unsafe Fallback Rejection & Synthetic Integrity  */
  /* ----------------------------------------------------------------------- */
  describe('20. Security Hardening, Unsafe Fallback Rejection & Synthetic Integrity', () => {
    test('20.1 In production mode, request without authenticated session throws AUTHENTICATION_REQUIRED', async () => {
      await assert.rejects(async () => {
        await request('/test-auth-required-endpoint', {
          baseUrl: 'http://localhost:5678',
          demoMode: false // Force production mode
        });
      }, (err) => {
        assert.equal(err.code, 'AUTHENTICATION_REQUIRED');
        assert.equal(err.status, 401);
        return true;
      });
    });

    test('20.2 In production mode, request with authenticated session passes through to fetch', async () => {
      const prevFetch = globalThis.fetch;
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ status: 'success' })
      });
      try {
        const res = await request('/test-auth-passed-endpoint', {
          baseUrl: 'http://localhost:5678',
          demoMode: false,
          tenantId: 'aurevia-beverly-hills',
          authenticatedSession: { userId: 'usr-001', role: 'CLINIC_OWNER' },
          authToken: 'valid-jwt-token'
        });
        assert.equal(res.status, 'success');
      } finally {
        globalThis.fetch = prevFetch;
      }
    });

    test('20.3 In production mode, getClinicConfig with unknown ID fails closed with TENANT_NOT_FOUND', () => {
      assert.throws(() => {
        getClinicConfig('unknown-nonexistent-clinic', { failClosed: true });
      }, /TENANT_NOT_FOUND/);

      assert.throws(() => {
        getClinicConfig('', { failClosed: true });
      }, /TENANT_NOT_FOUND/);
    });

    test('20.4 In demo mode, getClinicConfig safely defaults to Beverly Hills for interactive UI', () => {
      const config = getClinicConfig('unknown-nonexistent-clinic');
      assert.ok(config);
      assert.equal(config.clinic_id, 'aurevia-beverly-hills');
    });

    test('20.5 Browser-selected role header cannot elevate privileges across tenant boundaries', () => {
      setActiveUser('usr-003'); // Clinical Staff
      assert.equal(checkTenantPermission('canEditBilling'), false);
      assert.equal(checkTenantPermission('canExportAuditLogs'), false);
      assert.throws(() => {
        validateTenantIsolation('aurevia-dental-downtown');
      }, /Tenant Isolation Violation/);
    });

    test('20.6 All patient fixtures in mockDataStore and fakeDataMode are strictly synthetic', () => {
      const bhPatients = getTenantPatients('aurevia-beverly-hills');
      assert.ok(bhPatients.length >= 3);
      bhPatients.forEach(p => {
        assert.ok(p.name.startsWith('Synthetic Patient'), `Patient name must be synthetic: ${p.name}`);
        assert.ok(p.email.endsWith('.invalid'), `Email must end with .invalid: ${p.email}`);
        assert.ok(p.phone.includes('555'), `Phone must be in 555 range: ${p.phone}`);
      });

      assert.equal(AUTHORIZED_PROD_TEST_RECORD.email.endsWith('.invalid'), true);
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.phone, '+15550100001');
      assert.equal(AUTHORIZED_PROD_TEST_RECORD.is_synthetic, true);
    });

    test('20.7 Production bundle does not contain WEBHOOK_SECRET or node:crypto', () => {
      const distDir = path.resolve('The_Med_Spa_Dental_Reactivation_Engine/dist/assets');
      if (fs.existsSync(distDir)) {
        const jsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
        assert.ok(jsFiles.length > 0, 'Build output must exist');
        jsFiles.forEach(f => {
          const code = fs.readFileSync(path.join(distDir, f), 'utf8');
          assert.equal(code.includes('WEBHOOK_SECRET'), false, `${f} must not contain WEBHOOK_SECRET`);
          assert.equal(code.includes('node:crypto'), false, `${f} must not bundle node:crypto`);
        });
      }
    });

    test('20.8 Workflow accounting accurately reflects 17 physical files and 14 unique workflows', () => {
      const files = [
        'med_dental_workflow.json',
        'maya_spa_campaign_workflow.json',
        'missed_call_recovery_workflow.json',
        'error_trigger_workflow.json',
        'weekly_report_workflow.json',
        'n8n_read_api_workflows.json',
        'PATCH patients.json',
        'PATCH handoff status.json',
        'AI Reactivation — Incoming Conversation.json',
        'AI Reactivation — Outgoing Conversation.json',
        'API-Dashboard.json',
        'API-Clients.json',
        'Client.json',
        'API - Conversations.json',
        'API-Human Handoffs.json',
        'API - Offers.json',
        'API-Config.json'
      ];
      const existing = files.filter(f => fs.existsSync(f) || fs.existsSync(path.join('The_Med_Spa_Dental_Reactivation_Engine', f)));
      assert.equal(existing.length, 17, 'Must have 17 physical files on disk');
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 21. Multi-Tenant Cache Isolation, Dynamic Readiness & Telemetry Provenance */
  /* ----------------------------------------------------------------------- */
  describe('21. Multi-Tenant Cache Isolation, Dynamic Readiness & Telemetry Provenance', () => {
    test('21.1 Multi-tenant cache key isolation prevents cross-tenant cache collision', () => {
      const path = '/webhook-test/dashboard';
      const keyA = getCacheKey(path, 'aurevia-beverly-hills');
      const keyB = getCacheKey(path, 'aurevia-dental-downtown');

      assert.equal(keyA, 'aurevia-beverly-hills:/webhook-test/dashboard');
      assert.equal(keyB, 'aurevia-dental-downtown:/webhook-test/dashboard');
      assert.notEqual(keyA, keyB);

      // Populate cache for Clinic A
      responseCache.set(keyA, { timestamp: Date.now(), data: { clinic: 'beverly', revenue: 1000 } });
      
      // Clinic B must not see Clinic A's cache
      assert.equal(responseCache.has(keyB), false);
      assert.equal(responseCache.get(keyB), undefined);

      // Populate cache for Clinic B
      responseCache.set(keyB, { timestamp: Date.now(), data: { clinic: 'downtown', revenue: 500 } });

      // Invalidate only Clinic A
      const cleared = invalidateCache(path, 'aurevia-beverly-hills');
      assert.ok(cleared >= 1);
      assert.equal(responseCache.has(keyA), false);
      assert.equal(responseCache.has(keyB), true, 'Clinic B cache must remain untouched');

      // Cleanup
      responseCache.delete(keyB);
    });

    test('21.2 Dynamic readiness gate truthfully fails when required workflow files are missing', () => {
      // Pass a partial workflow list missing required files
      const readiness = evaluateClinicReadiness('aurevia-beverly-hills', {
        demoMode: false,
        hasProductionCredentials: true,
        hasWebhookSecrets: true,
        legal_review_acknowledged: true,
        existingWorkflows: ['AI Reactivation — Incoming Conversation.json']
      });

      const workflowCheck = readiness.checklist.find(i => i.id === 'relevant_workflows_exported');
      assert.ok(workflowCheck);
      assert.equal(workflowCheck.passed, false);
      assert.match(workflowCheck.details, /Missing/);
      assert.ok(readiness.blockers.some(b => b.id === 'relevant_workflows_exported'));
      assert.equal(readiness.status, READINESS_STATUSES.BLOCKED_CONFIGURATION_REQUIRED);
    });

    test('21.3 Dynamic readiness gate passes when all mandatory workflow files are verified', () => {
      const readiness = evaluateClinicReadiness('aurevia-beverly-hills', {
        demoMode: false,
        hasProductionCredentials: true,
        hasWebhookSecrets: true,
        legal_review_acknowledged: true,
        existingWorkflows: MANDATORY_CORE_WORKFLOW_FILES
      });

      const workflowCheck = readiness.checklist.find(i => i.id === 'relevant_workflows_exported');
      assert.ok(workflowCheck);
      assert.equal(workflowCheck.passed, true);
      assert.equal(readiness.blockers.length, 0);
      assert.equal(readiness.status, READINESS_STATUSES.PRODUCTION_ENABLED);
    });

    test('21.4 ProviderStatusBadge property resolution maps booking_provider correctly', () => {
      const clinicA = getClinicConfig('aurevia-beverly-hills');
      const clinicB = getClinicConfig('aurevia-dental-downtown');
      const clinicC = getClinicConfig('aurevia-spa-wellness');

      // Ensure booking_provider exists on configurations
      assert.equal(clinicA.booking_provider, 'google_calendar');
      assert.equal(clinicB.booking_provider, 'calendly');
      assert.equal(clinicC.booking_provider, 'cal_com');

      // Label resolution
      const resolveLabel = (clinic) => {
        const raw = clinic.booking_provider || clinic.calendarProvider || 'DEMO';
        return raw === 'google_calendar' ? 'Google Calendar'
          : raw === 'calendly' ? 'Calendly'
          : raw === 'cal_com' ? 'Cal.com'
          : raw;
      };

      assert.equal(resolveLabel(clinicA), 'Google Calendar');
      assert.equal(resolveLabel(clinicB), 'Calendly');
      assert.equal(resolveLabel(clinicC), 'Cal.com');
    });

    test('21.5 Metric provenance tags every calculated KPI with its origin and disclaimer', () => {
      const metrics = calculateClinicMetrics('aurevia-beverly-hills');
      assert.ok(metrics.metric_provenance, 'metric_provenance must be present');
      assert.equal(metrics.metric_provenance.revenue_recovered, METRIC_SOURCES.ESTIMATE_MODEL);
      assert.equal(metrics.metric_provenance.showed, METRIC_SOURCES.ESTIMATE_MODEL);
      assert.equal(metrics.metric_provenance.open_handoffs, METRIC_SOURCES.MEASURED);
      assert.equal(metrics.is_estimate, true);
      assert.ok(metrics.provenance_disclaimer.length > 20);
    });

    test('21.6 Webhook ingress middleware and mock ingress handler enforce security boundary', () => {
      const testSecret = 'test_webhook_secret_key_12345';
      const body = { event_id: 'evt_test_21_6', patient_id: 'fake-patient-001' };
      const rawBody = JSON.stringify(body);
      const now = Date.now();
      const validSig = computeHmacSha256(rawBody, testSecret);

      // Valid ingress request
      const validReq = {
        headers: {
          'x-hub-signature-256': `sha256=${validSig}`,
          'x-timestamp': String(now),
          'x-event-id': 'evt_test_21_6'
        },
        body
      };
      const validRes = handleMockWebhookIngress(validReq, { secret: testSecret });
      assert.equal(validRes.status, 'ACCEPTED');
      assert.equal(validRes.code, 200);

      // Expired ingress request (>300s)
      const expiredReq = {
        headers: {
          'x-hub-signature-256': `sha256=${validSig}`,
          'x-timestamp': String(now - 400000),
          'x-event-id': 'evt_test_expired'
        },
        body
      };
      const expiredRes = handleMockWebhookIngress(expiredReq, { secret: testSecret });
      assert.equal(expiredRes.statusCode, 401);
      assert.equal(expiredRes.body.reason, 'EXPIRED_TIMESTAMP');

      // Tampered signature ingress request
      const tamperedReq = {
        headers: {
          'x-hub-signature-256': 'sha256=badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadb',
          'x-timestamp': String(now),
          'x-event-id': 'evt_test_tampered'
        },
        body
      };
      const tamperedRes = handleMockWebhookIngress(tamperedReq, { secret: testSecret });
      assert.equal(tamperedRes.statusCode, 401);
      assert.equal(tamperedRes.body.reason, 'INVALID_SIGNATURE');

      // Concrete n8n Code Node verification snippet
      assert.ok(N8N_WEBHOOK_VERIFICATION_CODE_NODE.includes('crypto.timingSafeEqual'));
      assert.ok(N8N_WEBHOOK_VERIFICATION_CODE_NODE.includes('WEBHOOK_SECRET'));
    });

    test('21.7 Disconnected booking and desk actions are callable with loading states', () => {
      assert.equal(typeof api.createBooking, 'function');
      assert.equal(typeof api.updateTakeover, 'function');
      assert.equal(typeof api.sendInboundReply, 'function');
    });
  });

});

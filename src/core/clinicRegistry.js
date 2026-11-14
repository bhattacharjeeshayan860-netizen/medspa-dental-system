/**
 * Multi-Client Practice Configuration Registry
 * Isolates settings, branding, timezone, quiet hours, providers,
 * and commercial pilot terms per clinic.
 */

export const COMMERCIAL_PRICING_TIERS = {
  founding_pilot: {
    name: 'Founding Clinic Pilot',
    setup_fee_range: '$1,000 – $1,500',
    monthly_subscription: '$497 / month',
    monthly_fee: 497,
    guarantee_clause: 'If the system books fewer than [N] appointments in 60 days, month 3 is free (N calculated from clinic-specific capacity).',
    status: 'ACTIVE_PILOT'
  },
  standard_med_spa: {
    name: 'Standard Med Spa & Dermatology',
    setup_fee_range: '$2,000 – $2,500',
    monthly_subscription: '$997 / month',
    monthly_fee: 997,
    guarantee_clause: 'If the system books fewer than 10 appointments in 60 days, month 3 is free.',
    status: 'PRODUCTION_TIER'
  },
  standard_dental: {
    name: 'Standard Private Dental Practice',
    setup_fee_range: '$2,000 – $2,500',
    monthly_subscription: '$797 / month',
    monthly_fee: 797,
    guarantee_clause: 'If the system books fewer than 12 recall appointments in 60 days, month 3 is free.',
    status: 'PRODUCTION_TIER'
  },
  premium_enterprise: {
    name: 'Premium / Multi-Location',
    setup_fee_range: 'Custom quote per project',
    monthly_subscription: '$1,500+ / month',
    monthly_fee: 1500,
    guarantee_clause: 'Custom enterprise SLA and pilot milestones.',
    status: 'FUTURE_PAID_BUILD'
  }
};

export const CLINIC_REGISTRY = {
  'aurevia-beverly-hills': {
    clinic_id: 'aurevia-beverly-hills',
    name: 'Aurevia Med Spa — Beverly Hills',
    type: 'med_spa',
    phone_number: '+15550100010',
    timezone: 'America/Los_Angeles',
    quiet_hours: {
      enabled: true,
      start: '21:00', // 9:00 PM
      end: '09:00'    // 9:00 AM
    },
    business_hours: {
      start: '09:00',
      end: '19:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },
    frequency_cap_hours: 24,
    average_treatment_value: 750,
    show_rate: 0.85,
    retention_policy_days: 30,
    legal_review_acknowledged: false, // Must be acknowledged via onboarding wizard
    currency: 'USD',
    currency_symbol: '$',
    booking_provider: 'google_calendar',
    booking_url: 'https://cal.example.invalid/beverly-hills',
    owner_email: 'director.beverly@example.invalid',
    staff_notification_channel: 'whatsapp',
    staff_notification_target: '+15550100011',
    review_requests_enabled: false, // FTC Guard: Disabled by default until clinic approval
    google_review_url: 'https://reviews.example.invalid/r/aurevia-beverly-hills',
    private_feedback_url: 'https://feedback.example.invalid/beverly-hills',
    pricing_tier: 'standard_med_spa',
    target_pilot_appointments: 10,
    template_whitelist: ['TEMPLATE_RECALL_NUDGE', 'TEMPLATE_MISSED_CALL_RECOVERY', 'TEMPLATE_BOOKING_LINK', 'TEMPLATE_OPT_OUT_CONFIRMATION', 'TEMPLATE_REVIEW_REQUEST_UNGATED'],
    approved_templates: {
      missed_call: 'Hi, this is Aurevia Med Spa. We missed your call and will get back to you shortly. If you’d like, reply here and we can help you find an appointment.',
      outreach_nudge: 'Hi {{first_name}}, this is Aurevia Med Spa. It has been a while since your last visit, and we wanted to see if you would like to see available times.',
      opt_out_ack: 'You have been unsubscribed from Aurevia Med Spa notifications. Reply START anytime to resume.'
    }
  },

  'aurevia-dental-downtown': {
    clinic_id: 'aurevia-dental-downtown',
    name: 'Aurevia Dental Studio — Downtown LA',
    type: 'dental',
    phone_number: '+15550100020',
    timezone: 'America/Los_Angeles',
    quiet_hours: {
      enabled: true,
      start: '20:30',
      end: '08:30'
    },
    business_hours: {
      start: '08:30',
      end: '18:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    },
    frequency_cap_hours: 24,
    average_treatment_value: 420,
    show_rate: 0.88,
    retention_policy_days: 30,
    legal_review_acknowledged: false,
    currency: 'USD',
    currency_symbol: '$',
    booking_provider: 'calendly',
    booking_url: 'https://cal.example.invalid/dental-recall',
    owner_email: 'director.dental@example.invalid',
    staff_notification_channel: 'slack',
    staff_notification_target: 'https://hooks.slack.example.invalid/services/DEMO/REDACTED',
    review_requests_enabled: false, // FTC Guard: Disabled by default
    google_review_url: 'https://reviews.example.invalid/r/aurevia-dental-la',
    private_feedback_url: 'https://feedback.example.invalid/dental-la',
    pricing_tier: 'standard_dental',
    target_pilot_appointments: 12,
    template_whitelist: ['TEMPLATE_RECALL_NUDGE', 'TEMPLATE_MISSED_CALL_RECOVERY', 'TEMPLATE_BOOKING_LINK', 'TEMPLATE_OPT_OUT_CONFIRMATION', 'TEMPLATE_REVIEW_REQUEST_UNGATED'],
    approved_templates: {
      missed_call: 'Hi, this is Aurevia Dental Studio. We missed your call and will get back to you shortly. If you’d like, reply here and we can help you find an appointment.',
      outreach_nudge: 'Hi {{first_name}}, this is Aurevia Dental Studio. It has been a while since your last visit, and we wanted to see if you would like to see available times.',
      opt_out_ack: 'You have been unsubscribed from Aurevia Dental Studio notifications. Reply START anytime to resume.'
    }
  },

  'aurevia-spa-wellness': {
    clinic_id: 'aurevia-spa-wellness',
    name: 'Aurevia Spa & Wellness',
    type: 'med_spa',
    phone_number: '+15550100030',
    timezone: 'Asia/Kolkata',
    quiet_hours: {
      enabled: true,
      start: '21:00',
      end: '10:00'
    },
    business_hours: {
      start: '10:00',
      end: '19:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    frequency_cap_hours: 24,
    average_treatment_value: 120, // In USD equivalent
    show_rate: 0.80,
    retention_policy_days: 30,
    legal_review_acknowledged: false,
    currency: 'USD',
    currency_symbol: '$',
    booking_provider: 'cal_com',
    booking_url: 'https://cal.example.invalid/wellness',
    owner_email: 'director.wellness@example.invalid',
    staff_notification_channel: 'whatsapp',
    staff_notification_target: '+15550100031',
    review_requests_enabled: false, // FTC Guard: Disabled by default
    google_review_url: 'https://reviews.example.invalid/r/aurevia-spa-wellness',
    private_feedback_url: 'https://feedback.example.invalid/spa-wellness',
    pricing_tier: 'founding_pilot',
    target_pilot_appointments: 8,
    template_whitelist: ['TEMPLATE_RECALL_NUDGE', 'TEMPLATE_MISSED_CALL_RECOVERY', 'TEMPLATE_BOOKING_LINK', 'TEMPLATE_OPT_OUT_CONFIRMATION', 'TEMPLATE_REVIEW_REQUEST_UNGATED'],
    approved_templates: {
      missed_call: 'Hi, this is Aurevia Spa & Wellness. We missed your call and will get back to you shortly. If you’d like, reply here and we can help you find an appointment.',
      outreach_nudge: 'Hi {{first_name}}, this is Aurevia Spa & Wellness. It has been a while since your last visit, and we wanted to see if you would like to see available times.',
      opt_out_ack: 'You have been unsubscribed from Aurevia Spa & Wellness updates. Reply START to opt back in.'
    }
  }
};

export const DEFAULT_CLINIC_ID = 'aurevia-beverly-hills';

export function resolveClinicId(clinicId, options = {}) {
  if (!clinicId) {
    if (options.failClosed || options.production) {
      const err = new Error('TENANT_NOT_FOUND: No clinic ID provided.');
      err.code = 'TENANT_NOT_FOUND';
      throw err;
    }
    return DEFAULT_CLINIC_ID;
  }
  if (clinicId === 'beverly-hills' || clinicId === 'aurevia-beverly-hills') return 'aurevia-beverly-hills';
  if (clinicId === 'downtown-dental' || clinicId === 'aurevia-dental-downtown' || clinicId === 'downtown-dental-studio') return 'aurevia-dental-downtown';
  if (clinicId === 'maya-spa' || clinicId === 'maya-spa-wellness' || clinicId === 'aurevia-spa-wellness' || clinicId === 'maya-spa-retreat') return 'aurevia-spa-wellness';
  return clinicId;
}

export function getClinicConfig(clinicId = DEFAULT_CLINIC_ID, options = {}) {
  const resolved = resolveClinicId(clinicId, options);
  const config = CLINIC_REGISTRY[resolved];
  if (!config) {
    if (options.failClosed || options.production) {
      const err = new Error(`TENANT_NOT_FOUND: Clinic '${clinicId}' does not exist in registry.`);
      err.code = 'TENANT_NOT_FOUND';
      throw err;
    }
    return CLINIC_REGISTRY[DEFAULT_CLINIC_ID];
  }
  return config;
}

export function getAllClinics() {
  return Object.values(CLINIC_REGISTRY);
}

export function listSupportedClinics() {
  return getAllClinics().map((c) => ({
    id: c.clinic_id,
    name: c.name,
    specialty: c.type === 'dental' ? 'Dental' : 'Med Spa',
    timezone: c.timezone,
    average_treatment_value: c.average_treatment_value
  }));
}

export function updateClinicConfig(clinicId, updates = {}) {
  const targetId = (clinicId === 'maya-spa-wellness') ? 'aurevia-spa-wellness' : clinicId;
  if (!CLINIC_REGISTRY[targetId]) return null;

  CLINIC_REGISTRY[targetId] = {
    ...CLINIC_REGISTRY[targetId],
    ...updates,
    business_hours: {
      ...CLINIC_REGISTRY[targetId].business_hours,
      ...(updates.business_hours || {})
    },
    quiet_hours: {
      ...CLINIC_REGISTRY[targetId].quiet_hours,
      ...(updates.quiet_hours || {})
    }
  };

  return CLINIC_REGISTRY[targetId];
}

/**
 * Aurevia Practice OS — Demo Tenant-Scoped Mock Store (Client-Side Partitioned Store)
 *
 * ARCHITECTURAL NOTICE & PERSISTENCE BOUNDARY:
 * This store implements a client-side partitioned mock store supporting in-memory
 * testing and browser localStorage persistence for interactive previews and demos.
 * It is NOT an enterprise server-side SQL/NoSQL database.
 * Production SaaS persistence requires an authenticated server-side database (e.g. PostgreSQL)
 * with server-enforced Row Level Security (RLS) and encrypted at-rest storage.
 *
 * Scopes all reads and writes by clinicId to demonstrate tenant isolation in UI interactions.
 */

import { getClinicConfig, resolveClinicId } from '../core/clinicRegistry.js';
import { AUTHORIZED_PROD_TEST_RECORD } from '../core/fakeDataMode.js';

// Base seed data partitioned by clinicId (strictly synthetic RFC fixtures)
const INITIAL_PATIENTS = {
  'aurevia-beverly-hills': [
    {
      id: 'pat_bh_001',
      clinicId: 'aurevia-beverly-hills',
      name: 'Synthetic Patient 001',
      phone: '+1 (555) 010-0001',
      email: 'patient.001@example.invalid',
      serviceInterest: 'Demo Aesthetic Service A',
      lastVisit: '2026-08-14',
      status: 'REACTIVATED',
      channel: 'SMS',
      notes: 'Demo procedural reactivation inquiry.',
      optedOut: false
    },
    {
      id: 'pat_bh_002',
      clinicId: 'aurevia-beverly-hills',
      name: 'Synthetic Patient 002',
      phone: '+1 (555) 010-0002',
      email: 'patient.002@example.invalid',
      serviceInterest: 'Demo Aesthetic Service B',
      lastVisit: '2026-07-22',
      status: 'ENGAGED',
      channel: 'SMS',
      notes: 'Demo scheduling inquiry.',
      optedOut: false
    },
    {
      id: 'pat_bh_003',
      clinicId: 'aurevia-beverly-hills',
      name: 'Synthetic Patient 003',
      phone: '+1 (555) 010-0003',
      email: 'patient.003@example.invalid',
      serviceInterest: 'Demo Aesthetic Service C',
      lastVisit: '2026-06-10',
      status: 'HUMAN_REQUIRED',
      channel: 'SMS',
      notes: 'Demo procedural aftercare inquiry.',
      optedOut: false
    }
  ],
  'aurevia-dental-downtown': [
    {
      id: 'pat_dd_001',
      clinicId: 'aurevia-dental-downtown',
      name: 'Synthetic Patient 010',
      phone: '+1 (555) 010-0010',
      email: 'patient.010@example.invalid',
      serviceInterest: 'Demo Dental Recall Service',
      lastVisit: '2026-09-02',
      status: 'BOOKED',
      channel: 'SMS',
      notes: 'Demo appointment confirmation.',
      optedOut: false
    },
    {
      id: 'pat_dd_002',
      clinicId: 'aurevia-dental-downtown',
      name: 'Synthetic Patient 011',
      phone: '+1 (555) 010-0011',
      email: 'patient.011@example.invalid',
      serviceInterest: 'Demo Dental Consultation',
      lastVisit: '2026-05-18',
      status: 'CONTACTED',
      channel: 'SMS',
      notes: 'Demo calendar link dispatch.',
      optedOut: false
    }
  ],
  'aurevia-spa-wellness': [
    {
      id: 'pat_ms_001',
      clinicId: 'aurevia-spa-wellness',
      name: 'Synthetic Patient 020',
      phone: '+1 (555) 010-0020',
      email: 'patient.020@example.invalid',
      serviceInterest: 'Demo Wellness Package',
      lastVisit: '2026-08-01',
      status: 'REACTIVATED',
      channel: 'WhatsApp',
      notes: 'Demo weekend schedule preference.',
      optedOut: false
    },
    {
      id: 'pat_ms_002',
      clinicId: 'aurevia-spa-wellness',
      name: 'Synthetic Patient 021',
      phone: '+1 (555) 010-0021',
      email: 'patient.021@example.invalid',
      serviceInterest: 'Demo Wellness Session',
      lastVisit: '2026-07-15',
      status: 'ENGAGED',
      channel: 'WhatsApp',
      notes: 'Demo seasonal outreach reply.',
      optedOut: false
    }
  ]
};

const INITIAL_CAMPAIGNS = {
  'aurevia-beverly-hills': [
    {
      id: 'cmp_bh_01',
      clinicId: 'aurevia-beverly-hills',
      name: 'Autumn Radiance HydraFacial',
      service: 'HydraFacial Deluxe',
      incentive: '$50 treatment credit toward seasonal package',
      targetDormancyDays: 90,
      channel: 'SMS',
      status: 'ACTIVE',
      sentCount: 142,
      repliedCount: 38,
      bookedCount: 14,
      totalRevenueGenerated: 10500
    }
  ],
  'aurevia-dental-downtown': [
    {
      id: 'cmp_dd_01',
      clinicId: 'aurevia-dental-downtown',
      name: 'Precision Smile Hygiene Reactivation',
      service: 'Hygiene & Teeth Whitening',
      incentive: 'Complimentary remineralization polish with checkup',
      targetDormancyDays: 180,
      channel: 'SMS',
      status: 'ACTIVE',
      sentCount: 96,
      repliedCount: 22,
      bookedCount: 9,
      totalRevenueGenerated: 3780
    }
  ],
  'aurevia-spa-wellness': [
    {
      id: 'cmp_ms_01',
      clinicId: 'aurevia-spa-wellness',
      name: 'Diwali Glow Ayurvedic Wellness',
      service: 'Ayurvedic Rejuvenation',
      incentive: 'Exclusive festive herbal scrub with facial booking',
      targetDormancyDays: 60,
      channel: 'WhatsApp',
      status: 'ACTIVE',
      sentCount: 180,
      repliedCount: 54,
      bookedCount: 26,
      totalRevenueGenerated: 52000
    }
  ]
};

const INITIAL_HUMAN_CASES = {
  'aurevia-beverly-hills': [
    {
      id: 'esc_bh_001',
      clinicId: 'aurevia-beverly-hills',
      patientName: 'Synthetic Patient 003',
      patientPhone: '+1 (555) 010-0003',
      reason: 'Demo procedural aftercare inquiry flagged for staff review',
      severity: 'HIGH',
      assignedTo: 'Practice Staff Desk',
      status: 'OPEN',
      escalatedAt: new Date(Date.now() - 12 * 60000).toISOString()
    }
  ],
  'aurevia-dental-downtown': [
    {
      id: 'esc_dd_001',
      clinicId: 'aurevia-dental-downtown',
      patientName: 'Synthetic Patient 012',
      patientPhone: '+1 (555) 010-0012',
      reason: 'Demo post-visit comfort inquiry flagged for staff review',
      severity: 'HIGH',
      assignedTo: 'Practice Staff Desk',
      status: 'OPEN',
      escalatedAt: new Date(Date.now() - 45 * 60000).toISOString()
    }
  ],
  'aurevia-spa-wellness': []
};

// Internal storage with optional browser localStorage hydration
const STORAGE_KEY = 'aurevia_tenant_store_v1';

function loadPersistedStore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[Aurevia] Unable to hydrate tenant store from localStorage:', e);
    }
  }
  return {
    patients: { ...INITIAL_PATIENTS },
    campaigns: { ...INITIAL_CAMPAIGNS },
    humanCases: { ...INITIAL_HUMAN_CASES },
    auditLog: []
  };
}

const store = loadPersistedStore();

function persistStore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      // Storage quota or sandboxed iframe
    }
  }
}

export function getTenantPatients(clinicId) {
  const cid = resolveClinicId(clinicId);
  return store.patients[cid] ? [...store.patients[cid]] : [];
}

export function addTenantPatient(clinicId, patientData) {
  const cid = resolveClinicId(clinicId);
  if (!store.patients[cid]) {
    store.patients[cid] = [];
  }
  const newPatient = {
    id: `pat_${cid.slice(0, 3)}_${Date.now()}`,
    clinicId: cid,
    optedOut: false,
    ...patientData
  };
  store.patients[cid].unshift(newPatient);
  recordStoreAudit(cid, 'PATIENT_CREATED', { patientId: newPatient.id });
  persistStore();
  return newPatient;
}

export function updateTenantPatient(clinicId, patientId, updates) {
  const cid = resolveClinicId(clinicId);
  const list = store.patients[cid];
  if (!list) return null;
  const index = list.findIndex(p => p.id === patientId);
  if (index === -1) return null;
  list[index] = { ...list[index], ...updates };
  recordStoreAudit(cid, 'PATIENT_UPDATED', { patientId, fields: Object.keys(updates) });
  persistStore();
  return list[index];
}

export function getTenantCampaigns(clinicId) {
  const cid = resolveClinicId(clinicId);
  return store.campaigns[cid] ? [...store.campaigns[cid]] : [];
}

export function getTenantHumanCases(clinicId) {
  const cid = resolveClinicId(clinicId);
  return store.humanCases[cid] ? [...store.humanCases[cid]] : [];
}

export function resolveTenantHumanCase(clinicId, caseId, resolutionNotes = '') {
  const cid = resolveClinicId(clinicId);
  const list = store.humanCases[cid];
  if (!list) return false;
  const target = list.find(c => c.id === caseId);
  if (target) {
    target.status = 'RESOLVED';
    target.resolvedAt = new Date().toISOString();
    target.resolutionNotes = resolutionNotes;
    recordStoreAudit(cid, 'HUMAN_CASE_RESOLVED', { caseId });
    persistStore();
    return true;
  }
  return false;
}

export function recordStoreAudit(clinicId, action, metadata = {}) {
  const cid = resolveClinicId(clinicId);
  const auditEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    clinicId: cid,
    action,
    metadata,
    timestamp: new Date().toISOString()
  };
  store.auditLog.unshift(auditEntry);
  if (store.auditLog.length > 200) {
    store.auditLog.pop();
  }
  persistStore();
  return auditEntry;
}

export function getTenantAuditLog(clinicId) {
  if (!clinicId) return [...store.auditLog];
  const cid = resolveClinicId(clinicId);
  return store.auditLog.filter(e => e.clinicId === cid);
}

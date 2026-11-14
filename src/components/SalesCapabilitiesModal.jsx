import React, { useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Zap,
  Building2,
  CalendarCheck,
  PhoneCall,
  Clock,
  HeartPulse,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Scale,
  DollarSign
} from 'lucide-react';
import { getAllClinics, COMMERCIAL_PRICING_TIERS } from '../core/clinicRegistry.js';

export function SalesCapabilitiesModal({ onClose }) {
  const clinics = getAllClinics();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="salesModalTitle"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(22, 34, 27, 0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal-card"
        style={{
          background: 'var(--panel, #ffffff)',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '16px',
          border: '1px solid var(--line, #e2e6e1)',
          padding: '28px',
          boxShadow: 'var(--shadow-lg, 0 16px 36px rgba(24, 34, 27, 0.16))'
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line, #eee)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <span className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted, #666)', fontSize: '11px', fontWeight: 700 }}>
              Practice OS Architecture &amp; Compliance Specifications
            </span>
            <h2 id="salesModalTitle" style={{ fontSize: '20px', margin: '4px 0 0 0', fontWeight: 800, color: 'var(--ink, #1a221d)' }}>
              Aurevia Practice OS — Operational Contract
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="icon-button"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--muted, #666)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* METRICS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--sage-light, #f2f7f3)', border: '1px solid var(--sage-border, #d2e3d6)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--sage-deep, #213a2c)' }}>Clinics</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--sage-deep, #213a2c)' }}>3 Configured</div>
            <span style={{ fontSize: '11px', color: 'var(--muted, #666)' }}>Beverly Hills, LA, Maya</span>
          </div>

          <div style={{ background: 'var(--gold-pale, #fbf5e7)', border: '1px solid var(--gold-border, #efe1c2)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--gold-deep, #8a6422)' }}>Workflows</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gold-deep, #8a6422)' }}>6 n8n Schemas</div>
            <span style={{ fontSize: '11px', color: 'var(--muted, #666)' }}>All JSON validated</span>
          </div>

          <div style={{ background: 'var(--blue-pale, #edf4f9)', border: '1px solid var(--blue-border, #d0e3f0)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--blue, #447190)' }}>Safety Guardrails</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue, #447190)' }}>6 Enforced</div>
            <span style={{ fontSize: '11px', color: 'var(--muted, #666)' }}>Deterministic logic</span>
          </div>

          <div style={{ background: 'var(--canvas-warm, #fcfbf9)', border: '1px solid var(--line, #e2e6e1)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink, #1a221d)' }}>Automated Tests</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--sage, #5b826b)' }}>65+ Passing</div>
            <span style={{ fontSize: '11px', color: 'var(--muted, #666)' }}>Zero-failure suite</span>
          </div>
        </div>

        {/* 10 DEMO CAPABILITIES CHECKLIST */}
        <div style={{ background: 'var(--canvas-warm, #fcfbf9)', border: '1px solid var(--line, #e2e6e1)', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ink, #1a221d)', marginBottom: '10px', fontSize: '13px' }}>
            <Sparkles size={16} style={{ color: 'var(--gold-deep, #8a6422)' }} /> Verified Operational Capabilities (10/10 Implemented)
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>1. Standard Missed Call:</strong> Instant recovery text dispatch</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>2. Duplicate Call ID:</strong> Exact idempotency suppression</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>3. 24h Frequency Cap:</strong> Suppresses repeat caller re-engagement</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>4. Quiet-Hours Suppression:</strong> Holds overnight messages until clinic morning</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>5. STOP Opt-Out:</strong> Immediate unsubscribe acknowledgment</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>6. Booking Simulation:</strong> Clearly labeled with demo event IDs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>7. Human Staff Takeover:</strong> Halts AI and missed-call automation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>8. Revenue / Weekly Report:</strong> Modeled revenue recovery preview</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>9. Multi-Clinic Switching:</strong> Beverly Hills, LA Dental, Maya Spa</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--sage, #5b826b)', flexShrink: 0 }} />
              <span><strong>10. Error / Failure Handling:</strong> Timeout, conflict, and missing credential errors</span>
            </div>
          </div>
        </div>

        {/* COMMERCIAL PRICING & PILOT TERMS */}
        <div style={{ border: '1px solid var(--gold-border, #efe1c2)', background: 'var(--gold-pale, #fdfbf7)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-deep, #8a6422)', marginBottom: '8px', fontSize: '13px' }}>
            <DollarSign size={16} /> Commercial Pilot Pricing &amp; Performance Terms
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', fontSize: '12px' }}>
            <div style={{ background: '#fff', border: '1px solid #ebdcb9', borderRadius: '8px', padding: '10px' }}>
              <strong style={{ color: '#2b362e' }}>Founding Clinic Pilot</strong>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#8a6422', margin: '4px 0' }}>$1,000–$1,500 setup</div>
              <div style={{ color: '#555' }}>then $497 / month</div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#777' }}>Capacity-calculated guarantee</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #ebdcb9', borderRadius: '8px', padding: '10px' }}>
              <strong style={{ color: '#2b362e' }}>Standard Med Spa</strong>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#8a6422', margin: '4px 0' }}>$2,000–$2,500 setup</div>
              <div style={{ color: '#555' }}>then $997 / month</div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#777' }}>Target: 10 recall bookings / 60d</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #ebdcb9', borderRadius: '8px', padding: '10px' }}>
              <strong style={{ color: '#2b362e' }}>Standard Private Dental</strong>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#8a6422', margin: '4px 0' }}>$2,000–$2,500 setup</div>
              <div style={{ color: '#555' }}>then $797 / month</div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#777' }}>Target: 12 hygiene recall bookings / 60d</div>
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#68593a', lineHeight: 1.4 }}>
            *<strong>Pilot Guarantee Terms:</strong> If the system books fewer than the agreed [N] appointments within 60 days, month 3 is provided free of charge. [N] is determined from clinic capacity during onboarding. Stripe deposits, live EHR write adapters, and voice dialers are reserved for future custom builds.
          </div>
        </div>

        {/* DETAILED SPECIFICATION BLOCKS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', color: 'var(--ink-soft, #324037)' }}>
          
          {/* COMPLIANCE & LEGAL GUARDRAILS */}
          <div style={{ border: '1px solid var(--line, #e2e6e1)', borderRadius: '10px', padding: '14px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ink, #1a221d)', marginBottom: '4px' }}>
              <Scale size={16} style={{ color: 'var(--sage, #5b826b)' }} /> Compliance &amp; Legal Boundaries
            </strong>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
              <li><strong>Zero PHI on WhatsApp (HIPAA Boundary):</strong> WhatsApp Business Platform is NOT HIPAA-compliant; Meta does NOT execute Business Associate Agreements (BAAs). Outbound messages are strictly restricted to non-clinical appointment coordination (zero procedure names, clinical notes, diagnoses, or medication details).</li>
              <li><strong>FTC Anti-Review-Gating:</strong> Review requests never route positive reviews to Google and negative reviews to private forms. Every eligible patient receives an identical public Google Review link; private feedback is offered as an optional path to all. Review outreach is disabled by default.</li>
              <li><strong>TCPA Telephony Sensitivity:</strong> Missed-call text-back is legally sensitive and requires explicit clinic legal review. Enforces 24h frequency cap, clinic quiet hours, and zero-token deterministic STOP opt-outs.</li>
              <li><strong>Claims Grounding:</strong> All performance figures are labeled as verified sources, pilot measurements, or user assumptions. Unsupported marketing metrics are excluded.</li>
            </ul>
          </div>

          {/* PROVIDERS */}
          <div style={{ border: '1px solid var(--line, #e2e6e1)', borderRadius: '10px', padding: '14px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ink, #1a221d)', marginBottom: '4px' }}>
              <CalendarCheck size={16} style={{ color: 'var(--sage, #5b826b)' }} /> Supported Booking &amp; Calendar Interfaces
            </strong>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>Demo Simulation Provider:</strong> In-memory prospective slot calculation with deterministic race-condition checks and unmistakable <code>PROV-*-DEMO-*</code> event IDs.</li>
              <li><strong>Google Calendar Adapter Interface:</strong> FreeBusy lookup and event creation interface (requires Google Workspace OAuth2/Service Account credentials).</li>
              <li><strong>Calendly Adapter Interface:</strong> Scheduling link dispatch with patient-recall tag mapping (requires Calendly Personal Access Token).</li>
              <li><strong>Cal.com Adapter Interface:</strong> Webhook booking event synchronization interface (requires Cal.com API key).</li>
            </ul>
          </div>

          {/* DEMO VS PRODUCTION STORAGE SEPARATION */}
          <div style={{ border: '1px solid var(--line, #e2e6e1)', borderRadius: '10px', padding: '14px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-deep, #8a6422)', marginBottom: '4px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--gold-deep, #8a6422)' }} /> Data Storage &amp; Persistence Boundary
            </strong>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>Demo Mode Storage:</strong> Strictly in-memory ledgers for missed calls and bookings. Can be reset instantly via the "Reset Demo Ledger" button without altering server state.</li>
              <li><strong>Production Mode Storage:</strong> Authoritative data is persisted strictly in the clinic's secure Google Sheets CRM and calendar platforms via n8n. The frontend never assumes browser memory is authoritative in live mode.</li>
            </ul>
          </div>

        </div>

        <div style={{ marginTop: '22px', textAlign: 'right' }}>
          <button 
            type="button"
            onClick={onClose}
            className="primary-button"
            style={{ minHeight: '38px', padding: '8px 22px' }}
          >
            Close Overview
          </button>
        </div>

      </div>
    </div>
  );
}

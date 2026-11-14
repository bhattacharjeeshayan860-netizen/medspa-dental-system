import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Building2, Clock, Calendar, Scale, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { getClinicConfig } from '../core/clinicRegistry.js';
import { recordAuditEvent } from '../core/fakeDataMode.js';

export function ClinicOnboardingModal({ clinicId = 'aurevia-beverly-hills', onClose, onSave }) {
  const clinic = getClinicConfig(clinicId);

  const [step, setStep] = useState(1); // 1: Practice Profile, 2: Hours & Channels, 3: Commercial & Legal
  const [formData, setFormData] = useState({
    name: clinic.name || '',
    timezone: clinic.timezone || 'America/Los_Angeles',
    atv: clinic.average_treatment_value || 750,
    showRate: 85,
    businessHoursStart: clinic.business_hours?.start || '09:00',
    businessHoursEnd: clinic.business_hours?.end || '19:00',
    quietHoursStart: clinic.quiet_hours?.start || '21:00',
    quietHoursEnd: clinic.quiet_hours?.end || '09:00',
    calendarProvider: clinic.booking_provider || 'google_calendar',
    bookingUrl: clinic.booking_url || '',
    googleReviewUrl: clinic.google_review_url || '',
    privateFeedbackUrl: clinic.private_feedback_url || '',
    staffNotificationTarget: clinic.staff_notification_target || '+13105550100',
    dailyCampaignCap: 25,
    retentionDays: 30,
    legalReviewAcknowledged: Boolean(clinic.legal_review_acknowledged || false)
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const validateStep = (currentStep) => {
    const errs = {};
    if (currentStep === 1) {
      if (!formData.name.trim()) errs.name = 'Practice name is required.';
      if (!formData.timezone) errs.timezone = 'Timezone is required.';
      if (!formData.atv || formData.atv <= 0) errs.atv = 'Valid average patient value is required.';
    } else if (currentStep === 2) {
      if (!formData.calendarProvider) errs.calendarProvider = 'Calendar provider selection required.';
      if (!formData.quietHoursStart || !formData.quietHoursEnd) errs.quietHours = 'Quiet hours are mandatory for outreach compliance.';
    } else if (currentStep === 3) {
      if (!formData.legalReviewAcknowledged) {
        errs.legalReview = 'You must acknowledge that missed-call outreach requires qualified legal counsel approval under TCPA.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(3, prev + 1));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    recordAuditEvent({
      action: 'CLINIC_ONBOARDING_UPDATED',
      clinic_id: clinicId,
      detail: `Onboarding completed with legal acknowledgment: ${formData.legalReviewAcknowledged}`
    });

    if (onSave) onSave(formData);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboardingModalTitle"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(22, 34, 27, 0.55)',
        backdropFilter: 'blur(5px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal-card"
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '16px',
          border: '1px solid #e2e6e1',
          padding: '28px',
          boxShadow: '0 16px 36px rgba(24, 34, 27, 0.16)'
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#8a6422', letterSpacing: '0.05em' }}>
              Practice Onboarding &amp; Compliance Configuration
            </span>
            <h3 id="onboardingModalTitle" style={{ fontSize: '20px', margin: '4px 0 0', fontWeight: 800, color: '#1a221d' }}>
              Aurevia Practice Setup Wizard
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close onboarding modal"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#666' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* STEPPER PROGRESS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { n: 1, label: 'Practice Profile' },
            { n: 2, label: 'Hours & Calendars' },
            { n: 3, label: 'Compliance & Legal' }
          ].map((s) => (
            <div
              key={s.n}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                background: step === s.n ? '#f2f7f3' : '#fcfbf9',
                border: `1px solid ${step === s.n ? '#5b826b' : '#eee'}`,
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: step === s.n ? '#213a2c' : '#888' }}>
                Step {s.n}: {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Practice Legal Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                />
                {errors.name && <span style={{ color: '#b3261e', fontSize: '11px' }}>{errors.name}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Primary Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  >
                    <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                    <option value="America/Denver">America/Denver (Mountain)</option>
                    <option value="America/Chicago">America/Chicago (Central)</option>
                    <option value="America/New_York">America/New_York (Eastern)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Average Treatment Value ($)</label>
                  <input
                    type="number"
                    value={formData.atv}
                    onChange={(e) => setFormData({ ...formData, atv: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                  {errors.atv && <span style={{ color: '#b3261e', fontSize: '11px' }}>{errors.atv}</span>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Quiet Hours Start (Evening)</label>
                  <input
                    type="time"
                    value={formData.quietHoursStart}
                    onChange={(e) => setFormData({ ...formData, quietHoursStart: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Quiet Hours End (Morning)</label>
                  <input
                    type="time"
                    value={formData.quietHoursEnd}
                    onChange={(e) => setFormData({ ...formData, quietHoursEnd: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Calendar Provider</label>
                <select
                  value={formData.calendarProvider}
                  onChange={(e) => setFormData({ ...formData, calendarProvider: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                >
                  <option value="google_calendar">Google Calendar (Workspace OAuth / Service Account)</option>
                  <option value="calendly">Calendly v2 (Recall Tag Mapping)</option>
                  <option value="cal_com">Cal.com (API Key Sync)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Booking Page URL</label>
                <input
                  type="url"
                  value={formData.bookingUrl}
                  onChange={(e) => setFormData({ ...formData, bookingUrl: e.target.value })}
                  placeholder="https://cal.yourclinic.com"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#fbf5e7', border: '1px solid #efe1c2', borderRadius: '10px', padding: '14px', fontSize: '12px', color: '#6b4e18' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Scale size={16} /> Legal &amp; Regulatory Review Requirement
                </strong>
                Under the Telephone Consumer Protection Act (TCPA) and healthcare privacy rules, automated missed-call text-back and patient recall outreach require express consent and compliant disclosures. You must review your outreach wording with qualified practice legal counsel before going live.
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  checked={formData.legalReviewAcknowledged}
                  onChange={(e) => setFormData({ ...formData, legalReviewAcknowledged: e.target.checked })}
                  style={{ marginTop: '3px' }}
                />
                <span>
                  <strong>I acknowledge</strong> that our practice legal counsel has reviewed and approved our missed-call text-back copy, opt-out language, and quiet-hours policy.
                </span>
              </label>
              {errors.legalReview && <span style={{ color: '#b3261e', fontSize: '11px' }}>{errors.legalReview}</span>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Public Google Review Link</label>
                  <input
                    type="url"
                    value={formData.googleReviewUrl}
                    onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                    placeholder="https://g.page/r/your-clinic/review"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Private Direct Feedback Link</label>
                  <input
                    type="url"
                    value={formData.privateFeedbackUrl}
                    onChange={(e) => setFormData({ ...formData, privateFeedbackUrl: e.target.value })}
                    placeholder="https://yourclinic.com/feedback"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="secondary-button"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '38px', padding: '8px 16px', fontSize: '12px' }}
              >
                <ArrowLeft size={14} /> Previous
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="primary-button"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '38px', padding: '8px 20px', fontSize: '12px' }}
              >
                Next Step <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="primary-button"
                style={{ minHeight: '38px', padding: '8px 24px', fontSize: '12px', background: '#213a2c' }}
              >
                Save &amp; Complete Onboarding
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}


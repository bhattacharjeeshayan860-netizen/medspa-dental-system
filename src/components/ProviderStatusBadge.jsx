import React from 'react';
import { Calendar, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getClinicConfig } from '../core/clinicRegistry.js';

export default function ProviderStatusBadge({ clinicId, isDemo = true }) {
  const clinic = getClinicConfig(clinicId);
  const rawProvider = clinic.booking_provider || clinic.calendarProvider || 'DEMO';
  const providerLabel = rawProvider === 'google_calendar' ? 'Google Calendar'
    : rawProvider === 'calendly' ? 'Calendly'
    : rawProvider === 'cal_com' ? 'Cal.com'
    : rawProvider;
  const hasA2P = Boolean(clinic.a2p10dlcBrandId || clinic.tcrCampaignId);

  return (
    <div className="provider-status">
      {/* Calendar Provider Badge */}
      <div className={`provider-chip ${isDemo ? 'is-demo' : 'is-live'}`}
        title={`Calendar: ${providerLabel} (${isDemo ? 'Simulated Demo' : 'Live Provider'})`}
      >
        <Calendar size={14} />
        <span>{providerLabel}</span>
        {isDemo ? (
          <span className="provider-state">Preview</span>
        ) : (
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        )}
      </div>

      {/* Messaging / A2P 10DLC Badge */}
      <div className={`provider-chip ${isDemo ? 'is-demo' : hasA2P ? 'is-live' : 'is-warning'}`}
        title={`Messaging: ${isDemo ? 'Simulated SMS' : hasA2P ? 'A2P 10DLC Verified' : 'A2P Unregistered'}`}
      >
        <MessageSquare size={14} />
        <span>{isDemo ? 'Demo SMS' : 'Twilio A2P'}</span>
        {!isDemo && !hasA2P && (
          <span className="provider-state">Unverified</span>
        )}
      </div>
    </div>
  );
}

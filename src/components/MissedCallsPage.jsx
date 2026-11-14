import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneMissed,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock3,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Ban,
  Check
} from 'lucide-react';
import { getClinicConfig } from '../core/clinicRegistry.js';
import { processMissedCall, getMissedCallLogs, resetMissedCallLedger } from '../core/missedCallEngine.js';

export function MissedCallsPage({ clinicId, notify }) {
  const clinic = getClinicConfig(clinicId);
  const [logs, setLogs] = useState(() => getMissedCallLogs(clinicId));
  const [phone, setPhone] = useState('+1 (310) 555-0199');
  const [callId, setCallId] = useState('');
  const [preset, setPreset] = useState('STANDARD');
  const [lastResult, setLastResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshLogs = useCallback(() => {
    setLogs(getMissedCallLogs(clinicId));
  }, [clinicId]);

  useEffect(() => {
    refreshLogs();
  }, [clinicId, refreshLogs]);

  const handleResetLedger = () => {
    resetMissedCallLedger();
    refreshLogs();
    setLastResult(null);
    setPreset('STANDARD');
    setPhone('+1 (310) 555-0199');
    setCallId(`CALL-${Date.now()}`);
    if (notify) notify('Demo ledger reset: All missed call logs and transient states cleared.');
  };

  const handleSimulate = (overrideParams = {}) => {
    setIsProcessing(true);
    const chosenCallId = overrideParams.call_id || callId || `CALL-${Date.now()}`;
    const chosenPhone = overrideParams.phone || phone;
    const isQuietHoursTest = overrideParams.quiet_hours_test || preset === 'QUIET_HOURS';
    const isOptOutTest = overrideParams.opt_out_test || preset === 'OPT_OUT';

    // Format local simulated timestamp if testing quiet hours (11:30 PM local)
    const timestamp = isQuietHoursTest 
      ? '2026-11-03T23:30:00-08:00' // 11:30 PM local
      : new Date().toISOString();

    const event = {
      clinic_id: clinic.clinic_id,
      caller_phone: chosenPhone,
      call_id: chosenCallId,
      timestamp,
      ignore_quiet_hours: !isQuietHoursTest,
      is_opted_out: isOptOutTest,
      demo_mode: true
    };

    setTimeout(() => {
      const res = processMissedCall(event);
      setLastResult(res);
      refreshLogs();
      setIsProcessing(false);
      if (res.status === 'SENT') {
        if (notify) notify(`Missed-call recovery message dispatched to ${chosenPhone}`);
      } else {
        if (notify) notify(`Simulation completed: ${res.status} (${res.log?.reason || 'Suppressed'})`);
      }
    }, 180);
  };

  const applyPreset = (type) => {
    setPreset(type);
    setLastResult(null); // Clear previous result immediately
    if (type === 'STANDARD') {
      setPhone('+1 (310) 555-0199');
      setCallId(`CALL-STD-${Date.now()}`);
    } else if (type === 'IDEMPOTENT') {
      const existing = logs[0]?.call_id || `CALL-REPEAT-${Date.now()}`;
      setPhone(logs[0]?.caller_phone || '+1 (310) 555-0199');
      setCallId(existing);
    } else if (type === 'FREQUENCY_CAP') {
      // Same phone as an already sent message, but distinct call ID within 24h
      const sentEntry = logs.find(l => l.status === 'SENT');
      setPhone(sentEntry?.caller_phone || '+1 (310) 555-0199');
      setCallId(`CALL-FREQ-${Date.now()}`);
    } else if (type === 'OPT_OUT') {
      setPhone('+1 (555) 000-1009'); // Pre-registered opt-out
      setCallId(`CALL-OPTOUT-${Date.now()}`);
    } else if (type === 'QUIET_HOURS') {
      setPhone('+1 (310) 555-4321');
      setCallId(`CALL-NIGHT-${Date.now()}`);
    }
  };

  // Format date strictly in active clinic timezone
  const formatClinicTime = (isoString) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: clinic.timezone,
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date(isoString));
    } catch {
      return new Date(isoString).toLocaleTimeString();
    }
  };

  return (
    <div className="missed-calls-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Patient Recovery Operations</span>
          <h1>Missed-Call Recovery &amp; Automation</h1>
        </div>
        <div className="heading-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="outline-button"
            onClick={handleResetLedger}
            title="Reset demo logs and opt-out registry"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={14} /> Reset Demo Ledger
          </button>
          <button
            type="button"
            className="outline-button"
            onClick={refreshLogs}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>
      </div>

      <div className="intro-line">
        <p>
          Captures unanswered calls in real time, verifies quiet hours and opt-outs, and dispatches a compliant SMS/WhatsApp before the patient contacts another clinic.
        </p>
        <span className="live-pill">
          <span /> {clinic.name} &bull; {clinic.timezone}
        </span>
      </div>

      {/* RESPONSIVE LAYOUT CONTAINER */}
      <div className="missed-calls-layout">
        
        {/* SIMULATOR PANEL */}
        <section className="panel simulator-panel">
          <div className="section-heading" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={18} style={{ color: 'var(--sage, #5b826b)' }} />
                <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>Interactive Missed-Call Simulator</h2>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'var(--gold-pale, #fbf5e7)',
                  color: 'var(--gold-deep, #8a6422)',
                  border: '1px solid var(--gold-border, #efe1c2)'
                }}
              >
                DEMO MODE
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted, #666)', margin: '4px 0 0 0' }}>
              Test all five regulatory and operational safety scenarios.
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted, #666)', marginBottom: '8px' }}>
              Select Test Scenario:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => applyPreset('STANDARD')}
                className={`scenario-btn ${preset === 'STANDARD' ? 'active' : ''}`}
              >
                1. Standard Lead
              </button>
              <button 
                type="button" 
                onClick={() => applyPreset('IDEMPOTENT')}
                className={`scenario-btn ${preset === 'IDEMPOTENT' ? 'active' : ''}`}
              >
                2. Duplicate Call ID
              </button>
              <button 
                type="button" 
                onClick={() => applyPreset('FREQUENCY_CAP')}
                className={`scenario-btn ${preset === 'FREQUENCY_CAP' ? 'active' : ''}`}
              >
                3. 24h Frequency Cap
              </button>
              <button 
                type="button" 
                onClick={() => applyPreset('QUIET_HOURS')}
                className={`scenario-btn ${preset === 'QUIET_HOURS' ? 'active' : ''}`}
              >
                4. Quiet Hours (Night)
              </button>
              <button 
                type="button" 
                onClick={() => applyPreset('OPT_OUT')}
                className={`scenario-btn ${preset === 'OPT_OUT' ? 'active' : ''}`}
              >
                5. STOP Opt-Out
              </button>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSimulate(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label htmlFor="callerPhoneInput" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink, #1a221d)', marginBottom: '4px' }}>
                Caller Phone Number:
              </label>
              <input 
                id="callerPhoneInput"
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                required
                className="input-field"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label htmlFor="callIdInput" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink, #1a221d)', marginBottom: '4px' }}>
                Provider Call ID (Idempotency Key):
              </label>
              <input 
                id="callIdInput"
                type="text" 
                value={callId} 
                placeholder="Auto-generated unique token"
                onChange={(e) => setCallId(e.target.value)}
                className="input-field"
              />
            </div>

            <button 
              type="submit"
              className="primary-button" 
              disabled={isProcessing}
              style={{ marginTop: '6px', minHeight: '44px' }}
            >
              <Play size={15} /> {isProcessing ? 'Verifying Guardrails...' : 'Dispatch Simulation'}
            </button>
          </form>

          {/* SIMULATION TRACE RESULT */}
          {lastResult && (
            <div 
              className="simulation-result-box"
              style={{
                marginTop: '18px',
                padding: '14px',
                borderRadius: '8px',
                background: lastResult.status === 'SENT' ? 'var(--sage-light, #f2f7f3)' : 'var(--rose-pale, #fcf0ef)',
                border: `1px solid ${lastResult.status === 'SENT' ? 'var(--sage-border, #d2e3d6)' : 'var(--rose-border, #f6d5d2)'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: lastResult.status === 'SENT' ? 'var(--sage-deep, #213a2c)' : 'var(--rose-deep, #873934)' }}>
                  Execution Result:
                </strong>
                <span className={`status-pill ${lastResult.status === 'SENT' ? 'pill-sent' : 'pill-suppressed'}`}>
                  {lastResult.status === 'SENT' ? 'SENT' : 'SUPPRESSED'}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', margin: '4px 0', color: 'var(--ink, #1a221d)' }}>
                <strong>Reason / Outcome:</strong> {lastResult.log?.reason || lastResult.action_taken}
              </p>
              {lastResult.message_text && (
                <div style={{ marginTop: '8px', padding: '10px 12px', background: '#fff', borderRadius: '6px', borderLeft: '3px solid var(--sage, #5b826b)', fontSize: '12px', color: 'var(--ink-soft, #324037)', fontStyle: 'italic' }}>
                  “{lastResult.message_text}”
                </div>
              )}
            </div>
          )}
        </section>

        {/* AUDIT LEDGER */}
        <section className="panel ledger-panel">
          <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>Recovery Audit Ledger</h2>
              <p style={{ fontSize: '12px', color: 'var(--muted, #666)', margin: '4px 0 0 0' }}>
                Audited event log with suppression reasons, timestamps, and message IDs.
              </p>
            </div>
            <span className="count-badge">
              {logs.length} events logged
            </span>
          </div>

          <div className="table-scroll">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Caller Phone</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Outcome</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Call ID</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Timestamp ({clinic.timezone.split('/')[1] || clinic.timezone})</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Suppression / Message Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--muted, #666)' }}>
                      No missed calls logged yet for {clinic.name}. Trigger a test scenario on the left to see live guardrail verification!
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.call_id || `${log.caller_phone}-${log.timestamp}`}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <PhoneMissed size={14} style={{ color: log.status === 'SENT' ? 'var(--sage, #5b826b)' : 'var(--rose, #b35952)' }} />
                          <span>{log.caller_phone}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`status-pill ${log.status === 'SENT' ? 'pill-sent' : 'pill-suppressed'}`}>
                          {log.status === 'SENT' ? 'SENT' : 'SUPPRESSED'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted, #666)' }}>
                        {log.call_id?.length > 18 ? `${log.call_id.slice(0, 18)}...` : log.call_id}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11.5px', color: 'var(--muted, #666)' }}>
                        {formatClinicTime(log.timestamp)}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--ink-soft, #324037)' }}>
                        {log.reason || (log.message_sent ? 'Compliant 0-second re-engagement sent' : 'Suppressed')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

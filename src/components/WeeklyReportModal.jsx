import React, { useEffect, useRef } from 'react';
import { X, FileText, ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { generateWeeklyReport } from '../core/weeklyReport.js';

export function WeeklyReportModal({ clinicId, onClose, isDemo = true }) {
  const report = generateWeeklyReport(clinicId);
  const m = report.metrics;
  const modalRef = useRef(null);

  // Handle Escape key close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
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
      aria-labelledby="weeklyReportModalTitle"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(22, 34, 27, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        ref={modalRef}
        className="modal-card"
        style={{
          background: 'var(--panel, #ffffff)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '16px',
          border: '1px solid var(--line, #e2e6e1)',
          padding: '24px',
          boxShadow: 'var(--shadow-lg, 0 16px 36px rgba(24, 34, 27, 0.12))'
        }}
      >
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line, #eee)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--sage-pale, #eaf3ed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sage, #5b826b)' }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 id="weeklyReportModalTitle" style={{ fontSize: '18px', margin: 0, fontWeight: 700, color: 'var(--ink, #1a221d)' }}>
                  Weekly Executive Telemetry Report
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isDemo ? 'var(--gold-pale, #fbf5e7)' : 'var(--sage-pale, #eaf3ed)',
                    color: isDemo ? 'var(--gold-deep, #8a6422)' : 'var(--sage-deep, #213a2c)',
                    border: `1px solid ${isDemo ? 'var(--gold-border, #efe1c2)' : 'var(--sage-border, #d2e3d6)'}`
                  }}
                >
                  {isDemo ? 'ESTIMATED / DEMO' : 'LIVE LEDGER'}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted, #67736b)' }}>
                Scheduled Automated Dispatch (Every Monday 08:00 AM)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="icon-button"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--muted, #666)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--muted, #555)', marginBottom: '16px' }}>
          <strong>Recipient:</strong> {report.recipient} &bull; <strong>Clinic:</strong> {report.clinic_name}
        </div>

        {/* REVENUE HIGHLIGHT */}
        <div style={{ background: 'var(--sage-light, #f2f7f3)', border: '1px solid var(--sage-border, #d2e3d6)', borderRadius: '12px', padding: '18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sage-deep, #213a2c)', fontWeight: 800 }}>
              {isDemo ? 'Modeled Attributed Revenue (Demo Simulation)' : 'Attributed Recovered Revenue (Live Reconciled)'}
            </span>
            {isDemo && (
              <span style={{ fontSize: '11px', color: 'var(--gold-deep, #8a6422)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> Synthetic Model
              </span>
            )}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--sage-deep, #213a2c)', margin: '4px 0' }}>
            {m.currency_symbol}{m.revenue_recovered.toLocaleString()}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sage, #5b826b)', marginLeft: '8px' }}>
              (+{m.revenue_growth_pct}% vs. previous week)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-soft, #324037)' }}>
            Generated across <strong>{m.booked} booked appointments</strong> ({m.showed} estimated completed visits at {m.currency_symbol}{m.average_treatment_value} ATV).
          </p>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted, #67736b)' }}>
            <strong>Data Source:</strong> {isDemo ? 'Configurable ATV benchmark modeled against 85% show-up rate.' : 'Direct CRM visit logs and verified provider calendar receipts.'}
          </div>
        </div>

        {/* METRICS TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '18px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--line, #eee)' }}>
              <td style={{ padding: '8px 0', color: 'var(--muted, #666)' }}>Outreach Contacted</td>
              <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>{m.contacted}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line, #eee)' }}>
              <td style={{ padding: '8px 0', color: 'var(--muted, #666)' }}>Patient Replies</td>
              <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>{m.replied} ({m.reply_rate_pct}%)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line, #eee)' }}>
              <td style={{ padding: '8px 0', color: 'var(--muted, #666)' }}>Avg Response Speed</td>
              <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>{m.first_reply_time_avg_sec} seconds</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line, #eee)' }}>
              <td style={{ padding: '8px 0', color: 'var(--muted, #666)' }}>Missed Calls Captured</td>
              <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>{m.missed_calls} total ({m.missed_call_messages_sent} texts sent)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line, #eee)' }}>
              <td style={{ padding: '8px 0', color: 'var(--muted, #666)' }}>Missed Call Conversions</td>
              <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right', color: 'var(--sage-deep, #213a2c)' }}>
                {m.missed_call_conversions} appointments ({m.currency_symbol}{m.missed_call_revenue.toLocaleString()})
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--line, #eee)' }}>
              <td style={{ padding: '8px 0', color: 'var(--muted, #666)' }}>Opt-Out Requests Honored</td>
              <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>{m.opt_outs}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: 'var(--muted, #666)' }}>Pending Staff Reviews</td>
              <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right', color: m.open_handoffs > 0 ? 'var(--rose, #b35952)' : 'var(--sage, #5b826b)' }}>
                {m.open_handoffs}
              </td>
            </tr>
          </tbody>
        </table>

        {/* OPERATIONAL HEALTH */}
        <div style={{ background: 'var(--canvas-warm, #fcfbf9)', border: '1px solid var(--line, #e2e6e1)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', marginBottom: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--ink, #1a221d)' }}>System Reliability &amp; Token Health:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sage, #5b826b)' }}>
            <ShieldCheck size={15} /> {report.operational_health.token_health_status} &bull; Uptime: {report.operational_health.webhook_uptime}
          </div>
        </div>

        {/* ATTRIBUTION ASSUMPTIONS */}
        <div style={{ fontSize: '11px', color: 'var(--muted, #777)', borderTop: '1px solid var(--line, #eee)', paddingTop: '10px' }}>
          <strong>Attribution Assumptions &amp; Modeling Notice:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
            {report.attribution_assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button 
            type="button"
            onClick={onClose}
            className="primary-button"
            style={{ minHeight: '38px', padding: '8px 18px' }}
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}

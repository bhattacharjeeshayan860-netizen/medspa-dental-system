import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, X, ChevronRight } from 'lucide-react';
import { evaluateClinicReadiness, READINESS_STATUSES } from '../core/readinessGate.js';

export function ReadinessGateBadge({ clinicId, isDemo = false, onOpenOnboarding }) {
  const [showModal, setShowModal] = useState(false);
  const readiness = evaluateClinicReadiness(clinicId);
  const displayReadiness = !isDemo && readiness.status === READINESS_STATUSES.DEMO_ONLY
    ? { ...readiness, label: 'Configuration required' }
    : readiness;

  const getIcon = () => {
    switch (readiness.status) {
      case READINESS_STATUSES.PRODUCTION_ENABLED:
        return <ShieldCheck size={13} style={{ color: '#2d6a4f' }} />;
      case READINESS_STATUSES.READY_FOR_PILOT:
        return <CheckCircle2 size={13} style={{ color: '#3b82f6' }} />;
      case READINESS_STATUSES.BLOCKED_CONFIGURATION_REQUIRED:
        return <AlertTriangle size={13} style={{ color: '#e15241' }} />;
      case READINESS_STATUSES.DEMO_ONLY:
      default:
        return <ShieldAlert size={13} style={{ color: '#d4af37' }} />;
    }
  };

  return (
    <>
      <button
        type="button"
        className="readiness-gate-badge-btn"
        onClick={() => setShowModal(true)}
        aria-label={`Readiness status: ${displayReadiness.label}. Click to review audit checklist.`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.85)',
          border: `1px solid ${readiness.color}`,
          borderRadius: '20px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#1a221d',
          cursor: 'pointer',
          letterSpacing: '0.02em',
          transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out',
          willChange: 'transform, opacity'
        }}
      >
        {getIcon()}
        <span>{displayReadiness.label}</span>
        <span style={{ fontSize: '10px', color: '#666', marginLeft: '2px' }}>
          ({readiness.passedCount}/{readiness.total})
        </span>
      </button>

      {/* DETAIL MODAL */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="readinessModalTitle"
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
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              border: '1px solid #e2e6e1',
              padding: '24px',
              boxShadow: '0 16px 36px rgba(24, 34, 27, 0.16)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: readiness.color, letterSpacing: '0.05em' }}>
                  Deployment &amp; Compliance Gate
                </span>
                <h3 id="readinessModalTitle" style={{ fontSize: '18px', margin: '4px 0 0', fontWeight: 800, color: '#1a221d' }}>
                  Practice OS Production Readiness Audit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close readiness audit"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#666' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#fcfbf9', border: '1px solid #e2e6e1', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Current Deployment State:</div>
                <strong style={{ fontSize: '14px', color: readiness.color }}>{displayReadiness.label}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Audit Pass Score:</div>
                <strong style={{ fontSize: '16px', color: '#1a221d' }}>{readiness.score}%</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {readiness.checklist.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: item.passed ? '#f7faf8' : '#fff9f8',
                    border: `1px solid ${item.passed ? '#d5e6da' : '#f0cfca'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.passed ? (
                      <CheckCircle2 size={15} style={{ color: '#2d6a4f', flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={15} style={{ color: '#e15241', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a221d' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{item.details}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: item.passed ? '#2d6a4f' : '#e15241' }}>
                    {item.passed ? 'PASSED' : item.blocker ? 'BLOCKER' : 'OPTIONAL'}
                  </span>
                </div>
              ))}
            </div>

            {readiness.blockers.length > 0 && (
              <div style={{ background: '#fff5f4', border: '1px solid #f2c2bd', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '12px', color: '#992b23' }}>
                <strong>{readiness.blockers.length} Active Blocker(s):</strong> Production execution is safely locked until all blockers are resolved via clinic configuration and n8n credential provisioning.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {onOpenOnboarding && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowModal(false);
                    onOpenOnboarding();
                  }}
                  style={{ minHeight: '36px', padding: '6px 16px', fontSize: '12px' }}
                >
                  Launch Onboarding Wizard
                </button>
              )}
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowModal(false)}
                style={{ minHeight: '36px', padding: '6px 18px', fontSize: '12px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

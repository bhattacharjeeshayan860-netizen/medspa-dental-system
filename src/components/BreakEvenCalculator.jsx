import React, { useEffect, useState, useMemo } from 'react';
import { Calculator, DollarSign, TrendingUp, Sparkles, HelpCircle } from 'lucide-react';
import { COMMERCIAL_PRICING_TIERS, getClinicConfig } from '../core/clinicRegistry.js';

export function BreakEvenCalculator({ clinicId = 'aurevia-beverly-hills' }) {
  const clinic = getClinicConfig(clinicId);
  const defaultMonthlyFee = COMMERCIAL_PRICING_TIERS[clinic.pricing_tier]?.monthly_fee;

  if (!Number.isFinite(defaultMonthlyFee)) {
    throw new Error(`Missing monthly fee for pricing tier "${clinic.pricing_tier}".`);
  }

  const [monthlyFee, setMonthlyFee] = useState(defaultMonthlyFee);
  const [atv, setAtv] = useState(clinic.average_treatment_value || 750);
  const [showRatePct, setShowRatePct] = useState(85); // 85% show rate
  const [projectedMonthlyBookings, setProjectedMonthlyBookings] = useState(8);

  useEffect(() => {
    setMonthlyFee(defaultMonthlyFee);
    setAtv(clinic.average_treatment_value || 750);
  }, [clinic.clinic_id, defaultMonthlyFee, clinic.average_treatment_value]);

  const {
    breakEvenAppointments,
    attendedProjected,
    projectedRevenue,
    netMonthlyProfit,
    annualRoi
  } = useMemo(() => {
    const showRate = showRatePct / 100;
    const effectiveRevenuePerBooking = atv * showRate;
    
    // Break-even calculation with safe zero division guard
    const breakEven = effectiveRevenuePerBooking > 0 
      ? Math.max(0, monthlyFee / effectiveRevenuePerBooking) 
      : 0;

    const attended = Math.round(projectedMonthlyBookings * showRate);
    const revenue = attended * atv;
    const netProfit = revenue - monthlyFee;
    const annual = netProfit * 12;

    return {
      breakEvenAppointments: breakEven,
      attendedProjected: attended,
      projectedRevenue: revenue,
      netMonthlyProfit: netProfit,
      annualRoi: annual
    };
  }, [monthlyFee, atv, showRatePct, projectedMonthlyBookings]);

  return (
    <div
      className="break-even-calculator-panel panel"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e6e1',
        borderRadius: '14px',
        padding: '22px',
        marginBottom: '24px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#8a6422', letterSpacing: '0.05em' }}>
            Unit Economics &amp; Pilot ROI Model
          </span>
          <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: '#1a221d', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calculator size={18} style={{ color: '#8a6422' }} /> Practice Break-Even &amp; Cash Flow Calculator
          </h3>
        </div>
        <span
          style={{
            fontSize: '11px',
            background: '#fbf5e7',
            border: '1px solid #efe1c2',
            color: '#8a6422',
            padding: '3px 8px',
            borderRadius: '6px',
            fontWeight: 600
          }}
        >
          Transparent Formula · Zero Fabricated Claims
        </span>
      </div>

      <div style={{ fontSize: '12px', color: '#555', marginBottom: '18px', lineHeight: 1.5 }}>
        Estimate how many additional attended appointments the practice needs per month to cover the <strong>${monthlyFee}/mo</strong> fee.
      </div>

      {/* INPUT CONTROLS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: '#fcfbf9', border: '1px solid #eee', borderRadius: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="input-monthly-fee" style={{ fontSize: '11px', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>
              Software Fee ($/mo)
            </label>
            <span style={{ fontSize: '9px', background: '#e0e7ff', color: '#3730a3', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>Plan default</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#888', fontWeight: 600 }}>$</span>
            <input
              id="input-monthly-fee"
              type="number"
              min="100"
              max="5000"
              step="50"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(Number(e.target.value) || 0)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', fontWeight: 700 }}
            />
          </div>
          <span style={{ fontSize: '10px', color: '#888', display: 'block', marginTop: '4px' }}>Default for {clinic.name}: ${defaultMonthlyFee}/mo</span>
        </div>

        <div style={{ background: '#fcfbf9', border: '1px solid #eee', borderRadius: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="input-atv" style={{ fontSize: '11px', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>
              Avg Treatment Value (ATV)
            </label>
            <span style={{ fontSize: '9px', background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>Clinic-provided</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#888', fontWeight: 600 }}>$</span>
            <input
              id="input-atv"
              type="number"
              min="50"
              max="10000"
              step="25"
              value={atv}
              onChange={(e) => setAtv(Number(e.target.value) || 0)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', fontWeight: 700 }}
            />
          </div>
          <span style={{ fontSize: '10px', color: '#888', display: 'block', marginTop: '4px' }}>User-provided clinic average</span>
        </div>

        <div style={{ background: '#fcfbf9', border: '1px solid #eee', borderRadius: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="input-show-rate" style={{ fontSize: '11px', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>
              Attended Show Rate (%)
            </label>
            <span style={{ fontSize: '9px', background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>Clinic-provided</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              id="input-show-rate"
              type="range"
              min="50"
              max="100"
              value={showRatePct}
              onChange={(e) => setShowRatePct(Number(e.target.value) || 0)}
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 700, fontSize: '14px', minWidth: '40px' }}>{showRatePct}%</span>
          </div>
          <span style={{ fontSize: '10px', color: '#888', display: 'block', marginTop: '4px' }}>Clinic historical attendance</span>
        </div>

        <div style={{ background: '#fcfbf9', border: '1px solid #eee', borderRadius: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="input-projected-bookings" style={{ fontSize: '11px', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>
              Projected Recalls / Mo
            </label>
            <span style={{ fontSize: '9px', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>Estimated</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              id="input-projected-bookings"
              type="number"
              min="1"
              max="100"
              value={projectedMonthlyBookings}
              onChange={(e) => setProjectedMonthlyBookings(Number(e.target.value) || 0)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', fontWeight: 700 }}
            />
          </div>
          <span style={{ fontSize: '10px', color: '#888', display: 'block', marginTop: '4px' }}>Target reactivation cohort</span>
        </div>
      </div>

      {/* RESULT METRICS CALLOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', background: '#f2f7f3', border: '1px solid #d2e3d6', borderRadius: '12px', padding: '16px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#213a2c' }}>
              Break-Even Requirement
            </span>
            <span style={{ fontSize: '9px', background: '#e0e7ff', color: '#3730a3', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>Measured</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#213a2c', margin: '4px 0' }}>
            {breakEvenAppointments.toFixed(2)} visits
          </div>
          <div style={{ fontSize: '11px', color: '#4a6b56' }}>
            Just <strong>{Math.ceil(breakEvenAppointments)} attended bookings/mo</strong> covers the entire ${monthlyFee}/mo investment.
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#213a2c' }}>
              Projected Net Cash Flow
            </span>
            <span style={{ fontSize: '9px', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>Estimated</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: netMonthlyProfit >= 0 ? '#1b7340' : '#b3261e', margin: '4px 0' }}>
            {netMonthlyProfit >= 0 ? `+$${netMonthlyProfit.toLocaleString()}` : `-$${Math.abs(netMonthlyProfit).toLocaleString()}`}
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#666' }}> / mo</span>
          </div>
          <div style={{ fontSize: '11px', color: '#4a6b56' }}>
            From {attendedProjected} attended appointments (${projectedRevenue.toLocaleString()} gross revenue).
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#213a2c' }}>
              Estimated Annual ROI
            </span>
            <span style={{ fontSize: '9px', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>Estimated</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: annualRoi >= 0 ? '#1b7340' : '#b3261e', margin: '4px 0' }}>
            {annualRoi >= 0 ? `+$${annualRoi.toLocaleString()}` : `-$${Math.abs(annualRoi).toLocaleString()}`}
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#666' }}> / yr</span>
          </div>
          <div style={{ fontSize: '11px', color: '#4a6b56' }}>
            Annualized net practice impact.
          </div>
        </div>
      </div>

      <div style={{ marginTop: '12px', fontSize: '11px', color: '#777', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <HelpCircle size={13} />
        Formula: <code>break_even = monthly_fee / (atv * show_rate)</code>. Projections are calculated models based on owner inputs, not guaranteed outcomes.
      </div>
    </div>
  );
}


import React from 'react';
import { Building2 } from 'lucide-react';
import { getAllClinics, getClinicConfig } from '../core/clinicRegistry.js';

export function ClinicSelector({ selectedClinicId, onSelectClinic }) {
  const clinics = getAllClinics();
  const current = getClinicConfig(selectedClinicId);

  return (
    <div className="clinic-selector-wrap">
      <Building2 size={15} className="clinic-selector-icon" />
      <select 
        value={selectedClinicId} 
        onChange={(e) => onSelectClinic(e.target.value)}
        className="clinic-selector-select"
        aria-label="Select Clinic Configuration"
      >
        {clinics.map((c) => (
          <option key={c.clinic_id} value={c.clinic_id}>
            {c.name} ({c.type === 'dental' ? 'Dental' : 'Med Spa'})
          </option>
        ))}
      </select>
      <span
        className="clinic-selector-badge"
        title={`Average Treatment Value: ${current.currency_symbol}${current.average_treatment_value}`}
      >
        ATV: {current.currency_symbol}{current.average_treatment_value}
      </span>
    </div>
  );
}

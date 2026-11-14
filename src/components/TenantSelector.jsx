import React from 'react';
import { Building2, Shield, MapPin } from 'lucide-react';
import {
  ORGANIZATIONS,
  DEMO_USERS,
  getActiveUser,
  getActiveClinicId,
  getActiveOrganization
} from '../core/tenantContext.js';
import { listSupportedClinics } from '../core/clinicRegistry.js';

export default function TenantSelector({
  activeClinicId,
  activeUser,
  onClinicChange,
  onUserChange
}) {
  const clinics = listSupportedClinics();
  const currentOrg = getActiveOrganization();

  const roleLabels = {
    PLATFORM_ADMIN: 'Platform Admin',
    CLINIC_OWNER: 'Clinic Owner',
    PRACTICE_MANAGER: 'Practice Manager',
    STAFF: 'Clinical Staff',
    REPORTING: 'Reporting Only'
  };

  return (
    <div className="tenant-selector">
      <div className="tenant-org">
        <Building2 size={15} />
        <span title={currentOrg.name}>{currentOrg.name}</span>
      </div>
      <label className="tenant-control">
        <MapPin size={14} />
        <select
          value={activeClinicId}
          onChange={(e) => onClinicChange(e.target.value)}
          className="tenant-select"
          aria-label="Select Clinic Location"
          title={clinics.find((clinic) => clinic.id === activeClinicId)?.name || 'Select clinic location'}
        >
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id} title={`${clinic.name} (${clinic.specialty})`}>
              {clinic.name.includes(' — ') ? clinic.name.split(' — ').slice(1).join(' — ') : clinic.name}
            </option>
          ))}
        </select>
      </label>
      <label className="tenant-control">
        <Shield size={14} />
        <select
          value={activeUser.id}
          onChange={(e) => onUserChange(e.target.value)}
          className="tenant-select tenant-user-select"
          aria-label="Select User Role"
          title={`${activeUser.name} (${roleLabels[activeUser.role] || activeUser.role})`}
        >
          {DEMO_USERS.map((user) => (
            <option key={user.id} value={user.id} title={`${user.name} (${roleLabels[user.role]})`}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

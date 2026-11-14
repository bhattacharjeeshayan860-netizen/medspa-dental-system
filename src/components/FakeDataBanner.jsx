import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { isFakeDataModeActive, setFakeDataMode } from '../core/fakeDataMode.js';

export function FakeDataBanner({ onToggle, isActive }) {
  const active = isActive !== undefined ? isActive : isFakeDataModeActive();

  if (!active) return null;

  return (
    <aside
      className="fake-data-banner"
      role="status"
      aria-live="polite"
    >
      <div className="fake-data-copy">
        <span className="fake-data-label">
          <ShieldAlert size={12} /> Fake-Data Mode Active
        </span>
        <span className="fake-data-message">
          Safe preview only. Messages are simulated and no patient data is sent.
        </span>
      </div>
      <span className="fake-data-safe">Sandbox</span>
    </aside>
  );
}

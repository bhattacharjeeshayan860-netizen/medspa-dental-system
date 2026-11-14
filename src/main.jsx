import { Component, StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import {
  Activity, AlertCircle, AlertTriangle, ArrowUpRight, Award, Bot, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardList, Clock3, FileText, Filter, Globe, HeartPulse, Info, LayoutDashboard,
  Menu, MessageCircle, Moon, MoreHorizontal, PanelLeftClose, Plus, RefreshCw, Search, Send,
  Settings, ShieldCheck, Sparkles, Sun, UserRound, Users, X, Zap
} from 'lucide-react';
import './styles.css';
import { initializeSecurity } from './utils/security';
import { api, apiConfig, setApiDemoMode } from './api/client.js';
import { PhoneMissed } from 'lucide-react';
import TenantSelector from './components/TenantSelector';
import ProviderStatusBadge from './components/ProviderStatusBadge';
import { ClinicSelector } from './components/ClinicSelector';
import { MissedCallsPage } from './components/MissedCallsPage';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { SalesCapabilitiesModal } from './components/SalesCapabilitiesModal';
import { PatientScanExperience } from './components/PatientScanExperience';
import { ReadinessGateBadge } from './components/ReadinessGateBadge';
import { BreakEvenCalculator } from './components/BreakEvenCalculator';
import { ClinicOnboardingModal } from './components/ClinicOnboardingModal';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { CompactBrandMark } from './components/PremiumBrandMark';
import { getClinicConfig, updateClinicConfig } from './core/clinicRegistry';
import { getActiveUser, setActiveUser, setActiveClinicId } from './core/tenantContext';
import { getTenantPatients, getTenantCampaigns, getTenantHumanCases } from './api/mockDataStore';

// Initialize client-side security hardening
if (typeof window !== 'undefined') {
  initializeSecurity({
    injectCSP: true,
    cspOptions: { strict: process.env.NODE_ENV !== 'development' },
    enablePHIScanning: process.env.NODE_ENV === 'development'
  });
}

// Client runtime manifest of verified exported core workflows
if (typeof window !== 'undefined') {
  window.__AUREVIA_WORKFLOWS_MANIFEST__ = [
    'AI Reactivation — Incoming Conversation.json',
    'AI Reactivation — Outgoing Conversation.json',
    'missed_call_recovery_workflow.json',
    'weekly_report_workflow.json',
    'error_trigger_workflow.json',
    'PATCH patients.json',
    'PATCH handoff status.json'
  ];
}

const patients = [
  { id: 'P0001', name: 'Synthetic Client 001', initials: 'SC', phone: '+1 555 010 0001', treatment: 'Demo Aesthetic Service A', visit: 'Feb 18, 2026', days: 224, state: 'BOOKING_SENT', intent: 'BOOKING_INTENT', booking: 'NOT_BOOKED', eligible: true, tone: 'sage' },
  { id: 'P0002', name: 'Synthetic Client 002', initials: 'SC', phone: '+1 555 010 0002', treatment: 'Demo Aesthetic Service B', visit: 'Jun 12, 2026', days: 110, state: 'OFFER_PRESENTED', intent: 'ASKING_ABOUT_OFFER', booking: 'NOT_BOOKED', eligible: true, tone: 'clay' },
  { id: 'P0003', name: 'Synthetic Client 003', initials: 'SC', phone: '+1 555 010 0003', treatment: 'Demo Aesthetic Service C', visit: 'Jul 04, 2026', days: 88, state: 'INTERESTED', intent: 'INTERESTED', booking: 'NOT_BOOKED', eligible: true, tone: 'blue' },
  { id: 'P0004', name: 'Synthetic Client 004', initials: 'SC', phone: '+1 555 010 0004', treatment: 'Demo Aesthetic Service D', visit: 'Jan 15, 2026', days: 258, state: 'HUMAN_REQUIRED', intent: 'HUMAN_REQUIRED', booking: 'NOT_BOOKED', eligible: true, tone: 'rose' },
  { id: 'P0005', name: 'Synthetic Client 005', initials: 'SC', phone: '+1 555 010 0005', treatment: 'Demo Wellness Service A', visit: 'Mar 03, 2026', days: 211, state: 'HUMAN_REQUIRED', intent: 'HUMAN_REQUIRED', booking: 'NOT_BOOKED', eligible: true, tone: 'gold' },
  { id: 'P0006', name: 'Synthetic Client 006', initials: 'SC', phone: '+1 555 010 0006', treatment: 'Demo Aesthetic Service A', visit: 'Aug 02, 2026', days: 59, state: 'WAITING_FOR_REPLY', intent: 'OTHER', booking: 'NOT_BOOKED', eligible: false, tone: 'lilac' },
  { id: 'P0007', name: 'Synthetic Client 007', initials: 'SC', phone: '+1 555 010 0007', treatment: 'Demo Aesthetic Service E', visit: 'May 22, 2026', days: 131, state: 'BOOKED', intent: 'BOOKING_INTENT', booking: 'BOOKED', eligible: true, tone: 'green' },
  { id: 'P0008', name: 'Synthetic Client 008', initials: 'SC', phone: '+1 555 010 0008', treatment: 'Demo Wellness Service B', visit: 'Apr 18, 2026', days: 165, state: 'FOLLOW_UP_LATER', intent: 'FOLLOW_UP_LATER', booking: 'NOT_BOOKED', eligible: true, tone: 'slate' },
  { id: 'P0009', name: 'Synthetic Client 009', initials: 'SC', phone: '+1 555 010 0009', treatment: 'Demo Aesthetic Service B', visit: 'Aug 21, 2026', days: 40, state: 'NOT_INTERESTED', intent: 'NOT_INTERESTED', booking: 'NOT_BOOKED', eligible: false, tone: 'gray' },
  { id: 'P0010', name: 'Synthetic Client 010', initials: 'SC', phone: '+1 555 010 0010', treatment: 'Demo Aesthetic Service F', visit: 'Feb 28, 2026', days: 214, state: 'OUTREACH_SENT', intent: 'OTHER', booking: 'NOT_BOOKED', eligible: true, tone: 'teal' },
  { id: 'P0011', name: 'Synthetic Client 011', initials: 'SC', phone: '+1 555 010 0011', treatment: 'Demo Aesthetic Service G', visit: 'Mar 28, 2026', days: 186, state: 'OFFER_PRESENTED', intent: 'ASKING_PRICE', booking: 'NOT_BOOKED', eligible: true, tone: 'peach' },
  { id: 'P0012', name: 'Synthetic Client 012', initials: 'SC', phone: '+1 555 010 0012', treatment: 'Demo Wellness Service C', visit: 'Jun 29, 2026', days: 93, state: 'NEW', intent: 'OTHER', booking: 'NOT_BOOKED', eligible: true, tone: 'navy' },
  { id: 'P0013', name: 'Synthetic Client 013', initials: 'SC', phone: '+1 555 010 0013', treatment: 'Demo Aesthetic Service A', visit: 'Jan 08, 2026', days: 265, state: 'BOOKING_SENT', intent: 'BOOKING_INTENT', booking: 'NOT_BOOKED', eligible: true, tone: 'mint' },
  { id: 'P0014', name: 'Synthetic Client 014', initials: 'SC', phone: '+1 555 010 0014', treatment: 'Demo Wellness Service D', visit: 'Jul 16, 2026', days: 76, state: 'INTERESTED', intent: 'ASKING_ABOUT_TREATMENT', booking: 'NOT_BOOKED', eligible: true, tone: 'brown' },
  { id: 'P0015', name: 'Synthetic Client 015', initials: 'SC', phone: '+1 555 010 0015', treatment: 'Demo Aesthetic Service E', visit: 'Apr 02, 2026', days: 181, state: 'NOT_INTERESTED', intent: 'NOT_INTERESTED', booking: 'NOT_BOOKED', eligible: false, tone: 'pink' }
];

const conversations = [
  { id: 'CONV0001', patientId: 'P0001', last: 'Yes, send me the booking link', intent: 'BOOKING_INTENT', state: 'BOOKING_SENT', activity: '2 min ago', response: '1.5 sec' },
  { id: 'CONV0002', patientId: 'P0002', last: "What's included in the demo package?", intent: 'ASKING_ABOUT_OFFER', state: 'OFFER_PRESENTED', activity: '8 min ago', response: '1.2 sec' },
  { id: 'CONV0003', patientId: 'P0003', last: "I'm interested in available times", intent: 'INTERESTED', state: 'INTERESTED', activity: '12 min ago', response: '1.8 sec' },
  { id: 'CONV0004', patientId: 'P0004', last: 'Demo procedural aftercare inquiry regarding protocol...', intent: 'HUMAN_REQUIRED', state: 'HUMAN_REQUIRED', activity: '20 min ago', response: '—' },
  { id: 'CONV0005', patientId: 'P0005', last: "Demo question regarding appointment schedule.", intent: 'HUMAN_REQUIRED', state: 'HUMAN_REQUIRED', activity: '34 min ago', response: '—' }
];

const offers = [
  { id: 'OF001', name: 'Returning Client Demo Package A', treatment: 'Demo Aesthetic Service A', description: 'Seasonal demo returning client package', price: '$79', window: 'Sep 1 - Oct 31, 2026', active: true },
  { id: 'OF002', name: 'Reset & Restore Demo Package B', treatment: 'Demo Wellness Service A', description: 'Focused reset package for returning clients', price: '$99', window: 'Sep 15 - Nov 30, 2026', active: true },
  { id: 'OF003', name: 'Welcome Back Demo Package C', treatment: 'Demo Aesthetic Service G', description: 'Brightening ritual demo package', price: '$89', window: 'Aug 1 - Sep 30, 2026', active: false }
];

const humanCases = [
  { id: 'HQ001', patientId: 'P0004', reason: 'Demo procedural question', message: 'Demo inquiry regarding service suitability flagged for staff review.', created: 'Today, 7:20 PM', status: 'OPEN', assigned: 'Unassigned' },
  { id: 'HQ002', patientId: 'P0005', reason: 'Demo schedule question', message: 'Demo feedback regarding appointment timing.', created: 'Today, 6:52 PM', status: 'IN_PROGRESS', assigned: 'Staff Desk' },
  { id: 'HQ003', patientId: 'P0011', reason: 'Demo service inquiry', message: 'Demo request for package clarification.', created: 'Today, 5:11 PM', status: 'OPEN', assigned: 'Unassigned' },
  { id: 'HQ004', patientId: 'P0008', reason: 'Demo booking adjustment', message: 'Demo inquiry regarding previous consultation times.', created: 'Yesterday, 4:15 PM', status: 'RESOLVED', assigned: 'Staff Desk' },
  { id: 'HQ005', patientId: 'P0006', reason: 'Demo protocol inquiry', message: 'Demo protocol suitability question.', created: 'Yesterday, 1:40 PM', status: 'RESOLVED', assigned: 'Staff Desk' }
];

function formatIntentLabel(val) {
  if (!val) return '—';
  const str = String(val).trim().toUpperCase();
  const map = {
    'BOOKING_INTENT': 'Booking interest',
    'HUMAN_REQUIRED': 'Staff review',
    'ASKING_ABOUT_OFFER': 'Offer question',
    'OFFER_PRESENTED': 'Offer shared',
    'ASKING_PRICE': 'Pricing enquiry',
    'ASKING_ABOUT_TREATMENT': 'Treatment question',
    'INTERESTED': 'Interested',
    'FOLLOW_UP_LATER': 'Follow up later',
    'NOT_INTERESTED': 'Not interested',
    'OPTED_OUT': 'Opted out',
    'BOOKING_SENT': 'Booking link sent',
    'BOOKED': 'Confirmed booked',
    'NEW': 'New record',
    'OUTREACH_SENT': 'Outreach sent',
    'WAITING_FOR_REPLY': 'Awaiting reply',
    'OTHER': 'General inquiry'
  };
  return map[str] || str.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

function normalizeHandoffRow(item, index = 0) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id || item.queue_id || item.handoff_id || 'HQ-' + (index + 1);
  const patientId = item.patient_id || item.patientId || item.client_id || '';
  const reason = item.reason || item.issue || item.category || 'Staff review required';
  const message = item.last_message || item.message || item.text || 'No message provided';
  const rawStatus = String(item.status || 'OPEN').trim().toUpperCase();
  const status = rawStatus === 'RESOLVED' ? 'RESOLVED' : rawStatus === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'OPEN';
  const assigned = item.assigned_to || item.assigned || item.owner || 'Unassigned';
  const created = item.created_at || item.created || item.timestamp || 'Recent';
  const phone = item.phone || item.phone_number || '';
  const name = item.name || item.patient_name || item.client_name || '';
  const intent = item.intent || item.last_intent || '';

  return {
    id,
    patientId,
    reason,
    message,
    status,
    assigned,
    created,
    phone,
    name,
    intent
  };
}

function normalizeHandoffs(payload) {
  if (!payload) return [];
  if (payload.error) return [];
  let candidate = [];
  if (Array.isArray(payload)) {
    candidate = payload;
  } else if (payload && typeof payload === 'object') {
    for (const key of ['data', 'items', 'handoffs', 'rows', 'results']) {
      if (Array.isArray(payload[key])) {
        candidate = payload[key];
        break;
      }
    }
    if (!candidate.length && (payload.id || payload.queue_id || payload.handoff_id || payload.patient_id)) {
      candidate = [payload];
    }
  }
  return candidate.map(normalizeHandoffRow).filter(Boolean);
}

const TONES = ['sage', 'clay', 'blue', 'gold', 'rose', 'lilac', 'slate', 'teal', 'mint', 'navy', 'peach', 'brown'];
function getToneForId(id) {
  if (!id) return 'sage';
  const num = parseInt(String(id).replace(/\D/g, ''), 10) || 0;
  return TONES[num % TONES.length];
}

function getPatient(id) {
  const found = patients.find((patient) => patient.id === id);
  if (found) return found;
  return { id: id || 'P0001', name: 'Patient ' + (id || ''), initials: 'P', phone: '—', treatment: 'Consultation', visit: 'Recent', days: 60, state: 'NEW', intent: 'OTHER', booking: 'NOT_BOOKED', eligible: false, tone: 'sage' };
}
function StatusBadge({ children, kind = 'neutral' }) { return <span className={`badge badge-${kind.toLowerCase().replaceAll('_', '-')}`}>{children}</span>; }
function Avatar({ patient, size = '' }) {
  const tone = patient?.tone || (patient?.id || patient?.patient_id ? getToneForId(patient.id || patient.patient_id) : 'sage');
  const initials = patient?.initials || (patient?.name ? patient.name.slice(0, 2).toUpperCase() : '?');
  return <span className={`avatar avatar-${tone} ${size}`}>{initials}</span>;
}
function InfoTip({ title, text }) {
  const [open, setOpen] = useState(false);
  return <span className="info-wrap"><button className="icon-button info-button" aria-label={`About ${title}`} onClick={() => setOpen(!open)}><Info size={14} /></button>{open && <span className="info-popover"><strong>{title}</strong><span>{text}</span></span>}</span>;
}

function PremiumLogoMark() {
  return (
    <div className="brand-emblem">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3L14.5 8.5L20.5 9.5L16 14L17 20L12 17L7 20L8 14L3.5 9.5L9.5 8.5L12 3Z" stroke="url(#goldGradient)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="2.5" fill="#e2c98a" />
        <defs>
          <linearGradient id="goldGradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f3dfad" />
            <stop offset="0.5" stopColor="#d4af37" />
            <stop offset="1" stopColor="#96722d" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function App() {
  const location = useLocation();
  const [selectedClinicId, setSelectedClinicId] = useState('aurevia-beverly-hills');
  const [activeUserState, setActiveUserState] = useState(() => getActiveUser());
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPatientLounge, setShowPatientLounge] = useState(false);
  const [page, setPage] = useState(() => {
    const routePage = { '/pricing': 'Pricing', '/features': 'Features', '/demo': 'Overview' }[window.location.pathname];
    if (routePage) return routePage;
    const hash = window.location.hash.replace('#', '').replace(/%20/g, ' ');
    return hash || 'Overview';
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [queueCases, setQueueCases] = useState(apiConfig.demoMode ? humanCases : []);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [connection, setConnection] = useState({ status: apiConfig.demoMode ? 'demo' : 'loading', error: '' });
  const [isPreviewMode, setIsPreviewMode] = useState(apiConfig.demoMode);

  const [theme, setTheme] = useState(() => localStorage.getItem('aurevia_theme') || 'light');

  useEffect(() => {
    const routePage = { '/pricing': 'Pricing', '/features': 'Features', '/demo': 'Overview' }[location.pathname];
    if (routePage) setPage(routePage);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aurevia_theme', theme);
  }, [theme]);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const isMarketingPage = ['Landing', 'Pricing', 'Features'].includes(page);

  useEffect(() => {
    if (isPreviewMode) {
      setConnection({ status: 'demo', error: '' });
      setQueueCases(humanCases);
      return;
    }

    let active = true;
    setConnection({ status: 'loading', error: '' });
    api.getDashboard()
      .then(() => {
        if (active) setConnection({ status: 'connected', error: '' });
      })
      .catch((error) => {
        if (active) setConnection({ status: 'error', error: error.message });
      });
    api.getHumanHandoffs()
      .then((payload) => {
        if (active) setQueueCases(normalizeHandoffs(payload));
      })
      .catch((error) => {
        console.error('[Aurevia] Unable to load staff queue count:', error);
        if (active) setQueueCases([]);
      });
    return () => { active = false; };
  }, [isPreviewMode]);

  const openPatient = useCallback((id) => {
    setSelectedPatient(id);
    setSelectedCase(null);
    setPage('Clients');
  }, []);

  const openConversation = useCallback((patientId) => {
    if (patientId) {
      sessionStorage.setItem('aurevia.selectedConversationPatient', String(patientId));
    }
    setSelectedPatient(null);
    setSelectedCase(null);
    setPage('Conversations');
    setMobileNav(false);
  }, []);

  const nav = (next) => { setSelectedPatient(null); setSelectedCase(null); setPage(next); setMobileNav(false); };
  const updateDataMode = (liveEnabled) => {
    const nextPreviewMode = !liveEnabled;
    if (nextPreviewMode === apiConfig.demoMode) return;

    if (liveEnabled) {
      if (!apiConfig.canEnableLiveMode) {
        notify('Live data needs an n8n endpoint and authentication or approved public webhooks.');
        return;
      }
      if (!window.confirm('Switch to live data? The workspace will load records from your configured clinic systems.')) return;
    }

    try {
      setApiDemoMode(nextPreviewMode);
      setIsPreviewMode(nextPreviewMode);
      setSelectedPatient(null);
      setSelectedCase(null);
      setPage('Overview');
      notify(nextPreviewMode ? 'Preview data enabled. Live requests are paused.' : 'Live data enabled. Loading clinic records...');
    } catch (error) {
      notify(`Unable to change data mode: ${error.message}`);
    }
  };

  const systemStateText = isPreviewMode
    ? 'Synthetic preview'
    : connection.status === 'connected'
      ? 'Live data connected'
      : connection.status === 'error'
        ? 'Live connection unavailable'
        : 'Connecting to live data';

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <CompactBrandMark size={36} />
        <div className="brand-text">
          <strong>AUREVIA PRACTICE OS</strong>
          <span>CLIENT GROWTH &amp; CARE OPERATIONS</span>
        </div>
        <button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><X size={18} /></button>
      </div>
      <nav className="main-nav">
        {[
          ['Overview', LayoutDashboard], ['Clients', Users], ['Conversations', MessageCircle], ['Human Queue', HeartPulse], ['Missed Calls', PhoneMissed], ['Patient Lounge', Sparkles], ['Offers', ClipboardList], ['Campaigns', Zap], ['Settings', Settings]
        ].map(([label, Icon]) => <button key={label} className={page === label ? 'nav-item active' : 'nav-item'} onClick={() => nav(label)}><Icon size={17} /><span>{label}</span>{label === 'Human Queue' && <span className="nav-count">{queueCases.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS').length}</span>}</button>)}
        <div className="nav-divider" />
        {[
          ['Landing', Globe], ['Pricing', Award], ['Features', Zap]
        ].map(([label, Icon]) => <button key={label} className={page === label ? 'nav-item active' : 'nav-item'} onClick={() => nav(label)}><Icon size={17} /><span>{label}</span></button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="system-status" title={connection.error || systemStateText}>
          <span className={`system-status-dot ${isPreviewMode ? 'is-preview' : connection.status === 'connected' ? 'is-connected' : connection.status === 'error' ? 'is-error' : 'is-connecting'}`} />
          <div>
            <span>System State</span>
            <strong>{systemStateText}</strong>
          </div>
        </div>
        <div className="user-chip">
          <span className="user-avatar">{activeUserState.role === 'CLINIC_OWNER' ? 'CO' : activeUserState.role === 'PRACTICE_MANAGER' ? 'PM' : activeUserState.role === 'STAFF' ? 'ST' : 'PA'}</span>
          <div>
            <strong>{activeUserState.name}</strong>
            <span>{activeUserState.role.replace(/_/g, ' ')}</span>
          </div>
          <MoreHorizontal size={16} />
        </div>
      </div>
    </aside>
    {mobileNav && <button className="sidebar-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
    <main className="main-content">
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
        <div className="breadcrumb">
          <CompactBrandMark size={28} className="topbar-brand-mark" />
          <span className="breadcrumb-brand">Aurevia Practice OS</span>
          <span className="slash">/</span>
          <strong>{page}</strong>
        </div>
        <div className="topbar-actions">
          <TenantSelector
            activeClinicId={selectedClinicId}
            activeUser={activeUserState}
            onClinicChange={(id) => {
              setSelectedClinicId(id);
              setActiveClinicId(id);
            }}
            onUserChange={(uid) => {
              const u = setActiveUser(uid);
              setActiveUserState({ ...u });
              setSelectedClinicId(u.clinicId);
              setActiveClinicId(u.clinicId);
            }}
          />
          <details className="topbar-more">
            <summary className="topbar-more-trigger" aria-label="More workspace controls" title="More workspace controls">
              <MoreHorizontal size={19} />
            </summary>
            <div className="topbar-more-panel">
              <span className="topbar-more-title">Workspace controls</span>
              <label className="data-mode-control">
                <span className="data-mode-copy">
                  <strong>Live data</strong>
                  <small>{isPreviewMode ? 'Use configured clinic records' : 'Use connected clinic records'}</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Enable live data"
                  checked={!isPreviewMode}
                  disabled={isPreviewMode && !apiConfig.canEnableLiveMode}
                  onChange={(event) => updateDataMode(event.target.checked)}
                />
                <span className="data-mode-switch" aria-hidden="true" />
              </label>
              <p className="data-mode-status">
                {isPreviewMode
                  ? apiConfig.canEnableLiveMode
                    ? 'Preview records only. No live clinic data is loaded.'
                    : 'Configure an n8n endpoint and access method to enable live data.'
                  : connection.status === 'connected'
                    ? 'Connected to the live data source.'
                    : connection.status === 'error'
                      ? 'Live data is unavailable. Check the connection in Settings.'
                      : 'Connecting to the configured live data source.'}
              </p>
              <div className="topbar-more-divider" />
              <ProviderStatusBadge clinicId={selectedClinicId} isDemo={isPreviewMode} />
              <ReadinessGateBadge clinicId={selectedClinicId} isDemo={isPreviewMode} onOpenOnboarding={() => setShowOnboarding(true)} />
              <button className="topbar-more-action" onClick={() => setShowPatientLounge(true)}>
                <Sparkles size={15} /> Open Scan Experience
              </button>
              <button className="topbar-more-action" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
              </button>
            </div>
          </details>
        </div>
      </header>
      <div className={isMarketingPage ? 'page-wrap marketing-wrap' : 'page-wrap workspace-pages'}>
        {apiConfig.demoMode && <div className="workspace-banner"><Sparkles size={16} /><strong>WORKSPACE PREVIEW</strong><span>Explore the complete practice workflow with a ready-to-use patient dataset.</span></div>}
        {!apiConfig.demoMode && !isMarketingPage && connection.status === 'loading' && <div className="api-banner api-banner-loading"><Activity size={15} /><span>Connecting to n8n dashboard endpoint...</span></div>}
        {!apiConfig.demoMode && !isMarketingPage && connection.status === 'error' && <div className="api-banner api-banner-error api-status-quiet"><X size={15} /><span>Live data is unavailable.</span><button className="text-button" onClick={() => window.location.reload()}>Retry</button></div>}
        {apiConfig.demoMode ? <>
          {page === 'Overview' && <Overview clinicId={selectedClinicId} openPatient={openPatient} openConversation={openConversation} onNavigate={nav} notify={notify} queueCases={queueCases} onOpenWeeklyReport={() => setShowWeeklyReport(true)} />}
          {page === 'Missed Calls' && <MissedCallsPage clinicId={selectedClinicId} notify={notify} />}
          {page === 'Patient Lounge' && <PatientScanExperience isModal={false} />}
          {page === 'Clients' && <Clients search={search} setSearch={setSearch} openPatient={openPatient} openConversation={openConversation} selectedPatient={selectedPatient} notify={notify} />}
          {page === 'Conversations' && <Conversations openPatient={openPatient} openConversation={openConversation} setSelectedCase={setSelectedCase} notify={notify} />}
          {page === 'Human Queue' && <HumanQueue cases={queueCases} setCases={setQueueCases} selectedCase={selectedCase} setSelectedCase={setSelectedCase} notify={notify} />}
          {page === 'Offers' && <Offers notify={notify} />}
          {page === 'Campaigns' && <Campaigns notify={notify} />}
          {page === 'Settings' && <SettingsPage notify={notify} />}
          {page === 'Landing' && <LandingPage />}
          {page === 'Pricing' && <PricingPage />}
          {page === 'Features' && <FeaturesPage />}
        </> : page === 'Campaigns' ? <Campaigns notify={notify} /> : page === 'Settings' ? <LiveSettings notify={notify} /> : page === 'Missed Calls' ? <MissedCallsPage clinicId={selectedClinicId} notify={notify} /> : page === 'Landing' ? <LandingPage /> : page === 'Pricing' ? <PricingPage /> : page === 'Features' ? <FeaturesPage /> : <LiveWorkspace page={page} selectedClinicId={selectedClinicId} selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient} selectedCase={selectedCase} setSelectedCase={setSelectedCase} openPatient={openPatient} openConversation={openConversation} setPage={setPage} notify={notify} onOpenWeeklyReport={() => setShowWeeklyReport(true)} />}
      </div>
    </main>
    {toast && <div className="toast"><Check size={16} />{toast}</div>}
    {showWeeklyReport && <WeeklyReportModal clinicId={selectedClinicId} isDemo={apiConfig.demoMode} onClose={() => setShowWeeklyReport(false)} />}
    {showSalesModal && <SalesCapabilitiesModal onClose={() => setShowSalesModal(false)} />}
    {showOnboarding && <ClinicOnboardingModal clinicId={selectedClinicId} onClose={() => setShowOnboarding(false)} onSave={(data) => { updateClinicConfig(selectedClinicId, data); notify('Practice configuration saved'); }} />}
    {showPatientLounge && <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowPatientLounge(false); }} role="dialog" aria-modal="true" aria-label="Patient Scan Experience Modal"><PatientScanExperience onClose={() => setShowPatientLounge(false)} isModal={true} /></div>}
  </div>;
}

class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="runtime-error"><section className="panel"><X size={24} /><span className="eyebrow">Application error</span><h1>The workspace could not render</h1><p>{this.state.error.message || 'Unexpected frontend error.'}</p><button className="primary-button" onClick={() => window.location.reload()}>Reload workspace</button></section></main>;
  }
}

function LiveWorkspaceGate({ connection }) { return <section className="live-gate panel"><div className="live-gate-icon"><Activity size={22} /></div><span className="eyebrow">Live data required</span><h1>{connection.status === 'loading' ? 'Connecting to n8n' : 'Connect the control plane'}</h1><p>{connection.status === 'loading' ? 'The dashboard is waiting for the live data endpoint.' : 'Sample records are hidden because live mode is active. Create the n8n dashboard and page endpoints, then retry this workspace.'}</p><div className="live-gate-grid"><div><strong>Database</strong><span>Google Sheets through n8n</span></div><div><strong>Automation</strong><span>n8n webhook layer</span></div><div><strong>Secrets</strong><span>Never exposed in React</span></div></div><button className="primary-button" onClick={() => window.location.reload()}><Activity size={15} /> Retry connection</button></section>; }
function PageHeading({ eyebrow, title, children }) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{children}</div>; }
function StatCard({ icon: Icon, label, value, note, trend, tone = 'sage', info }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-label">{label}{info && <InfoTip title={label} text={info} />}</div><strong className="stat-value">{value}</strong><div className="stat-note">{trend && <span className="trend">{trend}</span>}{note}</div></div>; }

function Overview({ clinicId, openPatient, openConversation, onNavigate, notify, queueCases, onOpenWeeklyReport }) {
  const [simulating, setSimulating] = useState(false);

  const simulateLead = () => {
    setSimulating(true);
    notify('Preview simulation started. No message will be sent.');
    setTimeout(() => {
      setSimulating(false);
      notify('Preview check complete. No clinic systems were changed.');
    }, 1800);
  };

  return <>
    <PageHeading eyebrow="Practice operations" title="Overview">
      <div className="heading-actions">
        <button className="primary-button" onClick={simulateLead} disabled={simulating}>
          <Sparkles size={15} /> {simulating ? 'Running preview...' : 'Simulate workflow'}
        </button>
        <button className="outline-button" onClick={() => onOpenWeeklyReport ? onOpenWeeklyReport() : notify('Weekly Report')}>
          <FileText size={15} /> Export Report
        </button>
      </div>
    </PageHeading>
    
    <div className="intro-line">
      <p>Review the sample audience, outreach activity, bookings, and staff follow-up.</p>
      <span className="live-pill preview-mode-pill"><span /> Preview data</span>
    </div>

    <section className="stats-grid">
      <StatCard icon={Users} label="Total Patient Base" value="100" note="In designated reactivation pool" tone="sage" info="All patient records available to the automation engine." />
      <StatCard icon={Sparkles} label="Eligible Audience" value="37" note="60+ days overdue" tone="gold" info="Patients meeting inactivity, opt-in status, and channel readiness rules." />
      <StatCard icon={MessageCircle} label="Active Dialogues" value="12" note="Conversations in the sample dataset" tone="blue" info="Sample conversations currently awaiting replies or follow-up." />
      <StatCard icon={Send} label="Booking Links Sent" value="8" note="High conversion intent" tone="sage" info="Direct scheduling links generated and delivered via WhatsApp." />
      <StatCard icon={CalendarDays} label="Confirmed Bookings" value="3" note="Attributed to reactivation" tone="green" info="Appointments locked directly on practice calendar." />
      <StatCard icon={HeartPulse} label="Clinical Escalations" value={queueCases.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS').length} note="Staff ownership required" tone="rose" info="Conversations paused for clinical review or sensitive queries." />
    </section>

    <div className="content-grid overview-grid">
      <section className="panel funnel-panel">
        <div className="section-heading">
          <div>
            <h2>Reactivation Velocity Funnel</h2>
            <p>End-to-end pipeline progression from dormant patient to confirmed booking.</p>
          </div>
          <InfoTip title="Reactivation Pipeline" text="Shows sample progress from the eligible audience through confirmed bookings." />
        </div>
        <div className="funnel">
          {[
            ['Dormant Audience', '37', 100],
            ['Outreach Delivered', '31', 84],
            ['Engaged & Responded', '18', 49],
            ['Offers Accepted', '12', 33],
            ['Booking Links Sent', '8', 22],
            ['Confirmed Revenue', '3', 8]
          ].map(([label, value, width], index) => (
            <div className="funnel-row" key={label}>
              <span className="funnel-label">{label}</span>
              <div className="funnel-track"><span style={{ width: `${width}%` }} /></div>
              <strong>{value}</strong>
              {index < 5 && <ChevronDown className="funnel-arrow" size={14} />}
            </div>
          ))}
        </div>
      </section>

      <section className="panel activity-panel">
        <div className="section-heading">
          <div>
            <h2>7-Day Throughput</h2>
            <p>Autonomous outbound and reply activity.</p>
          </div>
          <button className="text-button" onClick={() => onNavigate('Campaigns')}>
            View Campaigns <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="mini-chart">
          <div className="chart-bars">
            {[34, 48, 42, 63, 52, 76, 89].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} className={index === 6 ? 'current' : ''} />
            ))}
          </div>
          <div className="chart-labels">
            <span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span>
          </div>
        </div>
        <div className="activity-summary">
          <div><strong>31</strong><span>Sent</span></div>
          <div><strong>18</strong><span>Replies</span></div>
          <div><strong>2</strong><span>Escalations</span></div>
        </div>
      </section>
    </div>

    <div className="content-grid lower-grid">
      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>Conversation activity</h2>
              <p>Recent patient replies, intent signals, and automated follow-up.</p>
          </div>
          <button className="text-button" onClick={() => onNavigate('Conversations')}>
            View All Threads <ArrowUpRight size={15} />
          </button>
        </div>
        <ConversationTable openPatient={openPatient} />
      </section>
      <HumanPreview onNavigate={onNavigate} cases={queueCases} />
    </div>

    <BreakEvenCalculator clinicId={clinicId} />
  </>;
}

function ConversationTable({ openPatient }) { return <div className="table-scroll"><table><thead><tr><th>Client</th><th>Last message</th><th>Intent</th><th>State</th><th>Activity</th><th /></tr></thead><tbody>{conversations.slice(0, 4).map((conversation) => { const patient = getPatient(conversation.patientId); return <tr key={conversation.id} onClick={() => openPatient(patient.id)}><td><div className="person-cell"><Avatar patient={patient} /><strong>{patient.name}</strong></div></td><td className="message-cell">“{conversation.last}”</td><td><StatusBadge kind={conversation.intent}>{conversation.intent}</StatusBadge></td><td><StatusBadge kind={conversation.state}>{conversation.state}</StatusBadge></td><td className="muted">{conversation.activity}</td><td><button className="row-action">View <ArrowUpRight size={14} /></button></td></tr>; })}</tbody></table></div>; }
function HumanPreview({ onNavigate, cases }) { const openCases = cases.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS'); return <section className="panel queue-preview"><div className="section-heading"><div><h2>Staff review queue</h2><p>Conversations paused for practice staff.</p></div><StatusBadge kind="open">{openCases.length} open</StatusBadge></div>{openCases.slice(0, 2).map((item) => { const patient = getPatient(item.patientId); return <div className="queue-item" key={item.id}><Avatar patient={patient} /><div className="queue-copy"><div><strong>{patient.name}</strong><span>{item.reason}</span></div><p>“{item.message}”</p></div><StatusBadge kind={item.status}>{item.status}</StatusBadge></div>; })}<button className="full-width-button" onClick={() => onNavigate('Human Queue')}>Open review queue <ArrowUpRight size={15} /></button></section>; }

function Clients({ search, setSearch, openPatient, selectedPatient, notify }) {
  if (selectedPatient) return <ClientDetail patient={getPatient(selectedPatient)} onBack={() => openPatient(null)} notify={notify} />;
  const filtered = patients.filter((patient) => patient.name.toLowerCase().includes(search.toLowerCase()) || patient.phone.includes(search));
  return <><PageHeading eyebrow="Patient CRM" title="Clients"><button className="outline-button" onClick={() => notify('Client import is ready for API connection')}><Plus size={16} /> Add client</button></PageHeading><div className="intro-line"><p>Keep the full reactivation audience in view, from first outreach to booking.</p></div><section className="panel client-panel"><div className="filter-bar"><label className="search-input"><Search size={16} /><input placeholder="Search clients" value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="filter-button"><Filter size={15} /> Filters <ChevronDown size={14} /></button><span className="result-count">{filtered.length} of {patients.length} clients</span></div><div className="table-scroll"><table className="clients-table"><thead><tr><th>Name</th><th>Phone</th><th>Last treatment</th><th>Last visit</th><th>Inactive</th><th>Eligibility</th><th>State</th><th>Booking</th><th /></tr></thead><tbody>{filtered.map((patient) => <tr key={patient.id} onClick={() => openPatient(patient.id)}><td><div className="person-cell"><Avatar patient={patient} /><strong>{patient.name}</strong></div></td><td className="muted">{patient.phone}</td><td>{patient.treatment}</td><td>{patient.visit}</td><td><strong>{patient.days}d</strong></td><td><StatusBadge kind={patient.eligible ? 'eligible' : 'neutral'}>{patient.eligible ? 'YES' : 'NO'}</StatusBadge></td><td><StatusBadge kind={patient.state}>{patient.state}</StatusBadge></td><td>{patient.booking === 'BOOKED' ? <StatusBadge kind="booked">BOOKED</StatusBadge> : <span className="muted">NOT BOOKED</span>}</td><td><button className="icon-button"><ArrowUpRight size={15} /></button></td></tr>)}</tbody></table></div></section></>;
}

function ConversationCard({ patient = {}, human = false, customMessages = null }) {
  const pName = patient?.name || 'Patient';
  const firstName = pName.split(' ')[0] || 'there';
  const pInitial = patient?.initials ? patient.initials.slice(0, 1) : pName.slice(0, 1);
  const defaultMessages = human ? [
    { from: 'ai', text: `Hi ${firstName}, thanks for reaching out. How can our clinical team help today?`, time: '7:08 PM' },
    { from: 'client', text: 'I had a bad reaction to a product during my last visit. Is this safe for me?', time: '7:20 PM' }
  ] : [
    { from: 'ai', text: `Hello ${firstName} 👋 It's been a little while since your last visit. We are currently offering a priority seasonal reservation for returning patients. Would you like to review available appointments?`, time: '6:42 PM' },
    { from: 'client', text: 'Yes please', time: '6:43 PM' },
    { from: 'ai', text: 'Wonderful! We have exclusive returning-patient openings this month. Would you like me to send you the details?', time: '6:43 PM' },
    { from: 'client', text: 'Yes what is the offer?', time: '6:44 PM' },
    { from: 'ai', text: 'We currently have a returning-patient Signature Treatment for $79, available through this season. Would you like me to share the direct booking link?', time: '6:44 PM' },
    { from: 'client', text: 'Yes send it', time: '6:45 PM' },
    { from: 'ai', text: "Of course! I'll generate your direct booking link right away.", time: '6:45 PM' }
  ];
  const messages = customMessages || defaultMessages;

  return (
    <section className="panel conversation-card">
      <div className="section-heading">
        <div>
          <h2>{human ? 'Conversation Review' : 'Patient WhatsApp Thread'}</h2>
          <p>{human ? 'AI paused this thread for executive staff review.' : 'Verified AI and patient message log.'}</p>
        </div>
        {human ? <StatusBadge kind="human-required">HUMAN REQUIRED</StatusBadge> : <span className="channel-label"><MessageCircle size={14} /> WhatsApp</span>}
      </div>
      <div className="chat-window">
        {messages.map((message, index) => (
          <div className={`chat-row ${message.from}`} key={index}>
            <div className="chat-avatar">{message.from === 'ai' ? <Bot size={15} /> : pInitial}</div>
            <div className="bubble-wrap">
              <span className="chat-author">{message.from === 'ai' ? 'Practice AI' : firstName}</span>
              <div className="chat-bubble">{message.text}</div>
              <time>{message.time}</time>
            </div>
          </div>
        ))}
      </div>
      {!human && (
        <div className="conversation-footer">
          <span><span className="online-dot" /> Autonomous Agent Active</span>
          <button className="icon-button" aria-label="More conversation actions"><MoreHorizontal size={17} /></button>
        </div>
      )}
    </section>
  );
}

function ClientDetail({ patient, onBack, notify }) {
  return <><button className="back-link" onClick={onBack}>← Back to clients</button><PageHeading eyebrow="Client detail" title={patient.name}><StatusBadge kind={patient.state}>{patient.state}</StatusBadge></PageHeading><div className="detail-meta"><Avatar patient={patient} size="large" /><div><strong>{patient.phone}</strong><span>Patient ID · {patient.id}</span></div><div className="detail-actions"><button className="outline-button" onClick={() => notify('Client notes opened')}><FileText size={15} /> Notes</button><button className="primary-button" onClick={() => notify('Conversation updated')}><MessageCircle size={15} /> Open conversation</button></div></div><div className="content-grid detail-grid"><section><div className="panel profile-panel"><div className="section-heading"><div><h2>Profile information</h2><p>Source of truth for reactivation decisions.</p></div><InfoTip title="Profile information" text="These fields are read by the automation before it starts or continues a conversation." /></div><div className="profile-fields">{[['Last treatment', patient.treatment], ['Last visit', patient.visit], ['Days inactive', `${patient.days} days`], ['Reactivation eligible', patient.eligible ? 'YES' : 'NO'], ['Booking status', patient.booking], ['Preferred channel', 'WhatsApp'], ['Opt out', 'NO'], ['Last intent', patient.intent]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div>{isHumanActive && (
            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '8px 14px', margin: '10px 0', fontSize: '12px', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⚠️ <strong>Staff Takeover Active (human_active = true):</strong> Autonomous AI responses are stopped.</span>
              <button className="text-button" onClick={() => toggleTakeover(selectedConv?.id)} style={{ color: '#b45309', fontWeight: 700 }}>Release to AI</button>
            </div>
          )}
          <ConversationCard patient={patient} /></section><aside className="detail-side"><div className="panel intent-panel"><div className="section-heading"><div><h2>Conversation signal</h2><p>Latest AI classification.</p></div><Bot size={18} className="sage-icon" /></div><div className="signal-line"><span>Current intent</span><StatusBadge kind={patient.intent}>{patient.intent}</StatusBadge></div><div className="signal-line"><span>Current state</span><StatusBadge kind={patient.state}>{patient.state}</StatusBadge></div><div className="signal-line"><span>Response time</span><strong>1.5 sec</strong></div><div className="signal-line"><span>Conversation ID</span><strong>CONV0001</strong></div><div className="signal-line"><span>Last activity</span><strong>2 min ago</strong></div></div><div className="panel next-step-panel"><span className="eyebrow">Next best action</span><h3>Booking link sent</h3><p>Sarah has signalled clear booking intent. The link is available, but no appointment is confirmed yet.</p><button className="full-width-button" onClick={() => notify('Booking link copied')}>Copy booking link <ArrowUpRight size={15} /></button></div></aside></div></>;
}

function InboundTestTray({ patient, onRefresh, notify, isDemo = false, onDemoReply }) {
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMsg = async (textToSend) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || !patient) return;
    setLoading(true);

    if (isDemo && onDemoReply) {
      onDemoReply(patient, text);
      setInputMsg('');
      setLoading(false);
      return;
    }

    try {
      const res = await api.sendInboundReply(patient.phone, text, 'TEST-' + Date.now());
      notify?.(`Inbound message delivered to n8n. Classification: ${res?.intent || 'Processed'} | State: ${res?.state || 'Updated'}`);
      setInputMsg('');
      if (onRefresh) onRefresh();
    } catch (err) {
      notify?.(`Failed to send test reply: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    { label: 'Booking Intent', text: 'Yes, what times do you have available?' },
    { label: 'Price Enquiry', text: 'How much is the returning client special?' },
    { label: 'Clinical Concern', text: 'I had a skin reaction to the product last time.' },
    { label: 'Opt-Out (STOP)', text: 'STOP' }
  ];

  return (
    <div className="inbound-tester-tray">
      <div className="tester-title-row">
        <strong><MessageCircle size={14} /> WhatsApp response tester</strong>
          <span className="metric-sub">{isDemo ? 'Workspace preview' : 'POST /webhook/patient-reply'}</span>
      </div>
      <div className="preset-chip-list">
        {presets.map((p) => (
          <button
            key={p.label}
            className="preset-chip-btn"
            disabled={loading}
            onClick={() => sendMsg(p.text)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="tester-input-bar">
        <input
          placeholder={`Send an incoming WhatsApp message from ${patient?.name || 'client'}...`}
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
          disabled={loading}
        />
        <button
          className="primary-button"
          disabled={loading || !inputMsg.trim()}
          onClick={() => sendMsg()}
        >
          <Send size={13} /> {loading ? 'Sending...' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
}

function Conversations({ openPatient, openConversation, setSelectedCase, notify }) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState(conversations[0]?.id || 'CONV0001');
  const [customThreads, setCustomThreads] = useState({});
  const [takeoverThreads, setTakeoverThreads] = useState({});
  const isHumanActive = Boolean(takeoverThreads[selectedConv?.id]);

  const toggleTakeover = (threadId) => {
    setTakeoverThreads(prev => {
      const active = !prev[threadId];
      if (active) {
        notify?.('Human takeover activated (human_active = true). Autonomous AI replies paused.');
      } else {
        notify?.('Conversation released back to autonomous AI automation.');
      }
      return { ...prev, [threadId]: active };
    });
  };

  const selectedConv = conversations.find(c => c.id === selectedThreadId) || conversations[0];
  const currentPatient = getPatient(selectedConv?.patientId) || patients[0];

  const handleDemoReply = (patient, text) => {
    const threadId = selectedConv?.id || 'CONV0001';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add client message immediately
    const userMsg = { from: 'client', text, time: nowTime };
    const pFirstName = patient?.name ? patient.name.split(' ')[0] : 'there';
    const existing = customThreads[threadId] || [
      { from: 'ai', text: `Hello ${pFirstName} 👋 We currently have exclusive returning-patient openings this month. Would you like details?`, time: '6:42 PM' },
      { from: 'client', text: 'Yes what is the offer?', time: '6:44 PM' },
      { from: 'ai', text: 'We have our Signature Facial for $79 through this month. Would you like me to share the direct booking link?', time: '6:44 PM' }
    ];

    setCustomThreads(prev => ({
      ...prev,
      [threadId]: [...existing, userMsg]
    }));

    notify?.(`Inbound message received: "${text.slice(0, 40)}"`);

    if (takeoverThreads[threadId]) {
      notify?.('Patient reply received. AI response suppressed because staff takeover is active.');
      return;
    }

    // Simulate AI response after 900ms
    setTimeout(() => {
      let aiReply = "Thanks for checking in! Would you like to review our returning patient seasonal schedule?";
      let classifiedIntent = "INTERESTED";
      let nextState = "INTERESTED";

      const lower = text.toLowerCase();
      if (/stop|unsubscribe|cancel|quit|end/i.test(lower)) {
        aiReply = "Understood. Promotional messages from Aurevia are stopped and you have been unsubscribed.";
        classifiedIntent = "NOT_INTERESTED";
        nextState = "OPTED_OUT";
      } else if (/react|allergy|rash|pain|doctor|complain|redness/i.test(lower)) {
        aiReply = "Thanks for reaching out! A member of our clinical team will review this and assist you shortly.";
        classifiedIntent = "HUMAN_REQUIRED";
        nextState = "HUMAN_REQUIRED";
      } else if (/book|time|appoint|tomorrow|slot|link/i.test(lower)) {
        aiReply = "We would love to welcome you back! Here is our priority reservation link: https://cal.aureviaspa.com/reserve";
        classifiedIntent = "BOOKING_INTENT";
        nextState = "BOOKING_SENT";
      } else if (/price|cost|offer|special|how much/i.test(lower)) {
        aiReply = "Our returning client facial is $79 (regularly $120) through this month. Would you like me to share available times?";
        classifiedIntent = "ASKING_PRICE";
        nextState = "OFFER_PRESENTED";
      }

      selectedConv.last = text;
      selectedConv.intent = classifiedIntent;
      selectedConv.state = nextState;
      currentPatient.state = nextState;

      setCustomThreads(prev => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), { from: 'ai', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
      }));

      notify?.(`AI Classified: ${classifiedIntent} · State: ${nextState}`);
    }, 900);
  };

  const filteredConversations = conversations.filter(c => {
    const p = getPatient(c.patientId);
    const matchesSearch = p?.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.last.toLowerCase().includes(searchQuery.toLowerCase()) || p?.phone.includes(searchQuery);
    if (!matchesSearch) return false;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'INBOUND') return c.state !== 'OUTREACH_SENT';
    if (activeTab === 'BOOKING') return c.intent === 'BOOKING_INTENT' || c.state === 'BOOKING_SENT';
    if (activeTab === 'OFFER') return c.intent === 'ASKING_ABOUT_OFFER' || c.intent === 'ASKING_PRICE';
    if (activeTab === 'HUMAN') return c.state === 'HUMAN_REQUIRED';
    if (activeTab === 'OPTED_OUT') return c.state === 'OPTED_OUT' || c.intent === 'NOT_INTERESTED';
    return true;
  });

  return (
    <>
      <PageHeading eyebrow="Intelligent Inbox" title="Conversations">
        <div className="heading-actions">
          <button className="outline-button" onClick={() => notify('Conversation transcripts exported')}>
            <FileText size={15} /> Export Transcripts
          </button>
        </div>
      </PageHeading>

      <div className="intro-line">
        <p>Real-time autonomous AI dialogues, intent classifications, and instant patient handoffs.</p>
        <span className="live-pill"><span /> Inbox automation active</span>
      </div>

      <div className="conversation-workspace-layout">
        {/* Left Master List: Patients & Threads */}
        <aside className="panel patient-thread-sidebar">
          <div className="thread-search-box">
            <Search size={15} />
            <input
              placeholder="Search patients, phone, or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="thread-filter-pills">
            {[
              ['ALL', 'All'],
              ['INBOUND', 'Inbound'],
              ['BOOKING', 'Bookings'],
              ['OFFER', 'Offers'],
              ['HUMAN', 'Handoffs'],
              ['OPTED_OUT', 'Opted Out']
            ].map(([key, label]) => (
              <button
                key={key}
                className={`thread-filter-pill ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="patient-threads-list">
            {filteredConversations.map(conv => {
              const p = getPatient(conv.patientId);
              const isSelected = conv.id === selectedThreadId;
              const isInbound = conv.state !== 'OUTREACH_SENT';
              return (
                <div
                  key={conv.id}
                  className={`patient-thread-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedThreadId(conv.id)}
                >
                  <div className="thread-card-header">
                    <Avatar patient={p} />
                    <div className="thread-patient-info">
                      <strong>{p.name}</strong>
                      <span>{p.phone}</span>
                    </div>
                    <span className="thread-time">{conv.activity}</span>
                  </div>

                  <p className="thread-snippet">
                    {isInbound && <span className="online-dot" style={{ display: 'inline-block', marginRight: 5 }} />}
                    “{conv.last}”
                  </p>

                  <div className="thread-card-footer">
                    <StatusBadge kind={conv.intent}>{conv.intent}</StatusBadge>
                    <span className="thread-latency">{conv.response}</span>
                  </div>
                </div>
              );
            })}
            {filteredConversations.length === 0 && (
              <div className="thread-empty-filter">
                <Info size={18} />
                <span>No conversations matching this filter</span>
              </div>
            )}
          </div>
        </aside>

        {/* Right Detail Pane: Active WhatsApp Conversation & Signals */}
        <section className="conversation-main-feed">
          <div className="panel active-conversation-header">
            <div className="active-patient-headline">
              <Avatar patient={currentPatient} size="large" />
              <div>
                <div className="headline-name-row">
                  <h2>{currentPatient.name}</h2>
                  <StatusBadge kind={currentPatient.state}>{currentPatient.state}</StatusBadge>
                  {currentPatient.booking === 'BOOKED' && <StatusBadge kind="booked">BOOKED</StatusBadge>}
                </div>
                <div className="headline-subtext">
                  <span>Phone: <strong>{currentPatient.phone}</strong></span>
                  <span>•</span>
                  <span>Last Visit: <strong>{currentPatient.visit} ({currentPatient.days}d ago)</strong></span>
                  <span>•</span>
                  <span>Service: <strong>{currentPatient.treatment}</strong></span>
                </div>
              </div>
            </div>

            <div className="header-cta-actions" style={{ display: 'flex', gap: '8px' }}>
              <button className="outline-button" style={{ borderColor: isHumanActive ? '#f59e0b' : undefined, color: isHumanActive ? '#92400e' : undefined }} onClick={() => toggleTakeover(selectedConv?.id)}>
                {isHumanActive ? 'Release to AI' : 'Take Over Thread'}
              </button>
              <button className="outline-button" onClick={() => openPatient(currentPatient.id)}>
                View Patient Profile <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          <ConversationCard
            patient={currentPatient}
            human={selectedConv?.state === 'HUMAN_REQUIRED'}
            customMessages={customThreads[selectedConv?.id]}
          />

          <InboundTestTray
            patient={currentPatient}
            isDemo={true}
            onDemoReply={handleDemoReply}
            notify={notify}
          />

          <div className="panel thread-quick-telemetry">
            <div className="telemetry-item">
              <span>Intent Classification</span>
              <StatusBadge kind={selectedConv.intent}>{selectedConv.intent}</StatusBadge>
            </div>
            <div className="telemetry-item">
              <span>AI Response Latency</span>
              <strong>{selectedConv.response}</strong>
            </div>
            <div className="telemetry-item">
              <span>Booking Probability</span>
              <strong style={{ color: '#2b6a41' }}>{selectedConv.intent === 'BOOKING_INTENT' ? '98.5%' : selectedConv.intent === 'ASKING_ABOUT_OFFER' ? '74.2%' : '42.0%'}</strong>
            </div>
            <div className="telemetry-item">
              <span>Channel</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MessageCircle size={14} style={{ color: '#2b6a41' }} /> WhatsApp
              </strong>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function HumanQueue({ cases, setCases, selectedCase, setSelectedCase, notify }) {
  const updateStatus = async (status) => {
    if (apiConfig.demoMode) {
      setCases((current) => current.map((item) => item.id === selectedCase ? { ...item, status, assigned: status === 'OPEN' ? 'Unassigned' : 'Clinical Staff' } : item));
      notify(`Case marked ${status.toLowerCase()}`);
      return;
    }
    try {
      await api.updateHumanHandoffStatus(selectedCase, status);
      setCases((current) => current.map((item) => item.id === selectedCase ? { ...item, status } : item));
      notify(`Case marked ${status.toLowerCase()}`);
    } catch (error) {
      notify(`Unable to update case: ${error.message}`);
    }
  };
  if (selectedCase) {
    const item = cases.find((caseItem) => caseItem.id === selectedCase);
    if (!item) {
      setSelectedCase(null);
      return null;
    }
    const patient = getPatient(item.patientId);
    return <><button className="back-link" onClick={() => setSelectedCase(null)}>← Back to review queue</button><PageHeading eyebrow="Staff handoff detail" title={patient.name}><StatusBadge kind="human-required">STAFF REVIEW</StatusBadge></PageHeading><div className="case-banner"><HeartPulse size={18} /><div><strong>{item.reason}</strong><span>Patient reported an issue that requires practice staff.</span></div></div><div className="content-grid detail-grid"><section><ConversationCard patient={patient} human /></section><aside className="detail-side"><div className="panel action-panel"><span className="eyebrow">Case actions</span><h3>Take ownership</h3><p>Automations remain paused until this case is resolved by your team.</p><button className="primary-button full-width-button" onClick={() => updateStatus('IN_PROGRESS')}>Assign to staff</button><button className="outline-button full-width-button" onClick={() => updateStatus('IN_PROGRESS')}>Mark in progress</button><button className="text-button full-width-button" onClick={() => updateStatus('RESOLVED')}><Check size={15} /> Mark resolved</button></div></aside></div></>;
  }
  const openCount = cases.filter((item) => item.status === 'OPEN').length;
  const inProgressCount = cases.filter((item) => item.status === 'IN_PROGRESS').length;
  const resolvedCount = cases.filter((item) => item.status === 'RESOLVED').length;
  return <><PageHeading eyebrow="Staff handoffs" title="Review queue"><button className="outline-button" onClick={() => notify('Queue export is ready')}><FileText size={16} /> Export queue</button></PageHeading><div className="intro-line"><p>Review conversations that require practice staff assistance.</p><span className="live-pill"><span /> Sensitive threads are paused</span></div><section className="stats-grid queue-stats"><StatCard icon={HeartPulse} label="Open" value={openCount} note="Needs ownership" tone="rose" /><StatCard icon={Clock3} label="In progress" value={inProgressCount} note="Being handled" tone="gold" /><StatCard icon={Check} label="Resolved" value={resolvedCount} note="In this workspace" tone="green" /></section><section className="panel table-panel"><div className="section-heading"><div><h2>Queue cases</h2><p>Automations are paused until a staff member responds.</p></div><button className="filter-button"><Filter size={15} /> Filter <ChevronDown size={14} /></button></div><div className="table-scroll"><table><thead><tr><th>Client</th><th>Reason</th><th>Last message</th><th>Created</th><th>Status</th><th>Assigned to</th><th /></tr></thead><tbody>{cases.map((item) => { const patient = getPatient(item.patientId); return <tr key={item.id} onClick={() => setSelectedCase(item.id)}><td><div className="person-cell"><Avatar patient={patient} /><strong>{patient.name}</strong></div></td><td><strong>{item.reason}</strong></td><td className="message-cell">“{item.message}”</td><td className="muted">{item.created}</td><td><StatusBadge kind={item.status}>{item.status}</StatusBadge></td><td>{item.assigned}</td><td><button className="row-action">Review <ArrowUpRight size={14} /></button></td></tr>; })}</tbody></table></div></section></>;
}

function Offers() { return <><PageHeading eyebrow="Business controlled" title="Offers" /><div className="intro-line"><p>Give the AI a precise offer library. It never invents pricing or availability.</p><span className="live-pill"><span /> AI reads active offers only</span></div><section className="panel table-panel"><div className="section-heading"><div><h2>Offer library</h2><p>Active offers can be presented in returning-client conversations.</p></div><InfoTip title="Offer library" text="The automation can only mention offers marked active and within their configured date window." /></div><div className="offer-list">{offers.map((offer) => <div className="offer-row" key={offer.id}><div className="offer-mark"><Sparkles size={17} /></div><div className="offer-main"><div><strong>{offer.name}</strong>{offer.active ? <StatusBadge kind="active">ACTIVE</StatusBadge> : <StatusBadge kind="neutral">INACTIVE</StatusBadge>}</div><span>{offer.treatment} · {offer.description}</span></div><div className="offer-price"><strong>{offer.price}</strong><span>USD</span></div><div className="offer-window"><span>Available</span><strong>{offer.window}</strong></div></div>)}</div></section></>; }

function ExistingCampaigns({ notify }) { const [started, setStarted] = useState(false); const startCampaign = async () => { if (apiConfig.demoMode) { setStarted(true); notify('Campaign ready for n8n'); return; } try { await api.startCampaign(); setStarted(true); notify('Campaign started through n8n'); } catch (error) { notify(`Unable to start campaign: ${error.message}`); } }; return <><PageHeading eyebrow="Reactivation engine" title="Campaigns"><button className="primary-button" onClick={startCampaign}><Zap size={16} /> {started ? 'Campaign started' : 'Start reactivation'}</button></PageHeading><div className="intro-line"><p>Prepare, preview, and hand off a reactivation run to n8n.</p><span className="live-pill"><span /> No messages sent from this UI</span></div><div className="content-grid campaign-grid"><section><div className="panel campaign-status"><div className="campaign-status-copy"><span className="eyebrow">Active Practice Campaign</span><h2>Q4 Returning Patient Reactivation</h2><p>Targeted audience segment, approved practice offer, and automated routing.</p></div><div className="campaign-ready"><span className="ready-dot" /> READY</div><div className="campaign-metrics"><div><strong>37</strong><span>Eligible patients</span></div><div><strong>60+</strong><span>Days inactive</span></div><div><strong>WhatsApp</strong><span>Preferred channel</span></div></div></div><div className="panel preview-panel"><div className="section-heading"><div><h2>Message preview</h2><p>Shown to the selected audience before the workflow starts.</p></div><button className="text-button" onClick={() => notify('Preview refreshed')}><Sparkles size={15} /> Refresh preview</button></div><div className="preview-message"><Avatar patient={patients[0]} /><div><strong>Sarah Williams</strong><div className="preview-bubble">Hello Sarah 👋 It's been a little while since your last visit. We are currently offering a priority seasonal reservation for returning patients. Would you like to review available appointments?</div><span>Draft · Autonomous Practice AI</span></div></div><div className="campaign-actions"><button className="outline-button" onClick={() => notify('Campaign preview opened')}><Search size={15} /> Preview audience</button><button className="primary-button" onClick={startCampaign}><Zap size={15} /> Start campaign</button></div></div></section><aside><div className="panel rules-panel"><div className="section-heading"><div><h2>Campaign rules</h2><p>Applied before every outreach.</p></div><InfoTip title="Campaign rules" text="These guardrails determine who can be contacted. Opted-out clients are always excluded." /></div>{[['Days inactive', '60+'], ['Reactivation eligible', 'YES'], ['Opt out', 'NO'], ['Preferred channel', 'WhatsApp']].map(([label, value]) => <div className="rule-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="panel activity-card"><div className="section-heading"><div><h2>Campaign activity</h2><p>Current run totals.</p></div></div>{[['Messages sent', '31'], ['Replies', '18'], ['Offers presented', '12'], ['Booking links sent', '8'], ['Booked', '3'], ['Human handoffs', '2']].map(([label, value]) => <div className="activity-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></aside></div></>; }

function ExistingSettingsPage() {
  const profileFields = [
    ['Practice name', 'Aurevia Practice OS'],
    ['Booking URL', 'Not configured'],
    ['Currency', 'USD'],
    ['Default follow-up period', 'Configured in preview']
  ];

  return (
    <>
      <PageHeading eyebrow="Workspace configuration" title="Settings" />
      <div className="intro-line">
        <p>Review the sample settings and connection requirements for this workspace.</p>
        <span className="live-pill preview-mode-pill"><span /> Preview configuration</span>
      </div>
      <div className="settings-grid">
        <section className="panel settings-panel">
          <div className="section-heading">
            <div>
              <h2>Practice profile</h2>
              <p>These are sample values. Changes are not saved from this preview.</p>
            </div>
            <InfoTip title="Practice configuration" text="Live practice values are managed through the configured clinic data source." />
          </div>
          {profileFields.map(([label, value]) => (
            <label className="setting-field" key={label}>
              <span>{label}</span>
              <input value={value} readOnly />
            </label>
          ))}
        </section>
        <section className="panel settings-panel">
          <div className="section-heading">
            <div>
              <h2>Automation connection</h2>
              <p>Connection details are not verified in preview mode.</p>
            </div>
            <StatusBadge kind="neutral">PREVIEW ONLY</StatusBadge>
          </div>
          <div className="connection-row"><span>n8n endpoint</span><strong>{apiConfig.baseUrl ? 'Configured' : 'Not configured'}</strong></div>
          <div className="connection-row"><span>Webhook routes</span><strong>{apiConfig.webhookPrefix}</strong></div>
          <div className="connection-row"><span>Connection status</span><strong>Not checked in preview</strong></div>
          <div className="connection-row"><span>Credentials</span><strong>Not displayed here</strong></div>
        </section>
      </div>
    </>
  );
}


function useLiveResource(key, loader) {
  const [resource, setResource] = useState({ status: loader ? 'loading' : 'idle', data: null, error: '' });
  useEffect(() => {
    if (!loader) { setResource({ status: 'idle', data: null, error: '' }); return; }
    let active = true;
    setResource({ status: 'loading', data: null, error: '' });
    loader().then((data) => { if (active) setResource({ status: 'success', data, error: '' }); }).catch((error) => { if (active) setResource({ status: 'error', data: null, error: error.message }); });
    return () => { active = false; };
  }, [key]);
  return resource;
}

function rowsFrom(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['data', 'items', 'rows', 'results', 'clients', 'conversations', 'handoffs', 'offers']) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

function conversationRows(payload, patientId) {
  const candidateRows = rowsFrom(payload);
  const rows = candidateRows.length
    ? candidateRows
    : (payload && typeof payload === 'object' && (payload.conversation_id || payload.patient_id) ? [payload] : []);

  if (!patientId) {
    return rows.sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')));
  }

  const normalizedTarget = String(patientId).trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (!row.patient_id) return true;
    return String(row.patient_id).trim().toLowerCase() === normalizedTarget;
  });

  const finalRows = filtered.length > 0 ? filtered : rows;
  return finalRows.sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')));
}

function objectFrom(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return payload.data && !Array.isArray(payload.data) ? payload.data : payload.client && !Array.isArray(payload.client) ? payload.client : payload;
}

function liveName(patient) {
  const fullName = [patient?.first_name, patient?.last_name].filter(Boolean).join(' ').trim();
  return fullName || patient?.name || patient?.patient_id || 'Unnamed patient';
}

function livePatient(patient) {
  const name = liveName(patient);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return {
    ...patient,
    id: patient?.patient_id || patient?.id || '',
    patient_id: patient?.patient_id || patient?.id || '',
    name,
    initials: initials || '?',
    tone: patient?.tone || getToneForId(patient?.patient_id || patient?.id),
    phone: patient?.phone ?? patient?.Phone ?? '',
    treatment: patient?.last_treatment ?? patient?.treatment ?? patient?.['Last Treatment'] ?? '',
    last_treatment: patient?.last_treatment ?? patient?.treatment ?? patient?.['Last Treatment'] ?? '',
    visit: patient?.last_visit ?? patient?.visit ?? patient?.['Last Visit'] ?? '',
    last_visit: patient?.last_visit ?? patient?.visit ?? patient?.['Last Visit'] ?? '',
    days_inactive: Number(patient?.days_inactive ?? patient?.['Days Inactive'] ?? patient?.days ?? 0),
    reactivation_eligible: patient?.reactivation_eligible ?? patient?.['Reactivation Eligible'] ?? patient?.eligible,
    conversation_state: patient?.conversation_state ?? patient?.['Conversation State'] ?? patient?.status ?? patient?.state ?? '',
    booking_status: patient?.booking_status ?? patient?.['Booking Status'] ?? patient?.booking ?? '',
    opt_out: patient?.opt_out ?? patient?.['Opt Out'] ?? patient?.optout ?? 'NO'
  };
}

function LiveResourceState({ resource, label, onRetry, children }) {
  if (resource.status === 'loading') return <section className="panel live-gate"><Activity size={20} className="spinning" /><p>Connecting to {label}...</p></section>;
  if (resource.status === 'error') return (
    <section className="panel live-gate">
      <X size={20} />
      <h2>Unable to load {label}</h2>
      <p>{resource.error || 'N8N endpoint unavailable.'}</p>
      {onRetry && (
        <button className="primary-button" style={{ marginTop: '14px' }} onClick={onRetry}>
          <RefreshCw size={14} /> Retry Connection
        </button>
      )}
    </section>
  );
  if (resource.status === 'success' && (!resource.data || (Array.isArray(resource.data) && resource.data.length === 0))) return <section className="panel live-gate"><Info size={20} /><h2>No {label} found</h2><p>The n8n endpoint returned no records.</p></section>;
  return children;
}

function LiveWorkspace({ page, selectedClinicId, selectedPatient, setSelectedPatient, selectedCase, setSelectedCase, openPatient, openConversation, setPage, notify, onOpenWeeklyReport }) {
  const [dashboardRevision, setDashboardRevision] = useState(0);
  const [handoffsRevision, setHandoffsRevision] = useState(0);
  const [conversationPatientId, setConversationPatientId] = useState(() => sessionStorage.getItem('aurevia.selectedConversationPatient') || sessionStorage.getItem('maya.selectedConversationPatient') || '');
  const [conversationRevision, setConversationRevision] = useState(0);

  const selectConversationPatient = useCallback((patientId) => {
    const normalizedPatientId = String(patientId || '').trim();
    if (!normalizedPatientId) return;
    setConversationPatientId(normalizedPatientId);
    sessionStorage.setItem('aurevia.selectedConversationPatient', normalizedPatientId);
  }, []);

  const dashboard = useLiveResource('dashboard-' + page + '-' + dashboardRevision, page === 'Overview' ? api.getDashboard : null);
  const clients = useLiveResource('clients-' + page + '-' + dashboardRevision, page === 'Overview' || (page === 'Clients' && !selectedPatient) || page === 'Conversations' ? api.getClients : null);
  const convs = useLiveResource('convs-' + page + '-' + dashboardRevision, page === 'Overview' ? api.getGlobalConversations : null);
  const client = useLiveResource('client-' + (selectedPatient || ''), page === 'Clients' && selectedPatient ? () => api.getClient(selectedPatient) : null);
  
  const clientConversations = useLiveResource(
    page === 'Clients' && selectedPatient ? 'client-conv-' + selectedPatient + '-' + conversationRevision : null,
    page === 'Clients' && selectedPatient ? () => api.getConversations(selectedPatient) : null
  );

  const threadConversations = useLiveResource(
    page === 'Conversations' && conversationPatientId ? 'thread-conv-' + conversationPatientId + '-' + conversationRevision : null,
    page === 'Conversations' && conversationPatientId ? () => api.getConversations(conversationPatientId) : null
  );

  const handoffs = useLiveResource('handoffs-' + page + '-' + handoffsRevision, page === 'Human Queue' ? api.getHumanHandoffs : null);
  const offers = useLiveResource('offers-' + page, page === 'Offers' ? api.getOffers : null);

  if (page === 'Missed Calls') return <MissedCallsPage clinicId={selectedClinicId} notify={notify} />;

  if (page === 'Overview') {
    const isReady = dashboard.status === 'success' || clients.status === 'success';
    if (!isReady && (dashboard.status === 'loading' || clients.status === 'loading')) {
      return (
        <section className="panel live-gate">
          <Activity size={20} className="spinning" />
          <p>Connecting to dashboard & practice database...</p>
        </section>
      );
    }
    if (!isReady && dashboard.status === 'error' && clients.status === 'error') {
      return (
        <section className="panel live-gate">
          <X size={20} />
          <h2>Unable to load dashboard</h2>
          <p>{dashboard.error || clients.error || 'N8N endpoint unavailable.'}</p>
          <button className="primary-button" style={{ marginTop: '14px' }} onClick={() => setDashboardRevision((v) => v + 1)}>
            <RefreshCw size={14} /> Retry Connection
          </button>
        </section>
      );
    }
    return (
      <LiveOverview
        data={objectFrom(dashboard.data).stats || objectFrom(dashboard.data)}
        dashboardData={objectFrom(dashboard.data).stats || objectFrom(dashboard.data)}
        clientsData={clients.data}
        conversationsData={convs.data}
        isDataLoaded={dashboard.status !== 'loading' && clients.status !== 'loading'}
        hasDataError={dashboard.status === 'error' || clients.status === 'error'}
        isRefreshing={dashboard.status === 'loading'}
        openPatient={openPatient}
        openConversation={openConversation}
        onNavigate={setPage}
        onOpenWeeklyReport={onOpenWeeklyReport}
        onRefresh={() => setDashboardRevision((v) => v + 1)}
      />
    );
  }
  if (page === 'Clients') return selectedPatient ? (
    <LiveClientWorkspace
      resource={client}
      conversations={clientConversations}
      patientId={selectedPatient}
      onBack={() => setSelectedPatient(null)}
      onRefresh={() => setConversationRevision((value) => value + 1)}
      openConversation={openConversation}
      onNavigate={(dest) => {
        if (dest === 'Conversations') {
          if (openConversation) {
            openConversation(selectedPatient);
          } else {
            selectConversationPatient(selectedPatient);
            setSelectedPatient(null);
            if (setPage) setPage('Conversations');
          }
        }
      }}
    />
  ) : (
    <LiveClients resource={clients} openPatient={openPatient} />
  );

  if (page === 'Conversations') return (
    <LiveConversations
      clientsResource={clients}
      conversationsResource={threadConversations}
      selectedPatient={conversationPatientId}
      onSelectPatient={selectConversationPatient}
      onRefresh={() => setConversationRevision((value) => value + 1)}
      openPatient={openPatient}
      notify={notify}
    />
  );

  if (page === 'Human Queue') return (
    <LiveHandoffs
      resource={handoffs}
      selectedCase={selectedCase}
      setSelectedCase={setSelectedCase}
      onResolved={() => {
        setSelectedCase(null);
        setHandoffsRevision((value) => value + 1);
      }}
      onRetry={() => setHandoffsRevision((v) => v + 1)}
    />
  );

  if (page === 'Offers') return <LiveOffers resource={offers} />;

  return (
    <LiveResourceState resource={dashboard} label="page" onRetry={() => setDashboardRevision((v) => v + 1)}>
      <LiveOverview
        data={objectFrom(dashboard.data).stats || objectFrom(dashboard.data)}
        dashboardData={objectFrom(dashboard.data).stats || objectFrom(dashboard.data)}
        clientsData={clients.data}
        conversationsData={convs.data}
        isDataLoaded={dashboard.status !== 'loading' && clients.status !== 'loading'}
        hasDataError={dashboard.status === 'error' || clients.status === 'error'}
        isRefreshing={dashboard.status === 'loading'}
        openPatient={openPatient}
        openConversation={openConversation}
        onNavigate={setPage}
        onRefresh={() => setDashboardRevision((v) => v + 1)}
      />
    </LiveResourceState>
  );
}

function metricCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function LiveOverview({
  data,
  dashboardData,
  clientsData,
  conversationsData,
  isDataLoaded,
  hasDataError,
  isRefreshing,
  openPatient,
  openConversation,
  onNavigate,
  onRefresh
}) {
  const rawStats = dashboardData || data || {};
  const clientRows = rowsFrom(clientsData).map(livePatient);
  const convRows = rowsFrom(conversationsData);

  // Helper to evaluate eligibility
  const isEligible = (p) => {
    const re = String(p.reactivation_eligible ?? p.eligible ?? '').toUpperCase();
    return re === 'YES' || p.reactivation_eligible === true || p.eligible === true || Number(p.days_inactive ?? 0) >= 60;
  };

  // Helper to evaluate contacted state
  const isContacted = (p) => {
    const s = String(p.conversation_state || p.state || '').toUpperCase();
    return Boolean(s && s !== 'NEW' && s !== 'NOT_CONTACTED' && s !== 'READY');
  };

  // Helper to evaluate active dialogue
  const isActive = (p) => {
    const s = String(p.conversation_state || p.state || '').toUpperCase();
    return ['OUTREACH_SENT', 'WAITING_FOR_REPLY', 'INTERESTED', 'OFFER_PRESENTED', 'BOOKING_SENT', 'HUMAN_REQUIRED', 'FOLLOW_UP_LATER'].includes(s);
  };

  // Helper to evaluate booking status
  const isBooked = (p) => {
    return String(p.booking_status || '').toUpperCase() === 'BOOKED';
  };

  // Helper to evaluate booking link sent
  const isBookingLinkSent = (p) => {
    const b = String(p.booking_status || '').toUpperCase();
    const s = String(p.conversation_state || p.state || '').toUpperCase();
    return b.includes('BOOKING_SENT') || s.includes('BOOKING_SENT');
  };

  // Helper to evaluate human handoff
  const isHumanHandoff = (p) => {
    const s = String(p.conversation_state || p.state || '').toUpperCase();
    return s.includes('HUMAN');
  };

  // Reconcile numeric metrics with patient rows returned by the connected sources.
  const totalPatients = metricCount(rawStats.total_patients ?? rawStats.total_clients ?? clientRows.length);

  const eligiblePatients = rawStats.eligible_clients !== undefined && rawStats.eligible_clients !== null
    ? metricCount(rawStats.eligible_clients)
    : clientRows.length > 0
      ? clientRows.filter(isEligible).length
      : metricCount(rawStats.inactive_patients);

  const contactedPatients = rawStats.contacted_patients !== undefined && rawStats.contacted_patients !== null
    ? metricCount(rawStats.contacted_patients)
    : rawStats.contacted !== undefined && rawStats.contacted !== null
      ? metricCount(rawStats.contacted)
      : clientRows.length > 0
        ? clientRows.filter(isContacted).length
        : 0;

  const activeDialogues = rawStats.active_conversations !== undefined && rawStats.active_conversations !== null
    ? metricCount(rawStats.active_conversations)
    : clientRows.length > 0
      ? clientRows.filter(isActive).length
      : 0;

  const bookingLinksSent = rawStats.booking_links_sent !== undefined && rawStats.booking_links_sent !== null
    ? metricCount(rawStats.booking_links_sent)
    : clientRows.length > 0
      ? clientRows.filter(isBookingLinkSent).length
      : 0;

  const confirmedBookings = rawStats.booked !== undefined && rawStats.booked !== null
    ? metricCount(rawStats.booked)
    : rawStats.confirmed_bookings !== undefined && rawStats.confirmed_bookings !== null
      ? metricCount(rawStats.confirmed_bookings)
      : clientRows.length > 0
        ? clientRows.filter(isBooked).length
        : 0;

  const staffEscalations = rawStats.pending_handoffs !== undefined && rawStats.pending_handoffs !== null
    ? metricCount(rawStats.pending_handoffs)
    : rawStats.human_handoffs !== undefined && rawStats.human_handoffs !== null
      ? metricCount(rawStats.human_handoffs)
      : clientRows.length > 0
        ? clientRows.filter(isHumanHandoff).length
        : 0;

  const cards = [
    { label: 'Total Audience', value: totalPatients, icon: Users, tone: 'sage', note: 'In reactivation pool', info: 'All patient records ingested from CRM.' },
    { label: 'Eligible Audience', value: eligiblePatients, icon: Sparkles, tone: 'gold', note: '60+ days overdue', info: 'Patients meeting inactivity threshold and channel readiness.' },
    { label: 'Outreach Delivered', value: contactedPatients, icon: Send, tone: 'blue', note: 'Contacted via WhatsApp', info: 'Patients who have received automated outreach messages.' },
    { label: 'Active Dialogues', value: activeDialogues, icon: MessageCircle, tone: 'sage', note: 'Awaiting reply or follow-up', info: 'Conversations currently in an active workflow state.' },
    { label: 'Confirmed Bookings', value: confirmedBookings, icon: CalendarDays, tone: 'green', note: 'Recorded by the data source', info: 'Bookings reported by the configured practice system.' },
    { label: 'Staff Review Queue', value: staffEscalations, icon: HeartPulse, tone: 'rose', note: 'Staff ownership required', info: 'Conversations paused for human clinical staff assistance.' }
  ];

  const funnelBase = Math.max(eligiblePatients, contactedPatients, activeDialogues, bookingLinksSent, confirmedBookings, 1);
  const funnelItems = [
    { label: 'Eligible Audience', value: eligiblePatients, width: 100 },
    { label: 'Outreach Delivered', value: contactedPatients, width: Math.min(100, Math.round((contactedPatients / funnelBase) * 100)) },
    { label: 'Active Dialogues', value: activeDialogues, width: Math.min(100, Math.round((activeDialogues / funnelBase) * 100)) },
    { label: 'Booking Links Sent', value: bookingLinksSent, width: Math.min(100, Math.round((bookingLinksSent / funnelBase) * 100)) },
    { label: 'Confirmed Bookings', value: confirmedBookings, width: Math.min(100, Math.round((confirmedBookings / funnelBase) * 100)) }
  ];

  const isSparse = isDataLoaded && totalPatients <= 5;
  const hasPracticeData = clientRows.length > 0 || [
    totalPatients,
    eligiblePatients,
    contactedPatients,
    activeDialogues,
    bookingLinksSent,
    confirmedBookings,
    staffEscalations
  ].some((value) => value > 0);
  const hasNoPracticeData = isDataLoaded && !hasPracticeData && !hasDataError;
  const hasEmptyDataError = isDataLoaded && !hasPracticeData && hasDataError;
  const latestTouchpoint = convRows.length > 0
    ? convRows[0]
    : clientRows.length > 0 && contactedPatients > 0
      ? {
          patient_id: clientRows[0].patient_id || clientRows[0].id,
          name: clientRows[0].name,
          intent: clientRows[0].last_intent || clientRows[0].conversation_state || 'CONTACTED',
          state: clientRows[0].conversation_state || 'CONTACTED',
          message: clientRows[0].last_message || 'Recent activity from the connected practice.'
        }
      : null;

  const displayConversations = convRows.length > 0
    ? convRows
    : clientRows
        .filter(p => isContacted(p) || p.last_message)
        .map(p => ({
          conversation_id: 'TOUCH-' + (p.patient_id || p.id),
          patient_id: p.patient_id || p.id,
          name: p.name,
          message: p.last_message || 'Recent activity from ' + (p.name || 'client') + '.',
          direction: 'outbound',
          intent: p.last_intent || p.conversation_state || 'OUTREACH_SENT',
          state: p.conversation_state || 'CONTACTED',
          timestamp: p.last_visit ? ('Last visit: ' + p.last_visit) : 'Recent touchpoint'
        }));

  return (
    <>
      <PageHeading eyebrow="Executive Operations" title="Overview">
        <div className="button-row">
          <button
            className="outline-button"
            onClick={onRefresh}
            disabled={!onRefresh || isRefreshing}
            aria-busy={isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spinning' : ''} />
            {isRefreshing ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>
      </PageHeading>

      <div className="intro-line">
        <p>Review current audience, outreach, booking, and staff follow-up activity.</p>
        <span className={`live-pill ${hasNoPracticeData ? 'live-pill-muted' : ''}`}><span />{hasNoPracticeData ? 'No records returned' : 'Live data'}</span>
      </div>

      {hasNoPracticeData ? (
        <section className="overview-empty-state">
          <div className="overview-empty-icon"><Users size={20} /></div>
          <div>
            <strong>No practice records yet</strong>
            <p>The data source returned no audience or activity. Check the clinic connection in Settings.</p>
          </div>
          <button className="outline-button" onClick={() => onNavigate?.('Settings')}>Open Settings <ArrowUpRight size={14} /></button>
        </section>
      ) : hasEmptyDataError ? (
        <section className="overview-empty-state overview-empty-error">
          <div className="overview-empty-icon"><AlertCircle size={20} /></div>
          <div>
            <strong>Dashboard data could not be loaded</strong>
            <p>Check the clinic connection in Settings, then refresh to try again.</p>
          </div>
          <button className="outline-button" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
            {isRefreshing ? 'Refreshing…' : 'Try again'}
          </button>
        </section>
      ) : hasDataError ? (
        <div className="overview-source-warning" role="status">
          Some dashboard data is unavailable. Refresh to retry the affected source.
        </div>
      ) : isSparse && (
        <section className="sparse-pipeline-card">
          <div className="sparse-pipeline-header">
            <div className="sparse-pipeline-title-group">
              <h3><Activity size={16} /> Activity snapshot</h3>
              <p>Recent activity returned by the connected practice systems.</p>
            </div>
          </div>
          {latestTouchpoint ? (
            <div className="touchpoint-stage-row">
              <span className="touchpoint-badge">
                <Send size={12} /> Latest Touchpoint
              </span>
              <div className="touchpoint-client-meta">
                <strong>{latestTouchpoint.name || latestTouchpoint.patient_id || 'Client'}</strong>
                <span>· Outreach message dispatched • {formatIntentLabel(latestTouchpoint.intent || latestTouchpoint.state || 'Awaiting client response')}</span>
              </div>
              <button
                className="outline-button-small"
                onClick={() => {
                  if (openConversation && latestTouchpoint.patient_id) {
                    openConversation(latestTouchpoint.patient_id);
                  } else if (openPatient && latestTouchpoint.patient_id) {
                    openPatient(latestTouchpoint.patient_id);
                  }
                }}
              >
                Inspect Thread <ArrowUpRight size={13} />
              </button>
            </div>
          ) : (
            <div className="touchpoint-stage-row">
              <span className="touchpoint-badge">
                <Info size={12} /> No recent touchpoint
              </span>
              <div className="touchpoint-client-meta">
                <span>No recent conversation was returned by the data source.</span>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="stats-grid">
        {cards.map((c) => (
          <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} note={c.note} tone={c.tone} info={c.info} />
        ))}
      </section>

      <div className="content-grid overview-grid">
        <section className="panel funnel-panel">
          <div className="section-heading">
            <div>
              <h2>Reactivation progress</h2>
              <p>Counts are based on the metrics supplied by the practice data source.</p>
            </div>
            <InfoTip title="Reactivation progress" text="Shows eligible patients moving through outreach, conversation, and booking stages." />
          </div>
          <div className="funnel">
            {funnelItems.map((item, index) => (
              <div className="funnel-row" key={item.label}>
                <span className="funnel-label">{item.label}</span>
                <div className="funnel-track"><span style={{ width: item.width + '%' }} /></div>
                <strong>{item.value}</strong>
                {index < funnelItems.length - 1 && <ChevronDown className="funnel-arrow" size={14} />}
              </div>
            ))}
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="section-heading">
            <div>
              <h2>Activity totals</h2>
              <p>Current totals supplied by the data source.</p>
            </div>
            {onNavigate && (
              <button className="text-button" onClick={() => onNavigate('Campaigns')}>
                View Campaigns <ArrowUpRight size={15} />
              </button>
            )}
          </div>
          <div className="activity-summary">
            <div><strong>{contactedPatients}</strong><span>Sent / Contacted</span></div>
            <div><strong>{activeDialogues}</strong><span>Replies / Active</span></div>
            <div><strong>{staffEscalations}</strong><span>Staff Review</span></div>
          </div>
        </section>
      </div>

      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>Recent Conversations & Touchpoints</h2>
            <p>Latest conversations and activity returned by the data source.</p>
          </div>
        </div>
        {displayConversations.length ? (
          <LiveConversationTable rows={displayConversations} openPatient={openPatient} />
        ) : (
          <p className="muted" style={{ padding: '24px 16px', textAlign: 'center' }}>
            No recent conversations were returned by the connected data source.
          </p>
        )}
      </section>
    </>
  );
}

function LiveClients({ resource, openPatient }) {
  const [search, setSearch] = useState('');
  const allRows = rowsFrom(resource.data);
  const data = allRows.filter((patient) => {
    const q = search.toLowerCase();
    return liveName(patient).toLowerCase().includes(q) ||
      String(patient.phone || '').includes(q) ||
      String(patient.patient_id || '').toLowerCase().includes(q) ||
      String(patient.last_treatment || '').toLowerCase().includes(q);
  });

  return (
    <LiveResourceState resource={{ ...resource, data }} label="clients">
      <>
        <PageHeading eyebrow="Client CRM Directory" title="Clients" />
        <section className="panel client-panel">
          <div className="filter-bar">
            <label className="search-input">
              <Search size={16} />
              <input placeholder="Search clients by name, phone, or service..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <span className="result-count">{data.length} of {allRows.length} clients</span>
          </div>
          <div className="table-scroll">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Last service</th>
                  <th>Last visit</th>
                  <th>Inactive</th>
                  <th>Eligibility</th>
                  <th>Status</th>
                  <th>Booking</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((raw) => {
                  const patient = livePatient(raw);
                  const isEligible = String(patient.reactivation_eligible || patient.eligible || '').toUpperCase() === 'YES' || patient.eligible === true;
                  const isBooked = String(patient.booking_status || '').toUpperCase() === 'BOOKED';
                  return (
                    <tr key={patient.id} onClick={() => openPatient(patient.id)}>
                      <td>
                        <div className="person-cell">
                          <Avatar patient={patient} />
                          <div>
                            <strong>{patient.name}</strong>
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>{patient.phone || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{patient.last_treatment || '—'}</td>
                      <td>{patient.last_visit || '—'}</td>
                      <td><strong>{patient.days_inactive ? patient.days_inactive + 'd' : '—'}</strong></td>
                      <td>
                        <StatusBadge kind={isEligible ? 'eligible' : 'neutral'}>
                          {isEligible ? 'Eligible' : 'Ineligible'}
                        </StatusBadge>
                      </td>
                      <td><StatusBadge kind={patient.conversation_state}>{formatIntentLabel(patient.conversation_state)}</StatusBadge></td>
                      <td>
                        {isBooked ? (
                          <StatusBadge kind="booked">Confirmed</StatusBadge>
                        ) : (
                          <span className="muted">Not booked</span>
                        )}
                      </td>
                      <td>
                        <button className="icon-button" aria-label="Open client profile">
                          <ArrowUpRight size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
                      No clients found matching "${search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>
    </LiveResourceState>
  );
}

function LiveClientWorkspace({ resource, conversations, patientId, onBack, onRefresh, openConversation, onNavigate }) {
  return (
    <LiveClientDetail resource={resource} conversations={conversations} patientId={patientId} onBack={onBack} onRefresh={onRefresh} openConversation={openConversation} onNavigate={onNavigate} />
  );
}

function LiveClientDetail({ resource, conversations, patientId, onBack, onRefresh, openConversation, onNavigate }) {
  return (
    <LiveResourceState resource={resource} label="client">
      <>{(() => {
        const patient = livePatient(objectFrom(resource.data));
        return (
          <>
            <button className="back-link" onClick={onBack}>← Back to clients</button>
            <PageHeading eyebrow="Client CRM Detail" title={patient.name}>
              <StatusBadge kind={patient.conversation_state}>{formatIntentLabel(patient.conversation_state)}</StatusBadge>
            </PageHeading>
            <div className="detail-meta">
              <Avatar patient={patient} size="large" />
              <div>
                <strong>{patient.phone || 'No phone'}</strong>
                <span>Client ID · {patientId}</span>
              </div>
              <div className="detail-actions">
                <button
                  className="primary-button"
                  onClick={() => openConversation ? openConversation(patientId) : onNavigate?.('Conversations')}
                >
                  <MessageCircle size={15} /> Open conversation
                </button>
              </div>
            </div>
            <div className="content-grid detail-grid">
              <section>
                <div className="panel profile-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Profile Information</h2>
                      <p>Synced live from n8n & Google Sheets.</p>
                    </div>
                  </div>
                  <div className="profile-fields">
                    {[
                      ['Email', patient.email],
                      ['Last service', patient.last_treatment],
                      ['Last visit', patient.last_visit],
                      ['Days inactive', patient.days_inactive ? patient.days_inactive + ' days' : '—'],
                      ['Preferred channel', patient.preferred_channel || 'WhatsApp'],
                      ['Current state', formatIntentLabel(patient.conversation_state)],
                      ['Last intent', formatIntentLabel(patient.last_intent)],
                      ['Booking status', patient.booking_status === 'BOOKED' ? 'Confirmed' : 'Not booked'],
                      ['Opt out', patient.opt_out || 'No']
                    ].map(([label, value]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong>{value || '—'}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <LiveConversationTimeline resource={conversations} patient={patient} onRefresh={onRefresh} />
              </section>
            </div>
          </>
        );
      })()}</>
    </LiveResourceState>
  );
}

function LiveConversationTable({ rows, openPatient }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Client ID</th>
            <th>Message</th>
            <th>Direction</th>
            <th>Intent</th>
            <th>State</th>
            <th>Timestamp</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.conversation_id || index} onClick={() => row.patient_id && openPatient?.(row.patient_id)}>
              <td><strong>{row.patient_id || '—'}</strong></td>
              <td className="message-cell">“{row.message}”</td>
              <td><span className={'direction-tag ' + row.direction}>{row.direction}</span></td>
              <td><StatusBadge kind={row.intent}>{formatIntentLabel(row.intent)}</StatusBadge></td>
              <td><StatusBadge kind={row.state}>{formatIntentLabel(row.state)}</StatusBadge></td>
              <td className="muted">{row.timestamp || 'Recent'}</td>
              <td>
                <button className="icon-button" aria-label="Open client record">
                  <ArrowUpRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiveConversations({ clientsResource, conversationsResource, selectedPatient, onSelectPatient, onRefresh, openPatient, notify }) {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [viewMode, setViewMode] = useState('timeline');
  const [signalsOpen, setSignalsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const allClients = rowsFrom(clientsResource.data);

  const filteredClients = allClients.filter((client) => {
    const p = livePatient(client);
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      String(p.id || '').toLowerCase().includes(search.toLowerCase()) ||
      String(p.phone || '').includes(search) ||
      String(p.last_treatment || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'ALL') return true;
    if (filterTab === 'ACTIVE') return p.conversation_state && !['OPTED_OUT', 'NOT_INTERESTED', 'INACTIVE'].includes(p.conversation_state);
    if (filterTab === 'BOOKING') return String(p.conversation_state || '').toUpperCase().includes('BOOK') || String(p.booking_status || '').toUpperCase().includes('BOOK');
    if (filterTab === 'ATTENTION') return String(p.conversation_state || '').toUpperCase().includes('HUMAN') || String(p.conversation_state || '').toUpperCase().includes('REQUIRED');
    if (filterTab === 'OPTED_OUT') return String(p.opt_out || '').toUpperCase() === 'YES' || String(p.conversation_state || '').toUpperCase().includes('OPT');
    return true;
  });

  const selectedClient = allClients.find((client) => String(client.patient_id || client.id) === selectedPatient) || (filteredClients.length > 0 && !selectedPatient ? filteredClients[0] : null);
  const selectedPatientObj = selectedClient ? livePatient(selectedClient) : null;
  const activePatientId = selectedPatient || selectedPatientObj?.id;
  const rows = conversationRows(conversationsResource.data, activePatientId);

  useEffect(() => {
    if (!selectedPatient && filteredClients.length > 0) {
      onSelectPatient(filteredClients[0].patient_id || filteredClients[0].id);
    }
  }, [filteredClients, selectedPatient, onSelectPatient]);

  if (!clientsResource.data && clientsResource.status !== 'success') {
    return <LiveResourceState resource={clientsResource} label="clients"><></></LiveResourceState>;
  }

  return (
    <>
      <PageHeading eyebrow="Practice Inbox" title="Conversations">
        <div className="button-row">
          <button className="outline-button" onClick={onRefresh} title="Sync latest data with n8n">
            <RefreshCw size={15} /> Refresh Thread
          </button>
        </div>
      </PageHeading>

      <div className="intro-line">
        <p>Master-detail conversation desk with real-time intent qualifications and staff review actions.</p>
        <span className="live-pill"><span /> Connected Suite</span>
      </div>

      <div className="conversations-three-pane">
        {/* Panel A: Conversation list panel */}
        <aside className="panel live-patient-picker-panel">
          <div className="picker-header">
            <div className="picker-title-row">
              <div className="picker-title-left">
                <h2>Clients</h2>
                <span className="picker-count-badge">{filteredClients.length} of {allClients.length}</span>
              </div>
            </div>
            <p className="picker-subtitle">Select a client to view messaging stream.</p>

            <div className="picker-search-bar">
              <Search size={14} />
              <input
                placeholder="Search name, phone, or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="clear-search-btn" onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="picker-filter-chips">
              {[
                ['ALL', 'All'],
                ['ACTIVE', 'Active'],
                ['BOOKING', 'Bookings'],
                ['ATTENTION', 'Staff review'],
                ['OPTED_OUT', 'Opted out']
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={'picker-chip ' + (filterTab === key ? 'active' : '')}
                  onClick={() => setFilterTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="live-patient-cards-list">
            {filteredClients.map((client) => {
              const patient = livePatient(client);
              const isSelected = String(selectedPatient) === String(patient.id);
              const needsAttention = String(patient.conversation_state || '').toUpperCase().includes('HUMAN');
              return (
                <button
                  key={patient.id}
                  className={'live-patient-card ' + (isSelected ? 'selected' : '')}
                  onClick={() => onSelectPatient(patient.id)}
                >
                  <div className="patient-card-top">
                    <Avatar patient={patient} />
                    <div className="patient-card-identity">
                      <div className="patient-card-name-row">
                        <strong className="patient-name">{patient.name}</strong>
                        <span className="patient-id-tag">{patient.id}</span>
                      </div>
                      <div className="patient-card-sub">
                        <span>{patient.phone || 'No phone'}</span>
                        {patient.last_treatment && (
                          <span className="patient-treatment-dot">· {patient.last_treatment}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="patient-card-bottom">
                    <StatusBadge kind={patient.conversation_state || patient.booking_status || 'neutral'}>
                      {formatIntentLabel(patient.conversation_state || patient.booking_status || 'READY')}
                    </StatusBadge>
                    {needsAttention && (
                      <span className="badge badge-human-required">Review</span>
                    )}
                    <span className="card-select-arrow">
                      <ArrowUpRight size={13} />
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="live-picker-empty" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
                <Info size={18} style={{ margin: '0 auto 8px', display: 'block' }} />
                <p>No clients match current filters</p>
                <button className="outline-button-small" onClick={() => { setSearch(''); setFilterTab('ALL'); }}>
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Panel B: Conversation detail panel */}
        <section className="live-conversation-detail-pane">
          {!selectedPatientObj ? (
            <div className="panel conversation-empty-state">
              <MessageCircle size={32} />
              <h2>Select a Client</h2>
              <p>Choose any client from the directory on the left to inspect conversation stream and automation signals.</p>
            </div>
          ) : (
            <div className="live-conversation-thread-wrap">
              <div className="panel live-thread-header-card">
                <div className="thread-header-main">
                  <div className="thread-patient-meta">
                    <Avatar patient={selectedPatientObj} size="large" />
                    <div>
                      <div className="thread-title-name-row">
                        <h2>{selectedPatientObj.name}</h2>
                        <span className="patient-id-tag-lg">{selectedPatientObj.id}</span>
                        <StatusBadge kind={selectedPatientObj.conversation_state || 'active'}>
                          {formatIntentLabel(selectedPatientObj.conversation_state || 'ACTIVE')}
                        </StatusBadge>
                      </div>
                      <div className="thread-meta-subrow">
                        <span>{selectedPatientObj.phone || '—'}</span>
                        <span>·</span>
                        <span>{selectedPatientObj.email || 'No email registered'}</span>
                        {selectedPatientObj.last_treatment && (
                          <>
                            <span>·</span>
                            <strong>{selectedPatientObj.last_treatment}</strong>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="thread-header-actions">
                    <div className="view-mode-toggle">
                      <button
                        className={'toggle-btn ' + (viewMode === 'timeline' ? 'active' : '')}
                        onClick={() => setViewMode('timeline')}
                        title="Interactive Chat Timeline"
                      >
                        <MessageCircle size={14} /> Timeline
                      </button>
                      <button
                        className={'toggle-btn ' + (viewMode === 'table' ? 'active' : '')}
                        onClick={() => setViewMode('table')}
                        title="Telemetry Table Log"
                      >
                        <FileText size={14} /> Data Log
                      </button>
                    </div>
                    {openPatient && (
                      <button
                        className="outline-button thread-crm-btn"
                        onClick={() => openPatient(selectedPatientObj.id)}
                      >
                        <UserRound size={14} /> Client Profile
                      </button>
                    )}
                  </div>
                </div>

                <div className="thread-telemetry-bar">
                  <div className="telemetry-cell">
                    <span>Days Inactive</span>
                    <strong>{selectedPatientObj.days_inactive ? selectedPatientObj.days_inactive + ' days' : '—'}</strong>
                  </div>
                  <div className="telemetry-cell">
                    <span>Last Visit</span>
                    <strong>{selectedPatientObj.last_visit || '—'}</strong>
                  </div>
                  <div className="telemetry-cell">
                    <span>Preferred Channel</span>
                    <strong>{selectedPatientObj.preferred_channel || 'WhatsApp'}</strong>
                  </div>
                  <div className="telemetry-cell">
                    <span>Booking Status</span>
                    <strong>{selectedPatientObj.booking_status === 'BOOKED' ? 'Confirmed' : 'Not booked'}</strong>
                  </div>
                </div>
              </div>

              <LiveResourceState resource={{ ...conversationsResource, data: rows }} label="conversation history">
                {rows.length === 0 ? (
                  <div className="panel conversation-empty-thread">
                    <div className="empty-thread-icon">
                      <Bot size={28} />
                    </div>
                    <h3>No logged messages for {selectedPatientObj.name}</h3>
                    <p>When automated outreach or incoming WhatsApp replies occur, dialogues will stream here in real-time.</p>
                  </div>
                ) : viewMode === 'timeline' ? (
                  <div className="panel conversation-timeline-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Conversation Stream</h2>
                        <p>Real-time dialogues & automated follow-ups.</p>
                      </div>
                      <span className="result-count">{rows.length} {rows.length === 1 ? 'message' : 'messages'}</span>
                    </div>

                    <div className="chat-window live-chat-window">
                      {rows.map((row, index) => {
                        const isInbound = row.direction === 'inbound';
                        return (
                          <div
                            className={'chat-row ' + (isInbound ? 'client' : 'ai')}
                            key={row.conversation_id || index}
                          >
                            <div className="chat-avatar">
                              {isInbound ? selectedPatientObj.initials.slice(0, 1) : <Bot size={14} />}
                            </div>
                            <div className="bubble-wrap">
                              <div className="chat-meta-header">
                                <span className="chat-author">
                                  {isInbound ? selectedPatientObj.name : 'Practice Assistant'}
                                </span>
                                {row.intent && (
                                  <StatusBadge kind={row.intent}>{formatIntentLabel(row.intent)}</StatusBadge>
                                )}
                              </div>
                              <div className="chat-bubble">{row.message}</div>
                              <div className="chat-meta-footer">
                                <span className="chat-time">{row.timestamp || 'Just now'}</span>
                                {row.response_time_seconds && (
                                  <span className="chat-latency">⚡ {row.response_time_seconds}s</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="panel table-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Raw Telemetry Records</h2>
                        <p>Tabular logs returned by n8n API.</p>
                      </div>
                    </div>
                    <LiveConversationTable rows={rows} openPatient={openPatient} />
                  </div>
                )}
              </LiveResourceState>

              {/* Collapsible Automation Signals */}
              <div className="collapsible-signals-card" style={{ marginTop: 14 }}>
                <button className="collapsible-signals-header" onClick={() => setSignalsOpen(!signalsOpen)}>
                  <span>Automation Signals & Diagnostics</span>
                  {signalsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {signalsOpen && (
                  <div className="collapsible-signals-body">
                    <div><span>Current State</span><br /><strong>{formatIntentLabel(selectedPatientObj.conversation_state)}</strong></div>
                    <div><span>Last Intent</span><br /><strong>{formatIntentLabel(selectedPatientObj.last_intent)}</strong></div>
                    <div><span>Channel</span><br /><strong>{selectedPatientObj.preferred_channel || 'WhatsApp'}</strong></div>
                    <div><span>Booking Intent</span><br /><strong>{selectedPatientObj.booking_status || 'NOT_BOOKED'}</strong></div>
                  </div>
                )}
              </div>

              {selectedPatientObj && (
                <InboundTestTray patient={selectedPatientObj} onRefresh={onRefresh} notify={notify} />
              )}
            </div>
          )}
        </section>

        {/* Panel C: Relevant action panel */}
        <aside className="action-sidebar-pane">
          <div className="panel action-panel">
            <span className="eyebrow">Desk Actions</span>
            <h3>Manage Conversation</h3>
            <p>Direct operational actions for this dialogue.</p>
            {selectedPatientObj && openPatient && (
              <button className="outline-button full-width-button" onClick={() => openPatient(selectedPatientObj.id)}>
                <UserRound size={14} /> Open client profile
              </button>
            )}
            <button
              className="outline-button full-width-button"
              disabled={actionLoading || !selectedPatientObj}
              onClick={async () => {
                if (!selectedPatientObj) return;
                setActionLoading(true);
                try {
                  if (apiConfig.demoMode) {
                    await api.updateTakeover(selectedPatientObj.id, 'Clinical Desk Staff', true).catch(() => null);
                    notify(`Patient ${selectedPatientObj.name} assigned to staff review queue`);
                    onRefresh?.();
                  } else {
                    await api.updateTakeover(selectedPatientObj.id, 'Clinical Desk Staff', true);
                    notify(`Patient ${selectedPatientObj.name} assigned to staff review queue`);
                    onRefresh?.();
                  }
                } catch (err) {
                  notify(`Unable to assign to staff: ${err.message}`);
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              <HeartPulse size={14} /> Assign to staff
            </button>
            <button
              className="outline-button full-width-button"
              disabled={actionLoading || !selectedPatientObj}
              onClick={async () => {
                if (!selectedPatientObj) return;
                setActionLoading(true);
                try {
                  const payload = {
                    patient_id: selectedPatientObj.id,
                    phone: selectedPatientObj.phone,
                    patient_name: selectedPatientObj.name,
                    service: selectedPatientObj.last_treatment || 'Clinical Consultation',
                    action: 'DISPATCH_BOOKING_LINK',
                    timestamp: new Date().toISOString()
                  };
                  if (apiConfig.demoMode) {
                    await api.createBooking(payload).catch(() => null);
                    notify(`Direct booking link dispatched to ${selectedPatientObj.name} (${selectedPatientObj.phone})`);
                    onRefresh?.();
                  } else {
                    await api.createBooking(payload);
                    notify(`Direct booking link successfully dispatched to ${selectedPatientObj.name}`);
                    onRefresh?.();
                  }
                } catch (err) {
                  notify(`Failed to dispatch booking link: ${err.message}`);
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              <Send size={14} /> {actionLoading ? 'Dispatching...' : 'Send booking link'}
            </button>
            <button
              className="primary-button full-width-button"
              disabled={actionLoading || !selectedPatientObj}
              onClick={async () => {
                if (!selectedPatientObj) return;
                setActionLoading(true);
                try {
                  if (apiConfig.demoMode) {
                    await api.updateTakeover(selectedPatientObj.id, 'Clinical Desk Staff', false).catch(() => null);
                    await api.updatePatient(selectedPatientObj.id, { conversation_state: 'RESOLVED' }).catch(() => null);
                    notify(`Dialogue for ${selectedPatientObj.name} marked as resolved`);
                    onRefresh?.();
                  } else {
                    await api.updateTakeover(selectedPatientObj.id, 'Clinical Desk Staff', false);
                    await api.updatePatient(selectedPatientObj.id, { conversation_state: 'RESOLVED' });
                    notify(`Dialogue for ${selectedPatientObj.name} marked as resolved`);
                    onRefresh?.();
                  }
                } catch (err) {
                  notify(`Unable to resolve conversation: ${err.message}`);
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              <Check size={14} /> Resolve conversation
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

function LiveConversationTimeline({ resource, patient, onRefresh }) {
  const rows = conversationRows(resource.data, patient.id);
  return (
    <LiveResourceState resource={{ ...resource, data: rows }} label="conversation">
      <div className="panel conversation-timeline-panel">
        <div className="section-heading">
          <div>
            <h2>Recent Dialogue History</h2>
            <p>Automated and inbound touchpoints for this client.</p>
          </div>
          <button className="outline-button-small" onClick={onRefresh}><RefreshCw size={13} /> Refresh</button>
        </div>
        <div className="chat-window">
          {rows.map((row, index) => {
            const isInbound = row.direction === 'inbound';
            return (
              <div className={'chat-row ' + (isInbound ? 'client' : 'ai')} key={row.conversation_id || index}>
                <div className="chat-avatar">{isInbound ? patient.initials.slice(0, 1) : <Bot size={14} />}</div>
                <div className="bubble-wrap">
                  <div className="chat-meta-header">
                    <span className="chat-author">{isInbound ? patient.name : 'Practice Assistant'}</span>
                    {row.intent && <StatusBadge kind={row.intent}>{formatIntentLabel(row.intent)}</StatusBadge>}
                  </div>
                  <div className="chat-bubble">{row.message}</div>
                  <div className="chat-meta-footer">
                    <span className="chat-time">{row.timestamp || 'Recent'}</span>
                    {row.response_time_seconds && <span className="chat-latency">⚡ {row.response_time_seconds}s</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="muted" style={{ padding: '24px 16px', textAlign: 'center' }}>No messages logged yet for this client.</p>
          )}
        </div>
      </div>
    </LiveResourceState>
  );
}

function LiveHandoffs({ resource, selectedCase, setSelectedCase, onResolved, onRetry }) {
  const rawRows = rowsFrom(resource.data);
  const rows = normalizeHandoffs(rawRows);
  const selected = rows.find((row) => row.id === selectedCase) || rows[0];

  return (
    <LiveResourceState resource={{ ...resource, data: rows }} label="staff review queue" onRetry={onRetry}>
      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>Staff review cases</h2>
            <p>Automations are paused until a staff member responds.</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="source-unavailable-card" style={{ border: 'none', margin: '20px 0' }}>
            <div className="source-unavailable-icon">
              <Check size={22} />
            </div>
            <h3>No staff review cases</h3>
            <p>Conversations requiring practice staff attention will appear here.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Phone</th>
                  <th>Reason</th>
                  <th>Last message</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Assigned to</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedCase(row.id)}>
                    <td><strong>{row.name || row.patientId}</strong></td>
                    <td className="muted">{row.phone || '—'}</td>
                    <td><strong>{row.reason}</strong></td>
                    <td className="message-cell">“{row.message}”</td>
                    <td><StatusBadge kind={row.status}>{row.status}</StatusBadge></td>
                    <td className="muted">{row.created}</td>
                    <td>{row.assigned}</td>
                    <td>
                      <button className="row-action">
                        Review <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </LiveResourceState>
  );
}

function LiveOffers({ resource }) {
  const rows = rowsFrom(resource.data);
  return (
    <LiveResourceState resource={{ ...resource, data: rows }} label="offers">
      <>
        <PageHeading eyebrow="Treatment Packages" title="Active Practice Offers" />
        <div className="intro-line">
          <p>Operational offer catalogue for returning clients. Automation presents only active, non-expired offers.</p>
          <span className="live-pill"><span /> Active offers only</span>
        </div>

        {/* Editorial Luxury Offers Grid */}
        <div className="offers-grid">
          {rows.map((row, index) => {
            const isActive = String(row.active).toLowerCase() === 'yes' || row.active === true;
            const rawPrice = String(row.price || '79').replace(/[^0-9]/g, '');
            return (
              <div className={'offer-luxury-card ' + (isActive ? 'active-offer' : '')} key={row.offer_id || index}>
                <div>
                  <div className="offer-card-top">
                    <div>
                      <span className="offer-treatment-tag">{row.treatment || 'Practice Treatment'}</span>
                      <h3 className="offer-card-title">{row.offer_name || 'Seasonal Offer'}</h3>
                    </div>
                    <StatusBadge kind={isActive ? 'active' : 'neutral'}>
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </StatusBadge>
                  </div>
                  <div className="offer-price-editorial">
                    <span className="currency-symbol">$</span>
                    <span>{rawPrice}</span>
                    <span className="cadence">/ {row.currency || 'USD'} promotional visit</span>
                  </div>
                  <p className="offer-card-desc">{row.description || 'Exclusive clinical package for returning clients.'}</p>
                </div>
                <div className="offer-card-footer">
                  <span>Valid until: <strong>{row.valid_until || 'Ongoing'}</strong></span>
                  <span className="gold-code">ID: {row.offer_id || 'OF00' + (index + 1)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <section className="panel table-panel">
          <div className="section-heading">
            <div>
              <h2>Audit Data Log</h2>
              <p>Raw records synced directly from n8n & Google Sheets CRM.</p>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Treatment</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Valid until</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const isActive = String(row.active).toLowerCase() === 'yes' || row.active === true;
                  return (
                    <tr key={row.offer_id || index}>
                      <td><strong>{row.offer_name || '—'}</strong></td>
                      <td>{row.treatment || '—'}</td>
                      <td>{row.description || '—'}</td>
                      <td><strong>{row.price || '—'} {row.currency || 'USD'}</strong></td>
                      <td>{row.valid_until || '—'}</td>
                      <td>
                        <StatusBadge kind={isActive ? 'active' : 'neutral'}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </>
    </LiveResourceState>
  );
}

function Campaigns({ notify }) {
  const isDemo = apiConfig.demoMode;

  // Live resources (only fetched in live mode)
  const clientsRes = useLiveResource(!isDemo ? 'camp-clients' : null, !isDemo ? api.getClients : null);
  const offersRes = useLiveResource(!isDemo ? 'camp-offers' : null, !isDemo ? api.getOffers : null);
  const convsRes = useLiveResource(!isDemo ? 'camp-convs' : null, !isDemo ? api.getGlobalConversations : null);
  const configRes = useLiveResource(!isDemo ? 'camp-config' : null, !isDemo ? api.getConfig : null);

  const rawConfig = !isDemo ? (objectFrom(configRes.data).config || objectFrom(configRes.data)) : {};
  const allPatients = isDemo ? patients : rowsFrom(clientsRes.data).map(livePatient);
  const rawOffers = isDemo ? offers : rowsFrom(offersRes.data);
  const activeOffers = rawOffers.filter(o => o.active === true || String(o.active).toUpperCase() === 'YES');
  const safeOffers = activeOffers.length > 0 ? activeOffers : [
    { id: 'OF001', offer_id: 'OF001', name: 'Returning Client Facial', offer_name: 'Returning Client Facial', treatment: 'Signature Facial', price: '$79', window: 'Sep 1 - Oct 31, 2026', valid_until: 'Oct 31, 2026', active: true }
  ];

  const rawConversations = isDemo ? conversations : rowsFrom(convsRes.data);

  // Timezone and date calculations (Asia/Kolkata)
  const tz = rawConfig.business_timezone || 'Asia/Kolkata';
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());

  // Count sent today from conversation history
  const sentToday = rawConversations.filter(c => {
    const isOut = String(c.direction || '').toLowerCase() === 'outbound';
    const ts = String(c.timestamp || c.activity || '');
    return isOut && (ts.startsWith(todayStr) || ts.includes('Today') || ts.includes('min ago'));
  }).length;

  // Daily limit: backend safety cap 25, never bypassable by frontend
  const dailyLimit = Math.min(Number(rawConfig.daily_outbound_limit || 25), 25);
  const remainingToday = Math.max(0, dailyLimit - sentToday);
  const hardRunCap = 25;
  const maxSelectable = Math.min(hardRunCap, remainingToday);

  // Eligibility evaluation for each patient
  const patientEligibilityMap = new Map();
  allPatients.forEach(p => {
    const optOut = String(p.opt_out || '').toUpperCase() === 'YES';
    const phoneDigits = String(p.phone || '').replace(/\D/g, '');
    const hasValidPhone = phoneDigits.length >= 10;
    const isBooked = String(p.booking_status || p.booking || '').toUpperCase() === 'BOOKED';
    const isHumanHandoff = String(p.conversation_state || p.state || '').toUpperCase() === 'HUMAN_REQUIRED';
    
    const pId = String(p.patient_id || p.id || '').trim();
    const contactedToday = rawConversations.some(c => {
      const cid = String(c.patient_id || c.patientId || '').trim();
      const ts = String(c.timestamp || c.activity || '');
      return cid === pId && (ts.startsWith(todayStr) || ts.includes('Today') || ts.includes('min ago'));
    });

    const days = Number(p.days_inactive ?? p.days ?? 0);
    const meetsInactivity = p.reactivation_eligible === true || p.reactivation_eligible === 'YES' || p.eligible === true || days >= 60;

    let reason = null;
    if (optOut) reason = 'Opted out of communications';
    else if (!hasValidPhone) reason = 'Missing / invalid phone number';
    else if (isBooked) reason = 'Appointment already booked';
    else if (isHumanHandoff) reason = 'In clinical human handoff';
    else if (contactedToday) reason = 'Already contacted today';
    else if (!meetsInactivity) reason = 'Below inactivity threshold (<60d)';

    patientEligibilityMap.set(p.id, {
      eligible: !reason,
      reason,
      optOut,
      hasValidPhone,
      isBooked,
      isHumanHandoff,
      contactedToday,
      days
    });
  });

  const totalEligible = allPatients.filter(p => patientEligibilityMap.get(p.id)?.eligible).length;

  // Local selection & filter state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState(safeOffers[0]?.id || safeOffers[0]?.offer_id || 'OF001');
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState(null);

  // Keep selected offer synchronized
  const currentOffer = safeOffers.find(o => (o.id || o.offer_id) === selectedOfferId) || safeOffers[0];

  // Filtered patients
  const filteredPatients = allPatients.filter(p => {
    const el = patientEligibilityMap.get(p.id) || {};
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      String(p.id).toLowerCase().includes(search.toLowerCase()) ||
      String(p.phone || '').includes(search) ||
      String(p.treatment || p.last_treatment || '').toLowerCase().includes(search.toLowerCase()) ||
      String(p.visit || p.last_visit || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'ALL') return true;
    if (filterTab === 'ELIGIBLE') return el.eligible;
    if (filterTab === 'INELIGIBLE') return !el.eligible;
    if (filterTab === 'CONTACTED_TODAY') return el.contactedToday;
    if (filterTab === 'OPTED_OUT') return el.optOut;
    return true;
  });

  // Toggle selection with safety guardrail enforcement
  const toggleSelect = (patientId) => {
    const el = patientEligibilityMap.get(patientId);
    if (!el || !el.eligible) {
      notify?.(`Cannot select: ${el?.reason || 'Customer is ineligible'}`);
      return;
    }

    if (selectedIds.includes(patientId)) {
      setSelectedIds(prev => prev.filter(id => id !== patientId));
    } else {
      if (selectedIds.length >= maxSelectable) {
        notify?.(`Safety limit reached! You cannot select more than ${maxSelectable} recipients for today's run.`);
        return;
      }
      setSelectedIds(prev => [...prev, patientId]);
    }
  };

  // Select all eligible up to the limit
  const selectAllEligible = () => {
    if (maxSelectable === 0) {
      notify?.("Today's daily outbound quota has been reached.");
      return;
    }
    const eligiblePool = allPatients.filter(p => patientEligibilityMap.get(p.id)?.eligible);
    const capped = eligiblePool.slice(0, maxSelectable).map(p => p.id);
    setSelectedIds(capped);
    notify?.(`Selected ${capped.length} eligible recipients (capped at safety limit of ${maxSelectable}).`);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Pre-launch modal trigger
  const handleOpenLaunchModal = () => {
    if (selectedIds.length === 0) {
      notify?.('Please select at least 1 customer before launching campaign.');
      return;
    }
    if (selectedIds.length > maxSelectable) {
      notify?.(`Selected count (${selectedIds.length}) exceeds daily limit (${maxSelectable}).`);
      return;
    }
    setRunError(null);
    setShowConfirmModal(true);
  };

  // Execute campaign run
  const executeCampaign = async () => {
    setIsSubmitting(true);
    setRunError(null);
    setShowConfirmModal(false);

    if (isDemo) {
      await new Promise(r => setTimeout(r, 1200));
      const campId = 'CAMP-' + todayStr.replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const workspaceResult = {
        success: true,
        campaign_id: campId,
        status: 'QUEUED',
        requested: selectedIds.length,
        accepted: selectedIds.length,
        skipped: 0,
        daily_limit: dailyLimit,
        sent_today_before_run: sentToday,
        remaining_after_run: Math.max(0, remainingToday - selectedIds.length),
        results: selectedIds.map(id => ({ patient_id: id, status: 'QUEUED', reason: null }))
      };
      setRunResult(workspaceResult);
      setIsSubmitting(false);
      notify?.(`Campaign ${campId} launched! ${selectedIds.length} messages queued.`);
      return;
    }

    try {
      const payload = {
        source: 'aurevia-practice-os',
        campaign_name: 'Returning Patient Reactivation',
        requested_at: new Date().toISOString(),
        customer_ids: selectedIds.slice(0, 25),
        max_recipients: 25,
        offer_id: currentOffer.id || currentOffer.offer_id,
        timezone: tz,
        dry_run: false
      };
      const res = await api.startOutboundCampaign(payload);
      setRunResult(res);
      notify?.(`Campaign ${res.campaign_id || 'launched'} accepted by n8n! ${res.accepted || selectedIds.length} queued.`);
    } catch (err) {
      setRunError(err.message);
      notify?.(`Campaign launch failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic preview text using verified offer
  const previewOfferName = currentOffer.treatment || currentOffer.offer_name || currentOffer.name || 'Returning Client Facial';
  const previewPrice = currentOffer.price ? (String(currentOffer.price).startsWith('$') ? currentOffer.price : '$' + currentOffer.price) : '$79';
  const previewDate = currentOffer.valid_until || currentOffer.window || 'this month';
  const fallbackSamplePatient = { id: 'P0001', name: 'Sarah Williams', initials: 'SW', tone: 'sage' };
  const previewSamplePatient = (selectedIds.length > 0 ? allPatients.find(p => selectedIds.includes(p.id)) : null) || allPatients[0] || fallbackSamplePatient;
  const sampleFirstName = previewSamplePatient?.name ? previewSamplePatient.name.split(' ')[0] : 'Sarah';
  const previewMessage = `Hi ${sampleFirstName} 😊 We haven't seen you in a little while. We have a returning-client ${previewOfferName} available for ${previewPrice} through ${previewDate}. Would you like me to send you the booking link?`;

  return (
    <>
      <PageHeading eyebrow="Autonomous Outreach Engine" title="Outbound Campaigns">
        <div className="button-row">
          <button
            className="primary-button"
            onClick={handleOpenLaunchModal}
            disabled={isSubmitting || selectedIds.length === 0}
          >
            <Zap size={15} /> {isSubmitting ? 'Queueing Outreach...' : `Review & Launch Campaign (${selectedIds.length})`}
          </button>
        </div>
      </PageHeading>

      <div className="intro-line">
        <p>Target returning clients with verified practice offers. Server-side guardrails enforce hard daily limits, opt-out compliance, and rate-limited WhatsApp sending.</p>
        <span className="live-pill"><span /> Hard Cap: 25 Daily Limit</span>
      </div>

      {/* Top Usage & Quota Metrics Strip */}
            {/* 3-Stage Linear Campaign Workflow */}
      <nav className="campaign-steps-nav">
        <div className="campaign-step-bar step-active">
          <span className="campaign-step-bar-num">1</span>
          <div className="campaign-step-bar-info">
            <strong>Audience &amp; Eligibility</strong>
            <span>Filtered {filteredPatients.length} clients · {selectedIds.length} selected</span>
          </div>
        </div>
        <div className={'campaign-step-bar ' + (selectedIds.length > 0 ? 'step-active' : '')}>
          <span className="campaign-step-bar-num">2</span>
          <div className="campaign-step-bar-info">
            <strong>Offer &amp; Message Preview</strong>
            <span>{currentOffer.name || currentOffer.offer_name || 'Verified Package'}</span>
          </div>
        </div>
        <div className={'campaign-step-bar ' + (selectedIds.length > 0 ? 'step-active' : '')}>
          <span className="campaign-step-bar-num">3</span>
          <div className="campaign-step-bar-info">
            <strong>Dispatch &amp; Safety Checks</strong>
            <span>Hard cap 25/day · 1 msg/15s safe pacing</span>
          </div>
        </div>
      </nav>

      <section className="campaign-usage-strip">
        <div className="usage-metric-card">
          <span className="metric-label"><ShieldCheck size={14} /> Daily Outbound Limit</span>
          <strong>{dailyLimit}</strong>
          <span className="metric-sub">Backend safety threshold</span>
        </div>

        <div className="usage-metric-card">
          <span className="metric-label"><Send size={14} /> Sent Today</span>
          <strong>{sentToday}</strong>
          <span className="metric-sub">Audited WhatsApp dispatches</span>
        </div>

        <div className="usage-metric-card">
          <span className="metric-label"><Clock3 size={14} /> Remaining Today</span>
          <strong style={{ color: remainingToday === 0 ? 'var(--rose)' : 'var(--ink)' }}>{remainingToday}</strong>
          <span className="metric-sub">Capacity left for today</span>
        </div>

        <div className="usage-metric-card">
          <span className="metric-label"><Users size={14} /> Eligible Pool</span>
          <strong>{totalEligible}</strong>
          <span className="metric-sub">60+ days inactive & opted-in</span>
        </div>

        <div className="usage-metric-card accent">
          <span className="metric-label"><CheckCircle2 size={14} /> Selected for Run</span>
          <strong>{selectedIds.length} <span style={{ fontSize: 14, fontWeight: 500 }}>/ {maxSelectable}</span></strong>
          <div className="usage-progress-bar">
            <span style={{ width: `${Math.min(100, (selectedIds.length / (maxSelectable || 1)) * 100)}%` }} />
          </div>
          <span className="metric-sub">Max {maxSelectable} selectable</span>
        </div>
      </section>

      {/* Error alert if n8n rejects */}
      {runError && (
        <div className="api-banner api-banner-error" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} />
          <div>
            <strong>Campaign Request Rejected by n8n</strong>
            <p style={{ margin: '2px 0 0', fontSize: 11.5 }}>{runError}</p>
          </div>
          <button className="text-button" onClick={() => setRunError(null)}>Dismiss</button>
        </div>
      )}

      {/* Campaign Run Results Card */}
      {runResult && (
        <section className="campaign-result-panel">
          <div className="result-header-row">
            <div>
              <span className="eyebrow">Outbound Dispatch Telemetry</span>
              <h2 style={{ margin: '4px 0 0', fontSize: 17 }}>Campaign Run Submitted Successfully</h2>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="run-id-pill">{runResult.campaign_id}</span>
              <StatusBadge kind="active">{runResult.status || 'QUEUED'}</StatusBadge>
              <button className="outline-button-small" onClick={() => setRunResult(null)}>
                Dismiss
              </button>
            </div>
          </div>

          <div className="result-stats-row">
            <div className="result-stat-item">
              <span>Requested</span>
              <strong>{runResult.requested}</strong>
            </div>
            <div className="result-stat-item">
              <span>Accepted / Queued</span>
              <strong style={{ color: '#2b6a41' }}>{runResult.accepted}</strong>
            </div>
            <div className="result-stat-item">
              <span>Skipped</span>
              <strong style={{ color: runResult.skipped > 0 ? '#b35952' : '#67736b' }}>{runResult.skipped}</strong>
            </div>
            <div className="result-stat-item">
              <span>Sent Today</span>
              <strong>{runResult.sent_today_before_run ?? sentToday}</strong>
            </div>
            <div className="result-stat-item">
              <span>Remaining Quota</span>
              <strong>{runResult.remaining_after_run ?? Math.max(0, remainingToday - selectedIds.length)}</strong>
            </div>
          </div>

          <div className="result-recipients-list">
            {(runResult.results || []).map((r, i) => {
              const pObj = allPatients.find(p => p.id === r.patient_id);
              return (
                <div key={r.patient_id || i} className="result-recipient-row">
                  <div>
                    <strong>{r.patient_id}</strong> · {pObj?.name || 'Customer'} <span className="muted">({pObj?.phone || '—'})</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {r.reason && <span className="ineligible-reason-tag">{r.reason}</span>}
                    <StatusBadge kind={r.status === 'QUEUED' ? 'active' : 'neutral'}>{r.status}</StatusBadge>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Campaign Stage: Recipient Selector on Left, Config & Preview on Right */}
      <div className="campaign-stage-layout">
        {/* Left: Recipient Directory Table */}
        <section className="panel campaign-table-panel">
          <div className="campaign-toolbar">
            <div className="campaign-toolbar-left">
              <div className="campaign-search-box">
                <Search size={14} />
                <input
                  placeholder="Search name, phone, patient ID, treatment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="clear-search-btn" onClick={() => setSearch('')}>
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="campaign-filter-tabs">
                {[
                  ['ALL', `All (${allPatients.length})`],
                  ['ELIGIBLE', `Eligible (${totalEligible})`],
                  ['INELIGIBLE', `Ineligible (${allPatients.length - totalEligible})`],
                  ['CONTACTED_TODAY', 'Contacted Today'],
                  ['OPTED_OUT', 'Opted Out']
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className={`campaign-filter-tab ${filterTab === key ? 'active' : ''}`}
                    onClick={() => setFilterTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="campaign-toolbar-right">
              <button
                className="outline-button-small"
                onClick={selectAllEligible}
                disabled={maxSelectable === 0}
                title={`Select eligible customers up to daily limit (${maxSelectable})`}
              >
                Select All Eligible
              </button>
              {selectedIds.length > 0 && (
                <button className="text-button" onClick={clearSelection}>
                  Clear
                </button>
              )}
              <span className={`selection-pill ${selectedIds.length >= maxSelectable && maxSelectable > 0 ? 'limit-reached' : ''}`}>
                {selectedIds.length} of {maxSelectable} selected
              </span>
            </div>
          </div>

          <div className="table-scroll">
            <table className="campaign-recipients-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>Select</th>
                  <th>Customer</th>
                  <th>Patient ID</th>
                  <th>Phone</th>
                  <th>Previous Treatment</th>
                  <th>Last Visit</th>
                  <th>Inactive</th>
                  <th>Eligibility</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => {
                  const el = patientEligibilityMap.get(p.id) || {};
                  const isChecked = selectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`${!el.eligible ? 'row-ineligible' : ''} ${isChecked ? 'row-selected' : ''}`}
                      onClick={() => el.eligible && toggleSelect(p.id)}
                      style={{ cursor: el.eligible ? 'pointer' : 'not-allowed' }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="campaign-checkbox"
                          checked={isChecked}
                          disabled={!el.eligible || (!isChecked && selectedIds.length >= maxSelectable)}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td>
                        <div className="person-cell">
                          <Avatar patient={p} />
                          <strong>{p.name}</strong>
                        </div>
                      </td>
                      <td><code>{p.id}</code></td>
                      <td className="muted">{p.phone || '—'}</td>
                      <td>{p.treatment || p.last_treatment || '—'}</td>
                      <td>{p.visit || p.last_visit || '—'}</td>
                      <td><strong>{el.days ? `${el.days}d` : '—'}</strong></td>
                      <td>
                        {el.eligible ? (
                          <StatusBadge kind="eligible">ELIGIBLE</StatusBadge>
                        ) : (
                          <div>
                            <StatusBadge kind="neutral">INELIGIBLE</StatusBadge>
                            {el.reason && (
                              <div className={`ineligible-reason-tag ${el.contactedToday ? 'contacted-today-tag' : ''}`}>
                                {el.reason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge kind={p.conversation_state || p.state || 'neutral'}>
                          {p.conversation_state || p.state || 'READY'}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}

                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                      No customers match the current search query or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Offer Selector & Dynamic WhatsApp Message Preview */}
        <aside className="campaign-config-side">
          {/* Active Offer Selector */}
          <div className="offer-selector-card">
            <div className="section-heading">
              <div>
                <h2>Campaign Offer</h2>
                <p>Select verified practice offer.</p>
              </div>
              <Sparkles size={16} className="gold-icon" />
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Active Offer Library
            </label>
            <select
              className="offer-picker-dropdown"
              value={selectedOfferId}
              onChange={(e) => setSelectedOfferId(e.target.value)}
            >
              {safeOffers.map(o => (
                <option key={o.id || o.offer_id} value={o.id || o.offer_id}>
                  {o.name || o.offer_name} ({o.price ? (String(o.price).startsWith('$') ? o.price : '$' + o.price) : 'Custom'})
                </option>
              ))}
            </select>

            <div className="offer-detail-banner">
              <strong>{currentOffer.treatment || currentOffer.name || currentOffer.offer_name}</strong>
              <span>{currentOffer.description || 'Exclusive returning-client treatment.'}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span className="offer-price-tag">{previewPrice}</span>
                <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Valid: {previewDate}</span>
              </div>
            </div>

            <span style={{ fontSize: 10.5, color: 'var(--muted)', display: 'block', lineHeight: 1.4 }}>
              🔒 <strong>Audit Rule:</strong> AI uses verified offer details only. Pricing, booking URLs, and discounts are never hallucinated.
            </span>
          </div>

          {/* Dynamic Message Preview */}
          <div className="offer-selector-card">
            <div className="section-heading">
              <div>
                <h2>Message Preview</h2>
                <p>Personalized WhatsApp draft.</p>
              </div>
              <MessageCircle size={16} className="sage-icon" />
            </div>

            <div className="campaign-preview-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Avatar patient={previewSamplePatient} size="small" />
                <strong style={{ fontSize: 12 }}>Recipient: {previewSamplePatient?.name || 'Sample Patient'}</strong>
              </div>
              <div className="preview-bubble-text">{previewMessage}</div>
              <div className="preview-meta-footer">
                <Clock3 size={11} /> <span>Pacing: 5-7s safe delay between dispatches</span>
              </div>
            </div>

            <button
              className="primary-button"
              style={{ width: '100%', marginTop: 14 }}
              onClick={handleOpenLaunchModal}
              disabled={isSubmitting || selectedIds.length === 0}
            >
              <Zap size={14} /> Review & Launch ({selectedIds.length} Selected)
            </button>
          </div>

          {/* Guardrails & Safety Rules */}
          <div className="guardrail-card">
            <h3><ShieldCheck size={14} /> Outbound Safety Guardrails</h3>
            <div className="guardrail-item">
              <Check size={13} />
              <span><strong>Hard Cap 25/day:</strong> System blocks sending to 50+ recipients to protect WhatsApp sender reputation.</span>
            </div>
            <div className="guardrail-item">
              <Check size={13} />
              <span><strong>Anti-Spam Cooldown:</strong> Automatically excludes patients contacted within the last 7 days.</span>
            </div>
            <div className="guardrail-item">
              <Check size={13} />
              <span><strong>Opt-Out Protection:</strong> Inactive or unsubscribed clients cannot be selected.</span>
            </div>
            <div className="guardrail-item">
              <Check size={13} />
              <span><strong>Business Hours:</strong> Outbound queue only dispatches between 10:00 AM - 7:00 PM Asia/Kolkata.</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="campaign-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="campaign-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Confirm Outbound Reactivation Run</h2>
              <button className="icon-button" onClick={() => setShowConfirmModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-summary-grid">
              <div className="modal-summary-cell">
                <span>Selected Recipients</span>
                <strong style={{ color: 'var(--sage-deep)', fontSize: 18 }}>{selectedIds.length} Patients</strong>
              </div>
              <div className="modal-summary-cell">
                <span>Daily Limit & Remaining</span>
                <strong>{dailyLimit} Max ({remainingToday - selectedIds.length} Left)</strong>
              </div>
              <div className="modal-summary-cell">
                <span>Estimated Send Duration</span>
                <strong>~{Math.max(1, Math.round(selectedIds.length * 6))} Seconds</strong>
              </div>
              <div className="modal-summary-cell">
                <span>Verified Offer</span>
                <strong>{currentOffer.name || currentOffer.offer_name} ({previewPrice})</strong>
              </div>
            </div>

            <div className="campaign-preview-box">
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                Preview of Dispatched Message
              </span>
              <div className="preview-bubble-text" style={{ margin: '6px 0 0' }}>
                {previewMessage}
              </div>
            </div>

            <div className="modal-disclaimer">
              <ShieldCheck size={16} />
              <div>
                <strong>Automated Rate-Limiting Protection:</strong>
                <p style={{ margin: '2px 0 0', fontSize: 10.5 }}>
                  Messages will be queued through n8n with randomized delays between sends. Duplicate contacts within 7 days, opted-out clients, and active bookings are server-side suppressed.
                </p>
              </div>
            </div>

            <div className="modal-action-row">
              <button
                className="outline-button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Cancel / Edit List
              </button>
              <button
                className="primary-button"
                onClick={executeCampaign}
                disabled={isSubmitting}
              >
                <Zap size={14} /> {isSubmitting ? 'Starting Run...' : 'Confirm & Launch Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LiveSettings({ notify }) {
  const resource = useLiveResource('config', api.getConfig);
  const configRows = rowsFrom(resource.data);
  const configPayload = objectFrom(resource.data);
  const rawConfig = configRows.length
    ? Object.fromEntries(configRows.map((row) => [row.key, row.value]))
    : (configPayload.config || configPayload);
  const config = rawConfig && typeof rawConfig === 'object' && !Array.isArray(rawConfig) ? rawConfig : {};
  const configValueCount = Object.keys(config).length;

  return (
    <LiveResourceState resource={resource} label="configuration">
      <>
        <PageHeading eyebrow="Workspace Configuration" title="Practice Settings" />
        <div className="intro-line">
          <p>Review the values returned by the selected clinic’s configuration source.</p>
          <span className="live-pill"><span /> Configuration loaded</span>
        </div>
        <div className="settings-readiness-strip">
          <div><span className="settings-strip-label">Values returned</span><strong>{configValueCount}</strong></div>
          <div><span className="settings-strip-label">Booking URL</span><strong>{config.booking_url ? 'Configured' : 'Not configured'}</strong></div>
          <div><span className="settings-strip-label">Preferred channel</span><strong>{config.preferred_channel || 'Not configured'}</strong></div>
        </div>
        <div className="settings-sections-wrap">
          <section className="settings-section-card">
            <div className="settings-section-header">
              <h2>Practice profile</h2>
              <p>Core practice identity referenced across conversational automations.</p>
            </div>
            <div className="settings-field-grid">
              <label className="setting-field"><span>Practice name</span><input value={config.spa_name || 'Not configured'} readOnly /></label>
              <label className="setting-field"><span>Currency</span><input value={config.currency || 'Not configured'} readOnly /></label>
              <label className="setting-field"><span>Reactivation threshold</span><input value={config.reactivation_days ? `${config.reactivation_days} days` : 'Not configured'} readOnly /></label>
              <label className="setting-field"><span>Campaign name</span><input value={config.campaign_name || 'Not configured'} readOnly /></label>
            </div>
          </section>

          <section className="settings-section-card">
            <div className="settings-section-header">
              <h2>Booking & scheduling</h2>
              <p>Verified booking URL delivered by the automation.</p>
            </div>
            <div className="settings-field-grid">
              <label className="setting-field">
                <span>Booking URL</span>
                <input value={config.booking_url || 'Not configured'} readOnly />
              </label>
            </div>
          </section>

          <section className="settings-section-card">
            <div className="settings-section-header">
              <h2>Messaging & channel</h2>
              <p>Configured channel and dispatch limits.</p>
            </div>
            <div className="settings-field-grid">
              <label className="setting-field"><span>Preferred channel</span><input value={config.preferred_channel || 'Not configured'} readOnly /></label>
              <label className="setting-field"><span>Max daily outbound</span><input value="25 recipients / day (system cap)" readOnly /></label>
              <label className="setting-field"><span>Inter-message pacing</span><input value="5–7 seconds" readOnly /></label>
            </div>
          </section>

          <section className="settings-section-card">
            <div className="settings-section-header">
              <h2>Automation connection</h2>
              <p>Webhook paths used by this workspace. Credentials are not displayed here.</p>
            </div>
            {[
              ['n8n Endpoint', apiConfig.baseUrl ? 'Configured' : 'Not configured'],
              ['Inbound Reply', apiConfig.webhooks.incomingWhatsApp],
              ['Outbound Outreach', apiConfig.webhooks.outboundCampaign],
              ['Staff Review Handoffs', apiConfig.webhooks.humanHandoffs],
              ['CRM Source', 'Google Sheets through n8n']
            ].map(([label, value]) => (
              <div className="connection-row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <section className="settings-section-card">
            <div className="settings-section-header">
              <h2>Staff review</h2>
              <p>Handling and escalation parameters.</p>
            </div>
            <div className="settings-field-grid">
              <label className="setting-field"><span>Handoff sheet</span><input defaultValue="Human Handoffs" disabled /></label>
              <label className="setting-field"><span>Escalation rules</span><input defaultValue="Adverse reactions, complaints, medical questions" disabled /></label>
            </div>
          </section>
        </div>
        <div style={{ marginTop: 22 }}>
          <InboundTestPanel notify={notify} />
        </div>
      </>
    </LiveResourceState>
  );
}

function InboundTestPanel({ notify }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setStatus('loading');
    setError('');
    if (apiConfig.demoMode) {
      setStatus('success');
      setMessage('');
      notify('Inbound test message simulated');
      return;
    }
    try {
      await api.sendInboundTest('+1 555 010 0001', message.trim());
      setStatus('success');
      setMessage('');
      notify('Inbound message accepted by n8n');
    } catch (requestError) {
      setStatus('error');
      setError(requestError.message);
    }
  };

  return (
    <section className="panel settings-panel">
      <div className="section-heading">
        <div>
          <h2>WhatsApp response tester</h2>
          <p>{apiConfig.demoMode ? 'Preview messages are simulated and never sent to n8n.' : 'Dispatches a controlled inbound WhatsApp payload to n8n.'}</p>
        </div>
        <MessageCircle size={18} className="sage-icon" />
      </div>
      <form onSubmit={submit}>
        <label className="setting-field">
          <span>Test message text</span>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type an inbound client inquiry or response..." />
        </label>
        <button className="primary-button" type="submit" disabled={status === 'loading' || !message.trim()}>
          {status === 'loading' ? 'Sending...' : apiConfig.demoMode ? 'Simulate test reply' : 'Send test reply'} <Send size={15} />
        </button>
      </form>
      {status === 'success' && <p className="status-text">{apiConfig.demoMode ? 'Test message simulated.' : 'n8n accepted the inbound message.'}</p>}
      {status === 'error' && <p className="api-error-text">Inbound message failed: {error}</p>}
    </section>
  );
}

function SettingsPage({ notify }) {
  return <><ExistingSettingsPage /><InboundTestPanel notify={notify} /></>;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppErrorBoundary><App /></AppErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);

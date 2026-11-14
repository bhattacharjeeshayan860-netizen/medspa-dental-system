import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Sparkles, QrCode, Ticket, Check, ChevronRight, RotateCcw, 
  Flame, Droplets, Shield, HeartPulse, Volume2, VolumeX, X,
  Clock, ArrowUpRight, Zap
} from 'lucide-react';

const RESTORATION_PROTOCOLS = [
  {
    id: 'proto-glow',
    name: 'Luminous Cellular Glow',
    category: 'Aesthetic Restoration',
    duration: '45 min',
    dialDegree: 0,
    phosphorColor: '#f59e0b',
    activeIngredients: ['Tri-Peptide Copper', 'Hyaluronic Acid Micro-Droplets', 'Photonic 633nm LED'],
    targetOutcome: 'Instant epidermal radiance and cellular revitalization',
    voucherValue: '$85 Credit',
    codePrefix: 'AUR-LUM'
  },
  {
    id: 'proto-fascia',
    name: 'Deep Fascial Decompression',
    category: 'Restorative Wellness',
    duration: '60 min',
    dialDegree: 90,
    phosphorColor: '#10b981',
    activeIngredients: ['Sub-Zero Magnesium Mist', 'Hyperbaric Oxygen', 'Percussive Alignment'],
    targetOutcome: 'Complete somatic tension release & lymph drainage',
    voucherValue: '$95 Credit',
    codePrefix: 'AUR-FAS'
  },
  {
    id: 'proto-barrier',
    name: 'Clinical Barrier Infusion',
    category: 'Medical Dermatology',
    duration: '50 min',
    dialDegree: 180,
    phosphorColor: '#06b6d4',
    activeIngredients: ['Ceramide Complex III', 'Centella Bio-Ferment', 'Thermal Cryo-Shield'],
    targetOutcome: 'Rapid stratum corneum repair & reactive soothing',
    voucherValue: '$75 Credit',
    codePrefix: 'AUR-BAR'
  },
  {
    id: 'proto-ortho',
    name: 'Enamel Mineralization Scan',
    category: 'Cosmetic Dentistry',
    duration: '30 min',
    dialDegree: 270,
    phosphorColor: '#8b5cf6',
    activeIngredients: ['Nano-Hydroxyapatite', 'Bio-Glass Matrix', '3D Photogrammetric Scan'],
    targetOutcome: 'Structural remineralization & cosmetic shade mapping',
    voucherValue: '$110 Credit',
    codePrefix: 'AUR-MIN'
  }
];

const INITIAL_TICKETS = [
  {
    id: 'TCK-801',
    patientName: 'Victoria Sterling',
    treatment: 'Luminous Cellular Glow',
    room: 'Suite 04 (Restoration)',
    time: '2m ago',
    status: 'suite_prepared', // 'awaiting_intake', 'suite_prepared', 'in_session', 'completed'
    voucherCode: 'AUR-LUM-9421',
    value: '$85 Credit'
  },
  {
    id: 'TCK-802',
    patientName: 'Harrison Cole',
    treatment: 'Deep Fascial Decompression',
    room: 'Suite 02 (Body)',
    time: '8m ago',
    status: 'in_session',
    voucherCode: 'AUR-FAS-3108',
    value: '$95 Credit'
  },
  {
    id: 'TCK-803',
    patientName: 'Elena Rostova',
    treatment: 'Enamel Mineralization Scan',
    room: 'Operatory 01 (Dental)',
    time: '14m ago',
    status: 'awaiting_intake',
    voucherCode: 'AUR-MIN-5520',
    value: '$110 Credit'
  }
];

export function PatientScanExperience({ onClose, isModal = false }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dialAngle, setDialAngle] = useState(0);
  const [isDispensing, setIsDispensing] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [guestPhone, setGuestPhone] = useState('');
  const [activeTab, setActiveTab] = useState('dial'); // 'dial' | 'ticket_rail' | 'qr_scanner'
  const audioCtxRef = useRef(null);

  const currentProtocol = RESTORATION_PROTOCOLS[selectedIdx];

  // Synthesized mechanical click sound (Web Audio API, no external files)
  const playMechanicalTick = useCallback((freq = 520, duration = 0.035, type = 'triangle') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Rotate dial to specific protocol
  const handleSelectProtocol = (idx) => {
    setSelectedIdx(idx);
    setDialAngle(RESTORATION_PROTOCOLS[idx].dialDegree);
    playMechanicalTick(740, 0.045, 'sine');
  };

  // Keyboard navigation for rotary dial (Accessibility requirement)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (selectedIdx + 1) % RESTORATION_PROTOCOLS.length;
      handleSelectProtocol(nextIdx);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (selectedIdx - 1 + RESTORATION_PROTOCOLS.length) % RESTORATION_PROTOCOLS.length;
      handleSelectProtocol(prevIdx);
    } else if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  // Dispense treatment voucher (delight moment)
  const handleDispenseVoucher = () => {
    setIsDispensing(true);
    playMechanicalTick(880, 0.08, 'sine');

    setTimeout(() => {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newVoucher = {
        code: `${currentProtocol.codePrefix}-${randomSuffix}`,
        protocol: currentProtocol.name,
        value: currentProtocol.voucherValue,
        duration: currentProtocol.duration,
        issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        phone: guestPhone || '+1 (555) 392-1084'
      };
      setActiveVoucher(newVoucher);
      setIsDispensing(false);
      playMechanicalTick(1100, 0.12, 'triangle');

      // Add as live physical ticket on staff rail
      const newTicket = {
        id: `TCK-${800 + tickets.length + 1}`,
        patientName: guestPhone ? `Patient (${guestPhone.slice(-4)})` : 'Walk-In Guest (Lounge)',
        treatment: currentProtocol.name,
        room: 'Consultation Lounge',
        time: 'Just now',
        status: 'awaiting_intake',
        voucherCode: newVoucher.code,
        value: currentProtocol.voucherValue
      };
      setTickets(prev => [newTicket, ...prev]);
    }, 450);
  };

  // Advance ticket status on physical rail
  const handleAdvanceTicket = (ticketId) => {
    playMechanicalTick(660, 0.05, 'triangle');
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const nextStatus = 
        t.status === 'awaiting_intake' ? 'suite_prepared' :
        t.status === 'suite_prepared' ? 'in_session' :
        t.status === 'in_session' ? 'completed' : 'completed';
      return { ...t, status: nextStatus };
    }));
  };

  return (
    <div 
      className={`scan-experience-container ${isModal ? 'modal-surface' : 'standalone-surface'}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Aurevia Scan-to-Play Patient Experience"
    >
      {/* Surface Header */}
      <div className="scan-exp-header">
        <div className="scan-exp-brand">
          <div className="apothecary-emblem">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="eyebrow" style={{ letterSpacing: '0.12em' }}>PATIENT LOUNGE &amp; SCAN INTERACTIVE</div>
            <h2 className="scan-exp-title">Apothecary Restoration Dial &amp; Ticket Rail</h2>
          </div>
        </div>

        <div className="scan-exp-actions">
          {/* Surface View Switcher */}
          <div className="surface-segmented-control" role="tablist">
            <button 
              className={`segmented-pill ${activeTab === 'dial' ? 'active' : ''}`}
              onClick={() => setActiveTab('dial')}
              role="tab"
              aria-selected={activeTab === 'dial'}
            >
              <RotateCcw size={13} />
              <span>Apothecary Dial</span>
            </button>
            <button 
              className={`segmented-pill ${activeTab === 'ticket_rail' ? 'active' : ''}`}
              onClick={() => setActiveTab('ticket_rail')}
              role="tab"
              aria-selected={activeTab === 'ticket_rail'}
            >
              <Ticket size={13} />
              <span>Staff Ticket Rail ({tickets.filter(t => t.status !== 'completed').length})</span>
            </button>
            <button 
              className={`segmented-pill ${activeTab === 'qr_scanner' ? 'active' : ''}`}
              onClick={() => setActiveTab('qr_scanner')}
              role="tab"
              aria-selected={activeTab === 'qr_scanner'}
            >
              <QrCode size={13} />
              <span>Scan QR Poster</span>
            </button>
          </div>

          <button 
            className="icon-button tactile-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute mechanical clicks' : 'Enable mechanical haptic clicks'}
            aria-label="Toggle mechanical clicks"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {isModal && (
            <button 
              className="icon-button close-modal-btn"
              onClick={onClose}
              aria-label="Close interactive experience"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Main Experience Body */}
      <div className="scan-exp-body">

        {/* TAB 1: THE TACTILE APOTHECARY DIAL (Scan-to-Play Experience) */}
        {activeTab === 'dial' && (
          <div className="apothecary-grid">
            {/* Left: Mechanical Dial Panel */}
            <div className="dial-housing-panel">
              <div className="panel-badge-bar">
                <span className="retro-indicator-light" />
                <span className="panel-meta-tag">MECHANICAL SELECTOR • 4-POINT APOTHECARY CALIBRATION</span>
              </div>

              {/* Physical Rotary Dial */}
              <div className="mechanical-dial-stage">
                <div 
                  className="rotary-dial"
                  style={{ transform: `rotate(${dialAngle}deg)` }}
                  aria-hidden="true"
                >
                  <div className="dial-core-notch" />
                  <div className="dial-grip-ridges" />
                  <div className="dial-center-brass">
                    <span className="brass-text">AUR</span>
                  </div>
                </div>

                {/* Dial Cardinal Nodes */}
                <div className="dial-cardinal-markers">
                  {RESTORATION_PROTOCOLS.map((proto, idx) => {
                    const isSelected = selectedIdx === idx;
                    return (
                      <button
                        key={proto.id}
                        className={`dial-node-btn node-pos-${idx} ${isSelected ? 'active-node' : ''}`}
                        onClick={() => handleSelectProtocol(idx)}
                        aria-label={`Select protocol: ${proto.name}`}
                      >
                        <span className="node-pip" style={{ borderColor: isSelected ? proto.phosphorColor : 'var(--line)' }} />
                        <span className="node-label">{proto.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Protocol Quick Select Tabs */}
              <div className="protocol-pills-row">
                {RESTORATION_PROTOCOLS.map((proto, idx) => (
                  <button
                    key={proto.id}
                    className={`protocol-tab-pill ${selectedIdx === idx ? 'active' : ''}`}
                    onClick={() => handleSelectProtocol(idx)}
                  >
                    <span>{proto.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Retro-Futuristic CRT Display & Formulation Readout */}
            <div className="apothecary-crt-terminal">
              <div className="crt-screen">
                <div className="crt-scanlines" />
                <div className="crt-glow-header">
                  <span className="crt-mono-tag">PROTOCOL FORMULATION READOUT // SYSTEM RE-04</span>
                  <span className="crt-status-live">● CALIBRATED</span>
                </div>

                <div className="crt-content">
                  <div className="crt-title-row">
                    <div>
                      <span className="crt-cat">{currentProtocol.category}</span>
                      <h3 className="crt-hero-name" style={{ color: currentProtocol.phosphorColor }}>
                        {currentProtocol.name}
                      </h3>
                    </div>
                    <div className="crt-voucher-pill">
                      <span>INCENTIVE</span>
                      <strong>{currentProtocol.voucherValue}</strong>
                    </div>
                  </div>

                  <p className="crt-outcome">{currentProtocol.targetOutcome}</p>

                  <div className="crt-ingredients-block">
                    <span className="crt-section-label">ACTIVE CLINICAL VEHICLES:</span>
                    <ul className="crt-ingredient-list">
                      {currentProtocol.activeIngredients.map((item, i) => (
                        <li key={i}>
                          <span className="bullet">▹</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="crt-meta-stats">
                    <div className="crt-stat-box">
                      <span>DURATION</span>
                      <strong>{currentProtocol.duration}</strong>
                    </div>
                    <div className="crt-stat-box">
                      <span>PATIENT VOUCHER</span>
                      <strong>{currentProtocol.voucherValue}</strong>
                    </div>
                    <div className="crt-stat-box">
                      <span>SAFETY CLEARANCE</span>
                      <strong>Class I Medical</strong>
                    </div>
                  </div>
                </div>

                {/* Dispense / Claim Action Bar */}
                <div className="crt-action-dock">
                  <div className="guest-phone-input-wrap">
                    <input 
                      type="tel"
                      placeholder="Enter mobile # for instant SMS voucher"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="crt-phone-input"
                      aria-label="Patient mobile number"
                    />
                  </div>

                  <button 
                    className="crt-dispense-btn"
                    onClick={handleDispenseVoucher}
                    disabled={isDispensing}
                  >
                    {isDispensing ? (
                      <span className="dispense-spin">DISPENSING VOUCHER...</span>
                    ) : (
                      <>
                        <Zap size={15} />
                        <span>DISPENSE TREATMENT PASS ({currentProtocol.voucherValue})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Physical Voucher Slip Preview */}
              {activeVoucher && (
                <div className="physical-voucher-slip">
                  <div className="voucher-stub">
                    <div className="stub-header">
                      <Sparkles size={14} />
                      <span>AUREVIA RESTORATION VOUCHER</span>
                    </div>
                    <div className="stub-code">{activeVoucher.code}</div>
                    <div className="stub-details">
                      <span>{activeVoucher.protocol} • {activeVoucher.value}</span>
                      <span>Dispatched to {activeVoucher.phone} at {activeVoucher.issuedAt}</span>
                    </div>
                  </div>
                  <div className="voucher-perforation" />
                  <div className="voucher-notice">
                    <span>Valid at front desk intake. Auto-routed to clinical ticket rail.</span>
                    <button 
                      className="text-action-link"
                      onClick={() => setActiveTab('ticket_rail')}
                    >
                      View on Staff Rail →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PHYSICAL TICKET RAIL (Staff / Admin View) */}
        {activeTab === 'ticket_rail' && (
          <div className="ticket-rail-board">
            <div className="ticket-rail-intro">
              <div>
                <h3>Clinical Intake &amp; Treatment Ticket Rail</h3>
                <p>Physical workflow cards advance through treatment stages with tactile feedback.</p>
              </div>
              <div className="rail-legend">
                <span className="legend-tag tag-intake">Awaiting Intake</span>
                <span className="legend-tag tag-prep">Suite Prepared</span>
                <span className="legend-tag tag-session">In Session</span>
                <span className="legend-tag tag-done">Completed</span>
              </div>
            </div>

            {/* The Brass & Slate Ticket Rail */}
            <div className="physical-brass-rail">
              <div className="rail-guide-bar" />
              <div className="ticket-cards-flex">
                {tickets.map((ticket) => {
                  const isDone = ticket.status === 'completed';
                  return (
                    <div 
                      key={ticket.id} 
                      className={`physical-ticket-card status-${ticket.status}`}
                    >
                      <div className="ticket-top-clip">
                        <div className="metal-clip-notch" />
                        <span className="ticket-id">{ticket.id}</span>
                        <span className="ticket-time">{ticket.time}</span>
                      </div>

                      <div className="ticket-card-body">
                        <div className="ticket-patient-name">{ticket.patientName}</div>
                        <div className="ticket-treatment">{ticket.treatment}</div>
                        <div className="ticket-room-badge">{ticket.room}</div>

                        <div className="ticket-voucher-row">
                          <span className="code-pill">{ticket.voucherCode}</span>
                          <span className="val-pill">{ticket.value}</span>
                        </div>
                      </div>

                      <div className="ticket-footer-action">
                        {isDone ? (
                          <div className="ticket-done-badge">
                            <Check size={14} />
                            <span>Intake &amp; Care Complete</span>
                          </div>
                        ) : (
                          <button
                            className="advance-stage-btn"
                            onClick={() => handleAdvanceTicket(ticket.id)}
                            title="Advance treatment status"
                          >
                            <span>
                              {ticket.status === 'awaiting_intake' ? 'Prepare Treatment Suite' :
                               ticket.status === 'suite_prepared' ? 'Begin Session' :
                               'Complete Care Protocol'}
                            </span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QR SCANNER POSTER (Lounge Standee Simulator) */}
        {activeTab === 'qr_scanner' && (
          <div className="qr-standee-preview">
            <div className="standee-card">
              <div className="standee-header">
                <div className="standee-logo">AUREVIA</div>
                <div className="standee-subtitle">SANCTUARY &amp; APOTHECARY</div>
              </div>

              <div className="standee-qr-frame">
                <QrCode size={160} style={{ color: 'var(--ink)' }} />
                <span className="qr-frame-caption">SCAN TO UNLOCK RESTORATION PERK</span>
              </div>

              <div className="standee-text">
                <h3>Welcome to Your Restorative Session</h3>
                <p>
                  Scan with your mobile camera to dial your personalized treatment formulation and unlock up to <strong>$110</strong> in complimentary clinical enhancements.
                </p>
                <div className="standee-pill-row">
                  <span>● Instant Mobile Booking</span>
                  <span>● Private Lounge Perks</span>
                  <span>● Zero Wait Hesitation</span>
                </div>
              </div>

              <div className="standee-footer">
                <button 
                  className="primary-button"
                  onClick={() => setActiveTab('dial')}
                >
                  <Sparkles size={15} />
                  <span>Test Mobile Scan Experience (Dial)</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


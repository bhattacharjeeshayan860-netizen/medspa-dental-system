# Aurevia Practice OS / AI Patient Reactivation Engine — Deployment Guide

This guide covers local testing with n8n and production deployment for the React dashboard and n8n webhook automation layers.

> **Deployment status:** The examples below are configuration guidance, not evidence of a deployed production service. This repository currently documents Google Sheets-backed workflow templates; it does not include a VPS, database, backend API, or database migrations. Use synthetic data until a production data path and its security controls are implemented and verified.

---

## 1. Frontend Environment Setup

### 1.1 Local Development & Testing

```env
VITE_N8N_BASE_URL=http://localhost:5678
VITE_N8N_WEBHOOK_PREFIX=/webhook-test
VITE_DEMO_MODE=true
```

- When `VITE_DEMO_MODE=true`: An interactive, complete synthetic dataset is active for testing, pitches, and interface design validation without requiring live n8n credentials.
- When testing live n8n workflows locally: Set `VITE_DEMO_MODE=false`.

### 1.2 Production Configuration

All `VITE_*` values are included in browser-delivered assets. Never put private credentials, database passwords, or long-lived bearer tokens in them. Use a server-side gateway for authenticated requests.

```env
VITE_N8N_BASE_URL=https://n8n.yourclinicdomain.com
VITE_N8N_WEBHOOK_PREFIX=/webhook
VITE_DEMO_MODE=false
VITE_AUREVIA_TENANT_ID=aurevia-beverly-hills
VITE_AUREVIA_USER_ROLE=STAFF
VITE_N8N_PUBLIC_WEBHOOKS=true
```

To build for production:

```bash
npm run build
```

This compiles optimized static assets into the `dist/` directory, ready to deploy to Netlify, Vercel, AWS S3/CloudFront, Cloudflare Pages, or any static web host.

---

## 2. n8n Server Environment

On your n8n VPS / Docker container, set the following environment variables:

```env
N8N_HOST=n8n.yourclinicdomain.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.yourclinicdomain.com/
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
```

### Reverse Proxy (Nginx / Caddy) Architecture

```text
Client Browser
   └──> HTTPS https://n8n.yourclinicdomain.com
         └──> Caddy / Nginx (TLS Termination)
               └──> http://127.0.0.1:5678 (n8n container)
```

Ensure TLS 1.3 is enabled and the reverse proxy forwards headers:
- `Host: $host`
- `X-Real-IP: $remote_addr`
- `X-Forwarded-For: $proxy_add_x_forwarded_for`
- `X-Forwarded-Proto: $scheme`

---

## 3. Webhook Testing Verification

### 3.1 Inbound Webhook Test (`patient-reply`)

Test inbound customer reply processing with curl:

```bash
curl -X POST "http://localhost:5678/webhook-test/patient-reply" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919000000001",
    "message": "Yes, what times do you have available?",
    "message_id": "TEST-MSG-001",
    "timestamp": "2026-10-09T14:30:00.000Z"
  }'
```

Expected Response:
```json
{
  "success": true,
  "patient_id": "P0001",
  "phone": "919000000001",
  "intent": "BOOKING_INTENT",
  "state": "BOOKING_SENT",
  "reply": "We’d love to welcome you back! Here’s the official booking link: https://your-booking-url.example",
  "human_required": false,
  "opt_out": false
}
```

#### Opt-Out Keyword Test:
```bash
curl -X POST "http://localhost:5678/webhook-test/patient-reply" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919000000001",
    "message": "STOP",
    "message_id": "TEST-MSG-STOP",
    "timestamp": "2026-10-09T14:31:00.000Z"
  }'
```

Expected Response:
```json
{
  "success": true,
  "patient_id": "P0001",
  "phone": "919000000001",
  "intent": "NOT_INTERESTED",
  "state": "OPTED_OUT",
  "reply": "Got it — I’ll stop promotional messages. You won’t hear from us again.",
  "human_required": false,
  "opt_out": true
}
```

### 3.2 Outbound Campaign Webhook Test (`patient-outbound`)

```bash
curl -X POST "http://localhost:5678/webhook-test/patient-outbound" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "maya-spa-dashboard",
    "campaign_name": "Returning Patient Reactivation",
    "requested_at": "2026-10-09T14:00:00.000Z",
    "customer_ids": ["P0001", "P0002"],
    "max_recipients": 25,
    "offer_id": "OF001",
    "timezone": "Asia/Kolkata",
    "dry_run": false
  }'
```

Expected Response:
```json
{
  "success": true,
  "campaign_id": "CAMP-20261009-ABC12",
  "status": "QUEUED",
  "requested": 2,
  "accepted": 2,
  "skipped": 0,
  "daily_limit": 25,
  "sent_today_before_run": 0,
  "remaining_after_run": 23,
  "results": [
    { "patient_id": "P0001", "status": "QUEUED", "reason": null },
    { "patient_id": "P0002", "status": "QUEUED", "reason": null }
  ]
}
```

---

## 4. Production Checklist

1. **Import Workflows**:
   - `med_dental_workflow.json` (Incoming WhatsApp Conversation Engine)
   - `maya_spa_campaign_workflow.json` (Outbound Reactivation Campaign Engine)
   - `n8n_read_api_workflows.json` (REST Read endpoints: `/dashboard`, `/clients`, `/conversations`, etc.)
2. **Configure Credentials in n8n**:
   - Create your own Google Sheets OAuth2 / Service Account credential and select your spreadsheet. Workflow exports use a placeholder spreadsheet ID and will not work until configured.
   - OpenAI or Google Gemini API Key
   - Twilio or Meta WhatsApp Business API credentials
3. **Verify Business Hours & Safety Limits**:
   - Outbound campaigns strictly enforce maximum 25 recipients per run.
   - Daily limit (defaults to 25) enforced against `Conversations` sheet logs.
   - Operating hours set to 10:00 AM - 7:00 PM `Asia/Kolkata`.
4. **Activate Workflows**:
   - Toggle workflow active switches in n8n so `/webhook/patient-reply` and `/webhook/patient-outbound` are live.
5. **Launch Frontend**:
   - Set `VITE_DEMO_MODE=false` with production `VITE_N8N_BASE_URL` and deploy static bundle.


---

## 5. Multi-Clinic Missed-Call Recovery & Telemetry Setup

### 5.1 Missed-Call Webhook Test (`missed-call`)

```bash
curl -X POST "http://localhost:5678/webhook-test/missed-call" \
  -H "Content-Type: application/json" \
  -d '{
    "clinic_id": "aurevia-beverly-hills",
    "caller_phone": "+13105550199",
    "call_id": "CALL-PROV-1001",
    "timestamp": "2026-11-03T15:30:00.000Z",
    "ignore_quiet_hours": false,
    "demo_mode": false
  }'
```

Expected Response:
```json
{
  "success": true,
  "status": "SENT",
  "call_id": "CALL-PROV-1001",
  "clinic_name": "Aurevia Med Spa — Beverly Hills",
  "caller_phone": "+13105550199",
  "message_id": "MSG-MC-1793707292886-zzok",
  "message_text": "Hi, this is Aurevia Med Spa — Beverly Hills. We missed your call and will get back to you shortly. If you’d like, reply here and we can help you find an appointment.",
  "message_sent": true,
  "demo_mode": false
}
```

### 5.2 Provider Connection Points
- **Twilio Voice**: Configure StatusCallback on phone number / TwiML: `statusCallback: https://n8n.yourclinicdomain.com/webhook/missed-call`, `statusCallbackEvent: completed, no-answer, busy`.
- **CallRail**: Webhook integration pointing to `/webhook/missed-call`.
- **Bland AI / Vapi / Retell**: Inbound transfer failure or unanswered webhook destination `/webhook/missed-call`.
- **Mock / Simulator Mode**: Send `demo_mode: true` to test without contacting real patients or burning SMS/WhatsApp units.

### 5.3 Reliability, Token Health, & Error Trigger
- **Workflow File:** `error_trigger_workflow.json`
- **Error Trigger Node:** Automatically intercepts unexpected runtime crashes across any practice workflow and formats an alert with execution ID, node name, clinic, timestamp, and stack trace.
- **Permanent System-User Tokens:** For Meta WhatsApp Cloud API, configure a permanent System User Access Token in Meta Business Manager to avoid 60-day token expiration outages.
- **Idempotency Protection:** Both the Inbound Conversation (`med_dental_workflow.json`) and Missed-Call Engine (`missed_call_recovery_workflow.json`) enforce exact `call_id` / `message_id` deduplication and a 24-hour frequency cap per phone.

### 5.4 Human Takeover (`human_active`) Protocol
- Setting `human_active = true` immediately halts all automated AI conversational responses.
- Staff members can take over any active patient thread directly from the dashboard.
- Staff takeover provenance (staff name, timestamp) is logged in CRM state.
- Explicit release (`human_active = false`) returns control back to the autonomous AI.
- Automated SLA alerts trigger within 1 minute of a clinical escalation and remind staff after 15 minutes if still unresolved.

### 5.5 Consent, Privacy & Compliance Notice
- **STOP Compliance:** Sending `STOP`, `UNSUBSCRIBE`, `CANCEL`, `QUIT`, `END`, or `REMOVE ME` immediately terminates all automation without consuming AI tokens.
- **Quiet Hours:** Overnight quiet hours (default 21:00 to 09:00 local time) are calculated strictly against each clinic's configured timezone. Messages generated during quiet hours are held for morning dispatch.
- **Clinical Safeguards:** Medical questions, reactions, and complaints are immediately escalated to human staff with a disclaimer to contact emergency services for acute medical issues.
- **Legal Review Notice:** *Each clinic or med spa practice is solely responsible for obtaining independent healthcare legal counsel to ensure compliance with HIPAA, TCPA, state medical practice acts, and local marketing regulations.*


---

## 6. Demo vs. Production Capability Matrix

| System Capability | Demo Mode (`VITE_DEMO_MODE=true`) | Production Mode (`VITE_DEMO_MODE=false`) | Live Credentials Required |
| :--- | :--- | :--- | :--- |
| **Interactive Dashboard** | High-fidelity synthetic dataset with 13 diverse patient cases, instant filtering, and responsive views | Live two-way sync with n8n read endpoints and Google Sheets | n8n Webhook URL |
| **Inbound Conversation Engine** | Deterministic intent classification (Opt-Out, Medical Risk, Pricing, Booking) | n8n workflow (`med_dental_workflow.json`) with direct LLM calls & guardrails | OpenAI / Gemini API Key |
| **Missed-Call Recovery** | In-memory audit ledger, 5 interactive scenarios, zero live SMS dispatched | Dispatches live SMS / WhatsApp recovery message via Twilio or Meta | Twilio SID / Meta Token |
| **Booking Provider Adapter** | Simulated booking IDs (`PROV-CALENDAR-DEMO-...`), slot conflict detection, duplicate prevention | Connects to Google Calendar API, Calendly API, or Cal.com webhook | Google OAuth / Calendly PAT |
| **Human Takeover (`human_active`)** | In-memory state lock with 1-min / 15-min SLA alerts | Persisted in Google Sheets `Human Handoffs` tab with staff provenance | Google Sheets Service Account |
| **Revenue & Executive Reports** | Modeled using configurable ATV and 85% show-up benchmark | Driven by actual confirmed calendar reservations and CRM visit logs | N/A |
| **Safety Guardrails** | Deterministic STOP opt-out, quiet hours, 24h frequency cap, medical risk escalation | Server-side n8n verification + sheet-backed suppression lists | N/A |

### 6.1 How to Run Tests & Verification

```bash
# 1. Run the automated regression tests
npm test

# 2. Validate all 6 n8n workflow JSON files
node scripts/validate_workflows.js

# 3. Run the Missed-Call CLI recovery demo (all 5 scenarios)
node scripts/demo_missed_call.js

# 4. Build production static bundle
npm run build
```

### 6.2 Legal Review & Compliance Checklist for Clinic Counsel
Before activating live outbound messaging or automated missed-call dispatches in production:
1. **TCPA & Consent:** Verify that patient telephone numbers in the CRM have affirmative written consent for SMS/WhatsApp communications.
2. **Medical Practice Boundary:** Ensure all automated conversational templates refrain from diagnosis, clinical assessment, or treatment promises.
3. **Emergency Disclaimers:** Confirm the clinic's local 911 / emergency contact language complies with state medical board guidance.
4. **Data Retention & HIPAA:** Review Google Sheets access control and ensure a Business Associate Agreement (BAA) is in place with Google Workspace and communication providers.

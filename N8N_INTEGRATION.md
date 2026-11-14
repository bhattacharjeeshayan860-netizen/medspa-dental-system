# AI Patient Reactivation Engine — n8n Integration Contract

The React application acts as the practice workspace. n8n is the automation and webhook orchestration layer. The current workflow templates use Google Sheets as a CRM data source, and WhatsApp delivery is intended to be managed server-side by n8n (for example, through Twilio or Meta WhatsApp Business API). These templates are not a production database deployment.

The frontend is a static client: all `VITE_*` values are public in the built browser assets. Keep Google, Gemini/OpenAI, Twilio/Meta, database, and other private credentials in server-side n8n or a secured backend. Do not use a private bearer token in `VITE_N8N_AUTH_TOKEN`; use an authenticated server-side gateway instead.

---

## 1. Environment Configuration

```env
# Local Development & Testing
VITE_N8N_BASE_URL=http://localhost:5678
VITE_N8N_WEBHOOK_PREFIX=/webhook-test
VITE_DEMO_MODE=true

# Production Deployment
VITE_N8N_BASE_URL=https://your-n8n-instance.com
VITE_N8N_WEBHOOK_PREFIX=/webhook
VITE_DEMO_MODE=false
VITE_AUREVIA_TENANT_ID=aurevia-beverly-hills
VITE_AUREVIA_USER_ROLE=STAFF
VITE_N8N_PUBLIC_WEBHOOKS=true
```

- Local test execution uses `/webhook-test/...`
- Activated production workflows use `/webhook/...`
- Setting `VITE_DEMO_MODE=true` loads a realistic synthetic dataset for pitches and client walkthroughs.
- Setting `VITE_DEMO_MODE=false` connects directly to the live n8n webhook API.
- `VITE_AUREVIA_TENANT_ID` supplies the tenant header used by live dashboard requests.
- `VITE_N8N_PUBLIC_WEBHOOKS=true` enables direct browser calls to intentionally public n8n webhook URLs; leave it `false` when requests go through an authenticated gateway.
- Do not set `VITE_N8N_AUTH_TOKEN` to a private credential. Any value with the `VITE_` prefix is available to browser users. Put authentication at a server-side gateway or backend.

---

## 2. Webhook Endpoints & Contracts

### 2.1 Outbound Campaign Engine

- **Production Endpoint**: `POST /webhook/patient-outbound`
- **Test Endpoint**: `POST /webhook-test/patient-outbound`
- **Workflow File**: `maya_spa_campaign_workflow.json`

#### Outbound Request Body

```json
{
  "source": "maya-spa-dashboard",
  "campaign_name": "Returning Patient Reactivation",
  "requested_at": "2026-10-09T10:30:00.000Z",
  "customer_ids": ["P0001", "P0002", "P0003"],
  "max_recipients": 25,
  "offer_id": "OF001",
  "timezone": "Asia/Kolkata",
  "dry_run": false
}
```

#### Outbound Guardrails & Server-Side Validations
1. **Hard Safety Cap**: Maximum 25 recipients per campaign run. Even if more IDs are passed, n8n slices to 25.
2. **Configurable Daily Limit**: Defaults to 25 from Config sheet. Re-checks all messages sent today from the `Conversations` sheet.
3. **Anti-Spam Cooldown**: Automatically excludes patients contacted within the last 7 days.
4. **Business Hours**: Outbound messages are strictly dispatched between **10:00 AM and 7:00 PM** (`Asia/Kolkata`), unless `dry_run: true`.
5. **Eligibility Suppression**:
   - Excludes opted-out customers (`opt_out = YES`)
   - Excludes invalid / missing phone numbers (< 10 digits)
   - Excludes customers with confirmed bookings (`booking_status = BOOKED`)
   - Excludes customers in clinical review (`conversation_state = HUMAN_REQUIRED`)
   - Excludes customers already contacted today
6. **Rate-Limiting Delay**: Injects a safe delay (5–7 seconds) between WhatsApp sends to prevent provider throttling and spam flags.
7. **Offer Verification**: Only uses active offers from the `Offers` sheet; never hallucinates discounts or pricing.

#### Outbound Response Contract (Success)

```json
{
  "success": true,
  "campaign_id": "CAMP-20261009-8F21",
  "status": "QUEUED",
  "requested": 3,
  "accepted": 2,
  "skipped": 1,
  "daily_limit": 25,
  "sent_today_before_run": 0,
  "remaining_after_run": 23,
  "offer_id": "OF001",
  "offer_name": "Returning Client Facial",
  "results": [
    {
      "patient_id": "P0001",
      "status": "QUEUED",
      "reason": null
    },
    {
      "patient_id": "P0002",
      "status": "SKIPPED",
      "reason": "Already contacted today"
    }
  ]
}
```

---

### 2.2 Inbound WhatsApp Conversation Engine

- **Primary Production Endpoint**: `POST /webhook/patient-reply`
- **Legacy Compatibility Endpoint**: `POST /webhook/patient-reactivation`
- **Test Endpoint**: `POST /webhook-test/patient-reply`
- **Workflow File**: `med_dental_workflow.json`

#### Inbound Request Body

Supports JSON payload or standard Twilio/WhatsApp webhook form-urlencoded payloads:

```json
{
  "phone": "+919000000001",
  "message": "Yes, what times do you have available?",
  "message_id": "SM1a2b3c4d5e",
  "timestamp": "2026-10-09T14:15:00.000Z"
}
```

*(Also supports Twilio metadata: `From`, `Body`, `MessageSid`)*

#### Inbound Workflow Capabilities
1. **Phone Normalization**: Strips non-digit characters and matches against Google Sheets CRM `Patients` tab.
2. **Deduplication**: Suppresses re-processing of already handled `message_id`s.
3. **Deterministic Opt-Out Detection**:
   - Immediately intercepts keywords: `STOP`, `UNSUBSCRIBE`, `CANCEL`, `QUIT`, `END`, `REMOVE ME`, `DO NOT CONTACT`.
   - Sets `opt_out = YES` in CRM and marks state as `OPTED_OUT`.
   - Sends polite unsubscribe confirmation without invoking LLM tokens.
4. **AI Intent Classification**:
   - `BOOKING_INTENT`: Returns verified booking link from config (`booking_url`), updates state to `BOOKING_SENT` (never claims booking is finalized).
   - `ASKING_PRICE` / `ASKING_ABOUT_OFFER`: Returns verified pricing from `Offers` sheet.
   - `HUMAN_REQUIRED`: Triggers when medical reaction, clinical complaint, or sensitive query occurs. Creates case in `Human Queue` sheet and delivers a safe, non-medical holding reply.
   - `FOLLOW_UP_LATER`: Records client preference.
5. **Conversations Logging**: Logs both inbound and outbound messages with latency and intent in the `Conversations` tab.

#### Inbound Response Contract

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

---

## 3. Read & Management API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/webhook/dashboard` | Returns calculated practice telemetry (`stats`) and recent messages |
| `GET` | `/webhook/clients` | Returns full list of patients from CRM sheet |
| `GET` | `/webhook/client?patient_id=P0001` | Returns single patient record |
| `GET` | `/webhook/conversations?patient_id=P0001` | Returns conversation stream for specific patient (or all if omitted) |
| `GET` | `/webhook/handoffs` | Returns open clinical escalations from Human Queue sheet |
| `GET` | `/webhook/offers` | Returns active, verified seasonal offers |
| `GET` | `/webhook/config` | Returns business configuration (hours, timezone, daily limits, booking URLs) |
| `PATCH`| `/webhook/human-handoff-status` | Resolves or reassigns an escalation (`{ queue_id, status }`) |
| `PATCH`| `/webhook/patient` | Updates approved CRM attributes (`first_name`, `last_name`, `phone`, `email`, `opt_out`) |

---

## 4. Current Google Sheets Worksheet Schema

### `Patients` Tab
Required header row (row 1) and unique match key: `patient_id`.

Columns used by the inbound reactivation workflow: `patient_id`, `first_name`, `last_name`, `phone`, `email`, `last_treatment`, `last_visit`, `days_inactive`, `preferred_channel`, `reactivation_eligible`, `conversation_state`, `recent_chat`, `last_message`, `last_intent`, `booking_status`, `opt_out`, `human_required`, `human_reason`, `updated_at`.

`recent_chat` may contain a JSON conversation array or plain text. Keep it limited to recent turns. Blank or missing optional values remain blank; they must never be filled with invented patient or business facts.

### `Conversations` Tab
Columns: `conversation_id`, `patient_id`, `timestamp`, `direction`, `message`, `message_id`, `intent`, `state_before`, `state_after`, `response_time_seconds`

### `Offers` Tab
Columns: `offer_id`, `offer_name`, `treatment`, `description`, `price`, `currency`, `valid_until`, `booking_url`, `active`

### `Config` Tab
Columns: `config_key` / `key`, `config_value` / `value` (e.g., `practice_name: Aurevia Practice OS`, `daily_outbound_limit: 25`, `business_timezone: Asia/Kolkata`, `booking_url: https://your-booking-url.example`)

The Gemini reply workflow reads verified facts from this tab and the `Offers` tab. Configure the Google Gemini credential in n8n, then keep the model on a low-temperature, short-output setting. The reply contract is strict: use only supplied facts, return no more than two sentences, and return exactly `HUMAN_REQUIRED` when a fact is missing, ambiguous, expired, or not present in the verified context. Do not put API keys in workflow exports.

### `Human Queue` Tab
Columns: `queue_id`, `patient_id`, `conversation_id`, `name`, `phone`, `reason`, `last_message`, `intent`, `state`, `status`, `created_at`, `resolved_at`, `assigned_to`


---

## 5. Missed-Call & Booking Integration Contracts

### 5.1 Missed-Call Ingestion Endpoint
- **Production Endpoint:** `POST /webhook/missed-call`
- **Payload Contract:**
```json
{
  "clinic_id": "aurevia-beverly-hills",
  "caller_phone": "+13105550199",
  "call_id": "CALL-TWILIO-SID-12345",
  "timestamp": "2026-11-03T18:45:00.000Z",
  "ignore_quiet_hours": false,
  "demo_mode": false
}
```
- **Response Contract (Dispatched):**
```json
{
  "success": true,
  "status": "SENT",
  "call_id": "CALL-TWILIO-SID-12345",
  "clinic_name": "Aurevia Med Spa — Beverly Hills",
  "caller_phone": "+13105550199",
  "message_id": "MSG-MC-1793721094290-j928",
  "message_text": "Hi, this is Aurevia Med Spa — Beverly Hills. We missed your call and will get back to you shortly. If you’d like, reply here and we can help you find an appointment.",
  "demo_mode": false
}
```
- **Response Contract (Suppressed — Quiet Hours / Opt-Out / Frequency Cap):**
```json
{
  "success": true,
  "status": "SUPPRESSED_QUIET_HOURS",
  "call_id": "CALL-TWILIO-SID-12345",
  "action_taken": "Message held for morning hours to avoid spamming patient at night.",
  "log": {
    "status": "SUPPRESSED_QUIET_HOURS",
    "reason": "Call occurred during quiet hours (21:00 - 09:00 America/Los_Angeles)",
    "queued_for_morning": true,
    "message_sent": false
  }
}
```

### 5.2 Human Takeover Override Endpoint
- **Production Endpoint:** `POST /webhook/human-takeover`
- **Payload Contract:**
```json
{
  "patient_id": "P0001",
  "staff_member": "Nurse Practitioner Sarah",
  "human_active": true
}
```
- **Behavior:** Updates `human_active` flag in the `Patients` and `Human Queue` sheets. When `human_active = true`, all autonomous AI reply workflows and outbound missed call messages are strictly suppressed until staff explicitly releases the thread (`human_active = false`).

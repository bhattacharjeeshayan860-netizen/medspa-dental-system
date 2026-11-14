# Aurevia Practice OS

**Patient follow-up, messaging, and staff review in one workspace.**

Aurevia is for med spa, dermatology, and dental teams that want a clearer way to follow up with clients. It brings the client list, campaigns, replies, missed calls, and staff handoffs together.

> **Current state:** This repository contains a React/Vite app and n8n workflow templates. The documented data source is Google Sheets. A VPS and production database are planned, but are not included here. Use the synthetic preview until a production data path and its safeguards are in place.

## The workflow

1. **Review who is due.** Check the client list and the configured eligibility rules.
2. **Prepare a follow-up.** Select an approved offer and message before launching a campaign.
3. **Handle the reply.** Keep booking interest visible, honor opt-outs, and send clinical or sensitive questions to staff.
4. **Recover missed calls.** Check quiet hours and contact rules before a configured text-back.

The app helps coordinate practice operations. It does not provide clinical advice or guarantee bookings.

## Screens from the app

These are screenshots of the current interface. The app preview uses sample records; live-connected screens may show empty results. They are not evidence of production messaging or customer outcomes.
Each image is kept at its original pixel size and will scale down to fit a smaller screen.

### Landing page

<p><img src="docs/assets/landing-page-app.png" width="1116" alt="Aurevia landing page with an overview of the follow-up workflow"></p>

### Practice overview

<p><img src="docs/assets/workspace-overview.png" width="1280" alt="Practice overview in synthetic preview mode"></p>

### Client list and campaigns

<p><img src="docs/assets/clients-page.png" width="1219" alt="Client list with synthetic client records"></p>

<p><img src="docs/assets/campaigns-page.png" width="1339" alt="Outbound campaign setup and safety checks"></p>

### Missed-call recovery

<p><img src="docs/assets/missed-call-recovery.png" width="1447" alt="Missed-call recovery simulator and audit ledger"></p>

### Pricing

The prices below are the values currently shown in the app. Confirm scope and rates before presenting them as an offer.

<p><img src="docs/assets/pricing-page.png" width="1222" alt="Pricing plans shown in the Aurevia app"></p>

### Messages and staff review

The chat examples follow the supplied message thread, with the name, practice, and treatment details replaced. The staff-review example is retained. None shows a real patient conversation.

<p><img src="docs/assets/sample-outreach-message.png" width="851" alt="Synthetic example of an appointment follow-up message"></p>

<p><img src="docs/assets/sample-reply-and-booking.png" width="794" alt="Synthetic conversation showing a reply and booking-link follow-up"></p>

<p><img src="docs/assets/chat-staff-review-illustration.png" width="794" alt="Synthetic staff-review conversation example"></p>

<p><img src="docs/assets/staff-review-queue.png" width="592" alt="Human Queue empty state in the app"></p>

## What is included

- React/Vite workspace for overview, clients, conversations, campaigns, missed calls, offers, and staff review.
- Synthetic preview data for local walkthroughs.
- n8n workflow exports for inbound replies, outbound campaigns, missed calls, read endpoints, handoffs, and error notifications.
- Google Sheets-oriented webhook and data contracts.
- Configurable booking and messaging provider connection points; provider credentials stay server-side.

See [N8N_INTEGRATION.md](N8N_INTEGRATION.md) for the current webhook contracts and [N8N_READ_API_IMPORT.md](N8N_READ_API_IMPORT.md) for importing read workflows.

## Run locally

Install dependencies, copy `.env.example` to `.env`, leave `VITE_DEMO_MODE=true`, then start the app:

```bash
npm ci
npm run dev
```

Run the checks:

```bash
npm test
npm run build
node scripts/validate_workflows.js
```

For n8n configuration notes and webhook examples, see [DEPLOYMENT.md](DEPLOYMENT.md). Static workflow validation does not test a live n8n instance or provider.

## Before using real clinic data

The planned VPS/database deployment needs more than a static frontend and workflow exports. Choose and implement the database, server-side API and authentication, tenant separation, secret storage, backups, and monitoring. Review consent, retention, access, messaging rules, and vendor agreements with the clinic and its qualified advisers before enabling live outreach.

All `VITE_*` settings are visible in browser assets. Do not put database passwords, provider credentials, or private bearer tokens in them. The current workflow templates use Google Sheets; they are not a production database adapter.

No HIPAA, TCPA, clinical, revenue, uptime, or booking guarantee is made by this repository.

## License

There is no license file in this repository. Do not assume the source is licensed for redistribution or commercial reuse.

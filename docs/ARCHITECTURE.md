# System Architecture & Technical Specification

## Overview
**Salty Auto** is a multi-tenant, serverless social media automation and messaging platform. It is engineered to operate with zero fixed recurring costs by utilizing tier-1 developer free tiers (Supabase, Meta Cloud APIs, Inngest, Vercel/Next.js) while maintaining enterprise reliability, data isolation, and security.

---

## 1. High-Level Architecture Diagram

```
                              [ Meta Platform ]
                        (Instagram & WhatsApp Business)
                                     │
                 Webhook Event (HTTPS POST with HMAC SHA-256)
                                     │
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │  Next.js 15 Serverless Route: /api/webhooks/meta            │
      │  - Validates HMAC SHA-256 Signature (10ms)                  │
      │  - Immediately sends event to Inngest Queue                 │
      │  - Returns HTTP 200 OK immediately (< 50ms)                 │
      └──────────────────────────────┬──────────────────────────────┘
                                     │ (No dropped webhooks)
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │  Inngest Serverless Workflow Orchestrator                   │
      │  - Automatic Retries with Exponential Backoff               │
      │  - Per-Account Rate Limiting & Concurrency Control          │
      │  - Idempotency & Deduplication Engine                       │
      └──────────────────────────────┬──────────────────────────────┘
                                     │
                  ┌──────────────────┴──────────────────┐
                  ▼                                     ▼
      ┌───────────────────────────────┐   ┌───────────────────────────┐
      │  Instagram Comment-to-DM Job  │   │  WhatsApp Message Job     │
      │  - Match Rule in Supabase     │   │  - 24h Window Check       │
      │  - Post Public Comment Reply  │   │  - Send Auto-Reply        │
      │  - Dispatch Private DM        │   │  - Upsert CRM Contact     │
      │  - Upsert CRM Contact         │   │                           │
      └───────────────┬───────────────┘   └─────────────┬─────────────┘
                      │                                 │
                      ▼                                 ▼
      ┌─────────────────────────────────────────────────────────────┐
      │  Supabase (PostgreSQL + RLS + Realtime)                     │
      │  - Workspaces & Multi-Tenant Data Boundaries                │
      │  - Contacts, Automation Rules, Logs & Messages              │
      │  - Realtime WebSockets for Dashboard Live Sync              │
      └─────────────────────────────────────────────────────────────┘
                                     ▲
                                     │ (Client Dashboard & Live CRM)
      ┌──────────────────────────────┴─────────────────────────────┐
      │  salty-auto Web Application (Next.js 15 App Router)        │
      │  - Rule Builder, CRM Kanban, Analytics, Account Settings   │
      └────────────────────────────────────────────────────────────┘
```

---

## 2. Ingress & Webhook Handling Protocol
Meta requires webhooks to respond with HTTP `200 OK` within 3–5 seconds, otherwise it marks the endpoint as unhealthy and retries with increasing frequency, potentially flooding the server.

1. **Challenge Verification (`GET`)**:
   - Responds to `hub.mode === 'subscribe'` and verifies `hub.verify_token`.
   - Returns the raw `hub.challenge` string.
2. **Payload Signature Verification (`POST`)**:
   - Computes HMAC SHA-256 over the raw request body using `APP_SECRET`.
   - Compares with the `X-Hub-Signature-256` header using timing-safe comparison (`crypto.timingSafeEqual`).
3. **Decoupled Queue Ingestion**:
   - Valid payloads are emitted to **Inngest** (`salty/instagram.comment` or `salty/whatsapp.message`).
   - The route immediately responds with `{ "status": "ok" }` in <50ms.

---

## 3. Worker Execution & Anti-Ban Safety Controls

### A. Per-Account Concurrency & Rate Limiting
Instagram and WhatsApp strictly monitor API call frequency. Sending 50 DMs in a single second will trigger an account restriction.
- **Inngest Concurrency**: Capped per `account_id` (e.g., max 3 concurrent executions per connected Instagram account).
- **Inngest Rate Limit**: Max 5 outgoing DMs per second per account.
- **Humanized Jitter**: Randomized delay (1–4 seconds) introduced between comment detection and DM dispatch.
- **Randomized Reply Copy**: Instead of static responses, public comment replies cycle through pre-configured variations (e.g., *"Just sent it over! 📩"*, *"Check your DMs! 🚀"*, *"Sent to your inbox! ✨"*).

### B. Idempotency & Deduplication
- Every incoming webhook carries a unique ID (`comment_id` or `message_id`).
- Inngest uses this ID as the idempotency key. Duplicate webhooks sent by Meta are discarded automatically without executing duplicate actions.

---

## 4. Multi-Tenant Security & Isolation
- **Workspaces**: All data belongs to a `workspace_id`.
- **Row-Level Security (RLS)**: Enforced at the database level in Supabase. Users can only query or mutate rows matching their authenticated workspace.
- **Service Role for Background Workers**: Inngest functions access Supabase via a protected service role key, bypassing RLS safely to process background automation events.

---

## 5. Dedicated User Portal & Authentication (`auto.saltymediaproduction.com`)
The subdomain `auto.saltymediaproduction.com` is reserved exclusively for registered agency clients and business owners:
- **No Marketing Landing**: Marketing pages live on the primary apex domain (`saltymediaproduction.com`). The root path `/` directly renders the Automations Dashboard.
- **Firebase Authentication Engine**: User identity management is powered 100% by **Firebase Authentication** (`firebase/auth`). Users can sign up and log in via:
  1. Email & Password (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`)
  2. Google (Gmail) Single Sign-On via popup (`signInWithPopup(auth, googleProvider)`)
- **Firebase UID & Workspace Provisioning**:
  - The PostgreSQL database column `auto_workspaces.owner_id` is typed as `TEXT` with an index `idx_auto_workspaces_owner_id`.
  - When users authenticate, their Firebase `uid` is passed to `/api/auth/session` which sets persistent session cookies and automatically ensures an `auto_workspaces` record exists where `owner_id = user.uid`.
- **Firebase Web App & Analytics**: Integrated client-side tracking using the `salty-media-production` project (`measurementId: G-HKGZ8KHB1W`) for real-time user lifecycle telemetry.
- **Webhook Whitelist**: The middleware explicitly whitelists `/api/webhooks/*`, `/api/inngest`, and `/api/auth/*` so background webhook payloads, serverless queues, and session handshakes are never interrupted by user authentication.

---

## 6. Transactional Email Service (Resend)
Transactional emails across Salty Auto and the Salty Media suite are handled via **Resend**:
- **Sender Address**: `team@saltymediaproduction.com`
- **Sender Display Name**: `Salty Media`
- **Reply-To Address**: `saltymediaproduction@gmail.com`
- **Format**: `"Salty Media" <team@saltymediaproduction.com>`
- **Email Workflows**:
  - **Agency Welcome**: Sent immediately upon first sign-up / workspace auto-provisioning via `/api/auth/session`.
  - **Lead Conversion Alerts**: Sent when comments or WhatsApp messages trigger keyword conversion rules and are captured into the Social CRM.



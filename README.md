# Salty Auto — Enterprise Social Media Automation & CRM Platform

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com/)
[![Inngest](https://img.shields.io/badge/Inngest-Serverless%20Queues-purple?style=flat)](https://www.inngest.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Analytics-orange?style=flat&logo=firebase)](https://firebase.google.com/)
[![Resend](https://img.shields.io/badge/Resend-Transactional%20Email-black?style=flat)](https://resend.com/)

**Salty Auto** is a high-performance, serverless social media automation and messaging platform designed for agencies, creators, and modern businesses. Engineered for zero fixed recurring cost, bank-grade reliability, and anti-ban execution safety.

Live Portal: [https://auto.saltymediaproduction.com](https://auto.saltymediaproduction.com)

---

## ⚡ Core Features

1. **Instagram Comment-to-DM Growth Funnels**:
   - Real-time comment monitoring on reels and feed posts.
   - Keyword matching with regex and exact matching support.
   - Randomized public comment reply variations to avoid bot detection.
   - Automated private DM dispatch (`recipient: { comment_id }`) delivering lead magnets or checkout links.
   - Built-in deduplication (zero duplicate messages per user per post).

2. **WhatsApp Business Cloud API Auto-Responder**:
   - Official Meta WhatsApp Cloud API integration.
   - 24-hour customer service window management.
   - Instant automated customer support and lead qualification.

3. **Multi-Tenant Social CRM**:
   - Automatic contact capture from Instagram DMs and WhatsApp messages.
   - Kanban pipeline view (`lead` → `engaged` → `qualified` → `customer`).
   - Live real-time updates via Supabase PostgreSQL Realtime channels.

4. **Authentication & Session Management**:
   - Pure Firebase Authentication (Email/Password & Google Single Sign-On).
   - Dynamic workspace provisioning keyed directly to Firebase UIDs.
   - Edge middleware route protection.

5. **Transactional Email Engine (Resend)**:
   - Branded agency onboarding emails (`"Salty Media" <team@saltymediaproduction.com>`).
   - Real-time lead capture notification alerts.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router, Turbopack) | Serverless frontend & API routes |
| **Database** | Supabase (PostgreSQL + RLS + Realtime) | Multi-tenant isolated datastore |
| **Background Queues** | Inngest (Serverless Queues) | Async event processing, jitter & retries |
| **Auth** | Firebase Authentication | Secure email & Google OAuth login |
| **Analytics** | Google / Firebase Analytics (`next/script`) | User telemetry and event tracking |
| **Email** | Resend | Transactional welcome & lead alerts |
| **Media Hosting** | Cloudinary | Asset delivery for automation media |
| **Styling** | Tailwind CSS + Lucide Icons | Dark-mode SaaS UI |

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/saltymediaproduction/salty-auto.git
cd salty-auto
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` or `.env`:

```bash
cp .env.example .env.local
```

Fill in your configuration credentials:
- **Supabase**: URL, Anon Key, Service Role Key
- **Meta**: App ID, App Secret, Verify Token
- **Inngest**: Event Key, Signing Key
- **Firebase**: API Key, Project ID, App ID
- **Resend**: API Key, Sender Email (`team@saltymediaproduction.com`)
- **Cloudinary**: Cloud Name, API Key, API Secret

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or configured port) in your browser.

### 4. Verify Production Build

```bash
npm run build
```

---

## 🔒 Security & Anti-Ban Safeguards

- **Timing-Safe HMAC SHA-256**: All incoming Meta webhooks are verified with `crypto.timingSafeEqual`.
- **Decoupled Async Queue**: Ingress endpoints respond `200 OK` in <50ms, offloading heavy processing to Inngest.
- **Humanized Jitter**: Configurable 1–4s randomized delays between social actions.
- **Strict Rate Limits**: Per-account concurrency caps to stay strictly within Meta Graph API limits.
- **Row-Level Security (RLS)**: PostgreSQL workspace isolation preventing cross-tenant data leakage.

---

## 📄 Documentation

Comprehensive architecture specifications, database schemas, and Meta integration guides are available in the `/docs` folder:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): Full end-to-end architecture & queue workflows.
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md): Complete PostgreSQL schema and RLS policies.
- [docs/META_INTEGRATION_GUIDE.md](docs/META_INTEGRATION_GUIDE.md): Meta App Review & Webhook setup instructions.
- [docs/TASK_PROGRESS.md](docs/TASK_PROGRESS.md): Detailed changelog and task tracker.

---

## 🏢 License & Credits

Developed by **Salty Media Production**  
Contact: [team@saltymediaproduction.com](mailto:team@saltymediaproduction.com)  
Website: [https://saltymediaproduction.com](https://saltymediaproduction.com)

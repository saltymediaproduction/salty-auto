# Salty Auto Platform Documentation

Welcome to the technical documentation for **Salty Auto**, an enterprise-grade, zero-cost social media automation and messaging engine designed for agencies, business owners, and creators.

## Documentation Index

| Document | Description |
| :--- | :--- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Full system architecture, serverless design, event orchestration, and security protocols. |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Supabase PostgreSQL schema, multi-tenant tables, indexes, and Row-Level Security (RLS) policies. |
| [META_INTEGRATION_GUIDE.md](./META_INTEGRATION_GUIDE.md) | Setup and operational guide for WhatsApp Business Cloud API and Instagram Comment-to-DM. |
| [TASK_PROGRESS.md](./TASK_PROGRESS.md) | Living progress log tracking tasks, completions, and change history. |

## Core Principles
1. **100% Zero-Cost Operations**: Designed to operate entirely within enterprise-grade free tiers (Supabase, Meta Cloud API free quotas, Inngest serverless queue, Vercel/Next.js).
2. **Enterprise Reliability**:
   - Zero dropped webhooks via asynchronous edge ingestion.
   - Per-account rate limiting and concurrency control to safeguard social accounts from platform bans.
   - HMAC SHA-256 signature verification on all inbound traffic.
   - Strict multi-tenant isolation via PostgreSQL Row-Level Security.

# Meta App Setup Guide

This document tracks the configuration, rules, and strategies for our Meta Developer Apps and WhatsApp phone numbers as we build out the Interakt-like platform for Salty Media Production.

## Meta App Strategy: Two-Phase Approach

We are building this platform for the official company (Salty Media Production opc Pvt Ltd). We have two Meta apps:
1. **Salty Media Production (App)**: Connected to a personal business portfolio. Contains a dedicated, unused mobile number.
2. **Salty Agent (App)**: Connected to the official company Facebook Page and Business Manager. Currently, the phone number here is active on a physical mobile device.

### Current Phase: Sandbox Testing (Phase 1)
To test the code (Live Inbox, Webhooks, CRM) quickly and without disrupting active mobile devices, we are using the **Salty Media Production** app as a sandbox.
- **Webhook Target**: `https://auto.saltymediaproduction.com/api/webhooks/meta` (or local ngrok proxy).
- **Callback Location**: Added to the *Salty Media Production* Meta App.
- **Phone Number**: The dedicated number currently in the *Salty Media Production* app.

### Final Launch Phase (Phase 2)
When the platform is verified, robust, and ready for official launch, we will transition everything to the **Salty Agent** Meta App.
- **Webhook Target**: Same URL.
- **Callback Location**: Will be added to the *Salty Agent* Meta App.
- **Phone Number Strategy**: We must provide a clean phone number for the *Salty Agent* app. This can be achieved by:
  1. Buying a new cheap SIM/virtual number for the *Salty Agent* account.
  2. Deleting the dedicated number from the *Salty Media Production* app and moving it to the *Salty Agent* app.
  3. Or, completely deleting the WhatsApp account from the physical mobile device and using that number for the API.

## The Golden Rule of WhatsApp Phone Numbers
A single phone number **cannot** be used on a physical mobile device (via the normal WhatsApp or WhatsApp Business app) AND the Cloud API at the same time. If a number is on a phone, the API will reject it.

## Permissions Needed (App Review)
For Phase 1 (internal testing on our own numbers), **Standard Access** is sufficient.
For Phase 2 (allowing clients to connect their numbers via Embedded Signup), we must submit the **Salty Agent** app for review and request **Advanced Access** for:
- `whatsapp_business_messaging`
- `whatsapp_business_management`
- `business_management`

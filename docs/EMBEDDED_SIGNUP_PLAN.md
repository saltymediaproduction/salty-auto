# Meta Embedded Signup Implementation Plan

This document outlines the step-by-step technical plan to upgrade `salty-auto` from manual WhatsApp token entry to a seamless "One-Click" Embedded Signup flow (Facebook Login for Business).

## Phase 1: Environment & App Configuration
1. **Meta App Dashboard Setup**: Ensure the Meta App has the **Tech Provider** use case approved and the following permissions:
   - `whatsapp_empowerment`
   - `business_management`
2. **Environment Variables**: Add the following securely to `.env`:
   - `NEXT_PUBLIC_META_APP_ID`
   - `META_APP_SECRET`
   - `META_CONFIG_ID` (Configuration ID for the Embedded Signup flow)

## Phase 2: Frontend Implementation (React/Next.js)
1. **Meta JavaScript SDK Loading**: 
   - Inject the Facebook JS SDK asynchronously on the `whatsapp/page.tsx` dashboard.
   - Initialize with `FB.init({ appId: NEXT_PUBLIC_META_APP_ID, version: 'v19.0' })`.
2. **Embedded Signup Button Component**: 
   - Port the `Fbl4bLauncher` logic from the sample app into a modern React component.
   - Trigger `FB.login` with the specific config ID to launch the popup window.
   - Capture the `code` (OAuth authorization code) returned upon successful user approval.

## Phase 3: Backend API Token Exchange
1. **Create Token Exchange Route (`/api/accounts/meta-exchange`)**:
   - Create a secure Next.js API route that receives the short-lived authorization `code` from the frontend.
   - Make a server-to-server request to Meta's Graph API (`/oauth/access_token`) to exchange the code for a **long-lived access token**.
2. **Retrieve WhatsApp Account Metadata**:
   - Use the long-lived token to query the Graph API for the client's connected **WABA ID** (WhatsApp Business Account ID) and **Phone Number ID**.

## Phase 4: Database Storage (Supabase)
1. **Schema Update (if needed)**: 
   - Ensure the `accounts` (or `social_accounts`) table in Supabase can securely store the `waba_id`, `phone_number_id`, and the `access_token`.
2. **Save and Link**: 
   - Write the retrieved credentials into Supabase under the currently authenticated user/workspace ID, utilizing Row-Level Security (RLS).
   - Return a success response to the frontend to update the UI from "Not Connected" to "Live & Connected".

## Phase 5: Testing & Go-Live
1. Run local testing using HTTPS (required by Meta SDK).
2. Go through the full Embedded Signup mock flow.
3. Test a live WhatsApp message dispatch using the newly exchanged token to verify end-to-end functionality.

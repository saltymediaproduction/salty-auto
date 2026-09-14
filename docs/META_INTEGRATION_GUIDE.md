# Meta Platform Integration Guide (Instagram & WhatsApp)

This document provides the exact developer configuration for **Instagram Comment-to-DM** and **WhatsApp Business Cloud API** on Meta's developer portal without incurring costs.

---

## 1. Meta Developer Portal Configuration

### Step 1: Create a Business App
1. Go to [developers.facebook.com](https://developers.facebook.com) > **My Apps** > **Create App**.
2. Select **Business** as the App Type.
3. Name the app (e.g. `Salty Auto Automation`).
4. Link it to your **Meta Business Portfolio** (Business Manager).

### Step 2: Add Products
1. **Webhooks**: Required for real-time notifications of Instagram comments, Instagram messages, and WhatsApp messages.
2. **WhatsApp**: Required for WhatsApp Business Cloud API access.

---

## 2. Instagram Comment-to-DM Setup

### Requirements
* An **Instagram Professional Account** (Creator or Business account).
* A **Facebook Page** linked to your Instagram Professional Account.
* The Instagram Account must have **Allow Access to Messages** turned ON in the Instagram mobile app settings (*Settings > Messages and Story Replies > Message Controls > Connected Tools > Allow Access to Messages*).

### Permissions Required
* `instagram_basic`
* `instagram_manage_comments` (Read comments, post comment replies)
* `instagram_manage_messages` (Send direct messages to commenters)
* `pages_manage_metadata` & `pages_read_engagement` (Listen to page and Instagram events)

### Webhook Subscriptions (Field: `instagram`)
* Subscribe to `comments` (Incoming comments on posts and reels)
* Subscribe to `messages` (Incoming direct messages)

### The API Endpoints
1. **Reply to Comment Publicly**:
   ```http
   POST https://graph.facebook.com/v21.0/{comment_id}/replies
   Authorization: Bearer {PAGE_ACCESS_TOKEN}
   Content-Type: application/json

   {
     "message": "Check your DMs! 🚀"
   }
   ```

2. **Send Private Direct Message to Commenter**:
   Meta provides direct attribution via `recipient: { "comment_id": "..." }`:
   ```http
   POST https://graph.facebook.com/v21.0/{instagram_business_account_id}/messages
   Authorization: Bearer {PAGE_ACCESS_TOKEN}
   Content-Type: application/json

   {
     "recipient": {
       "comment_id": "{comment_id}"
     },
     "message": {
       "text": "Hey! Here is the link you requested: https://salty.media/guide"
     }
   }
   ```
   > **Note**: Meta does not charge for sending Instagram direct messages or comment replies via this API.

---

## 3. WhatsApp Business Cloud API Setup

### Requirements
* A phone number not currently registered to a mobile WhatsApp app.
* WhatsApp Business Account (WABA) inside Meta Business Manager.
* System User with admin permissions to generate a permanent access token.

### 24-Hour Customer Care Window Rules (Free Tier)
1. **Inbound Trigger**: When a user sends a message to your WhatsApp number, a **24-hour customer service session** opens.
2. **Cost**: **$0.00** for the first 1,000 service conversations per month across your Meta Business Portfolio.
3. **Message Types**: You can send free-form text, quick replies, images, and documents within this 24-hour window without needing pre-approved templates.

### Sending an Inbound Session Reply:
```http
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {SYSTEM_USER_ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+1234567890",
  "type": "text",
  "text": {
    "body": "Hi there! How can we help you today?"
  }
}
```

---

## 4. Webhook Security: Verification & Ingress

### Challenge Verification (`GET /api/webhooks/meta`)
Meta calls this when you configure or verify the Webhook URL in the App Dashboard:
* Checks `hub.mode === 'subscribe'`
* Checks `hub.verify_token === process.env.META_VERIFY_TOKEN`
* Returns `hub.challenge` as plain text.

### Signature Validation (`POST /api/webhooks/meta`)
Meta sends an `X-Hub-Signature-256` header: `sha256={hmac_hash}`.
* Generated using your Meta `APP_SECRET` as the secret key over the raw JSON payload.
* Our route computes the HMAC and verifies using `crypto.timingSafeEqual` before processing.

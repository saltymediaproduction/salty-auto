const crypto = require('crypto');

async function testWebhook() {
  const secret = process.env.META_APP_SECRET || 'test_secret_or_real';
  const url = 'https://auto.saltymediaproduction.com/api/webhooks/meta';
  
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "12345",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "12345",
            phone_number_id: "test_phone_id"
          },
          messages: [{
            from: "1234567890",
            id: "wamid.TEST",
            timestamp: "123456789",
            type: "text",
            text: {
              body: "This is a test message"
            }
          }]
        },
        field: "messages"
      }]
    }]
  };
  
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  
  console.log('Sending webhook...');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': `sha256=${signature}`
    },
    body: body
  });
  
  console.log('Status:', res.status);
  console.log('Response:', await res.text());
}

testWebhook();

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    const [encodedSig, payload] = signedRequest.split('.', 2);

    if (!encodedSig || !payload) {
      return NextResponse.json({ error: "Invalid signed_request format" }, { status: 400 });
    }

    // Decode the payload
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.META_APP_SECRET || '')
      .update(payload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (encodedSig !== expectedSig) {
      console.error("[Meta Data Deletion] Invalid signature!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const userId = data.user_id;
    console.log(`[Meta] User ${userId} requested data deletion.`);

    // Meta expects a JSON response with a URL and confirmation code so the user can track the status
    // of their deletion request.
    const confirmationCode = crypto.randomBytes(16).toString("hex");
    
    return NextResponse.json({
      url: `https://auto.saltymediaproduction.com/data-deletion-status?id=${confirmationCode}`,
      confirmation_code: confirmationCode
    });
  } catch (err) {
    console.error("[Meta Data Deletion] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

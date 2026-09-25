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
      console.error("[Meta Deauthorize] Invalid signature!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const userId = data.user_id;
    console.log(`[Meta] User ${userId} deauthorized the app.`);

    // In a production scenario, you'd look up the user by their Meta user ID 
    // and delete their associated access tokens or account connections.

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Meta Deauthorize] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

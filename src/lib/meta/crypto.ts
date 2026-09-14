import crypto from "crypto";

/**
 * Validates Meta's X-Hub-Signature-256 header.
 * Meta computes: sha256={HMAC_SHA256(raw_body, APP_SECRET)}
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    console.error("[Meta Crypto] Missing META_APP_SECRET in environment");
    return false;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    console.warn("[Meta Crypto] Missing or malformed X-Hub-Signature-256 header");
    return false;
  }

  const expectedSignature = signatureHeader.slice("sha256=".length);

  const calculatedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const calculatedBuffer = Buffer.from(calculatedSignature, "hex");

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
  } catch (err) {
    console.error("[Meta Crypto] Signature verification exception:", err);
    return false;
  }
}

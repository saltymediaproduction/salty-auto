import crypto from "crypto";
import { verifyMetaSignature } from "../src/lib/meta/crypto";

// Test HMAC signature verification
const testSecret = "test_meta_app_secret_12345";
process.env.META_APP_SECRET = testSecret;

const samplePayload = JSON.stringify({
  object: "instagram",
  entry: [
    {
      id: "17841400012345678",
      changes: [
        {
          field: "comments",
          value: {
            id: "comment_99887766",
            text: "Please send me the PRICE and LINK!",
            from: { id: "user_112233", username: "marketing_pro" },
            media: { id: "media_554433" },
          },
        },
      ],
    },
  ],
});

// Compute genuine signature
const validHash = crypto
  .createHmac("sha256", testSecret)
  .update(samplePayload, "utf8")
  .digest("hex");

const validHeader = `sha256=${validHash}`;
const invalidHeader = "sha256=wrong_tampered_signature_hex_value_here_1234";

console.log("--- Testing Meta Webhook HMAC SHA-256 Verification ---");

// Test 1: Valid signature should pass
const test1 = verifyMetaSignature(samplePayload, validHeader);
console.log("Test 1 (Valid Signature):", test1 ? "PASSED ✅" : "FAILED ❌");

// Test 2: Invalid signature should fail
const test2 = verifyMetaSignature(samplePayload, invalidHeader);
console.log("Test 2 (Tampered Signature):", !test2 ? "PASSED (Rejected as expected) ✅" : "FAILED ❌");

// Test 3: Missing signature should fail
const test3 = verifyMetaSignature(samplePayload, null);
console.log("Test 3 (Missing Header):", !test3 ? "PASSED (Rejected as expected) ✅" : "FAILED ❌");

if (test1 && !test2 && !test3) {
  console.log("\nALL WEBHOOK SECURITY TESTS PASSED! 🚀");
  process.exit(0);
} else {
  console.error("\nTEST SUITE FAILED ❌");
  process.exit(1);
}

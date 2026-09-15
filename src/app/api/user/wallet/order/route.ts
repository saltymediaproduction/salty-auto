import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "INR" } = await req.json();

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required." },
        { status: 400 }
      );
    }

    // Convert to lowest currency denomination (e.g. paisa for INR)
    const amountInSubunits = Math.round(Number(amount) * 100);

    if (keyId && keySecret) {
      try {
        const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: amountInSubunits,
            currency: currency.toUpperCase(),
            receipt: `rcpt_${Date.now()}`,
            notes: {
              purpose: "Salty Auto Wallet Top-Up",
            },
          }),
        });

        if (response.ok) {
          const order = await response.json();
          return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
          });
        } else {
          const errText = await response.text();
          console.warn("[Razorpay Order] API returned non-200:", errText);
        }
      } catch (fetchErr) {
        console.warn("[Razorpay Order] Network call failed, falling back to simulated order:", fetchErr);
      }
    }

    // Fallback test order ID for instant sandbox top-up
    const mockOrderId = `order_test_${Date.now()}`;
    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      amount: amountInSubunits,
      currency: currency.toUpperCase(),
      keyId: keyId || "rzp_test_TYtlMiaHZqElpP",
      isMock: true,
    });
  } catch (err: any) {
    console.error("[Razorpay Order API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initiate payment order." },
      { status: 500 }
    );
  }
}

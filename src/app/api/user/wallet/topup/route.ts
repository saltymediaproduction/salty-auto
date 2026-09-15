import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { topUpWallet } from "@/lib/billing/wallet";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    const supabase = createAdminClient();
    let workspaceId: string | null = null;

    if (uid) {
      const { data: ws } = await supabase
        .from("auto_workspaces")
        .select("id")
        .eq("owner_id", uid)
        .maybeSingle();
      if (ws) workspaceId = ws.id;
    }

    if (!workspaceId) {
      const { data: firstWs } = await supabase
        .from("auto_workspaces")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (firstWs) workspaceId = firstWs.id;
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "No workspace found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const amount = Number(body.amount);
    const paymentMethod = body.paymentMethod || "Razorpay UPI";
    const paymentRef = body.paymentRef || `pay_${Date.now()}`;
    const orderId = body.orderId || null;

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid positive amount." },
        { status: 400 }
      );
    }

    // Minimum topup check (e.g. ₹100 or $5)
    if (amount < 50) {
      return NextResponse.json(
        { error: "Minimum top-up amount is ₹50 / $1." },
        { status: 400 }
      );
    }

    const updatedBilling = await topUpWallet(
      workspaceId,
      amount,
      paymentMethod,
      paymentRef,
      orderId
    );

    return NextResponse.json({
      success: true,
      billing: updatedBilling,
      message: `Successfully added ${updatedBilling.businessDetails.currency === "USD" ? "$" : "₹"}${amount.toFixed(
        2
      )} to wallet.`,
    });
  } catch (err: any) {
    console.error("[Wallet Topup API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process top-up." },
      { status: 500 }
    );
  }
}

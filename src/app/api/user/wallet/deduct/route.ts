import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { deductAutomationCost } from "@/lib/billing/wallet";

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

    const body = await req.json().catch(() => ({}));
    const cost = typeof body.cost === "number" ? body.cost : 0.15;
    const description = body.description || "Instagram Comment-to-DM Execution";
    const ruleId = body.ruleId || undefined;

    const updatedBilling = await deductAutomationCost(
      workspaceId,
      cost,
      description,
      ruleId
    );

    return NextResponse.json({
      success: true,
      billing: updatedBilling,
      message: `Deducted ${updatedBilling.businessDetails.currency === "USD" ? "$" : "₹"}${cost.toFixed(
        2
      )} for automation run.`,
    });
  } catch (err: any) {
    console.error("[Wallet Deduct API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to deduct automation cost." },
      { status: 500 }
    );
  }
}

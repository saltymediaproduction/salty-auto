import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getWorkspaceBillingProfile,
  updateWorkspaceBusinessProfile,
  type BusinessDetails,
} from "@/lib/billing/wallet";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    const supabase = createAdminClient();

    // 1. Resolve workspace
    let workspaceId: string | null = null;

    if (uid) {
      const { data: ws } = await supabase
        .from("auto_workspaces")
        .select("id")
        .eq("owner_id", uid)
        .maybeSingle();

      if (ws) {
        workspaceId = ws.id;
      }
    }

    // Fallback to first workspace in system if local dev session is unlinked
    if (!workspaceId) {
      const { data: firstWs } = await supabase
        .from("auto_workspaces")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (firstWs) {
        workspaceId = firstWs.id;
      }
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "No workspace found. Please log in." },
        { status: 404 }
      );
    }

    const billingState = await getWorkspaceBillingProfile(workspaceId);

    return NextResponse.json({
      success: true,
      billing: billingState,
    });
  } catch (err: any) {
    console.error("[User Profile API] GET error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch user profile." },
      { status: 500 }
    );
  }
}

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
    const businessDetails: Partial<BusinessDetails> = {
      businessName: body.businessName,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      taxId: body.taxId,
      address: body.address,
      city: body.city,
      state: body.state,
      country: body.country,
      postalCode: body.postalCode,
      currency: body.currency,
    };

    const updated = await updateWorkspaceBusinessProfile(workspaceId, businessDetails);

    return NextResponse.json({
      success: true,
      billing: updated,
      message: "Business and invoicing details securely saved in database.",
    });
  } catch (err: any) {
    console.error("[User Profile API] POST error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update user profile." },
      { status: 500 }
    );
  }
}

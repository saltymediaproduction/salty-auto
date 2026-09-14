import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/resend/client";

export async function POST(req: NextRequest) {
  try {
    const { uid, email, name, companyName } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing user UID" }, { status: 400 });
    }

    const cookieStore = await cookies();

    // Set 14-day persistent session cookies
    cookieStore.set("salty_uid", uid, {
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false, // Accessible to client if needed
    });

    cookieStore.set("salty_auth", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    });

    // Auto-provision workspace in Supabase with the Firebase UID as owner_id
    const supabase = createAdminClient();
    const { data: existingWorkspace } = await supabase
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (!existingWorkspace) {
      const workspaceName =
        companyName || (name ? `${name}'s Workspace` : `${email || "Agency"}'s Workspace`);

      await (supabase.from("auto_workspaces") as any).insert({
        name: workspaceName,
        owner_id: uid, // Storing Firebase UID
      });

      // Send branded welcome email via Resend
      if (email) {
        sendWelcomeEmail(email, name).catch((err) =>
          console.error("[Session API] Failed to send welcome email:", err)
        );
      }
    }

    return NextResponse.json({ success: true, uid });
  } catch (err) {
    console.error("[Session API] Error creating session:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("salty_uid");
  cookieStore.delete("salty_auth");
  return NextResponse.json({ success: true });
}

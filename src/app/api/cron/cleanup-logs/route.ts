import { NextRequest, NextResponse } from "next/server";
import { purgeAndAggregateOldLogs } from "@/lib/maintenance/log-cleaner";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.INTERNAL_API_SECRET;

    // Optional secret check if invoked by external cron
    if (secret && authHeader && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days");
    const retentionDays = daysParam ? parseInt(daysParam, 10) : 30;

    const result = await purgeAndAggregateOldLogs(retentionDays);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Cron Cleanup API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to purge logs." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

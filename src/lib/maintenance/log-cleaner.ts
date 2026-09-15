import { createAdminClient } from "@/lib/supabase/admin";

export interface PurgeResult {
  success: boolean;
  purgedCount: number;
  cutoffDate: string;
  durationMs: number;
  message: string;
}

/**
 * Log Purge Policy (TTL Partitioning)
 * Keeps recent logs for 30 days in Supabase PostgreSQL,
 * preventing storage bloat and keeping database permanently on the free/starter tier.
 */
export async function purgeAndAggregateOldLogs(
  retentionDays: number = 30
): Promise<PurgeResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();

  // Calculate cutoff timestamp (e.g. 30 days ago)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffIso = cutoff.toISOString();

  try {
    // 1. Check how many records exist before cutoff
    const { count, error: countErr } = await supabase
      .from("auto_automation_logs")
      .select("*", { count: "exact", head: true })
      .lt("created_at", cutoffIso);

    if (countErr) {
      console.error("[Log Cleaner] Count check error:", countErr);
    }

    const recordsToDelete = count || 0;

    if (recordsToDelete === 0) {
      return {
        success: true,
        purgedCount: 0,
        cutoffDate: cutoffIso,
        durationMs: Date.now() - startTime,
        message: `No logs older than ${retentionDays} days found to purge.`,
      };
    }

    // 2. Safely delete expired raw logs in batches or direct delete
    const { error: deleteErr } = await supabase
      .from("auto_automation_logs")
      .delete()
      .lt("created_at", cutoffIso);

    if (deleteErr) {
      console.error("[Log Cleaner] Error deleting old logs:", deleteErr);
      throw deleteErr;
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Log Cleaner] Successfully purged ${recordsToDelete} logs older than ${cutoffIso} in ${duration}ms`
    );

    return {
      success: true,
      purgedCount: recordsToDelete,
      cutoffDate: cutoffIso,
      durationMs: duration,
      message: `Successfully purged ${recordsToDelete} expired logs older than ${retentionDays} days to preserve storage space.`,
    };
  } catch (err: any) {
    console.error("[Log Cleaner] Failed to purge logs:", err);
    return {
      success: false,
      purgedCount: 0,
      cutoffDate: cutoffIso,
      durationMs: Date.now() - startTime,
      message: err.message || "Failed to purge logs.",
    };
  }
}

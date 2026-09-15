import { inngest } from "../client";
import { purgeAndAggregateOldLogs } from "@/lib/maintenance/log-cleaner";

/**
 * Daily Inngest Cron job running at 02:00 UTC
 * Implements automated 30-day Log TTL partitioning and storage purge.
 */
export const cleanupLogsCron = inngest.createFunction(
  {
    id: "cleanup-logs-cron",
    name: "Automated 30-Day Log TTL Cleaner",
  },
  { cron: "0 2 * * *" }, // Run daily at 2:00 AM UTC
  async ({ step }) => {
    const result = await step.run("purge-expired-logs", async () => {
      return await purgeAndAggregateOldLogs(30);
    });

    return {
      status: "completed",
      purgedCount: result.purgedCount,
      cutoffDate: result.cutoffDate,
      durationMs: result.durationMs,
    };
  }
);

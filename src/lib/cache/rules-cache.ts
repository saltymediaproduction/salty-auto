import { createAdminClient } from "@/lib/supabase/admin";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-Memory Fast Cache Store
const rulesCache = new Map<string, CacheEntry<any[]>>();
const accountCache = new Map<string, CacheEntry<any>>();

// Cache TTL: 2 minutes for automation rules, 5 minutes for connected accounts
const RULES_TTL_MS = 120 * 1000;
const ACCOUNT_TTL_MS = 300 * 1000;

/**
 * Get active automation rules from in-memory Edge Cache.
 * Prevents hammering PostgreSQL with SELECT queries on every inbound webhook.
 */
export async function getCachedActiveRules(
  workspaceId: string,
  platform: string,
  triggerType?: string
): Promise<any[]> {
  const cacheKey = `rules:${workspaceId}:${platform}:${triggerType || "all"}`;
  const now = Date.now();

  const cached = rulesCache.get(cacheKey);
  if (cached && now - cached.timestamp < RULES_TTL_MS) {
    return cached.data;
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("auto_automation_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("platform", platform.toLowerCase())
    .eq("is_active", true);

  if (triggerType) {
    query = query.eq("trigger_type", triggerType.toLowerCase());
  }

  const { data: rules, error } = await query;

  if (error) {
    console.error("[Rules Cache] DB error fetching rules:", error);
    // If DB has a temporary glitch, return stale cache if available
    if (cached) return cached.data;
    return [];
  }

  const result = rules || [];
  rulesCache.set(cacheKey, { data: result, timestamp: now });

  return result;
}

/**
 * Get active connected social account credentials from in-memory cache.
 */
export async function getCachedSocialAccount(
  platform: string,
  accountId: string
): Promise<any | null> {
  const cacheKey = `account:${platform}:${accountId}`;
  const now = Date.now();

  const cached = accountCache.get(cacheKey);
  if (cached && now - cached.timestamp < ACCOUNT_TTL_MS) {
    return cached.data;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("auto_social_accounts")
    .select("id, workspace_id, access_token, status")
    .eq("platform", platform.toLowerCase())
    .eq("account_id", accountId.trim())
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    if (cached) return cached.data;
    return null;
  }

  accountCache.set(cacheKey, { data, timestamp: now });
  return data;
}

/**
 * Invalidate cache whenever rules or accounts are updated in the dashboard.
 */
export function invalidateRulesCache(workspaceId?: string) {
  if (!workspaceId) {
    rulesCache.clear();
    accountCache.clear();
    return;
  }

  for (const key of rulesCache.keys()) {
    if (key.includes(workspaceId)) {
      rulesCache.delete(key);
    }
  }
}

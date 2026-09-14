import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dwizjplnmxlyhkbxbosw.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "temp-anon-key";

  return createBrowserClient<Database>(url, anonKey);
}

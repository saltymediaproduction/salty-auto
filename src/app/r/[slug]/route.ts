import { NextRequest, NextResponse } from "next/server";
import { resolveTrackedSlug, recordLinkClick } from "@/lib/tracking/client";

export const dynamic = "force-dynamic";

/**
 * High-speed redirect endpoint for campaign tracked links.
 * URL: /r/[slug]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 1. Resolve destination URL (< 10ms)
  const destinationUrl = await resolveTrackedSlug(slug);

  if (!destinationUrl) {
    // If slug not found, redirect to main site or 404
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2. Asynchronously record click (non-blocking)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip");
  const userAgent = req.headers.get("user-agent");
  const referrer = req.headers.get("referer");

  // Fire and forget click tracking so redirect latency is minimal
  recordLinkClick({ slug, ip, userAgent, referrer }).catch((err) => {
    console.error("[Link Redirect] Click recording error:", err);
  });

  // 3. Temporary 307 redirect directly to destination
  return NextResponse.redirect(destinationUrl, 307);
}

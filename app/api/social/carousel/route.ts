import { after, NextResponse } from "next/server";
import { renderCarousel } from "@/lib/carousel/render";
import { claimPost, markFailed, saveSlides } from "@/lib/carousel/store";
import { fromCrmPayload, validateListing } from "@/lib/carousel/types";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds; rendering 9 slides takes ~8–20s

/**
 * POST /api/social/carousel
 * Fired by the same CRM "Publish to Website" webhook that updates the site.
 * Auth: header `x-webhook-secret` or `?secret=` must equal CAROUSEL_WEBHOOK_SECRET.
 * `?force=1` re-renders even if the listing already has an active carousel.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-webhook-secret") ?? url.searchParams.get("secret");
  if (!process.env.CAROUSEL_WEBHOOK_SECRET || secret !== process.env.CAROUSEL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const listing = fromCrmPayload(body);
  const problems = validateListing(listing);
  if (problems.length) {
    return NextResponse.json({ status: "rejected", ref: listing.ref, problems }, { status: 422 });
  }

  const postId = await claimPost(listing, url.searchParams.get("force") === "1");
  if (!postId) {
    return NextResponse.json({ status: "skipped", reason: "Carousel already exists for this listing", ref: listing.ref });
  }

  // Answer the webhook immediately; render in the background so the CRM never times out.
  after(async () => {
    try {
      const slides = await renderCarousel(listing);
      await saveSlides(postId, listing.ref, slides);
    } catch (e) {
      await markFailed(postId, e instanceof Error ? e.message : String(e));
    }
  });

  return NextResponse.json({ status: "queued", postId, ref: listing.ref }, { status: 202 });
}

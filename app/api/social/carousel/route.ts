import { after, NextResponse } from "next/server";
import { notifyCrm } from "@/lib/carousel/callback";
import { renderCarousel } from "@/lib/carousel/render";
import { uploadSlides } from "@/lib/carousel/storage";
import { fromCrmPayload, validateListing } from "@/lib/carousel/types";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds; rendering 9 slides takes ~8–20s, plus up to ~17s of callback retries

/**
 * POST /api/social/carousel
 * Body: { post_id: "<uuid from the CRM>", property: { ...listing fields } }
 * Auth: header `x-webhook-secret` or `?secret=` must equal CAROUSEL_WEBHOOK_SECRET.
 * Idempotency is the CRM's job: it decides when to create a post_id and call this route.
 * The result is POSTed back to CRM_CALLBACK_URL once rendering finishes.
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

  const postId = typeof body?.post_id === "string" ? body.post_id.trim() : "";
  if (!postId) {
    return NextResponse.json({ error: "post_id is required" }, { status: 400 });
  }

  const listing = fromCrmPayload(body);
  const problems = validateListing(listing);
  if (problems.length) {
    return NextResponse.json({ status: "rejected", post_id: postId, ref: listing.ref, problems }, { status: 422 });
  }

  // Answer the webhook immediately; render in the background so the CRM never times out.
  after(async () => {
    try {
      const { slides, warnings } = await renderCarousel(listing);
      const slideUrls = await uploadSlides(postId, listing.ref, slides);
      await notifyCrm({ post_id: postId, ref: listing.ref, status: "pending_approval", slide_urls: slideUrls, warnings });
    } catch (e) {
      const error = (e instanceof Error ? e.message : String(e)).slice(0, 2000);
      await notifyCrm({ post_id: postId, ref: listing.ref, status: "failed", error });
    }
  });

  return NextResponse.json({ status: "queued", post_id: postId }, { status: 202 });
}

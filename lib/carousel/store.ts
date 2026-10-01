import { createClient } from "@supabase/supabase-js";
import type { CarouselListing } from "./types";

export const BUCKET = "social-carousels";

const db = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

/** Statuses that mean "this listing already has a carousel in flight or live". */
const ACTIVE = ["rendering", "pending_approval", "approved", "scheduled", "published"];

/**
 * Creates the social_posts row, or returns null if one is already active.
 * Protects against "Sync All" re-firing the webhook for every published listing.
 */
export async function claimPost(l: CarouselListing, force: boolean) {
  const supabase = db();
  if (!force) {
    const { data: existing } = await supabase
      .from("social_posts")
      .select("id,status")
      .eq("property_id", l.id)
      .in("status", ACTIVE)
      .limit(1)
      .maybeSingle();
    if (existing) return null;
  }
  const { data, error } = await supabase
    .from("social_posts")
    .insert({ property_id: l.id, ref: l.ref, status: "rendering", source_images: l.images })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function saveSlides(postId: string, ref: string, slides: Buffer[]) {
  const supabase = db();
  const folder = `${ref}/${postId}`; // new folder per render, so no stale CDN cache
  const urls: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    const path = `${folder}/slide-${String(i + 1).padStart(2, "0")}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, slides[i], {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw error;
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  const { error } = await supabase
    .from("social_posts")
    .update({ status: "pending_approval", slide_urls: urls, error: null, rendered_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) throw error;
  return urls;
}

export async function markFailed(postId: string, message: string) {
  await db().from("social_posts").update({ status: "failed", error: message.slice(0, 2000) }).eq("id", postId);
}

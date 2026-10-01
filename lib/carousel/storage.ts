import { put } from "@vercel/blob";

/**
 * Uploads rendered slides to Vercel Blob (uses BLOB_READ_WRITE_TOKEN) and returns their public URLs.
 * Path: carousels/{ref}/{post_id}/slide-01.jpg — a new folder per post, so no stale CDN cache.
 */
export async function uploadSlides(postId: string, ref: string, slides: Buffer[]) {
  const urls: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    const path = `carousels/${ref}/${postId}/slide-${String(i + 1).padStart(2, "0")}.jpg`;
    const blob = await put(path, slides[i], {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true, // the CRM may resend the same post_id
    });
    urls.push(blob.url);
  }
  return urls;
}

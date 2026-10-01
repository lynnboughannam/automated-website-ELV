import { put } from "@vercel/blob";

/**
 * Read-write token for the connected Blob store. Passed explicitly on every call: without it,
 * @vercel/blob 2.x prefers OIDC + BLOB_STORE_ID when running on Vercel, and only falls back to
 * BLOB_READ_WRITE_TOKEN when no OIDC token is available.
 */
export function blobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  return token;
}

/**
 * Uploads rendered slides to Vercel Blob and returns their public URLs.
 * Path: carousels/{ref}/{post_id}/slide-01.jpg — a new folder per post, so no stale CDN cache.
 */
export async function uploadSlides(postId: string, ref: string, slides: Buffer[]) {
  const token = blobToken();
  const urls: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    const path = `carousels/${ref}/${postId}/slide-${String(i + 1).padStart(2, "0")}.jpg`;
    const blob = await put(path, slides[i], {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true, // the CRM may resend the same post_id
      token,
    });
    urls.push(blob.url);
  }
  return urls;
}

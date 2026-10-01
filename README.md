# Elevate Estates – listing carousel renderer

**Cover style: Option 1 – Framed** (location header, inset photo, Linen frame).

Turns a published CRM listing into a branded Instagram carousel: 1440×1800 JPEGs (4:5, quality 92;
laid out at 1080×1350 CSS px and rendered at 4/3 scale — Instagram's API accepts up to 1440px wide).
Slides: cover → one slide per extra photo (up to 6) → details → CTA. A listing with 1 photo
gives 3 slides (cover, details, CTA); the maximum is 9.

The details slide's "Highlights" chips are the listing's amenities, then its tags in Title Case
(trimmed, empties and case-insensitive duplicates removed, max 12). The chips shrink step by step
if they would run into the price row. The `luxury` tag also shows the Luxury badge on the cover. Slides are uploaded to Vercel Blob
and the result is POSTed back to the CRM (Lovable Cloud), which stores it and tracks status.

This app has no database. The CRM owns the `post_id`, the post status, and idempotency
(deciding whether a listing already has a carousel, handling "Sync All", re-renders).

## Flow
1. CRM creates a post (status `rendering`) and calls this app:
   ```http
   POST https://YOUR-APP.vercel.app/api/social/carousel
   content-type: application/json
   x-webhook-secret: <CAROUSEL_WEBHOOK_SECRET>      (or ?secret=... in the URL)

   { "post_id": "<uuid from the CRM>", "property": { ...listing fields } }
   ```
2. The app validates and answers immediately, then renders in the background.
3. When rendering finishes, the app POSTs to `CRM_CALLBACK_URL` with headers
   `content-type: application/json` and `x-webhook-secret: <CAROUSEL_WEBHOOK_SECRET>`:
   ```json
   { "post_id": "...", "ref": "ELV-AH-1212", "status": "pending_approval",
     "slide_urls": ["https://….public.blob.vercel-storage.com/carousels/ELV-AH-1212/<post_id>/slide-01.jpg", "…"],
     "warnings": ["Photo 3 is only 800px wide; it may look blurry"] }
   ```
   `warnings` is always present (empty array when there's nothing to report). A photo narrower
   than 1080px still renders, but gets a warning so the CRM can flag it before approval.
   or, if rendering/upload failed:
   ```json
   { "post_id": "...", "ref": "ELV-AH-1212", "status": "failed", "error": "<message>" }
   ```
   The CRM must check `x-webhook-secret` and return 2xx. A failed or non-2xx callback is
   retried 3 times (after 2s, 5s, 10s); the final failure is logged with `console.error`
   (visible in Vercel → Logs).

Slides live at `carousels/{ref}/{post_id}/slide-01.jpg`, `slide-02.jpg`, … (public).
Sending the same `post_id` again overwrites that post's slides; use a new `post_id` for a fresh render.

## Response codes
| Code | Body | Meaning |
|---|---|---|
| 202 | `{ "status": "queued", "post_id" }` | Accepted; result arrives via callback |
| 400 | `{ "error" }` | Body is not JSON, or `post_id` is missing |
| 401 | `{ "error": "Unauthorized" }` | Wrong or missing secret |
| 422 | `{ "status": "rejected", "post_id", "ref", "problems": [...] }` | Listing not ready: invalid reference, no published images, no location or no property type — no callback is sent |

## Environment variables
| Name | Purpose |
|---|---|
| `CAROUSEL_WEBHOOK_SECRET` | Shared secret. Checked on incoming requests, sent on outgoing callbacks. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token. Added automatically when a Blob store is connected to the Vercel project. |
| `CRM_CALLBACK_URL` | CRM endpoint that receives the render result. |
| `CHROME_EXECUTABLE_PATH` | Local dev only: path to your installed Chrome. |

## Setup
1. `npm install`
2. Vercel → Storage → create/connect a Blob store (sets `BLOB_READ_WRITE_TOKEN`).
3. Add `CAROUSEL_WEBHOOK_SECRET` and `CRM_CALLBACK_URL` in Vercel → Settings → Environment Variables.
   For local dev, copy `.env.example` → `.env.local` and fill it in.
4. Vercel: Node 22. If renders time out, raise Function CPU/memory in Project Settings → Functions.
5. Local dev: set `CHROME_EXECUTABLE_PATH` to your Chrome, `npm run dev`, then open
   `http://localhost:3000/api/social/carousel/preview` to see every slide at full size.
   POST a real request body to the same URL to preview an actual listing.
   In production the preview needs `?secret=`.

## Where to change things
- `lib/carousel/types.ts` → `fromCrmPayload()`: the only place that knows CRM field names.
  It reads `published_images`, `reference_number`, `property_type`, `listing_type`,
  `location`, `price`, `size`, `bedrooms`, `bathrooms`, `amenities`, `tags` (with fallbacks).
  Owner fields are never read, so owner contact details cannot reach an image.
- `lib/carousel/types.ts` → `validateListing()`: the reference (e.g. `ELV-AH-1212`) must be 3–20
  characters of A–Z, 0–9 and hyphens, starting and ending with a letter or digit; the listing
  needs at least 1 published image, a location and a property type.
  The slides are checked for references up to 14 characters; longer ones shrink the tag text further.
- `lib/carousel/template.ts`: the design (CSS + slide markup). The contact number on the last slide is `CONTACT_PHONE`.
- `lib/carousel/storage.ts`: Vercel Blob upload.
- `lib/carousel/callback.ts`: the CRM callback and its retries.
- Logos/fonts are inlined from `lib/carousel/assets.generated.ts`. If you replace the PNGs
  in `lib/carousel/assets/`, run `npm run assets`.

# Elevate Estates – listing carousel renderer

**Cover style: Option 2 – Floating card** (full-bleed photo, white location card at the bottom).

Turns a published CRM listing into a branded Instagram carousel (1080×1350 JPEGs):
cover → up to 6 photos → details → CTA (max 9 slides). Slides are saved to Supabase
Storage and a `social_posts` row is set to `pending_approval`.

## How it is triggered
Same event as the website: the CRM "Publish to Website" webhook.

**Option A – forward from your existing webhook receiver** (one line, recommended):
```ts
// inside the handler that already publishes the listing to the website
fetch(`${process.env.CAROUSEL_APP_URL}/api/social/carousel`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-webhook-secret": process.env.CAROUSEL_WEBHOOK_SECRET! },
  body: JSON.stringify(payload), // the exact body the CRM sent you
}).catch(() => {}); // never block the website publish
```
**Option B – add a second webhook in the CRM** (Settings → Webhooks):
`https://YOUR-APP.vercel.app/api/social/carousel?secret=YOUR_SECRET`

The route answers in <1s (202) and renders in the background, so the CRM never times out.
"Sync All" is safe: a listing that already has an active carousel is skipped.
Add `?force=1` to re-render after you change photos.

## Setup
1. `npm install`
2. Run `supabase/migrations/20261001_social_posts.sql` in the Supabase SQL editor
   (creates `social_posts` and the public `social-carousels` bucket).
3. Copy `.env.example` → `.env.local` and fill it in. Add the same vars in Vercel.
4. Vercel: Node 22. If renders time out, raise Function CPU/memory in Project Settings → Functions.
5. Local dev: set `CHROME_EXECUTABLE_PATH` to your Chrome, `npm run dev`, then open
   `http://localhost:3000/api/social/carousel/preview` to see every slide at full size.
   POST a real webhook body to the same URL to preview an actual listing.

## Where to change things
- `lib/carousel/types.ts` → `fromCrmPayload()`: the only place that knows CRM field names.
  It reads `published_images`, `reference_number`, `property_type`, `listing_type`,
  `location`, `price`, `size`, `bedrooms`, `bathrooms`, `amenities`, `tags` (with fallbacks).
  Owner fields are never read, so owner contact details cannot reach an image.
- `lib/carousel/template.ts`: the design (CSS + slide markup).
- Logos/fonts are inlined from `lib/carousel/assets.generated.ts`. If you replace the PNGs
  in `lib/carousel/assets/`, run `npm run assets`.

## Response codes
202 queued · 200 skipped (already exists) · 422 listing not ready (bad ref, <3 photos, no location) · 401 bad secret
Render errors land on the row: `status = 'failed'`, `error = '...'`.

## Moving into the new CRM
Copy `lib/carousel/`, `app/api/social/carousel/`, the migration, and the two
`serverExternalPackages` entries in `next.config.mjs`. Nothing else changes.

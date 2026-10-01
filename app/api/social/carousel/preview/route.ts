import { buildCarouselHtml } from "@/lib/carousel/template";
import { fromCrmPayload, type CarouselListing } from "@/lib/carousel/types";

export const runtime = "nodejs";

const SAMPLE: CarouselListing = {
  id: "sample",
  ref: "EE-017331",
  title: "3 bedroom apartment in Martakla",
  propertyType: "Apartment",
  listingType: "sale",
  location: "Martakla",
  price: 285000,
  currency: "USD",
  sizeSqm: 180,
  bedrooms: 3,
  bathrooms: 2,
  amenities: ["Mountain view", "Covered parking", "24/7 electricity", "Elevator", "Storage room", "Balcony"],
  tags: [],
  images: [],
};

const allowed = (req: Request) =>
  process.env.NODE_ENV !== "production" ||
  new URL(req.url).searchParams.get("secret") === process.env.CAROUSEL_WEBHOOK_SECRET;

const html = (body: string) => new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });

/** GET /api/social/carousel/preview?images=url1,url2,...  — sample listing, every slide stacked. */
export async function GET(req: Request) {
  if (!allowed(req)) return new Response("Not found", { status: 404 });
  const images = new URL(req.url).searchParams.get("images")?.split(",").filter(Boolean) ?? [];
  return html(buildCarouselHtml({ ...SAMPLE, images }).html);
}

/** POST the real webhook payload here to see exactly what a listing will render as. */
export async function POST(req: Request) {
  if (!allowed(req)) return new Response("Not found", { status: 404 });
  return html(buildCarouselHtml(fromCrmPayload(await req.json())).html);
}

export type ListingType = "sale" | "rent";

/** Normalized listing used by the carousel template. Nothing else reaches the slides. */
export interface CarouselListing {
  id: string;
  ref: string; // EE-XXXXXX
  title: string; // English title
  propertyType: string; // Apartment, Villa, Office...
  listingType: ListingType;
  location: string; // From the shared locations table, e.g. "Martakla"
  price: number | null; // null = price on request
  currency: string; // "USD"
  sizeSqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[];
  tags: string[]; // "luxury" tag switches the cover badge
  images: string[]; // Ordered public URLs. First = cover.
}

const pick = (o: Record<string, any>, ...keys: string[]) => {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== "") return o[k];
  return undefined;
};
const num = (v: unknown) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String).filter(Boolean) : typeof v === "string" && v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

/**
 * Maps the CRM "Publish to Website" webhook payload to CarouselListing.
 * This is the ONE place to edit if your payload field names differ.
 * Owner details are never read, so they can never reach a published image.
 */
export function fromCrmPayload(body: Record<string, any>): CarouselListing {
  const p = body.property ?? body.record ?? body.data ?? body;
  const imagesRaw = pick(p, "published_images", "publishedImages", "images") ?? [];
  const images = (Array.isArray(imagesRaw) ? imagesRaw : [])
    .map((i: any) => (typeof i === "string" ? i : i?.url ?? i?.src))
    .filter(Boolean);
  const lt = String(pick(p, "listing_type", "listingType") ?? "sale").toLowerCase();
  const loc = pick(p, "location", "location_name", "locationName");

  return {
    id: String(pick(p, "id", "property_id") ?? ""),
    ref: String(pick(p, "reference_number", "reference", "ref", "ref_number") ?? "").toUpperCase(),
    title: String(pick(p, "title_en", "title") ?? ""),
    propertyType: String(pick(p, "property_type", "type", "propertyType") ?? "Property"),
    listingType: lt.includes("rent") ? "rent" : "sale",
    location: String(typeof loc === "object" ? loc?.name ?? "" : loc ?? ""),
    price: num(pick(p, "price")),
    currency: String(pick(p, "currency") ?? "USD"),
    sizeSqm: num(pick(p, "size", "size_sqm", "area")),
    bedrooms: num(pick(p, "bedrooms", "beds")),
    bathrooms: num(pick(p, "bathrooms", "baths")),
    amenities: list(pick(p, "amenities")),
    tags: list(pick(p, "tags")).map((t) => t.toLowerCase()),
    images,
  };
}

/** Returns human-readable problems. Empty array = ready to render. */
export function validateListing(l: CarouselListing): string[] {
  const errors: string[] = [];
  if (!/^EE-\d{6}$/.test(l.ref)) errors.push(`Reference "${l.ref}" is not in EE-XXXXXX format.`);
  if (!l.location) errors.push("Location is missing.");
  if (!l.propertyType) errors.push("Property type is missing.");
  if (l.images.length < 3) errors.push(`Only ${l.images.length} published images. Select at least 3.`);
  return errors;
}

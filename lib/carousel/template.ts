import { ASSETS } from "./assets.generated";
import type { CarouselListing } from "./types";

export const SLIDE_W = 1080;
export const SLIDE_H = 1350; // 4:5, the tallest Instagram feed format
const MAX_PHOTO_SLIDES = 6; // cover + 6 photos + details + CTA = 9 (API limit is 10)

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const money = (l: CarouselListing) => {
  if (l.price == null) return "Price on request";
  const f = new Intl.NumberFormat("en-US", { style: "currency", currency: l.currency || "USD", maximumFractionDigits: 0 });
  return f.format(l.price);
};

const typeLine = (l: CarouselListing) => `${l.propertyType} for ${l.listingType === "rent" ? "rent" : "sale"}`;

const specs = (l: CarouselListing) =>
  [
    l.bedrooms != null && { value: String(l.bedrooms), label: l.bedrooms === 1 ? "Bedroom" : "Bedrooms" },
    l.bathrooms != null && { value: String(l.bathrooms), label: l.bathrooms === 1 ? "Bathroom" : "Bathrooms" },
    l.sizeSqm != null && { value: `${l.sizeSqm}`, unit: "m²", label: "Built-up area" },
  ].filter(Boolean) as { value: string; unit?: string; label: string }[];

const refTag = (ref: string, size: "sm" | "md" | "xl" = "md") => `
  <div class="tag tag-${size}">
    <span class="grommet"></span>
    <div>
      <div class="tag-label">Reference</div>
      <div class="tag-num">${esc(ref)}</div>
    </div>
  </div>`;

const stamp = () => `<div class="stamp"><img src="data:image/png;base64,${ASSETS.iconWhite}" alt=""></div>`;

const CSS = `
@font-face{font-family:"Playfair Display";font-weight:700;font-style:normal;src:url(data:font/woff2;base64,${ASSETS.playfair700}) format("woff2")}
@font-face{font-family:"Playfair Display";font-weight:400;font-style:italic;src:url(data:font/woff2;base64,${ASSETS.playfair400i}) format("woff2")}
@font-face{font-family:"Nunito Sans";font-weight:400;src:url(data:font/woff2;base64,${ASSETS.nunito400}) format("woff2")}
@font-face{font-family:"Nunito Sans";font-weight:600;src:url(data:font/woff2;base64,${ASSETS.nunito600}) format("woff2")}
@font-face{font-family:"Nunito Sans";font-weight:700;src:url(data:font/woff2;base64,${ASSETS.nunito700}) format("woff2")}
@font-face{font-family:"Nunito Sans";font-weight:800;src:url(data:font/woff2;base64,${ASSETS.nunito800}) format("woff2")}
:root{--brown:#7A5230;--oak:#4E3219;--tan:#A87850;--linen:#EDE8E0;--sand:#EFE3D5;--sand-line:#D4B89A;--espresso:#2E1F0E;--white:#FAF7F3;--gold-bg:#FAF0DC;--gold:#7A5A0B}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#999;font-family:"Nunito Sans",sans-serif;color:var(--espresso);-webkit-font-smoothing:antialiased}
.slide{width:${SLIDE_W}px;height:${SLIDE_H}px;position:relative;overflow:hidden;background:var(--linen)}
.photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;background:var(--sand)}

/* Brand stamp: the logomark in a Dark Oak block, pinned top-left on photo slides */
.stamp{position:absolute;top:0;left:64px;width:116px;height:136px;background:var(--oak);display:flex;align-items:flex-end;justify-content:center;padding-bottom:26px;border-radius:0 0 12px 12px}
.stamp img{height:62px;width:auto;display:block}

/* Reference key tag: the signature element, same corner on every slide */
.tag{display:inline-flex;align-items:center;gap:22px;background:var(--sand);border:2px solid var(--sand-line);border-radius:14px;padding:18px 32px 18px 24px}
.grommet{width:22px;height:22px;border-radius:50%;background:var(--linen);border:5px solid var(--tan);flex:none}
.tag-label{font-weight:800;font-size:15px;letter-spacing:3px;text-transform:uppercase;color:var(--brown);line-height:1}
.tag-num{font-weight:800;font-size:40px;letter-spacing:4px;color:var(--oak);line-height:1;margin-top:8px}
.tag-sm{padding:14px 26px 14px 20px;gap:18px}
.tag-sm .tag-num{font-size:32px;letter-spacing:3px}
.tag-sm .tag-label{font-size:13px}
.tag-xl{padding:30px 52px 30px 38px;gap:34px;border-radius:20px}
.tag-xl .grommet{width:34px;height:34px;border-width:7px}
.tag-xl .tag-label{font-size:20px;letter-spacing:4px}
.tag-xl .tag-num{font-size:84px;letter-spacing:7px;margin-top:12px}
.corner{position:absolute;right:56px;bottom:56px}

.badges{position:absolute;top:56px;right:56px;display:flex;gap:12px}
.badge{font-weight:800;font-size:24px;padding:12px 26px;border-radius:40px;background:var(--white);color:var(--oak)}
.badge.lux{background:var(--gold-bg);color:var(--gold)}

/* Cover: floating card. Full-bleed photo, location card anchored at the bottom. */
.kicker{font-weight:700;font-size:28px;color:var(--tan);letter-spacing:.5px}
.place{display:block;max-width:100%;overflow:hidden;font-family:"Playfair Display",serif;font-weight:700;font-size:108px;line-height:1;letter-spacing:-2px;color:#fff;margin-top:14px;white-space:nowrap}
.price{font-weight:800;font-size:58px;color:#fff;line-height:1;letter-spacing:-.5px}
.price small{font-weight:600;font-size:26px;color:rgba(255,255,255,.6);letter-spacing:0;margin-left:8px}
.speclist{display:flex;font-weight:600;font-size:31px;color:rgba(46,31,14,.72)}
.speclist span+span{border-left:2px solid rgba(122,82,48,.25);margin-left:22px;padding-left:22px}
.cover .scrim{position:absolute;left:0;right:0;top:0;height:240px;background:linear-gradient(rgba(0,0,0,.38),rgba(0,0,0,0))}
.cover .wordmark{position:absolute;top:56px;left:60px;height:64px;width:auto}
.cover .badges{top:56px;right:56px}
.card{position:absolute;left:48px;right:48px;bottom:48px;background:var(--white);border-radius:24px;padding:46px 52px 44px}
.card-loc{display:flex;align-items:center;gap:20px}
.card-loc-text{flex:1;min-width:0}
.pin{width:58px;height:74px;flex:none;color:var(--brown)}
.card .place{color:var(--oak);font-size:112px;letter-spacing:-2.5px;margin-top:6px;padding-bottom:6px}
.card hr{border:0;height:2px;background:rgba(122,82,48,.15);margin:30px 0 30px}
.card-foot{display:flex;align-items:flex-end;justify-content:space-between}
.card .price{color:var(--oak);font-size:58px;margin-top:16px}
.card .price small{color:var(--tan)}

/* Details */
.details{padding:190px 80px 64px;display:flex;flex-direction:column}
.details .logo{position:absolute;top:72px;left:80px;height:60px}
.details .kicker{color:var(--brown)}
.details .place{color:var(--oak);font-size:156px;letter-spacing:-3px;margin-top:12px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:96px}
.cell{border-top:3px solid var(--brown);padding-top:22px}
.cell .v{font-family:"Playfair Display",serif;font-weight:700;font-size:148px;line-height:1;color:var(--oak);letter-spacing:-2px}
.cell .v small{font-family:"Nunito Sans",sans-serif;font-weight:700;font-size:34px;letter-spacing:0;margin-left:6px;color:var(--brown)}
.cell .l{font-weight:700;font-size:28px;color:var(--tan);margin-top:14px}
.features{margin-top:96px}
.features h3{font-weight:700;font-size:28px;color:var(--brown);margin-bottom:20px}
.chips{display:flex;flex-wrap:wrap;gap:14px}
.chip{background:var(--white);border:1.5px solid rgba(122,82,48,.25);color:var(--oak);font-weight:700;font-size:28px;padding:14px 30px;border-radius:40px}
.details-foot{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;border-top:1.5px solid rgba(122,82,48,.2);padding-top:36px}
.details-foot .lbl{font-weight:700;font-size:24px;color:var(--tan)}
.details-foot .price{color:var(--oak);font-size:66px;margin-top:10px}
.details-foot .price small{color:var(--tan)}

/* CTA */
.cta{background:var(--brown);padding:96px 80px 80px;display:flex;flex-direction:column}
.cta .logo{height:76px;align-self:flex-start}
.cta h2{font-family:"Playfair Display",serif;font-weight:700;font-size:112px;line-height:1.02;letter-spacing:-2.5px;color:#fff;margin-top:110px}
.cta .ask{font-weight:600;font-size:36px;line-height:1.45;color:rgba(255,255,255,.82);margin-top:56px;max-width:840px}
.cta .tagwrap{margin-top:52px}
.cta .tag{border-color:var(--sand)}
.cta .site{margin-top:auto;font-weight:700;font-size:32px;color:#fff;letter-spacing:.5px;border-top:1.5px solid rgba(255,255,255,.25);padding-top:36px}
`;

const PIN = `<svg class="pin" viewBox="0 0 20 26" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M10 0C4.5 0 0 4.4 0 9.9 0 17.3 10 26 10 26s10-8.7 10-16.1C20 4.4 15.5 0 10 0zm0 13.6a3.7 3.7 0 1 1 0-7.4 3.7 3.7 0 0 1 0 7.4z"/></svg>`;

function coverSlide(l: CarouselListing) {
  const lux = l.tags.includes("luxury");
  const s = specs(l);
  return `
  <section class="slide cover">
    <img class="photo" src="${esc(l.images[0] ?? "")}" alt="">
    <div class="scrim"></div>
    <img class="wordmark" src="data:image/png;base64,${ASSETS.logoWhite}" alt="Elevate Estates">
    ${lux ? `<div class="badges"><span class="badge lux">Luxury</span></div>` : ""}
    <div class="card">
      <div class="card-loc">${PIN}<div class="card-loc-text">
        <div class="kicker">${esc(typeLine(l))}</div>
        <div class="place">${esc(l.location)}</div>
      </div></div>
      <hr>
      <div class="card-foot">
        <div>
          ${s.length ? `<div class="speclist">${s.map((x) => `<span>${esc(x.value)}${x.unit ? " " + x.unit : " " + esc(x.label.toLowerCase())}</span>`).join("")}</div>` : ""}
          <div class="price">${esc(money(l))}${l.price != null && l.listingType === "rent" ? "<small>/ month</small>" : ""}</div>
        </div>
        ${refTag(l.ref, "sm")}
      </div>
    </div>
  </section>`;
}

function photoSlide(l: CarouselListing, src: string) {
  return `
  <section class="slide">
    <img class="photo" src="${esc(src)}" alt="">
    ${stamp()}
    <div class="corner">${refTag(l.ref, "sm")}</div>
  </section>`;
}

function detailsSlide(l: CarouselListing) {
  const s = specs(l);
  const feats = l.amenities.slice(0, 8);
  return `
  <section class="slide details">
    <img class="logo" src="data:image/png;base64,${ASSETS.logoBrown}" alt="Elevate Estates">
    <div class="kicker">${esc(typeLine(l))}</div>
    <div class="place">${esc(l.location)}</div>
    ${s.length ? `<div class="grid">${s.map((x) => `<div class="cell"><div class="v">${esc(x.value)}${x.unit ? `<small>${x.unit}</small>` : ""}</div><div class="l">${esc(x.label)}</div></div>`).join("")}</div>` : ""}
    ${feats.length ? `<div class="features"><h3>Highlights</h3><div class="chips">${feats.map((f) => `<span class="chip">${esc(f)}</span>`).join("")}</div></div>` : ""}
    <div class="details-foot">
      <div>
        <div class="lbl">${l.listingType === "rent" ? "Monthly rent" : "Asking price"}</div>
        <div class="price">${esc(money(l))}</div>
      </div>
      ${refTag(l.ref, "md")}
    </div>
  </section>`;
}

function ctaSlide(l: CarouselListing) {
  return `
  <section class="slide cta">
    <img class="logo" src="data:image/png;base64,${ASSETS.logoWhite}" alt="Elevate Estates">
    <h2>One reference.<br>One call.<br>Done.</h2>
    <p class="ask">Send this reference to us on WhatsApp and we'll pull up the listing instantly.</p>
    <div class="tagwrap">${refTag(l.ref, "xl")}</div>
    <div class="site">elevateestateslb.com</div>
  </section>`;
}

// Shrinks long area names (e.g. "Ain el Mreisseh") until they fit on one line.
const FIT_SCRIPT = `document.fonts.ready.then(()=>{document.querySelectorAll(".place").forEach(el=>{let s=parseFloat(getComputedStyle(el).fontSize);while(el.scrollWidth>el.clientWidth&&s>48){s-=2;el.style.fontSize=s+"px"}});document.body.dataset.ready="1"})`;

/** Full HTML document with every slide stacked. The renderer screenshots each <section.slide>. */
export function buildCarouselHtml(l: CarouselListing): { html: string; slideCount: number } {
  const photos = l.images.slice(1, 1 + MAX_PHOTO_SLIDES);
  const slides = [coverSlide(l), ...photos.map((p) => photoSlide(l, p)), detailsSlide(l), ctaSlide(l)];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${slides.join("")}<script>${FIT_SCRIPT}</script></body></html>`;
  return { html, slideCount: slides.length };
}

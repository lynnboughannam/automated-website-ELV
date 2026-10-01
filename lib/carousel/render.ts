import type { Browser } from "puppeteer-core";
import { buildCarouselHtml, SLIDE_H, SLIDE_W } from "./template";
import type { CarouselListing } from "./types";

async function launch(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;
  // Local dev: point CHROME_EXECUTABLE_PATH at your installed Chrome.
  // e.g. macOS: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
  if (process.env.CHROME_EXECUTABLE_PATH) {
    return puppeteer.launch({ executablePath: process.env.CHROME_EXECUTABLE_PATH, headless: true, args: ["--no-sandbox"] });
  }
  // Vercel / serverless: bundled Chromium build
  const chromium = (await import("@sparticuz/chromium")).default;
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

/** Renders every slide to a JPEG buffer, in order. */
export async function renderCarousel(listing: CarouselListing): Promise<Buffer[]> {
  const { html } = buildCarouselHtml(listing);
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 1 });
    // "load" fires after every <img> (the listing photos) has finished loading
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    await page.waitForSelector("body[data-ready]", { timeout: 15_000 });

    const broken = await page.$$eval("img", (imgs) =>
      imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src")?.slice(0, 120))
    );
    if (broken.length) throw new Error(`Photos failed to load: ${broken.join(", ")}`);

    const slides = await page.$$("section.slide");
    const out: Buffer[] = [];
    for (const s of slides) {
      // Instagram's API only accepts JPEG for feed images
      out.push(Buffer.from(await s.screenshot({ type: "jpeg", quality: 90 })));
    }
    return out;
  } finally {
    await browser.close();
  }
}

export type CallbackBody =
  | { post_id: string; ref: string; status: "pending_approval"; slide_urls: string[] }
  | { post_id: string; ref: string; status: "failed"; error: string };

const RETRY_WAITS_MS = [2000, 5000, 10000];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Reports the render result to the CRM (CRM_CALLBACK_URL), authenticated with CAROUSEL_WEBHOOK_SECRET.
 * One attempt plus up to 3 retries (2s, 5s, 10s) on network errors or non-2xx responses.
 */
export async function notifyCrm(body: CallbackBody) {
  const url = process.env.CRM_CALLBACK_URL;
  if (!url) {
    console.error(`[carousel] CRM_CALLBACK_URL is not set; cannot report post ${body.post_id}`, body);
    return;
  }

  let lastError = "";
  for (let attempt = 0; attempt <= RETRY_WAITS_MS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_WAITS_MS[attempt - 1]);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": process.env.CAROUSEL_WEBHOOK_SECRET ?? "",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) return;
      lastError = `HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 500)}`;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  console.error(`[carousel] CRM callback failed for post ${body.post_id} after ${RETRY_WAITS_MS.length + 1} attempts: ${lastError}`, body);
}

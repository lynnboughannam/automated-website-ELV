import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import blobPkg from "@/node_modules/@vercel/blob/package.json";
import { blobToken } from "@/lib/carousel/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/social/carousel/blob-check?secret=...
 * Diagnoses Vercel Blob auth: which store the token points at, what BLOB_STORE_ID says,
 * and whether a test upload works. Never returns the token itself.
 */
export async function GET(req: Request) {
  const secret = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("secret");
  if (!process.env.CAROUSEL_WEBHOOK_SECRET || secret !== process.env.CAROUSEL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const prefix = "vercel_blob_rw_";

  let testUpload: Record<string, unknown>;
  try {
    const blob = await put("diagnostics/ping.txt", `ping ${new Date().toISOString()}`, {
      access: "public",
      contentType: "text/plain",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: blobToken(),
    });
    testUpload = { ok: true, url: blob.url };
  } catch (e) {
    const err = e as Error & { status?: number };
    testUpload = {
      ok: false,
      error: err?.message ?? String(e),
      name: err?.name,
      ...(err?.status !== undefined ? { status: err.status } : {}),
    };
  }

  return NextResponse.json({
    tokenPresent: Boolean(token),
    tokenStoreId: token?.startsWith(prefix) ? token.slice(prefix.length).split("_")[0].slice(0, 12) : null,
    blobStoreIdEnv: process.env.BLOB_STORE_ID ?? null,
    sdkVersion: blobPkg.version,
    testUpload,
  });
}

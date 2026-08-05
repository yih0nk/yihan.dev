/**
 * Upload the résumé PDF to Vercel Blob.
 *
 * The PDF is deliberately not committed (this repo is public), so it lives in
 * Blob and /api/resume streams it after a password check. Re-run this whenever
 * the résumé changes — the newest upload under resume/ is what gets served.
 *
 * Usage:
 *   node scripts/upload-resume.mjs <path-to-pdf>
 *   node scripts/upload-resume.mjs ~/Documents/Work/Yihan_Hong_Resume.pdf
 *
 * Requires BLOB_READ_WRITE_TOKEN (from .env.local via `vercel env pull`).
 */
import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/upload-resume.mjs <path-to-pdf>");
  process.exit(1);
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "BLOB_READ_WRITE_TOKEN is not set.\n" +
      "Link a Blob store in the Vercel dashboard, then run `vercel env pull .env.local`."
  );
  process.exit(1);
}

const body = await readFile(path);
const { url, pathname } = await put("resume/Yihan_Hong_Resume.pdf", body, {
  access: "public", // unguessable URL; never exposed to the browser by the API
  contentType: "application/pdf",
  addRandomSuffix: true,
  allowOverwrite: true,
});

console.log(`uploaded ${pathname}`);
console.log(`blob url (keep private): ${url}`);

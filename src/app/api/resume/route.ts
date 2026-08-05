import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

/**
 * Password-gated résumé download.
 *
 * The PDF lives in Vercel Blob, never in this repo (which is public). On a
 * correct password the server looks the blob up with the read/write token,
 * fetches it, and streams the bytes back — the blob URL itself is never sent
 * to the browser, so there is no link to share around or scrape.
 *
 * Env required (set in .env.local locally and in the Vercel project):
 *   RESUME_PASSWORD         the password to unlock the file
 *   BLOB_READ_WRITE_TOKEN   provided automatically by Vercel once a Blob
 *                           store is linked; needed locally for `vercel env pull`
 */
const BLOB_PREFIX = "resume/";

export async function POST(req: Request) {
  const expected = process.env.RESUME_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Resume access is not configured." },
      { status: 503 }
    );
  }

  let password = "";
  try {
    ({ password = "" } = await req.json());
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // Newest upload under resume/ wins, so re-uploading replaces the live file.
  let file: Response;
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const newest = blobs
      .filter((b) => b.pathname.toLowerCase().endsWith(".pdf"))
      .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))[0];

    if (!newest) {
      return NextResponse.json(
        { error: "Resume is not available right now." },
        { status: 503 }
      );
    }

    file = await fetch(newest.url, { cache: "no-store" });
  } catch {
    // Missing/invalid BLOB_READ_WRITE_TOKEN, or Blob unreachable.
    return NextResponse.json(
      { error: "Resume is not available right now." },
      { status: 503 }
    );
  }

  if (!file.ok) {
    return NextResponse.json(
      { error: "Resume is not available right now." },
      { status: 502 }
    );
  }

  return new NextResponse(file.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Yihan_Hong_Resume.pdf"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

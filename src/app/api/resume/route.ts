import { NextResponse } from "next/server";
import { get, list } from "@vercel/blob";

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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Resume storage is not connected." },
      { status: 503 }
    );
  }

  // Newest upload under resume/ wins, so re-uploading replaces the live file.
  let stream: ReadableStream | null = null;
  try {
    // List everything, so a PDF dropped in from the Vercel dashboard (which
    // lands at the root) works just as well as a scripted resume/ upload.
    const { blobs } = await list();
    const pdfs = blobs
      .filter((b) => b.pathname.toLowerCase().endsWith(".pdf"))
      .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));

    // Prefer anything filed under resume/, otherwise take the newest PDF.
    const newest =
      pdfs.find((b) => b.pathname.startsWith(BLOB_PREFIX)) ?? pdfs[0];

    if (!newest) {
      return NextResponse.json(
        { error: "Resume has not been uploaded yet." },
        { status: 503 }
      );
    }

    // Read through the SDK rather than fetching blob.url directly: dashboard
    // uploads default to private, whose URL is not publicly fetchable, and
    // list() does not report the access level. Try private, then public.
    const result =
      (await get(newest.pathname, { access: "private" }).catch(() => null)) ??
      (await get(newest.pathname, { access: "public" }).catch(() => null));

    stream = result?.stream ?? null;
  } catch {
    // Missing/invalid BLOB_READ_WRITE_TOKEN, or Blob unreachable.
    return NextResponse.json(
      { error: "Resume is not available right now." },
      { status: 503 }
    );
  }

  if (!stream) {
    return NextResponse.json(
      { error: "Resume could not be read from storage." },
      { status: 502 }
    );
  }

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Yihan_Hong_Resume.pdf"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

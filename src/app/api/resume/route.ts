import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Password-gated resume download.
 *
 * The check runs server-side and the PDF lives outside /public, so the file is
 * never served from a guessable static URL and the password never ships to the
 * browser. The password itself comes from RESUME_PASSWORD (set in .env.local
 * locally, and in the Vercel project env for production) so it stays out of
 * this public repo.
 *
 * Note: this is a soft gate. The PDF is committed to a public repo, so someone
 * determined can still find it on GitHub — it stops casual access, not a
 * motivated reader.
 */
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
    // Constant-ish response; no hint about which part was wrong.
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const file = await readFile(
    path.join(process.cwd(), "private", "Yihan_Hong_Resume.pdf")
  );

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Yihan_Hong_Resume.pdf"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

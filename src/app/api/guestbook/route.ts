import { NextResponse } from "next/server";

import { addNote, allow, check, listNotes, removeNote } from "@/lib/guestbook";

/**
 * The guest book on the Classic's desktop (see src/lib/guestbook.ts for the
 * moderation and the storage).
 *
 *   GET     the wall, newest first
 *   POST    { name, note } → the note as stored, or { error } with a short reason
 *   DELETE  ?id=…, with `Authorization: Bearer $GUESTBOOK_ADMIN_TOKEN` (in production): take one down
 *
 * The POST body also carries `website`, a field no person fills in (it is not
 * drawn anywhere); a bot that fills every field gets a cheerful 200 and its
 * note goes nowhere.
 */
export const dynamic = "force-dynamic";

const who = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";

export async function GET() {
  try {
    return NextResponse.json({ notes: await listNotes() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ notes: [], error: "the guest book is resting" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  let body: { name?: unknown; note?: unknown; website?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "that did not come through" }, { status: 400 });
  }
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });
  const v = check(body.name, body.note);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 422 });
  try {
    if (!(await allow(who(req)))) return NextResponse.json({ error: "one note a minute, five a day" }, { status: 429 });
    const saved = await addNote(v.name, v.note);
    if (saved === "duplicate") return NextResponse.json({ error: "someone already said that" }, { status: 409 });
    return NextResponse.json({ note: saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "the guest book is resting, try later" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  // in development the wall is an in-memory list on this machine: no token needed to tidy it
  const token = process.env.GUESTBOOK_ADMIN_TOKEN;
  const authed = process.env.NODE_ENV !== "production" || (!!token && req.headers.get("authorization") === `Bearer ${token}`);
  if (!authed) return new NextResponse(null, { status: 404 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  return NextResponse.json({ removed: await removeNote(id) });
}

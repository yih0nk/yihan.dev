import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

import { redis } from "@/lib/redis";

/**
 * The guest book: a name and a short note, left on the Classic's desktop and
 * shown to everyone who opens it. Server-side only.
 *
 * Moderation is deliberately basic and deliberately strict, because there is
 * no queue: a note is either clean enough to go up immediately or it does not
 * go up at all.
 *
 *  - `obscenity` catches profanity, sexual terms and slurs, including the
 *    usual disguises (sh1t, f.u.c.k, repeated letters).
 *  - Letters spelled out with gaps ("f u c k") are rejoined and checked again.
 *  - A short list covers what that dataset leaves out (nudes, onlyfans, kys…).
 *  - No links, email addresses or phone numbers: spam, and other people's
 *    contact details, both stay off the wall.
 *  - Only plain printable characters, which is also all the one-bit system
 *    font can draw.
 *  - One note a minute and five a day per address, and no repeats.
 *
 * Anything that slips through can be taken down with DELETE and the
 * GUESTBOOK_ADMIN_TOKEN (see the route).
 *
 * Storage is the site's Upstash Redis in production. In development it is an
 * in-memory list instead: the dev server talks to the production database, and
 * test notes must never land on the real wall.
 */

export type Note = { id: string; name: string; note: string; at: number };

export const NAME_MAX = 24;
export const NOTE_MAX = 140;
const KEEP = 300; // how many notes the wall keeps
const KEY = "guestbook:notes";

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });

/** What `obscenity`'s dataset does not cover, matched as whole words on a lowercased, de-leeted copy. */
const EXTRA = /\b(nudes?|nudity|horny|onlyfans|nsfw|xxx|kys|kill\s*(yo)?urself|neck\s*yourself|nazis?|heil|hitler|sieg)\b/;
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|dev|co|me|xyz|ru|cn|info|biz|app|gg|ly|link|site|online|shop|top)\b)/i;
const EMAIL = /\S+@\S+\.\S+/;
const PHONE = /(\d[\s().-]*){7,}/;
/** The one-bit font's repertoire: letters, digits, space and plain punctuation. */
const PLAIN = /^[A-Za-z0-9 .,:;!?'"()&@#%*+=/<>|_[\]-]*$/;

const deleet = (s: string) =>
  s
    .toLowerCase()
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t");

/** "f u c k" and "f.u.c.k" → "fuck": runs of single letters, rejoined. */
const rejoin = (s: string) => s.replace(/\b(?:[a-z0-9@$!](?:[\s._*-]+|$)){3,}/gi, (run) => ` ${run.replace(/[\s._*-]+/g, "")} `);

function unkind(text: string): boolean {
  for (const t of [text, rejoin(text)]) {
    if (matcher.hasMatch(t)) return true;
    if (EXTRA.test(deleet(t))) return true;
  }
  return false;
}

/** Collapse whitespace, drop control characters, trim. */
const tidy = (s: unknown) =>
  String(s ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export type Verdict = { ok: true; name: string; note: string } | { ok: false; error: string };

/** Is this fit for the wall? Errors are short, lowercase, and say what to change. */
export function check(rawName: unknown, rawNote: unknown): Verdict {
  const name = tidy(rawName);
  const note = tidy(rawNote);
  if (!name) return { ok: false, error: "add your name" };
  if (!note) return { ok: false, error: "write a note first" };
  if (name.length > NAME_MAX) return { ok: false, error: `name: ${NAME_MAX} letters at most` };
  if (note.length > NOTE_MAX) return { ok: false, error: `note: ${NOTE_MAX} letters at most` };
  if (!PLAIN.test(name) || !PLAIN.test(note)) return { ok: false, error: "plain letters and punctuation only" };
  if (LINK.test(note) || LINK.test(name) || EMAIL.test(note) || EMAIL.test(name)) return { ok: false, error: "no links or emails, sorry" };
  if (PHONE.test(note) || PHONE.test(name)) return { ok: false, error: "no phone numbers" };
  if (/(.)\1{5,}/.test(note) || /^[^a-z]*$/i.test(note)) return { ok: false, error: "that looks like a keyboard smash" };
  if (unkind(name) || unkind(note)) return { ok: false, error: "keep it kind, please" };
  return { ok: true, name, note };
}

// ── storage ─────────────────────────────────────────────────────────────────
const live = process.env.NODE_ENV === "production";
type Memory = { notes: Note[]; hits: Map<string, number[]> };
const g = globalThis as unknown as { __guestbook?: Memory };
/** The dev wall, kept on globalThis so a hot reload does not wipe it. */
const mem = (): Memory => (g.__guestbook ??= { notes: [], hits: new Map() });

export async function listNotes(limit = 60): Promise<Note[]> {
  if (!live) return mem().notes.slice(0, limit);
  const raw = await redis.lrange<Note | string>(KEY, 0, limit - 1);
  return raw.map((r) => (typeof r === "string" ? (JSON.parse(r) as Note) : r)).filter((n): n is Note => !!n && typeof n.note === "string");
}

/** One a minute and five a day per address. True if this one may go up. */
export async function allow(who: string): Promise<boolean> {
  const now = Date.now();
  if (!live) {
    const hits = (mem().hits.get(who) ?? []).filter((t) => now - t < 86_400_000);
    if (hits.length >= 5 || (hits.length && now - hits[hits.length - 1] < 60_000)) return false;
    mem().hits.set(who, [...hits, now]);
    return true;
  }
  const minute = await redis.set(`guestbook:rate:min:${who}`, 1, { nx: true, ex: 60 });
  if (minute === null) return false;
  const day = await redis.incr(`guestbook:rate:day:${who}`);
  if (day === 1) await redis.expire(`guestbook:rate:day:${who}`, 86_400);
  return day <= 5;
}

export async function addNote(name: string, note: string): Promise<Note | "duplicate"> {
  const recent = await listNotes(30);
  if (recent.some((n) => n.note.toLowerCase() === note.toLowerCase())) return "duplicate";
  const entry: Note = { id: crypto.randomUUID().slice(0, 12), name, note, at: Date.now() };
  if (!live) {
    mem().notes.unshift(entry);
    mem().notes.length = Math.min(mem().notes.length, KEEP);
    return entry;
  }
  await redis.lpush(KEY, JSON.stringify(entry));
  await redis.ltrim(KEY, 0, KEEP - 1);
  return entry;
}

export async function removeNote(id: string): Promise<boolean> {
  if (!live) {
    const before = mem().notes.length;
    mem().notes = mem().notes.filter((n) => n.id !== id);
    return mem().notes.length < before;
  }
  const all = await listNotes(KEEP);
  const hit = all.find((n) => n.id === id);
  if (!hit) return false;
  await redis.lrem(KEY, 1, JSON.stringify(hit));
  return true;
}

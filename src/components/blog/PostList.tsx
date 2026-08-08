'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { CATEGORY_DESCRIPTIONS, type PostCategory } from '@/lib/blogMeta'
import type { PostMeta } from '@/lib/mdx'
import { COLORS, FONTS, MOTION } from '@/styles/tokens'

/**
 * The posts, with the categories demoted to filters.
 *
 * /blog was four bordered tiles and a pinned one, and no writing at all: a
 * visitor arrived at a menu, picked a door, and two of the four doors opened
 * onto nothing. The categories were being asked to carry navigation they were
 * not big enough for — with three posts across four categories, the taxonomy
 * was larger than the thing it organised.
 *
 * So the list is the page and the categories are tags above it. Selecting is
 * additive: pick two and you see both, which is the behaviour people expect
 * from tags and not from folders. Nothing navigates — filtering happens in
 * place, so the back button still means "leave the blog" rather than "undo a
 * filter".
 *
 * ── empty categories are not offered ────────────────────────────────────────
 * A tag with no posts behind it is a promise the page cannot keep, which is
 * exactly what the old tiles did with music and film. The caller passes counts
 * and anything at zero never renders. That means the tag row shrinks as the
 * blog grows into it, which is the right direction for it to move.
 */

const UI = `${MOTION.ui} ${MOTION.ease}`

/** Categories that must hold at least one post before the filter appears. */
const MIN_CATEGORIES = 2
/** Posts that must exist in total before the filter appears. */
const MIN_POSTS = 6

const REDUCED_MOTION_CSS = `
@media (prefers-reduced-motion: reduce) { .bl-anim { transition: none !important; } }
`

/** 2026-08-04 → "04 aug 2026". Mono, because a date is metadata. */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
function formatDate(iso: string) {
  // Parsed by hand rather than with `new Date`, which reads a bare YYYY-MM-DD as
  // UTC midnight and then prints it in local time — one timezone west of the
  // meridian and every post is dated a day early.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

export default function PostList({
  posts,
  counts,
}: {
  posts: PostMeta[]
  counts: Record<PostCategory, number>
}) {
  const [active, setActive] = useState<Set<PostCategory>>(new Set())
  const [hovered, setHovered] = useState<string | null>(null)

  const available = useMemo(
    () => (Object.keys(counts) as PostCategory[]).filter((c) => counts[c] > 0),
    [counts],
  )

  const shown = useMemo(
    () => (active.size === 0 ? posts : posts.filter((p) => active.has(p.category as PostCategory))),
    [posts, active],
  )

  const toggle = (c: PostCategory) =>
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })

  return (
    <div>
      <style>{REDUCED_MOTION_CSS}</style>

      {/*
        The filter stays hidden until there is something to filter.

        With one category and one post, "all / life 1" is a control whose every
        state shows the same list — it advertises a taxonomy the writing has not
        earned yet, which is the same mistake the four category tiles made. Two
        thresholds because either alone is gameable: four posts in one category
        still has nothing to sort between, and two categories holding one post
        each is a filter that only ever hides a single entry.
      */}
      {available.length >= MIN_CATEGORIES && posts.length >= MIN_POSTS && (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={() => setActive(new Set())}
            className="bl-anim text-[12px] uppercase tracking-[0.18em] underline-offset-4 hover:underline"
            style={{
              fontFamily: FONTS.mono,
              color: active.size === 0 ? COLORS.ink : COLORS.muted,
              transition: `color ${UI}`,
            }}
            aria-pressed={active.size === 0}
          >
            all
          </button>

          {available.map((c) => {
            const on = active.has(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className="bl-anim text-[12px] uppercase tracking-[0.18em] underline-offset-4 hover:underline"
                style={{
                  fontFamily: FONTS.mono,
                  color: on ? COLORS.accent : COLORS.muted,
                  transition: `color ${UI}`,
                }}
                aria-pressed={on}
              >
                {c}
                {/* The count is the honest part: it says how much is behind the
                    tag before anyone spends a click finding out. */}
                <span aria-hidden style={{ opacity: 0.55 }}> {counts[c]}</span>
              </button>
            )
          })}
        </div>
      )}

      {/*
        The description of the selected category, and only when exactly one is
        selected — two tags at once describe a set that no single line covers.
        Rendered in the display face because it is authored prose about the
        writing, not a label on it.
      */}
      {active.size === 1 && (
        <p
          className="mt-5 text-[24px] leading-tight tracking-[-0.01em]"
          style={{ fontFamily: FONTS.display, color: COLORS.muted }}
        >
          {CATEGORY_DESCRIPTIONS[[...active][0]]}
        </p>
      )}

      <ul className="mt-12 md:mt-16">
        {shown.map((post) => {
          const on = hovered === post.slug
          return (
            <li key={`${post.category}/${post.slug}`}>
              <Link
                href={`/blog/${post.slug}`}
                className="bl-anim block py-7 md:py-9"
                style={{
                  transform: on ? 'translateX(6px)' : 'translateX(0)',
                  transition: `transform ${UI}`,
                }}
                onMouseEnter={() => setHovered(post.slug)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(post.slug)}
                onBlur={() => setHovered(null)}
              >
                <div className="md:grid md:grid-cols-12 md:items-baseline md:gap-8">
                  <div className="md:col-span-3">
                    <span
                      className="block text-[12px] tracking-[0.14em]"
                      style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
                    >
                      {formatDate(post.date)}
                    </span>
                    <span
                      className="mt-1 block text-[12px] uppercase tracking-[0.18em]"
                      style={{ fontFamily: FONTS.mono, color: COLORS.muted, opacity: 0.7 }}
                    >
                      {post.category}
                    </span>
                  </div>

                  <div className="mt-3 md:col-span-9 md:mt-0">
                    {/*
                      Underline on hover rather than a colour change. The accent
                      is doing too much work across the site — it already marks
                      every outbound link and every active filter — and a title
                      turning blue reads as "this is a link somewhere else"
                      rather than "this is the thing you are about to open".
                    */}
                    <h3
                      className="text-[32px] leading-none tracking-[-0.01em] underline-offset-[6px]"
                      style={{
                        fontFamily: FONTS.display,
                        color: COLORS.ink,
                        textDecoration: on ? 'underline' : 'none',
                      }}
                    >
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p
                        className="mt-3 max-w-[62ch] text-base leading-relaxed"
                        style={{ fontFamily: FONTS.body, color: COLORS.muted }}
                      >
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      {shown.length === 0 && (
        <p
          className="mt-12 text-base"
          style={{ fontFamily: FONTS.body, color: COLORS.muted }}
        >
          Nothing under that yet.
        </p>
      )}
    </div>
  )
}

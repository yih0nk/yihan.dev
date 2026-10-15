import { CURRENT_ROLE, SEEKING, STRENGTHS, STUDYING } from '@/lib/recruiting'
import { EMAIL, GITHUB_URL, LINKEDIN_URL } from '@/lib/site'
import { COLORS, FONTS } from '@/styles/tokens'

/**
 * The first glance of the résumé, in public: what he is looking for, where he
 * is now, what he is strongest in, and how to reach him. The résumé itself
 * stays behind its gate; everything here is already said elsewhere on the
 * site. The facts come from src/lib/recruiting.ts, which /llms.txt and the
 * Person schema read too.
 *
 * A plain definition list, so it reads the same to a person skimming, a
 * screen reader and a crawler.
 */

const { ink: INK, muted: MUTED, hairline: HAIRLINE, accent: ACCENT } = COLORS
const MONO = FONTS.mono
const LABEL = 'text-[12px] uppercase leading-none tracking-[0.2em]'
const LINK = 'border-b [border-color:var(--color-accent)] transition-colors duration-200 hover:[color:var(--color-accent)]'

export default function ForRecruiters() {
  const rows: { term: string; body: React.ReactNode }[] = [
    { term: 'looking for', body: SEEKING },
    { term: 'now', body: `${CURRENT_ROLE.title}, ${CURRENT_ROLE.org}` },
    { term: 'studying', body: STUDYING },
    { term: 'strongest in', body: STRENGTHS.join(', ') },
    {
      term: 'reach me',
      body: (
        <>
          <a href={`mailto:${EMAIL}`} className={LINK}>
            {EMAIL}
          </a>
          {' · '}
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
            LinkedIn
          </a>
          {' · '}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
            GitHub
          </a>
        </>
      ),
    },
  ]

  return (
    <section id="recruiters" className="w-full pb-12 md:pb-16" aria-labelledby="recruiters-label">
      <div className="mx-auto max-w-[1100px] px-6">
        <div data-reveal className="border-t pt-10" style={{ borderColor: HAIRLINE }}>
          <h2 id="recruiters-label" className={LABEL} style={{ fontFamily: MONO, color: MUTED }}>
            for recruiters
          </h2>
          <dl className="mt-6 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-[160px_minmax(0,1fr)]">
            {rows.map(({ term, body }) => (
              <div key={term} className="contents">
                <dt className={`${LABEL} pt-[5px] sm:pt-[7px]`} style={{ fontFamily: MONO, color: MUTED }}>
                  {term}
                </dt>
                <dd className="m-0 text-[16px] leading-relaxed md:text-[17px]" style={{ fontFamily: FONTS.body, color: INK }}>
                  {body}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent('Résumé request')}`}
            className="mt-8 inline-block text-[12px] tracking-[0.1em] underline-offset-[3px] hover:underline"
            style={{ fontFamily: MONO, color: ACCENT }}
          >
            full résumé on request →
          </a>
        </div>
      </div>
    </section>
  )
}

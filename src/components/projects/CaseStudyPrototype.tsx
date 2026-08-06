import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { getProject, projects } from '@/lib/projects'
import { COLORS, FONTS, LAYOUT, MOTION } from '@/styles/tokens'

/**
 * Case-study prototype — the template every project detail page will follow.
 *
 * The page is a document, not a dashboard: one column of reading, a label rail
 * that runs down the left on wide screens, hairline rules instead of cards, and
 * exactly one accent that only ever appears on a link you can press.
 */

const SLUG = 'cotter'

/** Role · period · stack — metadata that does not live on the Project type yet. */
const META = 'founder · 2026 · python, pytorch, gymnasium, mujoco'

const STANDFIRST =
  'Cotter is a test framework for robot policies. It takes a trained controller as a black box, runs it through a declared battery of trials in simulation, and returns pass or fail with the statistics that back the call.'

/** Scoped custom properties so hover states can reference tokens, not literals. */
const cssVars = {
  '--cs-ink': COLORS.ink,
  '--cs-ink-soft': COLORS.inkSoft,
  '--cs-muted': COLORS.muted,
  '--cs-hairline': COLORS.hairline,
  '--cs-accent': COLORS.accent,
  '--cs-ui': MOTION.ui,
  '--cs-ease': MOTION.ease,
} as CSSProperties

const scopedCss = `
.cs-root a { color: inherit; }
.cs-quiet { color: var(--cs-muted); transition: color var(--cs-ui) var(--cs-ease); }
.cs-quiet:hover { color: var(--cs-ink); }
.cs-link {
  color: var(--cs-ink);
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--cs-hairline);
  transition: color var(--cs-ui) var(--cs-ease), text-decoration-color var(--cs-ui) var(--cs-ease);
}
.cs-link:hover { color: var(--cs-accent); text-decoration-color: var(--cs-accent); }
.cs-jump { transition: color var(--cs-ui) var(--cs-ease); }
.cs-jump:hover { color: var(--cs-accent); }
@media (prefers-reduced-motion: reduce) {
  .cs-root *, .cs-root *::before, .cs-root *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
`

/** A label + prose row. The label sits in a rail on wide screens, above on narrow. */
function Section({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <section
      className="border-t pt-10 md:pt-14 md:grid md:grid-cols-[10rem_minmax(0,1fr)] md:gap-x-12"
      style={{ borderColor: COLORS.hairline }}
    >
      <h2
        className="text-[11px] tracking-[0.2em] mb-6 md:mb-0 md:sticky md:top-10 md:self-start"
        style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
      >
        {label}
      </h2>
      <div className={LAYOUT.prose}>{children}</div>
    </section>
  )
}

/** One of the four test categories. Hierarchy comes from size, not a border. */
function Method({
  name,
  question,
  children,
}: {
  name: string
  question: string
  children: ReactNode
}) {
  return (
    <div>
      <h3
        className="text-2xl md:text-3xl leading-tight"
        style={{ fontFamily: FONTS.display, color: COLORS.ink }}
      >
        {name}
      </h3>
      <p
        className="mt-1 text-[11px] tracking-[0.16em]"
        style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
      >
        {question}
      </p>
      <div
        className="mt-4 space-y-4 text-[15px] md:text-base leading-[1.75]"
        style={{ fontFamily: FONTS.body, color: COLORS.inkSoft }}
      >
        {children}
      </div>
    </div>
  )
}

export default function CaseStudyPrototype() {
  const project = getProject(SLUG)
  if (!project) return null

  const index = projects.findIndex((p) => p.slug === SLUG)
  const prev = index > 0 ? projects[index - 1] : null
  const next = index > -1 && index < projects.length - 1 ? projects[index + 1] : null

  const bodyText = { fontFamily: FONTS.body, color: COLORS.inkSoft }

  return (
    <div
      className="cs-root min-h-screen"
      style={{ ...cssVars, background: COLORS.bg, color: COLORS.ink }}
    >
      <style>{scopedCss}</style>

      {/* 1 — back */}
      <div className={`${LAYOUT.container} pt-12 md:pt-16`}>
        <Link
          href="/projects"
          className="cs-quiet inline-block text-[11px] tracking-[0.18em]"
          style={{ fontFamily: FONTS.mono }}
        >
          ← projects
        </Link>
      </div>

      {/* 2 + 3 — title, meta line, standfirst */}
      <header className={`${LAYOUT.container} pt-10 md:pt-16`}>
        <h1
          className="text-4xl md:text-6xl leading-[1.02] tracking-[-0.01em]"
          style={{ fontFamily: FONTS.display, color: COLORS.ink }}
        >
          {project.title}
        </h1>

        <p
          className="mt-4 text-[11px] tracking-[0.18em]"
          style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
        >
          {META}
        </p>

        <p
          className={`${LAYOUT.prose} mt-10 md:mt-12 text-lg md:text-xl leading-[1.55]`}
          style={bodyText}
        >
          {STANDFIRST}
        </p>
      </header>

      {/* 4 — cover */}
      {project.image && (
        <div className={`${LAYOUT.container} mt-12 md:mt-16`}>
          <div
            className="w-full overflow-hidden border"
            style={{ borderColor: COLORS.hairline, background: COLORS.surface }}
          >
            <Image
              src={project.image}
              alt={`${project.title} — test report output`}
              width={1600}
              height={900}
              unoptimized
              priority
              className="w-full h-auto block"
            />
          </div>
          <p
            className="mt-3 text-[11px] tracking-[0.14em]"
            style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
          >
            a run report — one verdict per category
          </p>
        </div>
      )}

      {/* 5 — the case study */}
      <main className={`${LAYOUT.container} pt-20 md:pt-28 space-y-20 md:space-y-28`}>
        <Section label="the problem">
          <div
            className="space-y-5 text-[15px] md:text-base leading-[1.75]"
            style={bodyText}
          >
            <p>
              A learned controller is a black box that someone eventually bolts onto a
              machine with motors in it. The evidence that it is ready to do that is
              usually a demo clip, a training curve, and a researcher who sounds
              confident. That is how most policies ship: on vibes.
            </p>
            <p>
              Regulation is arriving to ask harder questions. The EU Machinery
              Regulation and ISO 10218 both expect a manufacturer to produce evidence
              that a controller behaves — a record, reproducible by someone else, not an
              anecdote about a good run last Tuesday. Software solved its version of
              this decades ago and called it pytest. Robot policies had no equivalent:
              no standard battery, no agreed pass criteria, and no artifact you could
              hand to a reviewer who was not in the room.
            </p>
            <p>
              I wanted a tool that answers one question honestly — is this policy good
              enough, and how would you know? Cotter loads a policy as a black box,
              observation in and action out, runs whichever categories a config declares
              against a MuJoCo environment, and writes a structured report with the
              statistics attached. It runs entirely on CPU. I built it on a laptop, and
              there is no CUDA anywhere in the stack, because a test tool that needs a
              cluster is a test tool nobody runs before pushing.
            </p>
          </div>
        </Section>

        <Section label="the approach">
          <div
            className="space-y-5 text-[15px] md:text-base leading-[1.75]"
            style={bodyText}
          >
            <p>
              Four categories, because four different kinds of failure hide from each
              other. What took the longest was not the harness — it was refusing the
              convenient statistical method in each case and using the one that actually
              matches the question being asked.
            </p>
          </div>

          <div className="mt-12 space-y-12 md:space-y-16">
            <Method name="performance" question="does it succeed at the task?">
              <p>
                A fixed number of trials is the obvious design and the wrong one: it
                spends the same effort on a policy that is plainly fine as on one that is
                plainly broken. Performance uses Wald&rsquo;s sequential probability
                ratio test instead. After every trial it compares the accumulated
                likelihood ratio against two decision boundaries and stops the moment the
                evidence crosses one, so decisive cases end early and only genuinely
                borderline policies pay for the full sample.
              </p>
              <p>
                Every rate it reports carries an exact Clopper-Pearson interval. A
                success rate without an interval is a number pretending to be a fact.
              </p>
            </Method>

            <Method name="safety" question="does it ever cross a hard limit?">
              <p>
                This is the category where the reflex of machine learning — average over
                episodes, report a mean — is actively dangerous. A joint that exceeds its
                velocity limit once has exceeded it; averaging that away across the
                well-behaved episodes around it is how a violation becomes a rounding
                error.
              </p>
              <p>
                So safety is checked per timestep, against declared limits on joint
                velocities, actuator forces, contact counts and contact-force magnitudes.
                A single violation anywhere in the run fails the category outright. No
                averaging, no tolerance band, no partial credit.
              </p>
            </Method>

            <Method name="regression" question="did the new version break behaviour?">
              <p>
                Comparing two policies on independent rollouts mostly measures the
                physics draw. Regression runs matched pairs instead: baseline and
                candidate face an identical seed sequence, so a difference between them
                is attributable to the policy rather than to which episode happened to
                start in an easy state.
              </p>
              <p>
                On those pairs I use exact McNemar for binary success and exact Wilcoxon
                signed-rank for continuous metrics — exact rather than asymptotic,
                because at the sample sizes a CI gate can afford, the normal
                approximation is a comfortable lie. Both results come back with an effect
                size beside the p-value, since &ldquo;detectable&rdquo; and
                &ldquo;worth caring about&rdquo; are different claims.
              </p>
            </Method>

            <Method name="adversarial" question="how bad is the worst case?">
              <p>
                A random noise sweep answers a question nobody asked: it tells you the
                policy survived the perturbations you happened to draw. Cotter trains a
                PPO adversary whose entire job is to perturb the policy&rsquo;s
                observations, inside a hard L-infinity budget, to make it fail — a search
                for the worst case rather than a sample of the average one.
              </p>
              <p>
                It always runs alongside a random-noise baseline at the identical budget,
                and that pairing is the whole point. The baseline establishes what that
                budget looks like when nothing is trying. A policy that shrugs off noise
                and folds to a directed search of the same magnitude is not robust; it
                was never tested. If adversary training falls over, the category degrades
                to the baseline and says so in the result, so it always returns a number
                rather than a gap.
              </p>
            </Method>
          </div>

          <div
            className="mt-12 space-y-5 text-[15px] md:text-base leading-[1.75]"
            style={bodyText}
          >
            <p>
              Underneath all four, one rule: every category derives its seeds from a
              single base seed, so enabling or disabling one never perturbs another&rsquo;s
              rollouts, and parallel runs stay bit-identical to serial ones. Trained
              adversaries are expensive, so they are cached against the environment, a
              hash of the victim&rsquo;s parameters, and the budget — retrain the victim
              and it can never silently reuse a stale attacker.
            </p>
          </div>
        </Section>

        {/* 6 — pull quote */}
        <figure className="py-4 md:py-10">
          <blockquote
            className="max-w-[30ch] text-2xl md:text-3xl leading-[1.25]"
            style={{ fontFamily: FONTS.display, color: COLORS.ink }}
          >
            &ldquo;a single violation anywhere fails. safety does not average.&rdquo;
          </blockquote>
        </figure>

        <Section label="what i'd do differently">
          <div
            className="space-y-5 text-[15px] md:text-base leading-[1.75]"
            style={bodyText}
          >
            <p>
              I built the harness first and the report last, which is backwards. The
              report is the actual product — it is the thing a reviewer, a CI job or an
              auditor reads, and the tests only exist to fill it in. Because I designed
              it afterwards, its shape records the order I happened to write the
              categories in rather than the order a reader needs them. Next time I would
              write the report schema first, freeze it as the contract, and make every
              new category earn a slot in something that already exists.
            </p>
            <p>
              The adversarial budget is a flag, and it should be a first-class part of
              the configuration. As a scalar you pass on the command line it invites the
              worst possible workflow: turn it down until the run goes green. It wants to
              be declared per sensor, in the units of the thing being perturbed, and
              versioned alongside the policy it was chosen for — so that loosening it
              shows up in a diff somebody has to approve. That is the difference between
              a robustness claim and a knob.
            </p>
            <p>
              I would also cut the simulator backend out earlier. The abstraction exists
              now, but it grew outward from Gymnasium-shaped code, so its seams sit where
              the first implementation happened to have seams rather than where a second
              one would want them. Abstractions extracted under pressure from one caller
              tend to describe that caller.
            </p>
          </div>
        </Section>

        {/* built with + 7 — links */}
        <section
          className="border-t pt-10 md:pt-14 md:grid md:grid-cols-[10rem_minmax(0,1fr)] md:gap-x-12"
          style={{ borderColor: COLORS.hairline }}
        >
          <h2
            className="text-[11px] tracking-[0.2em] mb-6 md:mb-0"
            style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
          >
            built with
          </h2>
          <div className={LAYOUT.prose}>
            <p
              className="text-[13px] leading-[2]"
              style={{ fontFamily: FONTS.mono, color: COLORS.inkSoft }}
            >
              {project.tags.join('  ·  ')}
            </p>

            {project.links && project.links.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {project.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cs-link text-[13px] tracking-[0.06em]"
                    style={{ fontFamily: FONTS.mono }}
                  >
                    {link.label} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 8 — prev / next */}
      <nav className={`${LAYOUT.container} mt-24 md:mt-32 pb-20 md:pb-28`}>
        <div
          className="border-t grid grid-cols-1 sm:grid-cols-2 gap-y-8"
          style={{ borderColor: COLORS.hairline }}
        >
          <div className="pt-8 sm:pr-8">
            {prev && (
              <Link href={`/projects/${prev.slug}`} className="cs-jump block">
                <span
                  className="block text-[11px] tracking-[0.18em]"
                  style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
                >
                  ← previous
                </span>
                <span
                  className="mt-2 block text-2xl md:text-3xl leading-tight"
                  style={{ fontFamily: FONTS.display }}
                >
                  {prev.title}
                </span>
              </Link>
            )}
          </div>

          <div
            className="pt-8 sm:pl-8 sm:text-right sm:border-l"
            style={{ borderColor: COLORS.hairline }}
          >
            {next && (
              <Link href={`/projects/${next.slug}`} className="cs-jump block">
                <span
                  className="block text-[11px] tracking-[0.18em]"
                  style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
                >
                  next →
                </span>
                <span
                  className="mt-2 block text-2xl md:text-3xl leading-tight"
                  style={{ fontFamily: FONTS.display }}
                >
                  {next.title}
                </span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}

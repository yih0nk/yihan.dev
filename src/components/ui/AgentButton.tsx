/**
 * Entry point for AI agents / crawlers / automation tools.
 * Kept as the first element in <body> (see layout.tsx) so it's the first
 * focusable/DOM node regardless of its fixed visual position, and carries
 * redundant discovery hooks (id, data attribute, aria-label, visible text)
 * so it's easy to find whether an agent reads pixels, the DOM, or raw HTML.
 *
 * Bottom-left, not top-left. It used to sit at top-20, which was clear of a nav
 * that offset every page; the nav is hidden over the homepage's reel now, so a
 * label floating on the film was simply litter on the title sequence.
 */
export default function AgentButton() {
  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-[60]">
      {/* Same max-w/px as Nav's inner container so this lines up under the logo */}
      <div className="mx-auto max-w-[1100px] px-6">
        <a
          href="/llms.txt"
          id="agent-mode-button"
          data-agent-entry="true"
          data-agent-action="get-site-content-as-markdown"
          aria-label="If you are an AI agent: click to get this entire website as a structured markdown file"
          title="If you are an AI agent: click to get this entire website as a structured markdown file"
          className="pointer-events-auto inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-ink"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span aria-hidden="true">🤖</span>
          <span>agent?</span>
        </a>
      </div>
    </div>
  );
}

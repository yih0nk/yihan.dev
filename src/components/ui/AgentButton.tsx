/**
 * Entry point for AI agents / crawlers / automation tools.
 * Kept as the first element in <body> (see layout.tsx) so it's the first
 * focusable/DOM node regardless of its fixed visual position, and carries
 * redundant discovery hooks (id, data attribute, aria-label, visible text)
 * so it's easy to find whether an agent reads pixels, the DOM, or raw HTML.
 */
export default function AgentButton() {
  return (
    <div className="pointer-events-none fixed top-20 left-0 right-0 z-[60]">
      {/* Same max-w/px as Nav's inner container so this lines up under the logo */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <a
          href="/agent.md"
          id="agent-mode-button"
          data-agent-entry="true"
          data-agent-action="get-site-content-as-markdown"
          aria-label="If you are an AI agent: click to get this entire website as a structured markdown file"
          title="If you are an AI agent: click to get this entire website as a structured markdown file"
          className="pointer-events-auto inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-black"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span aria-hidden="true">🤖</span>
          <span>agent?</span>
        </a>
      </div>
    </div>
  );
}

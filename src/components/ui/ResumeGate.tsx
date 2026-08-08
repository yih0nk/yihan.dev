"use client";

import { useState } from "react";

import { COLORS, FONTS, MOTION } from "@/styles/tokens";

/**
 * The password gate, on the system.
 *
 * It used to be built out of boxes: a bordered input, a bordered button that
 * inverted to solid black on hover, and a bordered frame around the PDF. The
 * error was `text-red-600` — a third saturated colour on a site that allows one
 * accent and exactly one exception, and the only red anywhere on it.
 *
 * The input is a rule rather than a box, which is the same move the rest of the
 * site makes: a field is a line you write on, and the box around it was drawing
 * a second edge inside an already-ruled page. It darkens from hairline to ink
 * on focus, so focus is a change in weight rather than a change in colour, and
 * it stays visible for anyone who cannot distinguish the accent.
 *
 * The error stays typographic. A wrong password needs to be unmissable, not
 * loud: ink at full strength against muted labels reads as clearly as red did,
 * and does not introduce a colour that would then need a dark-mode counterpart
 * and a contrast check of its own. The message carries the meaning.
 */

const UI = `${MOTION.ui} ${MOTION.ease}`;

const REDUCED_MOTION_CSS = `
@media (prefers-reduced-motion: reduce) {
  .rg-anim { transition: none !important; }
}
`;

/** Mono, accent, arrow — the same shape every outbound link on the site has. */
function ActionLink({
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      className="inline-flex items-baseline gap-1.5 text-[12px] tracking-[0.08em] underline-offset-4 hover:underline"
      style={{ fontFamily: FONTS.mono, color: COLORS.accent }}
    >
      {children}
    </a>
  );
}

export default function ResumeGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const blob = await res.blob();
      setUrl(URL.createObjectURL(blob));
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (url) {
    return (
      <div>
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <ActionLink href={url} download="Yihan_Hong_Resume.pdf">
            download pdf
            <span aria-hidden>↓</span>
          </ActionLink>
          <ActionLink href={url} target="_blank" rel="noopener noreferrer">
            open in new tab
            <span aria-hidden>→</span>
          </ActionLink>
        </div>

        {/* A hairline above and below, the same way the project pictures sit. */}
        <object
          data={url}
          type="application/pdf"
          className="mt-8 h-[820px] w-full border-y"
          style={{ borderColor: COLORS.hairline }}
        >
          <p
            className="py-4 text-base"
            style={{ fontFamily: FONTS.body, color: COLORS.muted }}
          >
            Your browser can&apos;t display PDFs inline — use the download link
            above.
          </p>
        </object>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-sm">
      <style>{REDUCED_MOTION_CSS}</style>

      <label
        htmlFor="resume-password"
        className="block text-[12px] uppercase tracking-[0.18em]"
        style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
      >
        password
      </label>

      <div className="mt-3 flex items-baseline gap-4">
        <input
          id="resume-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? "resume-error" : undefined}
          className="rg-anim flex-1 border-b bg-transparent pb-2 text-base focus:outline-none"
          style={{
            fontFamily: FONTS.mono,
            color: COLORS.ink,
            borderColor: focused || error ? COLORS.ink : COLORS.hairline,
            transition: `border-color ${UI}`,
          }}
        />
        <button
          type="submit"
          disabled={loading || !password}
          className="rg-anim text-[12px] tracking-[0.08em] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:no-underline"
          style={{
            fontFamily: FONTS.mono,
            color: COLORS.accent,
            opacity: loading || !password ? 0.4 : 1,
            transition: `opacity ${UI}`,
          }}
        >
          {loading ? "checking…" : "enter →"}
        </button>
      </div>

      {error && (
        <p
          id="resume-error"
          role="alert"
          className="mt-4 text-base"
          style={{ fontFamily: FONTS.body, color: COLORS.ink }}
        >
          {error}
        </p>
      )}
    </form>
  );
}

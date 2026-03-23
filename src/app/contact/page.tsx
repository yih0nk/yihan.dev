import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Yihan.",
};

const links = [
  { icon: "✉️", label: "email", href: "mailto:your@email.com", display: "your@email.com" },
  { icon: "🐙", label: "github", href: "https://github.com/yourusername", display: "github.com/yourusername" },
  { icon: "💼", label: "linkedin", href: "https://linkedin.com/in/yourusername", display: "linkedin.com/in/yourusername" },
];

export default function ContactPage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-6"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          let&apos;s talk.
        </h1>

        <p className="text-gray-600 leading-relaxed mb-2 max-w-md">
          Whether it&apos;s about an internship, a project idea, or just to say
          hi — I&apos;d love to hear from you.
        </p>
        <p className="text-gray-600 leading-relaxed mb-12 max-w-md">
          The best way to reach me is email. I also exist on the internet in the
          following places:
        </p>

        <ul className="space-y-6 mb-20">
          {links.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-4 w-fit"
              >
                <span className="text-xl">{l.icon}</span>
                <span className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">{l.label}</span>
                  <span
                    className="text-sm text-gray-700 group-hover:text-black group-hover:underline underline-offset-4 transition-colors"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {l.display}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-100 pt-8">
          <div className="w-16 h-16 border border-gray-200 bg-gray-50 flex items-center justify-center mb-3">
            <span className="text-gray-300 text-xs">pfp</span>
          </div>
          <p className="text-xs text-gray-400">
            built with next.js, three.js, and too much coffee. © 2026 yihan.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}

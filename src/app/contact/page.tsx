import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Yihan.",
};

const links = [
  { icon: "✉️", label: "email", href: "mailto:yihanhon@usc.edu", display: "yihanhon@usc.edu" },
  { icon: "🐱", label: "github", href: "https://github.com/yih0nk", display: "github.com/yih0nk" },
  { icon: "💼", label: "linkedin", href: "https://linkedin.com/in/yihan-hon", display: "linkedin.com/in/yihan-hon" },
];

export default function ContactPage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-6 lowercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          let&apos;s talk.
        </h1>

        <p className="text-gray-600 leading-relaxed mb-12 max-w-md lowercase">
          Whether it&apos;s about an internship, a project idea, or just to say
          hi — I&apos;d love to hear from you.
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

      </div>
    </PageTransition>
  );
}

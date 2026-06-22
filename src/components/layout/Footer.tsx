import Link from "next/link";

const SOCIAL_LINKS = [
  { href: "https://github.com/yih0nk", label: "github" },
  { href: "https://linkedin.com/in/yihan-hon", label: "linkedin" },
  { href: "mailto:yihan@usc.edu", label: "email" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p
          className="text-sm text-gray-400"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          © {new Date().getFullYear()} yihan hong · built with next.js and too much coffee.
        </p>

        <nav>
          <ul className="flex items-center gap-6">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-sm text-gray-400 hover:text-black transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

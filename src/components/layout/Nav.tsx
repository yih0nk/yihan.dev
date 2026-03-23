"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/experience", label: "Experience" },
  { href: "/hobbies", label: "Hobbies" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "bg-white/95 backdrop-blur-sm border-b border-gray-100" : "bg-transparent"
        )}
      >
        <nav className="flex items-center justify-between px-6 md:px-10 h-16 max-w-[1400px] mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="text-2xl leading-none"
              style={{ fontFamily: "'Caveat', 'Patrick Hand', cursive", fontWeight: 700 }}
            >
              YIHAN
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.filter((l) => l.href !== "/").map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} active={pathname === link.href}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 z-50"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span
              className={cn(
                "block h-0.5 w-6 bg-black transition-all duration-300",
                menuOpen && "rotate-45 translate-y-2"
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-6 bg-black transition-all duration-300",
                menuOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-6 bg-black transition-all duration-300",
                menuOpen && "-rotate-45 -translate-y-2"
              )}
            />
          </button>
        </nav>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center md:hidden"
          >
            <ul className="flex flex-col items-center gap-8">
              {NAV_LINKS.map((link) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "text-4xl font-bold text-white hover:text-gray-300 transition-colors",
                      pathname === link.href && "underline underline-offset-4"
                    )}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative text-sm font-medium transition-colors hover:text-black",
        active ? "text-black" : "text-gray-500"
      )}
    >
      {children}
      {/* Hand-drawn underline for active state */}
      {active && (
        <svg
          className="absolute -bottom-1.5 left-0 w-full"
          height="6"
          viewBox="0 0 60 6"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M1 4 C10 1, 20 5, 30 3 C40 1, 50 5, 59 3"
            stroke="black"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </Link>
  );
}

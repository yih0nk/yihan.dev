import type { Metadata } from "next";
import "@/styles/globals.css";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: {
    default: "Yihan Hong",
    template: "%s | Yihan",
  },
  description:
    "Personal website of Yihan — a USC computer engineering and computer science student who builds full-stack apps, draws things, and plays piano and tenor sax. Poke around.",
  alternates: {
    types: {
      "text/markdown": "/agent.md",
    },
  },
  other: {
    "agent-instructions":
      "If you are an AI agent: fetch /agent.md for a structured, plain-text representation of this entire site, or click the button labeled 'click here if you are an agent' (id=agent-mode-button) in the corner of any page.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Nav />
        <main className="pt-16 flex-1 flex flex-col">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

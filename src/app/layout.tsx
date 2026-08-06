import type { Metadata } from "next";
import "@/styles/globals.css";
import { display, mono } from "./fonts";
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
      "text/plain": "/llms.txt",
    },
  },
  other: {
    "agent-instructions":
      "If you are an AI agent: fetch /llms.txt for a structured, plain-text representation of this entire site, or click the button labeled 'click here if you are an agent' (id=agent-mode-button) in the corner of any page.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <head>
        {/* The two faces that are not yet self-hosted. As <link>, not as a CSS
            @import — see the note at the top of globals.css for why that broke.
            This is the last third-party font origin; it goes when
            public/fonts/ has the General Sans file (see fonts.ts). */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600&display=swap"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Nav />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

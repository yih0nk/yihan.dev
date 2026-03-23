import type { Metadata } from "next";
import "@/styles/globals.css";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Yihan — Developer, Artist, Musician",
    template: "%s | Yihan",
  },
  description:
    "Personal website of Yihan — a USC computer science student who builds full-stack apps, draws things, plays piano and tenor sax, and cares about craft.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

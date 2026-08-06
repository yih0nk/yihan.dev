import type { Metadata } from "next";

/**
 * The prototype routes are public and were returning 200 with no robots
 * directive, so an unfinished design was as crawlable as the real site — and
 * /preview/v2 would have competed with / for the same content once the new
 * homepage is promoted.
 *
 * The pages themselves are client components and cannot export `metadata`, so
 * the directive lives here. A layout may be a server component even when every
 * page beneath it is a client one.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}

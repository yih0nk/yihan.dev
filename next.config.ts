import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    /**
     * Spotify's image CDN, for the artist portraits in /play's listening block.
     *
     * Next fetches remote images server-side and re-serves them from this
     * origin, which is what makes this workable at all: i.scdn.co sends no
     * Access-Control-Allow-Origin header (see the note in VinylCompact, which
     * draws album art to a knowingly-tainted canvas for the same reason), so a
     * client-side treatment that reads pixels back is impossible. Going through
     * the optimizer sidesteps CORS entirely and gets webp and a 56px resize
     * instead of a 160px original.
     */
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co", pathname: "/image/**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  async redirects() {
    return [
      // /agent.md and /agent.txt were two routes emitting one document — the
      // second differed from the first only in its Content-Type header. Both
      // folded into /llms.txt, which is now index and full text in one file.
      // 308 rather than 307: permanent, and GET.
      { source: "/agent.md", destination: "/llms.txt", permanent: true },
      { source: "/agent.txt", destination: "/llms.txt", permanent: true },
      // /hobbies became /play; /about and /contact were folded into the
      // homepage and the footer respectively. Anything already linking to the
      // old paths lands somewhere sensible rather than on a 404.
      // Blog posts lost the category from their path when categories became
      // tags rather than folders. Both the old post URLs and the old category
      // listings redirect rather than 404, because they are the ones already in
      // Google's index and in anything anyone has linked. 308 keeps the method
      // and tells crawlers the move is permanent, so the new URL inherits the
      // old one's standing instead of competing with it.
      {
        source: "/blog/:category(life|music|film|tech)/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/blog/:category(life|music|film|tech)",
        destination: "/blog",
        permanent: true,
      },
      { source: "/hobbies", destination: "/play", permanent: true },
      { source: "/about", destination: "/", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;

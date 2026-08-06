import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
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
      { source: "/hobbies", destination: "/play", permanent: true },
      { source: "/about", destination: "/", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;

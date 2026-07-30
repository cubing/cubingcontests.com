import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({});

const nextConfig: NextConfig = withMDX({
  output: "standalone",
  serverExternalPackages: ["cubing", "geo-tz", "pino", "pino-logflare"],
  pageExtensions: ["md", "mdx", "tsx", "ts", "jsx", "js", "mjs", "json"],
  redirects() {
    return Promise.resolve([
      // This is just for Cubing Contests pre-2026-07-30
      {
        source: "/posts/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      // This is to override Better Auth's default behavior when redirecting after an error
      // https://github.com/better-auth/better-auth/issues/5467
      {
        source: "/api/auth/error",
        destination: "/oauth-error",
        permanent: false,
      },
    ]);
  },
  // Enables streaming (https://nextjs.org/docs/app/guides/self-hosting#streaming-and-suspense)
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: [{ key: "X-Accel-Buffering", value: "no" }],
      },
    ];
  },
});

export default nextConfig;

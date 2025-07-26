import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({});

const nextConfig: NextConfig = withMDX({
  output: "standalone",
  serverExternalPackages: ["cubing", "geo-tz"],
  pageExtensions: ["md", "mdx", "tsx", "ts", "jsx", "js", "mjs", "json"],
  redirects() {
    return Promise.resolve([
      {
        source: "/records",
        destination: "/records/unofficial",
        permanent: true,
      },
      {
        source: "/rankings",
        destination: "/rankings/fto/single",
        permanent: true,
      },
      {
        source: "/moderator-instructions",
        destination: "/moderator-instructions/wca",
        permanent: true,
      },
    ]);
  },
});

export default nextConfig;

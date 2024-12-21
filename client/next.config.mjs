/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects() {
    return [
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
    ];
  },
  webpack: (config) => {
    config.module.rules.push(
      {
        test: /\.md$/,
        type: "asset/source",
      },
    );
    return config;
  },
};

export default nextConfig;

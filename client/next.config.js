/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/records',
        destination: '/records/wca',
        permanent: true,
      },
      {
        source: '/rankings',
        destination: '/rankings/333/single',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

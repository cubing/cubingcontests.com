/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/records',
        destination: '/records/wca',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

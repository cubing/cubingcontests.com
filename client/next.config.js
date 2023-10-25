/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/records',
        destination: '/records/unofficial',
        permanent: true,
      },
      {
        source: '/rankings',
        destination: '/rankings/fto/single',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

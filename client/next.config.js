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
      {
        source: '/moderator-instructions',
        destination: '/moderator-instructions/wca',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

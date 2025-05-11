/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  env: {
    PORT: '3000'
  },
  // Add configuration to serve static files from the tmp directory
  async rewrites() {
    return [
      {
        source: '/tmp/:path*',
        destination: '/api/serve-audio/:path*',
      },
    ];
  }
};

module.exports = nextConfig;
module.exports = {
  basePath: '',
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  output: 'standalone',  // Enable standalone output mode
  experimental: {
    outputFileTracingRoot: undefined // Let Next.js detect the monorepo root
  },
  images: {
    unoptimized: true, // This helps with image display in static export scenarios
    domains: [],       // Add any external domains you're loading images from
  }
};
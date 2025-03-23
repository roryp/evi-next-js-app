module.exports = {
  basePath: '',
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  output: 'export',  // Change to static export
  experimental: {
    appDir: true,
    serverActions: true
  },
  images: {
    unoptimized: true,
    domains: [],
  },
  // Avoid symlinks in build output
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.symlinks = false;
    return config;
  }
};
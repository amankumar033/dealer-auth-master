import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Webpack configuration for Windows compatibility
  webpack: (config, { isServer }) => {
    // Disable symlinks in webpack for Windows
    config.resolve.symlinks = false;
    
    // Disable file watching issues on Windows
    if (!isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
  
  // Disable image optimization that can cause issues
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

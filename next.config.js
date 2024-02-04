const transpilePackages = []

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

  basePath: '/yass',

  images: {
    unoptimized: true,
  },

  transpilePackages,
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.wgsl$/i,
      use: ['@use-gpu/wgsl-loader'],
    });

    return config;
  },
}

module.exports = nextConfig

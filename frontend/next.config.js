const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tensorflow-models',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@tensorflow/tfjs',
    '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-backend-webgl',
    '@tensorflow/tfjs-backend-cpu',
    '@tensorflow/tfjs-converter',
    '@tensorflow-models/blazeface',
    '@tensorflow-models/body-pix',
    '@tensorflow-models/body-segmentation',
  ],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    // Exclude TensorFlow.js from server-side bundle
    if (isServer) {
      config.externals = [...(config.externals || []), {
        '@tensorflow/tfjs': 'commonjs @tensorflow/tfjs',
        '@tensorflow-models/blazeface': 'commonjs @tensorflow-models/blazeface',
        '@tensorflow-models/body-pix': 'commonjs @tensorflow-models/body-pix',
        '@tensorflow-models/body-segmentation': 'commonjs @tensorflow-models/body-segmentation',
      }];
    }
    
    return config;
  },
}

module.exports = withPWA(nextConfig);

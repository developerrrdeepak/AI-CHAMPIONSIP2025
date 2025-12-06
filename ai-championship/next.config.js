/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
  },
  transpilePackages: ['date-fns', 'react-day-picker'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,
  poweredByHeader: false,
  compress: true,

  webpack: (config, { isServer }) => {
    // Ensure server-only modules are externalized for both client and server builds if they are
    // causing issues in the client bundle, as they should never run in the browser.
    // This is a more aggressive approach to fix persistent ENOENT errors related to server modules.
    config.externals.push({
      'pdf-parse': 'commonjs pdf-parse',
      'express': 'commonjs express',
      'require-in-the-middle': 'commonjs require-in-the-middle',
      'genkit': 'commonjs genkit',
      '@genkit-ai/core': 'commonjs @genkit-ai/core',
      '@genkit-ai/google-cloud': 'commonjs @genkit-ai/google-cloud',
      // Add other Genkit related packages or server-only modules here if necessary
    });
    
    return config;
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vultrobjects.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Removed dangerouslyAllowSVG: true as it can cause issues and is not always necessary.
    // Removed contentSecurityPolicy from images as Vercel handles security headers automatically.
  },
};

module.exports = nextConfig;

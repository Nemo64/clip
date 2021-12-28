const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",

              "object-src 'none'",
              "style-src 'unsafe-inline' 'self'",
              `script-src ${PHASE_DEVELOPMENT_SERVER ? "'unsafe-eval'" : ""} 'self'`,
              "connect-src 'self' https://api.bitbucket.org/",

              "form-action 'none'",
              "frame-ancestors 'none'",
            ].join(';'),
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          {
            key: 'X-Frame-Options',
            value: 'deny',
          },
        ],
      },
    ];
  },
};

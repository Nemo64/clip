const {PHASE_DEVELOPMENT_SERVER} = require('next/constants');
const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_FFMPEG_URL: '/dist/ffmpeg',
  },
  webpack(config) {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, 'node_modules/@ffmpeg/core/dist'),
            to: path.join(__dirname, `public/dist/ffmpeg`),
          },
        ],
      }),
    );
    return config;
  },
  headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' blob:",

              "object-src 'none'",
              "style-src 'unsafe-inline' 'self'",
              `script-src ${PHASE_DEVELOPMENT_SERVER ? "'unsafe-eval'" : ""} 'self' blob:`,

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

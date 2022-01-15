const {PHASE_DEVELOPMENT_SERVER} = require('next/constants');
const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');
const classNames = require("classnames");

const FFMPEG_PATH = 'dist/ffmpeg';

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_FFMPEG_URL: `/${FFMPEG_PATH}`,
    NEXT_PUBLIC_HOST: 'https://clip.marco.zone',
  },
  webpack(config) {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, 'node_modules/@ffmpeg/core/dist'),
            to: path.join(__dirname, 'public', FFMPEG_PATH),
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
        locale: false,
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "style-src 'unsafe-inline' 'self'",

              // thumbnails and preview video at the end are blob urls
              "img-src 'self' blob:",
              "media-src 'self' blob:",

              // the ffmpeg-wasm library requires blob: to work, even though that's not a good idea
              // if matomo is configured, CSP needs to allow that as well
              `script-src ${classNames("'self' blob:", {"'unsafe-eval'": PHASE_DEVELOPMENT_SERVER})}`,
              `connect-src ${classNames("'self' blob:", process.env.NEXT_PUBLIC_MATOMO_URL)}`,

              "form-action 'none'",
              "frame-ancestors 'none'",
            ].join(';'),
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp', // required for SharedArrayBuffer of the ffmpeg library
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

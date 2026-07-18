/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only: React 19 double-invokes effects under StrictMode, so every
  // page's data-fetching effect fires twice (two identical API requests per
  // page load) in development only — production builds were never affected.
  // Disabled so the Network tab reflects one request per page, as intended.
  reactStrictMode: false,
  allowedDevOrigins: ['127.0.0.1'],
}

module.exports = nextConfig

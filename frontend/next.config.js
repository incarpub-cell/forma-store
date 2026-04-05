/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'forma-store-api.railway.app'],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:4000',
  },
}

module.exports = nextConfig

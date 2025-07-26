/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is not a Next.js app, but some Vercel configurations expect this file
  // The actual build process is handled by Vite and Express
  experimental: {
    serverComponentsExternalPackages: ['firebase']
  }
}

module.exports = nextConfig
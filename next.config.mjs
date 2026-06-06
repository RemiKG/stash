/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Plates and scrubbed photos are served from the data dir via an API route,
  // so no remote image domains are needed. Keep the surface small.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || '').replace(/\/$/, '');
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;

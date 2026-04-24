/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    const target = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:3001').replace(/\/$/, '');
    return [{ source: '/api/:path*', destination: `${target}/api/:path*` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'svyrkggjjkbxsbvumfxj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'svyrkggjjkbxsbvumfxj.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
      {
        protocol: 'https',
        hostname: 'mbztkqdpojnvdgvlqmnf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'mbztkqdpojnvdgvlqmnf.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
};

export default nextConfig;

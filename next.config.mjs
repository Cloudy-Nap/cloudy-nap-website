/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const raw =
      process.env.API_PROXY_TARGET ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3001' : '');
    const target = typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : '';
    if (!target) return [];
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

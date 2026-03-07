import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone 输出用于 Docker 部署
  output: 'standalone',

  // 生产环境优化
  poweredByHeader: false,
  compress: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 实验性特性
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['lucide-react', 'motion/react'],
  },

  // 日志配置
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // 静态资源缓存头
  headers: async () => [
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/api/health',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
      ],
    },
  ],
};

export default nextConfig;

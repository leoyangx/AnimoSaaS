/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔴 CRITICAL: 启用 Standalone 输出用于 Docker 部署
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
  },

  // 实验性特性
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // 日志配置
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;

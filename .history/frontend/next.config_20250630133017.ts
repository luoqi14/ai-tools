import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发服务器配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8003/api/:path*',
      },
    ]
  },
  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出配置 - 可以部署到静态服务器
  output: 'export',
  trailingSlash: true,
  
  // 图片优化配置
  images: {
    unoptimized: true, // 静态导出需要禁用图片优化
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8003',
      },
    ],
  },
  
  // 环境变量配置
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default nextConfig;

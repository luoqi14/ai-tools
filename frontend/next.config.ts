import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React编译器配置 - React 19自动优化
  experimental: {
    // reactCompiler has been moved to top-level in newer Next.js versions
  },
  reactCompiler: true,
  
  // 静态导出配置 - 仅在生产构建时使用
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
  }),
  
  // 图片优化配置
  images: {
    // 在开发模式下启用图片优化，生产模式下禁用
    unoptimized: process.env.NODE_ENV === 'production',
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

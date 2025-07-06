"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import GlassContainer from "@/components/layout/GlassContainer";
import ToolGrid from "@/components/tools/ToolGrid";

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState<string>("");

  useEffect(() => {
    // 使用我们自己的后端代理端点获取背景图片
    // 添加时间戳参数确保每次都是新的请求，避免缓存
    const timestamp = Date.now();
    const bingImageUrl = `http://localhost:8003/api/bing-image?t=${timestamp}`;
    setBackgroundImage(bingImageUrl);
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 底层：动态背景图片 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : undefined,
        }}
      ></div>

      {/* 半透明遮罩层 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 z-1"></div>

      {/* 中层：主要内容容器 */}
      <div className="relative z-20 min-h-screen flex flex-col justify-center items-center">
        {/* 主要内容区域 */}
        <div className="container mx-auto px-6">
          {/* 中层：磨砂玻璃面板容器 */}
          <GlassContainer className="p-8 md:p-12">
            {/* 上层：工具网格 */}
            <div className="space-y-8">
              {/* 工具网格标题 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-center"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  工具集
                </h1>
                <p className="text-lg text-white/80 max-w-2xl mx-auto">
                  AI驱动的现代化工具平台，提供高效便捷的在线工具服务
                </p>
              </motion.div>

              {/* 工具网格 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <ToolGrid />
              </motion.div>
            </div>
          </GlassContainer>
        </div>
      </div>
    </main>
  );
}

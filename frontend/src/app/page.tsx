"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import GlassContainer from "@/components/layout/GlassContainer";
import ToolGrid from "@/components/tools/ToolGrid";
import { api } from "@/lib/api";

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState<string>("");

  useEffect(() => {
    // 使用API函数获取背景图片URL
    const bingImageUrl = api.getBingImageUrl();
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
          <GlassContainer className="p-8 md:p-12 min-h-[60vh]">
            {/* 上层：工具网格 */}
            <div className="space-y-8">
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

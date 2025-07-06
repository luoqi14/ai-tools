"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import GlassContainer from "@/components/layout/GlassContainer";
import ImageGenerator from "@/components/tools/ImageGenerator";

export default function ImageGeneratorPage() {
  const [backgroundImage, setBackgroundImage] = useState<string>("");

  useEffect(() => {
    // 使用我们自己的后端代理端点获取背景图片
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
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* 顶部导航 */}
        <div className="container mx-auto px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
          </motion.div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 container mx-auto px-6 pb-8">
          {/* 中层：磨砂玻璃面板容器 */}
          <GlassContainer className="p-6 md:p-8 min-h-[80vh]">
            {/* 标题 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                AI图像生成
              </h1>
              <p className="text-white/80 text-lg">
                基于Flux Kontext模型的文生图和图生图工具
              </p>
            </motion.div>

            {/* 图像生成组件 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <ImageGenerator />
            </motion.div>
          </GlassContainer>
        </div>
      </div>
    </main>
  );
}

"use client";

import { motion } from "framer-motion";
import GlassContainer from "@/components/layout/GlassContainer";
import ToolGrid from "@/components/tools/ToolGrid";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 底层：渐变背景 */}
      <div className="absolute inset-0 gradient-bg"></div>

      {/* 装饰性背景元素 */}
      <div className="absolute inset-0">
        {/* 浮动圆形装饰 */}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full blur-xl"
          animate={{
            y: [0, 15, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-xl"
          animate={{
            y: [0, -10, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>

      {/* 中层：主要内容容器 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 头部区域 */}
        <header className="pt-16 pb-8">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            ></motion.div>
          </div>
        </header>

        {/* 主要内容区域 */}
        <div className="flex-1 pb-16">
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
                ></motion.div>

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
      </div>
    </main>
  );
}

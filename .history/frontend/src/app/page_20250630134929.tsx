"use client";

import { motion } from "framer-motion";
import GlassContainer from "@/components/layout/GlassContainer";
import ToolGrid from "@/components/tools/ToolGrid";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 底层：渐变背景 */}
      <div className="absolute inset-0 gradient-bg"></div>

      {/* 中层：主要内容容器 */}
      <div className="relative z-10 min-h-screen flex flex-col">
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

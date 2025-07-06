"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Image,
  Code,
  BarChart,
  Zap,
  Braces,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tool } from "@/lib/api";

// 图标映射
const iconMap: Record<string, LucideIcon> = {
  FileText,
  Image,
  Code,
  BarChart,
  Zap,
  Braces,
};

interface ToolCardProps {
  tool: Tool;
  index: number;
  onClick?: () => void;
}

export default function ToolCard({ tool, index, onClick }: ToolCardProps) {
  const Icon = iconMap[tool.icon] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <Card className="glass-panel border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 tool-icon">
        <CardContent className="p-6 text-center">
          {/* 图标容器 */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>

              {/* 状态指示器 */}
              {tool.status === "beta" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white/20"></div>
              )}
              {tool.status === "active" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white/20"></div>
              )}
            </div>
          </div>

          {/* 文本内容 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-100 transition-colors">
              {tool.name}
            </h3>
            <p className="text-sm text-white/70 group-hover:text-white/80 transition-colors line-clamp-2">
              {tool.description}
            </p>
          </div>

          {/* 分类标签 */}
          <div className="mt-4">
            <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-white/80 border border-white/20">
              {getCategoryLabel(tool.category)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// 分类标签映射
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    text: "文本处理",
    media: "媒体处理",
    development: "开发工具",
    analysis: "数据分析",
  };

  return labels[category] || category;
}

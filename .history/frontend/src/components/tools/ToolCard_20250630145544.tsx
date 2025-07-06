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
      <div className="text-center">
        {/* 图标容器 - 类似手机app图标 */}
        <div className="mb-3 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-md hover:bg-white/25 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-110">
            <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* 应用名称 */}
        <h3 className="text-sm font-medium text-white group-hover:text-blue-100 transition-colors truncate">
          {tool.name}
        </h3>
      </div>
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

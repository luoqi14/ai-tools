"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import ToolCard from "./ToolCard";
import { Tool, api } from "@/lib/api";

interface ToolGridProps {
  onToolClick?: (tool: Tool) => void;
}

export default function ToolGrid({ onToolClick }: ToolGridProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setLoading(true);
    const toolsData = await api.getTools();
    setTools(toolsData);
    setLoading(false);
  };

  const handleToolClick = (tool: Tool) => {
    console.log("点击工具:", tool);
    if (onToolClick) {
      onToolClick(tool);
    } else {
      // 判断是内部路由还是外部链接
      if (tool.url) {
        if (tool.url.startsWith("/")) {
          // 内部路由，使用Next.js路由
          router.push(tool.url);
        } else {
          // 外部链接，在新窗口打开
          window.open(tool.url, "_blank");
        }
      } else {
        alert(`${tool.name} 功能开发中...`);
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className="animate-pulse">
              <div className="w-20 h-20 bg-white/20 rounded-2xl mx-auto mb-3"></div>
              <div className="h-3 bg-white/20 rounded w-full"></div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="glass-panel border-white/20 bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-md mx-auto">
          <p className="text-white/70">暂无可用工具</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
      {tools.map((tool, index) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          index={index}
          onClick={() => handleToolClick(tool)}
        />
      ))}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ToolCard from "./ToolCard";
import { Tool, api } from "@/lib/api";

interface ToolGridProps {
  onToolClick?: (tool: Tool) => void;
}

export default function ToolGrid({ onToolClick }: ToolGridProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const toolsData = await api.getTools();
      setTools(toolsData);
    } catch (err) {
      setError("加载工具列表失败");
      console.error("加载工具失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = (tool: Tool) => {
    console.log("点击工具:", tool);
    if (onToolClick) {
      onToolClick(tool);
    } else {
      // 默认行为：显示提示或导航到工具页面
      alert(`${tool.name} 功能开发中...`);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel border-white/20 bg-white/10 backdrop-blur-md rounded-lg p-6 h-48"
          >
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4"></div>
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-6 bg-white/20 rounded-full w-20 mx-auto"></div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="glass-panel border-red-300/20 bg-red-100/10 backdrop-blur-md rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={loadTools}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/20"
          >
            重新加载
          </button>
        </div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

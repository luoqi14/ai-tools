"use client";

import ImageGenerator from "@/components/tools/ImageGenerator";

export default function ImageGeneratorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI图像生成工具
          </h1>
          <p className="text-xl text-gray-600">
            基于 Flux Kontext 模型的专业图像生成服务
          </p>
        </div>

        {/* 主要内容 */}
        <ImageGenerator />
      </div>
    </div>
  );
}

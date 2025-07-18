"use client";

import React, { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
// import {
//   Carousel,
//   CarouselContent,
//   CarouselItem,
//   CarouselNext,
//   CarouselPrevious,
// } from "@/components/ui/carousel";
import { Upload, X, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { RainbowButton } from "@/components/magicui/rainbow-button";

interface TreasureBoxImage {
  id: string;
  url: string;
  thumbnailUrl?: string; // 缩略图URL
  file: File;
  timestamp: number;
}

interface TreasureBoxProps {
  isOpen: boolean;
  onClose: () => void;
  images: TreasureBoxImage[];
  onImageUpload: (file: File, thumbnailUrl?: string) => void;
  onImageRemove: (id: string) => void;
}

export const TreasureBox: React.FC<TreasureBoxProps> = ({
  isOpen,
  onClose,
  images,
  onImageUpload,
  onImageRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生成缩略图
  const generateThumbnail = useCallback(
    (file: File, maxSize = 200, quality = 0.8): Promise<string> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          // 计算缩略图尺寸，保持宽高比
          const { width, height } = img;
          let newWidth = width;
          let newHeight = height;

          if (width > height) {
            if (width > maxSize) {
              newWidth = maxSize;
              newHeight = (height * maxSize) / width;
            }
          } else {
            if (height > maxSize) {
              newHeight = maxSize;
              newWidth = (width * maxSize) / height;
            }
          }

          canvas.width = newWidth;
          canvas.height = newHeight;

          // 绘制缩略图
          ctx?.drawImage(img, 0, 0, newWidth, newHeight);

          // 转换为blob URL，使用JPEG格式和指定质量
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const thumbnailUrl = URL.createObjectURL(blob);
                resolve(thumbnailUrl);
              } else {
                reject(new Error("Failed to generate thumbnail"));
              }
            },
            "image/jpeg",
            quality
          );
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error("文件错误", { description: "图片大小不能超过10MB" });
          return;
        }
        if (!file.type.startsWith("image/")) {
          toast.error("文件错误", { description: "请选择图片文件" });
          return;
        }

        try {
          // 生成缩略图
          const thumbnailUrl = await generateThumbnail(file);

          // 传递原始文件和缩略图URL
          onImageUpload(file, thumbnailUrl);
          toast.success("上传成功", { description: "图片已添加到百宝箱" });
        } catch (error) {
          console.error("生成缩略图失败:", error);
          // 如果缩略图生成失败，仍然上传原图
          onImageUpload(file);
          toast.success("上传成功", { description: "图片已添加到百宝箱" });
        }
      }
    },
    [onImageUpload, generateThumbnail]
  );

  const handleImageDragStart = (
    image: TreasureBoxImage,
    e: React.DragEvent
  ) => {
    e.dataTransfer.setData("application/json", JSON.stringify(image));
    e.dataTransfer.effectAllowed = "copy";

    // 添加拖拽时的视觉反馈
    const target = e.target as HTMLElement;
    target.style.opacity = "0.5";
    target.style.transform = "scale(0.95)";
  };

  const handleImageDragEnd = (e: React.DragEvent) => {
    // 恢复拖拽元素的样式
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    target.style.transform = "scale(1)";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1] // 使用更平滑的缓动函数
          }}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 w-80 max-h-[80vh] bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
        >
        {/* 头部 */}
        <div className="p-4 border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">百宝箱</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4 max-h-[calc(80vh-80px)] overflow-y-auto">
          {/* 上传按钮 */}
          <div className="mb-4">
            <RainbowButton
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              上传图片
            </RainbowButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* 图片列表 */}
          {images.length > 0 ? (
            <div className="space-y-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group bg-white/50 rounded-lg p-2 hover:bg-white/70 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt="宝箱图片"
                      className="w-16 h-16 object-cover rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200"
                      draggable
                      onDragStart={(e) => handleImageDragStart(image, e)}
                      onDragEnd={handleImageDragEnd}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {image.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(image.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onImageRemove(image.id)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">百宝箱是空的</p>
              <p className="text-xs mt-1">上传图片开始使用</p>
            </div>
          )}
        </div>

        {/* 使用提示 */}
        <div className="p-4 border-t border-white/20 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
          <p className="text-xs text-gray-600 text-center">
            💡 拖拽图片到画布即可添加到场景中
          </p>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TreasureBox;

"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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
  isLoadingPresetImages?: boolean;
}

// 图片加载组件 - 使用dnd-kit的useDraggable
const ImageWithSkeleton: React.FC<{
  image: TreasureBoxImage;
}> = ({ image }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // 使用dnd-kit的useDraggable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `treasure-image-${image.id}`,
    data: {
      type: 'treasure-image',
      image: image,
    },
  });

  // 计算拖拽时的样式变换，使用useMemo优化性能
  const style = React.useMemo(() => ({
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1, // 拖拽时更透明，因为有DragOverlay显示
    scale: isDragging ? 0.9 : 1,
    transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
  }), [transform, isDragging]);

  // 当图片 URL 改变时重置加载状态
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setShowSkeleton(true);
  }, [image.url, image.thumbnailUrl]);

  // 当图片加载完成时，延迟隐藏 Skeleton 以确保用户能看到加载效果
  useEffect(() => {
    if (isLoaded && !hasError) {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 300); // 图片加载完成后再显示 300ms 的 Skeleton
      return () => clearTimeout(timer);
    }
  }, [isLoaded, hasError]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative w-16 h-16 cursor-grab ${isDragging ? 'opacity-30 scale-90' : ''}`}
      style={{
        ...style,
      }}
      data-dnd-kit-draggable-id={`treasure-image-${image.id}`}
      {...listeners}
      {...attributes}
    >
      {/* Skeleton 占位符 - 确保至少显示 300ms */}
      {(showSkeleton || (!isLoaded && !hasError)) && (
        <div className="absolute inset-0 w-16 h-16 rounded-lg overflow-hidden">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      )}

      {/* 实际图片 - 带有淡入效果 */}
      <NextImage
        src={image.thumbnailUrl || image.url}
        alt="宝箱图片"
        width={64}
        height={64}
        className={`w-16 h-16 object-cover rounded-lg transition-all duration-300 ease-in-out ${
          !showSkeleton && isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        unoptimized={true} // 宝箱图片通常是blob URL，需要跳过优化
        style={{
          touchAction: 'pan-y',
          WebkitTapHighlightColor: 'transparent'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        draggable={false} // 禁用原生拖拽，使用dnd-kit
      />

      {/* 错误状态 - 带有淡入效果 */}
      {hasError && (
        <div className="absolute inset-0 w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center transition-all duration-300 ease-in-out">
          <Package className="h-6 w-6 text-gray-400" />
        </div>
      )}
    </div>
  );
};

// 加载中的 Skeleton 组件
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="relative bg-white/50 rounded-lg md:p-2 animate-pulse"
        >
          <div className="flex items-center md:space-x-3">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <div className="flex-1 min-w-0 hidden md:block">
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="h-8 w-8 rounded bg-gray-200 animate-pulse hidden md:block" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TreasureBox: React.FC<TreasureBoxProps> = ({
  isOpen,
  onClose,
  images,
  onImageUpload,
  onImageRemove,
  isLoadingPresetImages = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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

        setIsUploading(true);
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
        } finally {
          setIsUploading(false);
          // 清空文件输入，允许重复上传同一文件
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
    },
    [onImageUpload, generateThumbnail]
  );

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
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 max-h-[80vh] bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20"
        >
        {/* 移动端关闭按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute -top-4 -right-4 h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg md:hidden z-10"
        >
          <X className="h-4 w-4" />
        </Button>
        {/* 头部 */}
        <div className="p-4 border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50 hidden md:block">
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
        <div className="p-4 max-h-[calc(80vh-80px)] overflow-y-auto overflow-x-hidden">
          {/* 上传按钮 */}
          <div className="mb-4">
            <RainbowButton
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`w-full ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
              disabled={isUploading}
            >
              <>
                <Upload className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">上传图片</span>
              </>
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
          {isLoadingPresetImages ? (
            /* 加载预设图片时显示 Skeleton */
            <LoadingSkeleton />
          ) : (images.length > 0 || isUploading) ? (
            <div className="space-y-3">
              {/* 上传中的临时项目 */}
              {isUploading && (
                <div className="relative bg-white/50 rounded-lg p-2 animate-pulse">
                  <div className="flex items-center md:space-x-3">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 min-w-0 hidden md:block">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="h-8 w-8 rounded bg-gray-200 animate-pulse hidden md:block" />
                  </div>
                </div>
              )}
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group bg-white/50 rounded-lg md:p-2 hover:bg-white/70 transition-colors"
                >
                  <div className="flex items-center space-0 md:space-x-3">
                    <ImageWithSkeleton
                      image={image}
                    />
                    <div className="flex-1 min-w-0 hidden md:block">
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
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 hidden md:block"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 只有在不加载且没有图片时才显示空状态 */
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">百宝箱是空的</p>
              <p className="text-xs mt-1">上传图片开始使用</p>
            </div>
          )}
        </div>

        {/* 使用提示 */}
        <div className="p-4 border-t border-white/20 bg-gradient-to-r from-blue-50/30 to-purple-50/30 hidden md:block">
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

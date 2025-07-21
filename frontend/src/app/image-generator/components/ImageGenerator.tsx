"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { api, ImageGenerationRequest, API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import { DndContext, DragEndEvent, DragOverlay, useSensors, useSensor, PointerSensor, DragStartEvent } from "@dnd-kit/core";
import { performanceMonitor, DragDropErrorHandler, initializeDragDropSystem } from "@/lib/dragDropUtils";


import { Textarea } from "@/components/ui/textarea";

// 定义选择的提示词信息类型
interface SelectedPromptInfo {
  originalUserInput: string;
  optimizedPrompt: string;
  chinesePrompt: string;
  optimizationReason: string;
}

// 拖拽图片数据类型
interface DraggedImageData {
  id: string;
  url: string;
  name?: string;
  thumbnailUrl?: string;
}

// 指针事件类型
interface PointerEventWithTouches extends Event {
  touches?: TouchList;
  clientX?: number;
  clientY?: number;
}

// 扩展 Window 接口
declare global {
  interface Window {
    selectedPromptInfo?: SelectedPromptInfo;
    lastPointerEvent?: PointerEventWithTouches | MouseEvent | TouchEvent;
  }
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// import { Progress } from "@/components/ui/progress";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Settings,
  Wand2,
  Download,
  RefreshCw,
  X,
  Upload,
  ArrowLeftRight,
  Pen,
  Package,
} from "lucide-react";

// 导入Aceternity UI组件
import { FileUpload } from "@/components/ui/file-upload";
import { Compare } from "@/components/ui/compare";

// 导入Magic UI组件
// import { Lens } from "@/components/magicui/lens";
// import { BorderBeam } from "@/components/magicui/border-beam";

// 导入Floating Dock组件
import { FloatingDock } from "@/components/ui/floating-dock";

// 导入提示词选择对话框
import { PromptSelectionDialog } from "./PromptSelectionDialog";

// 导入路径绘制组件
import PathDrawingCanvas from "./PathDrawingCanvas";

// 导入百宝箱组件
import TreasureBox from "./TreasureBox";

// 导入历史图片tooltip组件
import { HistoryImageAnimatedTooltip } from "./HistoryImageAnimatedTooltip";

// 导入预设图片
import 太阳帽 from "../images/太阳帽.png";
import 手提包 from "../images/手提包.png";
import 水晶鞋 from "../images/水晶鞋.png";
import 沙滩 from "../images/沙滩.png";
import 自行车 from "../images/自行车.png";
import 连衣裙 from "../images/连衣裙.png";
import 项链 from "../images/项链.png";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // 初始化拖拽系统
  useEffect(() => {
    const { success, warnings } = initializeDragDropSystem();
    if (!success) {
      console.error("拖拽系统初始化失败");
    }
    if (warnings.length > 0) {
      console.warn("拖拽系统警告:", warnings);
    }

    // 添加全局鼠标和触摸位置跟踪
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      // 使用第一个触摸点的位置
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mousePositionRef.current = { x: touch.clientX, y: touch.clientY };
        // 保存到全局变量供drop时使用
        window.lastPointerEvent = e;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // 保存touchend事件，包含最后的触摸位置
      window.lastPointerEvent = e;
    };

    const handleMouseMoveGlobal = (e: MouseEvent) => {
      handleMouseMove(e);
      // 保存到全局变量供drop时使用
      window.lastPointerEvent = e;
    };

    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // 配置dnd-kit传感器，优化移动端体验
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: {
          x: 8,
        }, // 需要水平拖拽8px才激活
      },
    }),
  );

  // 参数状态
  const [aspectRatio, setAspectRatio] = useState("auto");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [promptUpsampling, setPromptUpsampling] = useState(false);
  const [safetyTolerance, setSafetyTolerance] = useState(5);
  const [seed, setSeed] = useState("");
  const [useRandomSeed, setUseRandomSeed] = useState(true);

  // 比较模式状态
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Popover状态控制
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] = useState(false);

  // 历史图片tooltip状态控制
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  // 提示词选择状态
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<
    Array<{
      chinese: string;
      english: string;
      reason: string;
    }>
  >([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [originalUserInput, setOriginalUserInput] = useState("");

  // 历史图片状态
  const [historyImages, setHistoryImages] = useState<
    Array<{
      id: string;
      url: string;
      thumbnailUrl?: string;
      prompt: string;
      timestamp: number;
      file?: File;
      originalUrl?: string; // 保存原始URL用于获取文件
      sourceImageId?: string; // 生成此图片时使用的源图片ID
      originalUserInput?: string; // 用户原始输入
      optimizedPrompt?: string; // 优化后的提示词
      chinesePrompt?: string; // 中文提示词
      optimizationReason?: string; // 优化原因
    }>
  >([]);

  // blob URL缓存
  const [blobUrls, setBlobUrls] = useState<Map<string, string>>(new Map());
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);

  // 路径绘制状态
  const [showPathDrawing, setShowPathDrawing] = useState(false);

  // 网格状态 - 默认显示，不需要切换
  const showGrid = true;



  // 百宝箱状态
  const [showTreasureBox, setShowTreasureBox] = useState(false);
  const [treasureBoxImages, setTreasureBoxImages] = useState<
    Array<{
      id: string;
      url: string;
      thumbnailUrl?: string;
      file: File;
      timestamp: number;
    }>
  >([]);

  // 预设图片加载状态
  const hasLoadedPresetImages = useRef(false);
  const [isLoadingPresetImages, setIsLoadingPresetImages] = useState(false);

  // 生成缩略图的通用函数
  const generateThumbnail = useCallback(
    (imageUrl: string, maxSize = 200, quality = 0.8): Promise<string> => {
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

        img.onerror = () => {
          reject(new Error("Failed to load image for thumbnail generation"));
        };

        img.src = imageUrl;
      });
    },
    []
  );

  // 预设图片数据
  const presetImages = [
    { name: "太阳帽.png", src: 太阳帽.src },
    { name: "手提包.png", src: 手提包.src },
    { name: "水晶鞋.png", src: 水晶鞋.src },
    { name: "沙滩.png", src: 沙滩.src },
    { name: "自行车.png", src: 自行车.src },
    { name: "连衣裙.png", src: 连衣裙.src },
    { name: "项链.png", src: 项链.src },
  ];

  // 计算当前图片
  const getCurrentImage = (): string | null => {
    if (!currentImageId || !historyImages.length) return null;

    const currentIndex = historyImages.findIndex(
      (img) => img.id === currentImageId
    );
    if (currentIndex <= -1) return null;

    return historyImages[currentIndex].url;
  };



  // 获取当前图片的源图片（用于比较功能）
  const getSourceImage = (): string | null => {
    if (!currentImageId || !historyImages.length) return null;

    const currentImage = historyImages.find(img => img.id === currentImageId);
    if (!currentImage || !currentImage.sourceImageId) return null;

    const sourceImage = historyImages.find(img => img.id === currentImage.sourceImageId);
    return sourceImage ? sourceImage.url : null;
  };

  const showToast = (
    variant: "success" | "error" | "info",
    title: string,
    description?: string
  ) => {
    if (variant === "success") {
      toast.success(title, { description });
    } else if (variant === "error") {
      toast.error(title, { description });
    } else {
      toast.info(title, { description });
    }
  };

  // 加载预设图片到百宝箱
  const loadPresetImages = useCallback(async () => {
    if (hasLoadedPresetImages.current) return;

    setIsLoadingPresetImages(true);
    try {
      const loadedImages = await Promise.all(
        presetImages.map(async (preset) => {
          try {
            // 获取图片数据
            const response = await fetch(preset.src);
            const blob = await response.blob();

            // 创建File对象
            const file = new File([blob], preset.name, { type: blob.type });

            // 生成缩略图
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            return new Promise<{
              id: string;
              url: string;
              thumbnailUrl?: string;
              file: File;
              timestamp: number;
            }>((resolve) => {
              img.onload = () => {
                // 计算缩略图尺寸
                const maxSize = 200;
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
                ctx?.drawImage(img, 0, 0, newWidth, newHeight);

                // 生成缩略图URL
                canvas.toBlob((thumbnailBlob) => {
                  const thumbnailUrl = thumbnailBlob
                    ? URL.createObjectURL(thumbnailBlob)
                    : undefined;

                  resolve({
                    id: `preset-${Date.now()}-${Math.random()}`,
                    url: preset.src,
                    thumbnailUrl,
                    file,
                    timestamp: Date.now(),
                  });
                }, "image/png");
              };

              img.onerror = () => {
                // 如果缩略图生成失败，仍然添加原图
                resolve({
                  id: `preset-${Date.now()}-${Math.random()}`,
                  url: preset.src,
                  file,
                  timestamp: Date.now(),
                });
              };

              img.src = preset.src;
            });
          } catch {
            return null;
          }
        })
      );

      // 过滤掉加载失败的图片
      const validImages = loadedImages.filter(Boolean) as Array<{
        id: string;
        url: string;
        thumbnailUrl?: string;
        file: File;
        timestamp: number;
      }>;

      if (validImages.length > 0) {
        setTreasureBoxImages(validImages);
        hasLoadedPresetImages.current = true;
      }
    } catch (error) {
      console.error("加载预设图片失败:", error);
    } finally {
      setIsLoadingPresetImages(false);
    }
  }, [presetImages]);

  // 监听百宝箱打开状态，首次打开时加载预设图片
  useEffect(() => {
    if (showTreasureBox && treasureBoxImages.length === 0 && !hasLoadedPresetImages.current) {
      loadPresetImages();
    }
  }, [showTreasureBox, treasureBoxImages.length, loadPresetImages]);

  const handleImageUpload = useCallback(async (files: File[]) => {
    const file = files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("error", "文件错误", "图片大小不能超过10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        showToast("error", "文件错误", "请选择有效的图片文件");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const imageUrl = e.target.result as string;

          try {
            // 生成缩略图
            const thumbnailUrl = await generateThumbnail(imageUrl);

            // 添加上传的图片到历史记录
            const newHistoryItem = {
              id: Date.now().toString(),
              url: imageUrl,
              thumbnailUrl: thumbnailUrl,
              prompt: "上传的图片",
              timestamp: Date.now(),
              file: file,
            };
            setHistoryImages((prev) => [...prev.slice(-19), newHistoryItem]);
            setCurrentImageId(newHistoryItem.id);
          } catch (error) {
            console.error("生成缩略图失败:", error);
            // 如果缩略图生成失败，仍然添加原图
            const newHistoryItem = {
              id: Date.now().toString(),
              url: imageUrl,
              prompt: "上传的图片",
              timestamp: Date.now(),
              file: file,
            };
            setHistoryImages((prev) => [...prev.slice(-19), newHistoryItem]);
            setCurrentImageId(newHistoryItem.id);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }, [generateThumbnail]);

  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 60;
    let attempts = 0;
    let pollingCancelled = false;

    // 捕获生成时的源图片ID（如果存在）
    const sourceImageIdAtGeneration = currentImageId;

    const poll = async () => {
      if (pollingCancelled || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          setIsGenerating(false);
          showToast("error", "生成超时", "请检查网络连接后重试");
        }
        return;
      }

      const taskData = await api.getTaskStatus(taskId);

      if (pollingCancelled) return;

      if (!taskData) {
        attempts++;
        if (attempts < maxAttempts) {
          showToast("info", "查询中...", `尝试 ${attempts}/${maxAttempts}`);
          setTimeout(() => {
            if (!pollingCancelled) {
              poll();
            }
          }, 3000);
        } else {
          setIsGenerating(false);
          showToast("error", "查询失败", "无法获取任务状态，请检查后端服务");
        }
        return;
      }

      // const progressValue = Math.min((attempts / maxAttempts) * 90 + 10, 90);
      // setProgress(progressValue);

      if (taskData.status === "completed") {
        // setProgress(100);
        setIsGenerating(false);
        showToast("success", "图片生成成功！", "您可以预览和下载生成的图片");

        // 生成成功后重置所有状态
        if (showPathDrawing) {
          setShowPathDrawing(false);
        }

        // 清除canvas上的路径和拖拽的图片
        clearCanvasContent();

        // 添加到历史记录
        if (taskData.result?.image_url) {
          // 先获取blob URL，然后统一使用blob URL保存到历史记录
          getBlobUrl(taskData.result.image_url).then(async (blobUrl) => {
            try {
              // 生成缩略图
              const thumbnailUrl = await generateThumbnail(blobUrl);

              // 获取选择的提示词信息
              const selectedInfo = window.selectedPromptInfo;

              const newHistoryItem = {
                id: Date.now().toString(),
                url: blobUrl, // 统一保存blob URL用于显示
                thumbnailUrl: thumbnailUrl, // 添加缩略图URL
                originalUrl: taskData.result!.image_url, // 保存原始URL用于获取文件
                prompt: selectedInfo?.optimizedPrompt || originalUserInput || prompt,
                timestamp: Date.now(),
                sourceImageId: sourceImageIdAtGeneration || undefined, // 记录源图片ID
                originalUserInput: selectedInfo?.originalUserInput || originalUserInput,
                optimizedPrompt: selectedInfo?.optimizedPrompt,
                chinesePrompt: selectedInfo?.chinesePrompt, // 保存中文提示词
                optimizationReason: selectedInfo?.optimizationReason,
              };

              // 清除临时保存的信息
              delete window.selectedPromptInfo;
              setHistoryImages((prev) => [...prev.slice(-19), newHistoryItem]); // 保留最近20张图片，新的在后
              selectHistoryImage(newHistoryItem);
              setCurrentImageId(newHistoryItem.id);
            } catch (error) {
              console.error("生成缩略图失败:", error);
              // 如果缩略图生成失败，仍然添加原图
              const selectedInfo = window.selectedPromptInfo;

              const newHistoryItem = {
                id: Date.now().toString(),
                url: blobUrl, // 统一保存blob URL用于显示
                originalUrl: taskData.result!.image_url, // 保存原始URL用于获取文件
                prompt: selectedInfo?.optimizedPrompt || originalUserInput || prompt,
                timestamp: Date.now(),
                sourceImageId: sourceImageIdAtGeneration || undefined, // 记录源图片ID
                originalUserInput: selectedInfo?.originalUserInput || originalUserInput,
                optimizedPrompt: selectedInfo?.optimizedPrompt,
                chinesePrompt: selectedInfo?.chinesePrompt, // 保存中文提示词
                optimizationReason: selectedInfo?.optimizationReason,
              };

              // 清除临时保存的信息
              delete window.selectedPromptInfo;
              setHistoryImages((prev) => [...prev.slice(-19), newHistoryItem]); // 保留最近20张图片，新的在后
              selectHistoryImage(newHistoryItem);
              setCurrentImageId(newHistoryItem.id);
            }
          });
        }
      } else if (taskData.status === "failed") {
        setIsGenerating(false);
        showToast("error", "生成失败", taskData.error || "未知错误");
      } else {
        attempts++;
        setTimeout(() => {
          if (!pollingCancelled) {
            poll();
          }
        }, 2000);
      }
    };

    poll();

    return () => {
      pollingCancelled = true;
    };
  };

  // 路径绘制相关函数
  const handlePathComplete = () => {
    // 路径数据现在由PathDrawingCanvas内部管理
  };

  const togglePathDrawing = () => {
    setShowPathDrawing(!showPathDrawing);
  };

  // 百宝箱相关函数
  const toggleTreasureBox = () => {
    const newShowTreasureBox = !showTreasureBox;
    setShowTreasureBox(newShowTreasureBox);
  };

  const handleTreasureBoxImageUpload = useCallback(
    (file: File, thumbnailUrl?: string) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageUrl = e.target.result as string;
          const newImage = {
            id: Date.now().toString(),
            url: imageUrl,
            thumbnailUrl: thumbnailUrl, // 保存缩略图URL
            file: file,
            timestamp: Date.now(),
          };
          setTreasureBoxImages((prev) => [newImage, ...prev]);
          showToast("success", "图片上传成功", "已添加到百宝箱");
        }
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleTreasureBoxImageRemove = useCallback((id: string) => {
    setTreasureBoxImages((prev) => prev.filter((img) => img.id !== id));
    showToast("info", "图片已删除", "已从百宝箱中移除");
  }, []);

  // 处理图片拖拽完成，自动关闭百宝箱
  const handleImageDropped = useCallback(() => {
    // 使用函数式更新来避免闭包陈旧值问题
    setShowTreasureBox((currentShowTreasureBox) => {

      if (currentShowTreasureBox) {
        return false; // 关闭百宝箱
      }
      return currentShowTreasureBox; // 保持当前状态
    });
  }, []); // 移除依赖项，使用函数式更新

  // 拖拽状态管理
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedImage, setDraggedImage] = useState<DraggedImageData | null>(null);
  const dragStartTimeRef = useRef<number>(0);
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragPointerListenerRef = useRef<((e: PointerEvent) => void) | null>(null);

  // dnd-kit拖拽开始事件处理
  const handleDragStart = useCallback((event: DragStartEvent) => {
    dragStartTimeRef.current = performanceMonitor.startDragMonitoring();

    // 阻止事件冒泡，防止触发父容器的滚动
    if (event.activatorEvent) {
      event.activatorEvent.preventDefault?.();
      event.activatorEvent.stopPropagation?.();

      // 记录初始位置
      const activatorEvent = event.activatorEvent as PointerEventWithTouches;
      if (activatorEvent.touches && activatorEvent.touches.length > 0) {
        mousePositionRef.current = {
          x: activatorEvent.touches[0].clientX,
          y: activatorEvent.touches[0].clientY
        };
      } else if (activatorEvent.clientX !== undefined && activatorEvent.clientY !== undefined) {
        mousePositionRef.current = {
          x: activatorEvent.clientX,
          y: activatorEvent.clientY
        };
      }

      // 保存初始位置到全局变量
      window.lastPointerEvent = activatorEvent;
    }

    // 添加临时的指针事件监听器，用于在拖拽过程中跟踪位置
    const handleDragPointerMove = (e: PointerEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      window.lastPointerEvent = e;
    };

    dragPointerListenerRef.current = handleDragPointerMove;
    document.addEventListener('pointermove', handleDragPointerMove, { passive: true });

    // 临时禁用页面滚动
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // 设置拖拽状态
    setActiveId(event.active.id as string);

    // 保存被拖拽的图片数据
    if (event.active.data.current?.type === 'treasure-image') {
      setDraggedImage(event.active.data.current.image);
    }
  }, []);

  // 拖拽取消事件处理
  const handleDragCancel = useCallback(() => {
    // 移除临时的指针事件监听器
    if (dragPointerListenerRef.current) {
      document.removeEventListener('pointermove', dragPointerListenerRef.current);
      dragPointerListenerRef.current = null;
    }

    // 恢复页面滚动
    document.body.style.overflow = '';
    document.body.style.touchAction = '';

    // 清理拖拽状态
    setActiveId('');
    setDraggedImage(null);
  }, []);

  // dnd-kit拖拽移动事件处理 - 现在主要依赖pointermove监听器
  const handleDragMove = useCallback(() => {
    // 实际位置跟踪由pointermove监听器处理
  }, []);

  // dnd-kit拖拽事件处理
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    let success = false;

    // 移除临时的指针事件监听器
    if (dragPointerListenerRef.current) {
      document.removeEventListener('pointermove', dragPointerListenerRef.current);
      dragPointerListenerRef.current = null;
    }

    // 恢复页面滚动
    document.body.style.overflow = '';
    document.body.style.touchAction = '';

    try {
      if (over && over.id === 'canvas-drop-zone') {
        // 检查拖拽的数据类型
        if (active.data.current?.type === 'treasure-image') {
          const imageData = active.data.current.image;

          // 获取PathDrawingCanvas的handleDndKitDrop函数
          const pathCanvas = (window as { pathDrawingCanvas?: { handleDndKitDrop?: (imageData: DraggedImageData, position: { x: number; y: number }) => void } }).pathDrawingCanvas;
          if (pathCanvas && pathCanvas.handleDndKitDrop) {
            // 计算精确的拖拽位置
            let dropPosition = { x: 400, y: 300 }; // 默认位置

            // 获取实际的拖拽释放位置
            try {
              const canvasElement = document.querySelector('canvas');
              if (canvasElement) {
                const rect = canvasElement.getBoundingClientRect();
                const isMobile = /Mobi|Android/i.test(navigator.userAgent);

                // 使用多种方法获取最准确的drop位置
                let clientX = mousePositionRef.current.x;
                let clientY = mousePositionRef.current.y;

                // 移动端优化：使用更可靠的位置检测
                if (isMobile) {
                  // 方法1: 尝试从最新的全局事件获取位置
                  const lastEvent = window.lastPointerEvent;
                  if (lastEvent) {
                    if ('touches' in lastEvent && lastEvent.touches && lastEvent.touches.length > 0) {
                      clientX = lastEvent.touches[0].clientX;
                      clientY = lastEvent.touches[0].clientY;
                    } else if ('changedTouches' in lastEvent && lastEvent.changedTouches && lastEvent.changedTouches.length > 0) {
                      // touchend事件使用changedTouches
                      clientX = lastEvent.changedTouches[0].clientX;
                      clientY = lastEvent.changedTouches[0].clientY;
                    } else if ('clientX' in lastEvent && 'clientY' in lastEvent && lastEvent.clientX !== undefined && lastEvent.clientY !== undefined) {
                      clientX = lastEvent.clientX;
                      clientY = lastEvent.clientY;
                    }
                  }

                  // 如果位置无效，使用canvas中心
                  if (clientX === 0 && clientY === 0) {
                    clientX = rect.left + rect.width / 2;
                    clientY = rect.top + rect.height / 2;
                  }
                } else {
                  // 桌面端：优先使用最新的鼠标位置
                  // 方法1: 使用实时更新的鼠标位置
                  if (mousePositionRef.current.x !== 0 || mousePositionRef.current.y !== 0) {
                    clientX = mousePositionRef.current.x;
                    clientY = mousePositionRef.current.y;
                  }
                  // 方法2: 尝试从最新的全局事件获取位置
                  else if (window.lastPointerEvent && 'clientX' in window.lastPointerEvent && 'clientY' in window.lastPointerEvent) {
                    const lastEvent = window.lastPointerEvent;
                    if (lastEvent.clientX !== undefined && lastEvent.clientY !== undefined) {
                      clientX = lastEvent.clientX;
                      clientY = lastEvent.clientY;
                    }
                  }
                  // 方法3: 备选方案，使用activatorEvent（拖拽开始位置）
                  else if (event.activatorEvent) {
                    const activatorEvent = event.activatorEvent as PointerEventWithTouches;
                    if (activatorEvent.clientX !== undefined && activatorEvent.clientY !== undefined) {
                      clientX = activatorEvent.clientX;
                      clientY = activatorEvent.clientY;
                    }
                  }
                }

                // 检查位置是否在canvas范围内
                const isInCanvas = clientX >= rect.left && clientX <= rect.right &&
                  clientY >= rect.top && clientY <= rect.bottom;

                if (isInCanvas) {
                  // 直接传递屏幕坐标，让PathDrawingCanvas处理坐标转换
                  // 这样可以正确处理viewport变换（缩放、平移等）
                  dropPosition = {
                    x: clientX,
                    y: clientY
                  };


                }
              }
            } catch {
              // Failed to calculate drop position, using default
            }

            pathCanvas.handleDndKitDrop(imageData, dropPosition);
            success = true;
          }

          // 调用原有的拖拽完成处理
          handleImageDropped();
        }
      }
    } catch (error) {
      console.error("拖拽处理错误:", error);
      DragDropErrorHandler.handleError(error as Error, "handleDragEnd");
    } finally {
      // 清除拖拽状态
      setActiveId(null);
      setDraggedImage(null);

      // 记录性能数据
      performanceMonitor.endDragMonitoring(dragStartTimeRef.current, success);
    }
  }, [handleImageDropped]);

  const getCompositeImageForGeneration = async (): Promise<File | null> => {
    // 现在统一从canvas获取图片，不再做复杂判断
    const canvas = (
      window as {
        pathDrawingCanvas?: {
          clearPath: () => void;
          exportCompositeImage: () => string | null;
          hasPath: () => boolean;
          clearDroppedImages: () => void;
          hasDroppedImages: () => boolean;
        };
      }
    ).pathDrawingCanvas;

    if (canvas) {
      const compositeDataUrl = canvas.exportCompositeImage();
      if (compositeDataUrl) {
        // 将 data URL 转换为 File 对象
        const response = await fetch(compositeDataUrl);
        const blob = await response.blob();
        return new File([blob], "composite-image.png", { type: "image/png" });
      }
    }

    return null;
  };

  const handleGenerate = async () => {
    // 检查是否有提示词或图片输入
    if (!prompt.trim() && !currentImageId) {
      showToast("error", "输入错误", "请输入提示词或上传图片");
      return;
    }

    // 统一从canvas获取图片
    let imageToUse: File | null = null;
    if (currentImageId) {
      imageToUse = await getCompositeImageForGeneration();
      if (!imageToUse) {
        showToast("error", "图像处理失败", "无法从canvas获取图像");
        return;
      }
    }

    // 先调用Gemini生成提示词
    setIsGeneratingPrompts(true);
    setOriginalUserInput(prompt);
    showToast("info", "AI正在优化提示词", "正在为您生成更好的提示词选项...");

    const promptResponse = await api.generatePrompts(
      prompt,
      imageToUse || undefined
    );
    setIsGeneratingPrompts(false);

    if (promptResponse.error) {
      showToast("error", "AI提示词生成失败", promptResponse.error);
      // 不再自动回退，让用户知道AI服务出现了问题
      return;
    }

    // 显示提示词选择对话框
    setGeneratedPrompts(promptResponse.prompts || []);
    setShowPromptDialog(true);
  };

  const generateImageWithPrompt = async (selectedPrompt: string) => {
    setIsGenerating(true);

    // 统一从canvas获取图片
    let imageToUse: File | null = null;
    if (currentImageId) {
      imageToUse = await getCompositeImageForGeneration();
      if (!imageToUse) {
        showToast("error", "图像处理失败", "无法从canvas获取图像");
        setIsGenerating(false);
        return;
      }
    }

    const request: ImageGenerationRequest = {
      prompt: selectedPrompt,
      aspect_ratio: aspectRatio === "auto" ? undefined : aspectRatio,
      output_format: outputFormat,
      safety_tolerance: safetyTolerance,
      seed: useRandomSeed ? undefined : seed,
      input_image: imageToUse || undefined,
      prompt_upsampling: promptUpsampling,
    };

    showToast("info", "开始生成", "正在提交生成请求...");
    const response = await api.generateImage(request);

    if (response.error) {
      setIsGenerating(false);
      // setProgress(0);
      showToast("error", "生成失败", response.error);
      return;
    }

    if (response.task_id) {
      showToast("info", "请求已提交", "正在生成图片，请稍候...");
      pollTaskStatus(response.task_id);
    }
  };

  const handlePromptSelect = (selectedPrompt: string) => {
    // 找到选择的提示词的详细信息
    const selectedPromptInfo = generatedPrompts.find(p =>
      p.chinese === selectedPrompt || p.english === selectedPrompt
    );

    // 保存选择的提示词信息，用于后续保存到历史记录
    if (selectedPromptInfo) {
      // 将选择的提示词信息临时保存，在图片生成成功后使用
      window.selectedPromptInfo = {
        originalUserInput,
        optimizedPrompt: selectedPrompt,
        chinesePrompt: selectedPromptInfo.chinese, // 保存中文提示词
        optimizationReason: selectedPromptInfo.reason
      };
    }

    generateImageWithPrompt(selectedPrompt);
  };

  const downloadImage = () => {
    const imageUrl = getCurrentImage();
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `generated-image-${Date.now()}.${outputFormat}`;
      link.click();
    }
  };

  // 清除canvas上的路径和拖拽的图片
  const clearCanvasContent = () => {
    const canvas = (
      window as {
        pathDrawingCanvas?: {
          clearPath: () => void;
          clearDroppedImages: () => void;
          hasPath: () => boolean;
          hasDroppedImages: () => boolean;
          exportCompositeImage: () => string | null;
        };
      }
    ).pathDrawingCanvas;

    if (canvas) {
      canvas.clearPath();
      canvas.clearDroppedImages();
    }
  };

  const clearImage = () => {
    setIsGenerating(false);
    setIsCompareMode(false);
    setCurrentImageId(null);
    // 清除canvas内容
    clearCanvasContent();
  };

  // 获取代理图片URL
  const getProxyImageUrl = (originalUrl: string) => {
    if (originalUrl.includes("bfl.ai")) {
      return `${API_BASE_URL}/api/image-generation/proxy-image?url=${encodeURIComponent(
        originalUrl
      )}`;
    }
    return originalUrl;
  };

  // 获取blob URL用于显示
  const getBlobUrl = async (originalUrl: string): Promise<string> => {
    // 检查缓存
    if (blobUrls.has(originalUrl)) {
      return blobUrls.get(originalUrl)!;
    }

    // 如果不是需要代理的URL，直接返回
    if (!originalUrl.includes("bfl.ai")) {
      return originalUrl;
    }

    try {
      const proxyUrl = `${API_BASE_URL}/api/image-generation/proxy-image?url=${encodeURIComponent(
        originalUrl
      )}`;

      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          Accept: "image/*",
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Empty blob received");
      }

      const blobUrl = URL.createObjectURL(blob);

      // 缓存blob URL
      setBlobUrls((prev) => new Map(prev).set(originalUrl, blobUrl));
      return blobUrl;
    } catch (error) {
      console.error("获取blob URL失败:", error);
      // 如果代理失败，尝试直接访问原始URL（可能会有CORS问题）
      return originalUrl;
    }
  };

  // 选择历史图片
  const selectHistoryImage = async (historyItem: (typeof historyImages)[0]) => {
    try {
      // 设置基本状态
      setCurrentImageId(historyItem.id);
      // setPrompt(historyItem.prompt);

      let file: File | undefined;
      let previewUrl: string;

      if (historyItem.file) {
        // 如果是上传的图片，直接使用原始文件
        file = historyItem.file;
        previewUrl = historyItem.url; // 对于上传的图片，url就是blob URL
      } else {
        // 现在历史记录中的URL都是blob URL，直接使用
        previewUrl = historyItem.url;

        // 尝试获取文件用于生成
        try {
          // 使用原始URL获取文件，如果没有originalUrl则使用url
          const urlForFetch =
            (historyItem as { originalUrl?: string; url: string })
              .originalUrl || historyItem.url;
          const proxyUrl = getProxyImageUrl(urlForFetch);
          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          file = new File([blob], `history-${historyItem.id}.jpg`, {
            type: "image/jpeg",
          });
        } catch {
          // 获取文件失败，创建虚拟文件
          // 如果无法获取文件，创建一个虚拟文件
          file = new File([], `history-${historyItem.id}.jpg`, {
            type: "image/jpeg",
          });
        }
      }

      // 使用变量以避免未使用警告
      void file?.name;
      void previewUrl;
    } catch (error) {
      showToast(
        "error",
        "加载历史图片失败",
        error instanceof Error ? error.message : "请重试"
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
        {/* 主要内容区域 - 图片展示 */}
        <div className="flex items-center justify-center h-full">
          <div className="w-full h-full flex items-center justify-center">
            {/* 文件上传区域 */}
            {!currentImageId && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full max-w-2xl px-8">
                  <FileUpload onChange={handleImageUpload} />
                </div>
              </div>
            )}

            {/* 图片对比区域 - 比较模式 */}
            {isCompareMode && (
              <div className="relative w-full h-[calc(100vh-332px)] flex items-center justify-center self-start pt-[16px]">
                <Compare
                  firstImage={getSourceImage()!}
                  secondImage={getCurrentImage()!}
                  firstImageClassName="object-contain"
                  secondImageClassname="object-contain"
                  className="rounded-lg w-full h-full"
                  slideMode="hover"
                  autoplay={true}
                  autoplayDuration={3000}
                />
              </div>
            )}

            {/* PathDrawingCanvas - 处理所有图片展示 */}
            {!isCompareMode && (
              <PathDrawingCanvas
                backgroundImage={getCurrentImage() || undefined}
                onPathComplete={handlePathComplete}
                onImageDropped={handleImageDropped}
                onCanvasClick={() => {
                  setIsSettingsPopoverOpen(false);
                  setShowTreasureBox(false);
                  setOpenTooltipId(null); // 关闭所有历史图片tooltip
                }}
                showPathDrawing={showPathDrawing}
                className="absolute inset-0"
                gridConfig={{
                  enabled: showGrid,
                  size: 25,
                  color: "#e5e5e5",
                  opacity: 0.5,
                  lineWidth: 1,
                }}
              />
            )}
          </div>
        </div>

        {/* 底部输入区域 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="max-w-4xl mx-auto mb-4">
            {/* 历史图片展示 */}
            {historyImages.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: false,
                    }}
                    className="w-full max-w-full"
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {historyImages.map((item) => (
                        <CarouselItem
                          key={item.id}
                          className="pl-2 md:pl-4 basis-auto"
                        >
                          <HistoryImageAnimatedTooltip
                            imageData={item}
                            isOpen={openTooltipId === item.id}
                            onOpenChange={(open) => {
                              setOpenTooltipId(open ? item.id : null);
                            }}
                          >
                            <div
                              className={`relative w-16 h-16 rounded-lg cursor-pointer border-2 transition-all overflow-hidden ${currentImageId === item.id
                                ? "border-purple-500 ring-2 ring-purple-200"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                              style={{
                                touchAction: 'none',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                WebkitTouchCallout: 'none',
                                WebkitTapHighlightColor: 'transparent'
                              }}
                              onClick={() => selectHistoryImage(item)}
                            >
                              <img
                                src={item.thumbnailUrl || item.url} // 优先使用缩略图，如果不存在则使用原图
                                alt={`历史图片 ${item.id}`}
                                className="w-full h-full object-cover hover:scale-105"
                              />
                              {currentImageId === item.id && (
                                <div className="absolute inset-0 bg-purple-500/10 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full shadow-lg"></div>
                                </div>
                              )}
                            </div>
                          </HistoryImageAnimatedTooltip>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-4 h-8 w-8 bg-white/80 backdrop-blur-sm border shadow-md hover:bg-white/90" />
                    <CarouselNext className="-right-4 h-8 w-8 bg-white/80 backdrop-blur-sm border shadow-md hover:bg-white/90" />
                  </Carousel>
                </div>
              </div>
            )}

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="用英文描述您想要生成的图片..."
              className="min-h-[80px] resize-none bg-white/50 backdrop-blur-md border-input placeholder:text-gray-400 focus-visible:border-color-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl"
              disabled={isGenerating}
            />
          </div>

          {/* Floating Dock控制区域 */}
          <div className="flex justify-center md:justify-center max-md:justify-end">
            <FloatingDock
              items={[
                // 清空图片按钮
                ...(currentImageId
                  ? [
                    {
                      title: "清空图片",
                      icon: <X className="text-red-600 h-full w-full" />,
                      onClick: clearImage,
                    },
                  ]
                  : []),
                // 上传图片按钮
                {
                  title: "上传图片",
                  icon: <Upload className="text-blue-600 h-full w-full" />,
                  onClick: () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleImageUpload([file]);
                      }
                    };
                    input.click();
                  },
                },
                // 路径绘制按钮
                ...(currentImageId
                  ? [
                    {
                      title: showPathDrawing ? "退出绘制" : "绘制路径",
                      icon: (
                        <Pen
                          className={`h-full w-full ${showPathDrawing ? "text-red-600" : "text-green-600"
                            }`}
                        />
                      ),
                      onClick: togglePathDrawing,
                    },
                  ]
                  : []),
                // 百宝箱按钮
                ...(currentImageId
                  ? [
                    {
                      title: showTreasureBox ? "关闭百宝箱" : "打开百宝箱",
                      icon: (
                        <Package
                          className={`h-full w-full ${showTreasureBox ? "text-orange-600" : "text-purple-600"
                            }`}
                        />
                      ),
                      onClick: toggleTreasureBox,
                    },
                  ]
                  : []),
                // 参数设置按钮
                {
                  title: "参数设置",
                  icon: <Settings className="h-full w-full" />,
                  element: (
                    <Popover open={isSettingsPopoverOpen} onOpenChange={setIsSettingsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-full w-full hover:bg-gray-200 cursor-pointer"
                          disabled={isGenerating}
                          title="参数设置"
                        >
                          <Settings className="h-full w-full" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="center" side="top" onInteractOutside={(e) => {
                        // 阻止因焦点丢失而关闭popover
                        e.preventDefault();
                      }}>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="aspect-ratio">纵横比</Label>
                            <Select
                              value={aspectRatio}
                              onValueChange={setAspectRatio}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">自动</SelectItem>
                                <SelectItem value="1:1">1:1 (正方形)</SelectItem>
                                <SelectItem value="16:9">16:9 (宽屏)</SelectItem>
                                <SelectItem value="9:16">9:16 (竖屏)</SelectItem>
                                <SelectItem value="3:2">3:2 (横向)</SelectItem>
                                <SelectItem value="2:3">2:3 (纵向)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="output-format">输出格式</Label>
                            <Select
                              value={outputFormat}
                              onValueChange={setOutputFormat}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="jpeg">JPEG</SelectItem>
                                <SelectItem value="png">PNG</SelectItem>
                                <SelectItem value="webp">WebP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="prompt-upsampling">提示词增强</Label>
                            <Switch
                              id="prompt-upsampling"
                              checked={promptUpsampling}
                              onCheckedChange={setPromptUpsampling}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="safety-tolerance">安全等级</Label>
                            <Select
                              value={safetyTolerance.toString()}
                              onValueChange={(value) =>
                                setSafetyTolerance(parseInt(value))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 (最严格)</SelectItem>
                                <SelectItem value="2">2 (严格)</SelectItem>
                                <SelectItem value="3">3 (中等)</SelectItem>
                                <SelectItem value="4">4 (宽松)</SelectItem>
                                <SelectItem value="5">5 (最宽松)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="use-random-seed">随机种子</Label>
                              <Switch
                                id="use-random-seed"
                                checked={useRandomSeed}
                                onCheckedChange={setUseRandomSeed}
                              />
                            </div>
                            {!useRandomSeed && (
                              <div className="space-y-2">
                                <Label htmlFor="seed">种子值</Label>
                                <Input
                                  id="seed"
                                  type="text"
                                  value={seed}
                                  onChange={(e) => setSeed(e.target.value)}
                                  placeholder="输入种子值（可选）"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ),
                },
                // 比较按钮 - 只有当前图片有源图片时才显示
                ...(getSourceImage() && getCurrentImage()
                  ? [
                    {
                      id: "compare",
                      title: isCompareMode ? "退出比较模式" : "比较图片",
                      icon: (
                        <ArrowLeftRight
                          className={`h-full w-full ${isCompareMode ? "text-white" : "text-orange-600"
                            }`}
                        />
                      ),
                      element: (
                        <Button
                          onClick={() => setIsCompareMode(!isCompareMode)}
                          variant={isCompareMode ? "default" : "outline"}
                          className={`h-full w-full cursor-pointer ${isCompareMode
                            ? "bg-orange-500 hover:bg-orange-600 text-white border-0"
                            : "hover:bg-orange-50 hover:border-orange-300"
                            }`}
                          title={isCompareMode ? "退出比较模式" : "比较图片"}
                        >
                          <ArrowLeftRight
                            className={`h-full w-full ${isCompareMode ? "text-white" : "text-orange-600"
                              }`}
                          />
                        </Button>
                      ),
                    },
                  ]
                  : []),
                // 下载按钮
                ...(getCurrentImage()
                  ? [
                    {
                      title: "下载图片",
                      icon: (
                        <Download className="h-full w-full text-green-600 cursor-pointer" />
                      ),
                      onClick: downloadImage,
                    },
                  ]
                  : []),
                // 生成按钮
                {
                  title: "生成图片",
                  icon:
                    isGenerating || isGeneratingPrompts ? (
                      <RefreshCw className="h-full w-full animate-spin" />
                    ) : (
                      <Wand2 className="h-full w-full" />
                    ),
                  element: (
                    <Button
                      onClick={handleGenerate}
                      disabled={
                        isGenerating ||
                        isGeneratingPrompts ||
                        (!prompt.trim() && !currentImageId)
                      }
                      className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 cursor-pointer"
                      title="生成图片"
                    >
                      {isGenerating || isGeneratingPrompts ? (
                        <RefreshCw className="h-full w-full animate-spin" />
                      ) : (
                        <Wand2 className="h-full w-full" />
                      )}
                    </Button>
                  ),
                },
              ].filter((item) => {
                if (isCompareMode) {
                  return item.id === "compare";
                }
                return true;
              })}
              desktopClassName="mx-auto !bg-transparent border-0 shadow-none"
              mobileClassName="!bg-transparent border-0 shadow-none"
            />
          </div>
        </div>

        {/* 提示词选择对话框 */}
        <PromptSelectionDialog
          open={showPromptDialog}
          onOpenChange={setShowPromptDialog}
          prompts={generatedPrompts}
          onSelect={handlePromptSelect}
          originalInput={originalUserInput}
        />

        {/* 百宝箱 */}
        <TreasureBox
          isOpen={showTreasureBox}
          onClose={() => {
            setShowTreasureBox(false);
          }}
          images={treasureBoxImages}
          onImageUpload={handleTreasureBoxImageUpload}
          onImageRemove={handleTreasureBoxImageRemove}
          isLoadingPresetImages={isLoadingPresetImages}
        />

        {/* 拖拽预览层 */}
        {activeId && draggedImage ? (
          <DragOverlay>
            <div className="w-16 h-16 opacity-90 transform rotate-3 shadow-lg">
              <img
                src={draggedImage.thumbnailUrl || draggedImage.url}
                alt="拖拽预览"
                className="w-full h-full object-cover rounded-lg border-2 border-purple-500"
              />
            </div>
          </DragOverlay>
        ) : null}
      </div>
    </DndContext>
  );
}

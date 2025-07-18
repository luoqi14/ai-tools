"use client";

import { useState, useCallback } from "react";
import { api, ImageGenerationRequest, API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
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
import { PromptSelectionDialog } from "@/components/ui/prompt-selection-dialog";

// 导入路径绘制组件
import PathDrawingCanvas from "./PathDrawingCanvas";

// 导入百宝箱组件
import TreasureBox from "./TreasureBox";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // 参数状态
  const [aspectRatio, setAspectRatio] = useState("auto");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [promptUpsampling, setPromptUpsampling] = useState(false);
  const [safetyTolerance, setSafetyTolerance] = useState(5);
  const [seed, setSeed] = useState("");
  const [useRandomSeed, setUseRandomSeed] = useState(true);

  // 比较模式状态
  const [isCompareMode, setIsCompareMode] = useState(false);

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
    }>
  >([]);

  // blob URL缓存
  const [blobUrls, setBlobUrls] = useState<Map<string, string>>(new Map());
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);

  // 路径绘制状态
  const [showPathDrawing, setShowPathDrawing] = useState(false);

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

  // 计算当前图片
  const getCurrentImage = (): string | null => {
    if (!currentImageId || !historyImages.length) return null;

    const currentIndex = historyImages.findIndex(
      (img) => img.id === currentImageId
    );
    if (currentIndex <= -1) return null;

    return historyImages[currentIndex].url;
  };

  // 计算前一张图片
  const getPreviousImage = (): string | null => {
    if (!currentImageId || !historyImages.length) return null;

    const currentIndex = historyImages.findIndex(
      (img) => img.id === currentImageId
    );
    if (currentIndex <= 0) return null;

    // 返回前一张图片的URL
    return historyImages[currentIndex - 1].url;
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

  const handleImageUpload = useCallback((files: File[]) => {
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
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageUrl = e.target.result as string;

          // 添加上传的图片到历史记录
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
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 60;
    let attempts = 0;
    let pollingCancelled = false;

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
          console.log(
            "Auto-exiting path drawing mode after successful generation"
          );
        }

        // 清除canvas上的路径和拖拽的图片
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
          console.log(
            "Cleared canvas paths and dropped images after generation"
          );
        }

        // 添加到历史记录
        if (taskData.result?.image_url) {
          // 先获取blob URL，然后统一使用blob URL保存到历史记录
          getBlobUrl(taskData.result.image_url).then((blobUrl) => {
            const newHistoryItem = {
              id: Date.now().toString(),
              url: blobUrl, // 统一保存blob URL用于显示
              originalUrl: taskData.result!.image_url, // 保存原始URL用于获取文件
              prompt: originalUserInput || prompt,
              timestamp: Date.now(),
            };
            setHistoryImages((prev) => [...prev.slice(-19), newHistoryItem]); // 保留最近20张图片，新的在后
            selectHistoryImage(newHistoryItem);
            setCurrentImageId(newHistoryItem.id);
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
  const handlePathComplete = (pathData: string) => {
    // setPathData(pathData); // 路径数据现在由PathDrawingCanvas内部管理
    console.log("Path completed:", pathData);
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
          setTreasureBoxImages((prev) => [...prev, newImage]);
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

  // 拖拽处理现在由PathDrawingCanvas内部管理

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

  const clearImage = () => {
    setIsGenerating(false);
    setIsCompareMode(false);
    setCurrentImageId(null);
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
      console.log("选择历史图片:", historyItem);

      // 设置基本状态
      setCurrentImageId(historyItem.id);
      // setPrompt(historyItem.prompt);

      let file: File;
      let previewUrl: string;

      if (historyItem.file) {
        // 如果是上传的图片，直接使用原始文件
        console.log("使用原始文件");
        file = historyItem.file;
        previewUrl = historyItem.url; // 对于上传的图片，url就是blob URL
      } else {
        // 现在历史记录中的URL都是blob URL，直接使用
        previewUrl = historyItem.url;
        console.log("使用历史记录中的blob URL:", previewUrl);

        // 尝试获取文件用于生成
        try {
          // 使用原始URL获取文件，如果没有originalUrl则使用url
          const urlForFetch =
            (historyItem as { originalUrl?: string; url: string })
              .originalUrl || historyItem.url;
          const proxyUrl = getProxyImageUrl(urlForFetch);
          console.log("从代理URL获取图片:", proxyUrl);
          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          console.log("Blob大小:", blob.size, "类型:", blob.type);
          file = new File([blob], `history-${historyItem.id}.jpg`, {
            type: "image/jpeg",
          });
        } catch (fetchError) {
          console.warn("获取文件失败，创建虚拟文件:", fetchError);
          // 如果无法获取文件，创建一个虚拟文件
          file = new File([], `history-${historyItem.id}.jpg`, {
            type: "image/jpeg",
          });
        }
      }
    } catch (error) {
      console.error("加载历史图片失败:", error);
      showToast(
        "error",
        "加载历史图片失败",
        error instanceof Error ? error.message : "请重试"
      );
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
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
                firstImage={getPreviousImage()!}
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
              showPathDrawing={showPathDrawing}
              className="absolute inset-0"
            />
          )}
        </div>
      </div>

      {/* 底部输入区域 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 backdrop-blur-md bg-white/20 border-t border-white/30">
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
                        <div
                          className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            currentImageId === item.id
                              ? "border-purple-500 ring-2 ring-purple-200"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => selectHistoryImage(item)}
                          title={`${item.prompt}`}
                        >
                          <img
                            src={item.url} // 现在历史记录中的URL都是blob URL，直接使用
                            alt={`历史图片 ${item.id}`}
                            className="w-full h-full object-cover hover:scale-105"
                          />
                          {currentImageId === item.id && (
                            <div className="absolute inset-0 bg-purple-500/10 flex items-center justify-center">
                              <div className="w-2 h-2 bg-purple-500 rounded-full shadow-lg"></div>
                            </div>
                          )}
                        </div>
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
        <div className="flex justify-center">
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
                          className={`h-full w-full ${
                            showPathDrawing ? "text-red-600" : "text-green-600"
                          }`}
                        />
                      ),
                      onClick: togglePathDrawing,
                    },
                  ]
                : []),
              // 百宝箱按钮
              {
                title: showTreasureBox ? "关闭百宝箱" : "打开百宝箱",
                icon: (
                  <Package
                    className={`h-full w-full ${
                      showTreasureBox ? "text-orange-600" : "text-purple-600"
                    }`}
                  />
                ),
                onClick: toggleTreasureBox,
              },
              // 参数设置按钮
              {
                title: "参数设置",
                icon: <Settings className="h-full w-full" />,
                element: (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-full w-full hover:bg-gray-100"
                        disabled={isGenerating}
                        title="参数设置"
                      >
                        <Settings className="h-full w-full" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="center" side="top">
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
                    className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
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
              // 比较按钮
              ...(getPreviousImage() && getCurrentImage()
                ? [
                    {
                      id: "compare",
                      title: isCompareMode ? "退出比较模式" : "比较图片",
                      icon: (
                        <ArrowLeftRight
                          className={`h-full w-full ${
                            isCompareMode ? "text-white" : "text-orange-600"
                          }`}
                        />
                      ),
                      element: (
                        <Button
                          onClick={() => setIsCompareMode(!isCompareMode)}
                          variant={isCompareMode ? "default" : "outline"}
                          className={`h-full w-full ${
                            isCompareMode
                              ? "bg-orange-500 hover:bg-orange-600 text-white border-0"
                              : "hover:bg-orange-50 hover:border-orange-300"
                          }`}
                          title={isCompareMode ? "退出比较模式" : "比较图片"}
                        >
                          <ArrowLeftRight
                            className={`h-full w-full ${
                              isCompareMode ? "text-white" : "text-orange-600"
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
                        <Download className="h-full w-full text-green-600" />
                      ),
                      element: (
                        <Button
                          onClick={downloadImage}
                          variant="outline"
                          className="h-full w-full hover:bg-green-50 hover:border-green-300"
                          title="下载图片"
                        >
                          <Download className="h-full w-full text-green-600" />
                        </Button>
                      ),
                    },
                  ]
                : []),
            ].filter((item) => {
              if (isCompareMode) {
                return item.id === "compare";
              }
              return true;
            })}
            desktopClassName=""
            mobileClassName=""
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
        onClose={() => setShowTreasureBox(false)}
        images={treasureBoxImages}
        onImageUpload={handleTreasureBoxImageUpload}
        onImageRemove={handleTreasureBoxImageRemove}
      />
    </div>
  );
}

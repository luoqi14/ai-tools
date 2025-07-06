"use client";

import { useState, useCallback } from "react";
import { api, ImageGenerationRequest, ImageGenerationTask } from "@/lib/api";
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
import { Progress } from "@/components/ui/progress";
import { Settings, Wand2, Download, RefreshCw, X, Upload } from "lucide-react";

// 导入Aceternity UI组件
import { FileUpload } from "@/components/ui/file-upload";
import { Compare } from "@/components/ui/compare";

// 导入Magic UI Dock组件
import { Dock, DockIcon } from "@/components/magicui/dock";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string>("");
  const [task, setTask] = useState<ImageGenerationTask | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // 参数状态
  const [aspectRatio, setAspectRatio] = useState("auto");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [promptUpsampling, setPromptUpsampling] = useState(false);
  const [safetyTolerance, setSafetyTolerance] = useState(2);
  const [seed, setSeed] = useState("");
  const [useRandomSeed, setUseRandomSeed] = useState(true);

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
      setInputImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setInputImagePreview(e.target.result as string);
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

      setTask(taskData);

      const progressValue = Math.min((attempts / maxAttempts) * 90 + 10, 90);
      setProgress(progressValue);

      if (taskData.status === "completed") {
        setProgress(100);
        setIsGenerating(false);
        showToast("success", "图片生成成功！", "您可以预览和下载生成的图片");
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast("error", "输入错误", "请输入提示词");
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setTask(null);

    const request: ImageGenerationRequest = {
      prompt,
      aspect_ratio: aspectRatio === "auto" ? undefined : aspectRatio,
      output_format: outputFormat,
      safety_tolerance: safetyTolerance,
      seed: useRandomSeed ? undefined : seed,
      input_image: inputImage || undefined,
      prompt_upsampling: promptUpsampling,
    };

    showToast("info", "开始生成", "正在提交生成请求...");
    const response = await api.generateImage(request);

    if (response.error) {
      setIsGenerating(false);
      setProgress(0);
      showToast("error", "生成失败", response.error);
      return;
    }

    if (response.task_id) {
      showToast("info", "请求已提交", "正在生成图片，请稍候...");
      pollTaskStatus(response.task_id);
    }
  };

  const downloadImage = () => {
    if (task?.result?.image_url) {
      const link = document.createElement("a");
      link.href = task.result.image_url;
      link.download = `generated-image-${Date.now()}.${outputFormat}`;
      link.click();
    }
  };

  const clearImage = () => {
    setInputImage(null);
    setInputImagePreview("");
    setTask(null);
    setProgress(0);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* 主要内容区域 - 图片展示 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* 文件上传区域 */}
          {!inputImagePreview && !task?.result?.image_url && (
            <div className="mb-8">
              <FileUpload onChange={handleImageUpload} />
            </div>
          )}

          {/* 图片对比区域 - 图生图模式 */}
          {inputImagePreview && task?.result?.image_url && (
            <div className="relative">
              <div className="aspect-video w-full max-w-3xl mx-auto">
                <Compare
                  firstImage={inputImagePreview}
                  secondImage={task.result.image_url}
                  firstImageClassName="object-contain"
                  secondImageClassname="object-contain"
                  className="rounded-lg border"
                  slideMode="hover"
                  autoplay={true}
                  autoplayDuration={3000}
                />
              </div>
              {/* 图片控制按钮 */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  onClick={clearImage}
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  title="清除图片"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleImageUpload([file]);
                        setTask(null); // 清除之前的生成结果
                      }
                    };
                    input.click();
                  }}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="重新上传"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 单图片展示 - 文生图模式 */}
          {!inputImagePreview && task?.result?.image_url && (
            <div className="flex justify-center">
              <img
                src={task.result.image_url}
                alt="Generated"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* 上传的图片预览 */}
          {inputImagePreview && !task?.result?.image_url && (
            <div className="relative">
              <div className="flex justify-center">
                <img
                  src={inputImagePreview}
                  alt="Input"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
              {/* 图片控制按钮 */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  onClick={clearImage}
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  title="清除图片"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
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
                  }}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="重新上传"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 进度条 */}
          {isGenerating && (
            <div className="mt-6 max-w-md mx-auto">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 mt-2 text-center">
                生成中... {progress.toFixed(0)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 底部输入区域 */}
      <div className="p-6 pb-8">
        <div className="max-w-4xl mx-auto mb-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述您想要生成的图片..."
            className="min-h-[80px] resize-none bg-white/80 backdrop-blur-sm border-gray-300"
            disabled={isGenerating}
          />
        </div>

        {/* Dock控制区域 */}
        <Dock
          iconSize={50}
          iconMagnification={70}
          iconDistance={150}
          direction="middle"
          className="bg-white/90 backdrop-blur-md border-gray-200 shadow-lg"
        >
          {/* 参数设置按钮 */}
          <DockIcon>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-full w-full hover:bg-gray-100"
                  disabled={isGenerating}
                  title="参数设置"
                >
                  <Settings className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="center" side="top">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aspect-ratio">纵横比</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
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
          </DockIcon>

          {/* 生成按钮 */}
          <DockIcon>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              title="生成图片"
            >
              {isGenerating ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <Wand2 className="h-6 w-6" />
              )}
            </Button>
          </DockIcon>

          {/* 下载按钮 */}
          {task?.result?.image_url && (
            <DockIcon>
              <Button
                onClick={downloadImage}
                variant="outline"
                className="h-full w-full hover:bg-green-50 hover:border-green-300"
                title="下载图片"
              >
                <Download className="h-6 w-6 text-green-600" />
              </Button>
            </DockIcon>
          )}
        </Dock>
      </div>
    </div>
  );
}

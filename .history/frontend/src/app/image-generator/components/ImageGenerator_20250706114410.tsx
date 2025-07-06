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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Wand2,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Zap,
  Palette,
  Settings,
} from "lucide-react";

// 导入新的UI组件
import { MagicCard } from "@/components/magicui/magic-card";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { TextGenerateEffect } from "@/components/aceternity/text-generate-effect";
import { AnimatedCircularProgressBar } from "@/components/aceternity/animated-circular-progress";
import { BackgroundGradient } from "@/components/aceternity/background-gradient";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string>("");
  const [task, setTask] = useState<ImageGenerationTask | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // 简化的参数状态
  const [aspectRatio, setAspectRatio] = useState("auto");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [promptUpsampling, setPromptUpsampling] = useState(false);

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

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
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
    },
    []
  );

  const removeImage = () => {
    setInputImage(null);
    setInputImagePreview("");
  };

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
      safety_tolerance: 2,
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

    if (!response.task_id) {
      setIsGenerating(false);
      setProgress(0);
      showToast("error", "生成失败", "未获取到任务ID");
      return;
    }

    showToast("info", "请求成功", "开始生成图片，请稍候...");
    await pollTaskStatus(response.task_id);
  };

  const downloadImage = () => {
    if (task?.result?.image_url) {
      const link = document.createElement("a");
      link.href = task.result.image_url;
      link.download = `generated-image-${Date.now()}.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetForm = () => {
    setPrompt("");
    setInputImage(null);
    setInputImagePreview("");
    setTask(null);
    setProgress(0);
    setAspectRatio("auto");
    setOutputFormat("jpeg");
    setPromptUpsampling(false);
  };

  const mode = inputImage ? "image-to-image" : "text-to-image";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 标题区域 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative">
            <TextGenerateEffect
              words="AI 图像生成工具"
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
            />
            <motion.div
              className="absolute -top-4 -right-4 text-yellow-400"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6"
          >
            <Badge
              variant="secondary"
              className="text-sm px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className="w-4 h-4 mr-2 text-blue-600" />
              </motion.div>
              当前模式: {mode === "text-to-image" ? "文生图" : "图生图"}
            </Badge>
          </motion.div>
        </motion.div>

        {/* 主要内容区域 */}
        <div className="space-y-8">
          {/* 输入区域 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <MagicCard className="p-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
              <div className="space-y-8">
                {/* 提示词输入 */}
                <div className="space-y-4">
                  <Label
                    htmlFor="prompt"
                    className="text-lg font-semibold flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Wand2 className="w-5 h-5 text-blue-600" />
                    </motion.div>
                    创作提示词
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="prompt"
                      placeholder="描述你想要生成的图像，例如：一只可爱的橙色小猫在花园里玩耍，阳光明媚，超现实主义风格"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-32 text-base resize-none border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 focus:shadow-lg"
                    />
                    <motion.div
                      className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-md"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {prompt.length} 字符
                    </motion.div>
                  </div>
                </div>

                {/* 图片上传区域 */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    参考图片 (可选)
                  </Label>

                  <AnimatePresence mode="wait">
                    {!inputImagePreview ? (
                      <motion.div
                        key="upload"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <BackgroundGradient className="rounded-2xl">
                          <motion.div
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Upload className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                            </motion.div>
                            <Label
                              htmlFor="image-upload"
                              className="cursor-pointer block"
                            >
                              <span className="text-lg font-medium text-gray-700 dark:text-gray-300 block mb-2">
                                点击上传图片
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                或将图片拖拽到此处
                              </span>
                              <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                            </Label>
                          </motion.div>
                        </BackgroundGradient>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="relative rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                      >
                        <img
                          src={inputImagePreview}
                          alt="预览"
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <ShimmerButton
                            onClick={removeImage}
                            background="linear-gradient(45deg, #ef4444, #dc2626)"
                            className="text-white"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            重新选择
                          </ShimmerButton>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 参数设置 */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    生成参数
                  </Label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      className="space-y-2"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label className="text-sm font-medium">纵横比</Label>
                      <Select
                        value={aspectRatio}
                        onValueChange={setAspectRatio}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">自动</SelectItem>
                          <SelectItem value="1:1">正方形</SelectItem>
                          <SelectItem value="16:9">横向</SelectItem>
                          <SelectItem value="9:16">竖向</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label className="text-sm font-medium">输出格式</Label>
                      <Select
                        value={outputFormat}
                        onValueChange={setOutputFormat}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                          <SelectItem value="png">PNG</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label className="text-sm font-medium">提示词增强</Label>
                      <div className="flex items-center space-x-2 p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        <Switch
                          id="prompt-upsampling"
                          checked={promptUpsampling}
                          onCheckedChange={setPromptUpsampling}
                        />
                        <Label htmlFor="prompt-upsampling" className="text-sm">
                          启用
                        </Label>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </MagicCard>
          </motion.div>

          {/* 操作和结果区域 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <MagicCard className="p-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
              <div className="space-y-8">
                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ShimmerButton
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="px-8 py-4 text-lg font-semibold"
                      background="linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4)"
                    >
                      {isGenerating ? (
                        <>
                          <motion.div
                            className="mr-2 h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-5 w-5" />
                          开始生成
                        </>
                      )}
                    </ShimmerButton>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ShimmerButton
                      onClick={resetForm}
                      disabled={isGenerating}
                      background="linear-gradient(45deg, #6b7280, #4b5563)"
                      className="px-6 py-4"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      重置
                    </ShimmerButton>
                  </motion.div>
                </div>

                {/* 进度显示 */}
                <AnimatePresence>
                  {isGenerating && (
                    <motion.div
                      className="flex flex-col items-center space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <AnimatedCircularProgressBar
                        value={progress}
                        size={120}
                        strokeWidth={8}
                        gaugePrimaryColor="#3b82f6"
                        gaugeSecondaryColor="#e5e7eb"
                      />
                      <motion.p
                        className="text-sm text-gray-600 dark:text-gray-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        AI 正在创作您的图片...
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 结果显示 */}
                <AnimatePresence>
                  {task?.status === "completed" && task.result?.image_url && (
                    <motion.div
                      className="space-y-6"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                    >
                      <BackgroundGradient className="rounded-2xl">
                        <motion.div
                          className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.3 }}
                        >
                          <img
                            src={task.result.image_url}
                            alt="生成的图片"
                            className="w-full h-auto"
                          />
                        </motion.div>
                      </BackgroundGradient>

                      <div className="flex justify-center">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ShimmerButton
                            onClick={downloadImage}
                            background="linear-gradient(45deg, #10b981, #059669)"
                            className="px-6 py-3"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            下载图片
                          </ShimmerButton>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 错误显示 */}
                <AnimatePresence>
                  {task?.status === "failed" && (
                    <motion.div
                      className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="text-red-600 dark:text-red-400 font-medium">
                        {task.error || "生成失败，请重试"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 空状态 */}
                {!task && !isGenerating && (
                  <motion.div
                    className="text-center py-12 space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center"
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ImageIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        准备就绪
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        输入提示词并点击生成按钮开始创作
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </MagicCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

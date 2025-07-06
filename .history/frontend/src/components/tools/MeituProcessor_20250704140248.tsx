"use client";

import { useState, useCallback, useEffect } from "react";
import {
  api,
  MeituProcessingFunction,
  MeituProcessingRequest,
  MeituProcessingTask,
} from "@/lib/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Wand2,
  Download,
  Settings,
  HelpCircle,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Palette,
  Zap,
} from "lucide-react";

export default function MeituProcessor() {
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string>("");
  const [task, setTask] = useState<MeituProcessingTask | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [functions, setFunctions] = useState<MeituProcessingFunction[]>([]);

  // 参数状态
  const [selectedFunction, setSelectedFunction] = useState("");
  const [intensity, setIntensity] = useState(50);
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [enablePreview, setEnablePreview] = useState(true);
  const [autoOptimize, setAutoOptimize] = useState(true);

  // 美颜参数
  const [skinSmoothing, setSkinSmoothing] = useState(70);
  const [faceSlimming, setFaceSlimming] = useState(30);
  const [eyeEnlargement, setEyeEnlargement] = useState(20);
  const [brightening, setBrightening] = useState(40);

  // 特效参数
  const [effectStyle, setEffectStyle] = useState("natural");
  const [effectStrength, setEffectStrength] = useState(60);
  const [colorTemperature, setColorTemperature] = useState(50);
  const [saturation, setSaturation] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [sharpness, setSharpness] = useState(50);

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

  // 加载可用功能
  useEffect(() => {
    const loadFunctions = async () => {
      try {
        const functionsData = await api.getMeituFunctions();
        setFunctions(functionsData);
        if (functionsData.length > 0) {
          setSelectedFunction(functionsData[0].id);
        }
      } catch (error) {
        showToast("error", "加载失败", "无法获取美图处理功能列表");
      }
    };
    loadFunctions();
  }, []);

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
    setTask(null);
  };

  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 60;
    let attempts = 0;
    let pollingCancelled = false;

    const poll = async () => {
      if (pollingCancelled || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          setIsProcessing(false);
          showToast("error", "处理超时", "请检查网络连接后重试");
        }
        return;
      }

      const taskData = await api.getMeituTaskStatus(taskId);

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
          setIsProcessing(false);
          showToast("error", "查询失败", "无法获取任务状态，请检查后端服务");
        }
        return;
      }

      setTask(taskData);

      const progressValue = Math.min((attempts / maxAttempts) * 90 + 10, 90);
      setProgress(progressValue);

      if (taskData.status === "completed") {
        setProgress(100);
        setIsProcessing(false);
        showToast("success", "图片处理成功！", "您可以预览和下载处理后的图片");
      } else if (taskData.status === "failed") {
        setIsProcessing(false);
        showToast("error", "处理失败", taskData.error || "未知错误");
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

  const handleProcess = async () => {
    if (!inputImage) {
      showToast("error", "输入错误", "请先上传要处理的图片");
      return;
    }

    if (!selectedFunction) {
      showToast("error", "参数错误", "请选择处理功能");
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setTask(null);

    const request: MeituProcessingRequest = {
      image: inputImage,
      function_id: selectedFunction,
      output_format: outputFormat,
      parameters: {
        intensity,
        skin_smoothing: skinSmoothing,
        face_slimming: faceSlimming,
        eye_enlargement: eyeEnlargement,
        brightening,
        effect_style: effectStyle,
        effect_strength: effectStrength,
        color_temperature: colorTemperature,
        saturation,
        contrast,
        sharpness,
        auto_optimize: autoOptimize,
        enable_preview: enablePreview,
      },
    };

    showToast("info", "开始处理", "正在提交处理请求...");
    const response = await api.processMeituImage(request);

    if (response.error) {
      setIsProcessing(false);
      setProgress(0);
      showToast("error", "处理失败", response.error);
      return;
    }

    if (!response.task_id) {
      setIsProcessing(false);
      setProgress(0);
      showToast("error", "处理失败", "未获取到任务ID");
      return;
    }

    showToast("info", "请求成功", "开始处理图片，请稍候...");
    await pollTaskStatus(response.task_id);
  };

  const downloadImage = () => {
    if (task?.result?.image_url) {
      const link = document.createElement("a");
      link.href = task.result.image_url;
      link.download = `meitu-processed-${Date.now()}.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetForm = () => {
    setInputImage(null);
    setInputImagePreview("");
    setTask(null);
    setProgress(0);
    setIntensity(50);
    setSkinSmoothing(70);
    setFaceSlimming(30);
    setEyeEnlargement(20);
    setBrightening(40);
    setEffectStyle("natural");
    setEffectStrength(60);
    setColorTemperature(50);
    setSaturation(50);
    setContrast(50);
    setSharpness(50);
    setOutputFormat("jpeg");
    setEnablePreview(true);
    setAutoOptimize(true);
  };

  const selectedFunctionData = functions.find((f) => f.id === selectedFunction);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* 头部标题 */}
        <div className="mb-6 text-center">
          <Badge variant="secondary" className="text-sm px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 mr-2" />
            美图秀秀 AI 处理
          </Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            智能美图处理
          </h1>
          <p className="text-gray-600">
            使用 AI 技术为您的照片带来专业级的美化效果
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* 左侧：主要控制面板 */}
          <div className="lg:col-span-3">
            <Card className="h-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Wand2 className="h-5 w-5 text-pink-600" />
                  </div>
                  美图处理控制台
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  上传图片并选择处理功能，调整参数获得最佳效果
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* 图片上传区域 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-600" />
                    上传图片 <span className="text-red-500">*</span>
                  </Label>

                  {!inputImagePreview ? (
                    <div className="border-2 border-dashed border-pink-300 rounded-xl p-12 text-center hover:border-pink-400 hover:bg-pink-50/50 transition-all duration-200 cursor-pointer">
                      <Upload className="mx-auto h-16 w-16 text-pink-400 mb-4" />
                      <Label
                        htmlFor="image-upload"
                        className="cursor-pointer block"
                      >
                        <span className="text-lg font-medium text-gray-700 block mb-2">
                          点击上传图片
                        </span>
                        <span className="text-sm text-gray-500">
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
                      <p className="text-xs text-gray-500 mt-4 bg-gray-100 rounded-lg px-3 py-2 inline-block">
                        支持 JPG, PNG, WebP 格式，最大 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                      <img
                        src={inputImagePreview}
                        alt="预览"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          重新选择
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 处理功能选择 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-600" />
                    处理功能 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedFunction}
                    onValueChange={setSelectedFunction}
                  >
                    <SelectTrigger className="bg-white border-gray-200 h-12">
                      <SelectValue placeholder="选择处理功能" />
                    </SelectTrigger>
                    <SelectContent>
                      {functions.map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            {func.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFunctionData && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {selectedFunctionData.description}
                    </p>
                  )}
                </div>

                <Separator className="my-8" />

                {/* 参数设置 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    处理参数
                  </h3>

                  <Tabs defaultValue="beauty" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                      <TabsTrigger
                        value="beauty"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        美颜设置
                      </TabsTrigger>
                      <TabsTrigger
                        value="effect"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        特效调色
                      </TabsTrigger>
                      <TabsTrigger
                        value="advanced"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        高级设置
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="beauty" className="space-y-6 mt-6">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                              磨皮程度: {skinSmoothing}
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>调整皮肤平滑程度，数值越高磨皮效果越强</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Slider
                            value={[skinSmoothing]}
                            onValueChange={(value) =>
                              setSkinSmoothing(value[0])
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                              瘦脸程度: {faceSlimming}
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>调整脸部收缩程度，让面部更显瘦削</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Slider
                            value={[faceSlimming]}
                            onValueChange={(value) => setFaceSlimming(value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                              大眼程度: {eyeEnlargement}
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>调整眼部放大程度，让眼睛更显有神</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Slider
                            value={[eyeEnlargement]}
                            onValueChange={(value) =>
                              setEyeEnlargement(value[0])
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                              美白程度: {brightening}
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>调整肤色提亮程度，让皮肤更加白皙</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Slider
                            value={[brightening]}
                            onValueChange={(value) => setBrightening(value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="effect" className="space-y-6 mt-6">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            特效风格
                          </Label>
                          <Select
                            value={effectStyle}
                            onValueChange={setEffectStyle}
                          >
                            <SelectTrigger className="bg-white border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="natural">自然</SelectItem>
                              <SelectItem value="sweet">甜美</SelectItem>
                              <SelectItem value="cool">冷酷</SelectItem>
                              <SelectItem value="vintage">复古</SelectItem>
                              <SelectItem value="fresh">清新</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            特效强度: {effectStrength}
                          </Label>
                          <Slider
                            value={[effectStrength]}
                            onValueChange={(value) =>
                              setEffectStrength(value[0])
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            色温调节: {colorTemperature}
                          </Label>
                          <Slider
                            value={[colorTemperature]}
                            onValueChange={(value) =>
                              setColorTemperature(value[0])
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>冷色调</span>
                            <span>暖色调</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            饱和度: {saturation}
                          </Label>
                          <Slider
                            value={[saturation]}
                            onValueChange={(value) => setSaturation(value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            对比度: {contrast}
                          </Label>
                          <Slider
                            value={[contrast]}
                            onValueChange={(value) => setContrast(value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-6 mt-6">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            锐化程度: {sharpness}
                          </Label>
                          <Slider
                            value={[sharpness]}
                            onValueChange={(value) => setSharpness(value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            整体强度: {intensity}
                          </Label>
                          <Slider
                            value={[intensity]}
                            onValueChange={(value) => setIntensity(value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            输出格式
                          </Label>
                          <Select
                            value={outputFormat}
                            onValueChange={setOutputFormat}
                          >
                            <SelectTrigger className="bg-white border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="jpeg">
                                JPEG (较小文件)
                              </SelectItem>
                              <SelectItem value="png">
                                PNG (无损质量)
                              </SelectItem>
                              <SelectItem value="webp">
                                WebP (最优压缩)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                启用预览
                              </Label>
                              <p className="text-xs text-gray-500">
                                生成低分辨率预览图
                              </p>
                            </div>
                            <Switch
                              checked={enablePreview}
                              onCheckedChange={setEnablePreview}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                自动优化
                              </Label>
                              <p className="text-xs text-gray-500">
                                AI自动调整参数获得最佳效果
                              </p>
                            </div>
                            <Switch
                              checked={autoOptimize}
                              onCheckedChange={setAutoOptimize}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：操作和结果面板 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 操作面板 */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Palette className="h-4 w-4 text-pink-600" />
                  </div>
                  操作面板
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || !inputImage}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      开始处理
                    </>
                  )}
                </Button>

                {isProcessing && (
                  <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
                    <div className="flex justify-between text-sm font-medium">
                      <span>处理进度</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                    <p className="text-xs text-gray-600 text-center">
                      AI正在为您的图片进行专业级美化处理...
                    </p>
                  </div>
                )}

                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full h-10"
                  disabled={isProcessing}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重置参数
                </Button>
              </CardContent>
            </Card>

            {/* 结果显示 */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm flex-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ImageIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    处理结果
                  </span>
                  {task && (
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "default"
                          : task.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {task.status === "completed"
                        ? "✓ 完成"
                        : task.status === "failed"
                        ? "✗ 失败"
                        : task.status === "running"
                        ? "⏳ 处理中"
                        : "⏸ 等待中"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {task?.status === "completed" && task.result?.image_url ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 group">
                      <img
                        src={task.result.image_url}
                        alt="处理后的图片"
                        className="w-full h-auto transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end">
                        <p className="text-white text-sm p-4">
                          点击下载按钮保存美化后的图片
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={downloadImage}
                      variant="outline"
                      className="w-full h-10 border-pink-200 hover:bg-pink-50"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      下载图片
                    </Button>
                  </div>
                ) : task?.status === "failed" ? (
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50"
                  >
                    <AlertDescription className="text-red-800">
                      {task.error || "处理失败，请重试"}
                    </AlertDescription>
                  </Alert>
                ) : task ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600 mb-4" />
                    <p className="text-base font-medium text-gray-700 mb-2">
                      正在处理图片
                    </p>
                    <p className="text-sm text-gray-500">
                      AI 正在为您的图片进行美化处理...
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-200 rounded-full flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-pink-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-medium text-gray-700">
                        等待处理
                      </p>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        上传图片并选择处理功能，AI
                        将为您的照片带来专业级美化效果
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

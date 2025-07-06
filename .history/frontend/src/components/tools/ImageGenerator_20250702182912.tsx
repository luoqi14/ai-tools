"use client";

import { useState, useCallback } from "react";
import { api, ImageGenerationRequest, ImageGenerationTask } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string>("");
  const [task, setTask] = useState<ImageGenerationTask | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 参数状态
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [steps, setSteps] = useState([28]);
  const [seed, setSeed] = useState("");
  const [guidance, setGuidance] = useState([3.5]);
  const [safety, setSafety] = useState(true);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          showAlert("error", "图片大小不能超过10MB");
          return;
        }
        if (!file.type.startsWith("image/")) {
          showAlert("error", "请选择有效的图片文件");
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

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsGenerating(false);
        showAlert("error", "生成超时，请重试");
        return;
      }

      try {
        const taskData = await api.getTaskStatus(taskId);
        setTask(taskData);

        // 更新进度
        const progressValue = Math.min((attempts / maxAttempts) * 90 + 10, 90);
        setProgress(progressValue);

        if (taskData.status === "completed") {
          setProgress(100);
          setIsGenerating(false);
          showAlert("success", "图片生成成功！");
        } else if (taskData.status === "failed") {
          setIsGenerating(false);
          showAlert("error", taskData.error || "生成失败");
        } else {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error("轮询状态失败:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setIsGenerating(false);
          showAlert("error", "查询状态失败，请重试");
        }
      }
    };

    poll();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showAlert("error", "请输入提示词");
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setTask(null);

    try {
      const request: ImageGenerationRequest = {
        prompt,
        aspect_ratio: aspectRatio,
        output_format: outputFormat,
        steps: steps[0],
        guidance: guidance[0],
        safety_tolerance: safety ? 2 : 6,
        seed: seed || undefined,
        input_image: inputImage || undefined,
      };

      const response = await api.generateImage(request);
      await pollTaskStatus(response.task_id);
    } catch (error) {
      console.error("生成失败:", error);
      setIsGenerating(false);
      showAlert(
        "error",
        error instanceof Error ? error.message : "网络错误，请检查后端服务"
      );
    }
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
    setSeed("");
    setSteps([28]);
    setGuidance([3.5]);
    setAspectRatio("1:1");
    setOutputFormat("jpeg");
    setSafety(true);
  };

  const mode = inputImage ? "image-to-image" : "text-to-image";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* 当前模式指示器 */}
        <div className="mb-6 text-center">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            当前模式: {mode === "text-to-image" ? "文生图" : "图生图"}
          </Badge>
        </div>

        {/* 全局提示信息 */}
        {alert && (
          <div className="mb-6">
            <Alert
              className={`${
                alert.type === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <AlertDescription
                className={
                  alert.type === "error" ? "text-red-800" : "text-green-800"
                }
              >
                {alert.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* 左侧：主要控制面板 */}
          <div className="lg:col-span-3">
            <Card className="h-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wand2 className="h-5 w-5 text-blue-600" />
                  </div>
                  图像生成控制台
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  输入提示词或上传参考图片，配置生成参数
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* 提示词输入 */}
                <div className="space-y-3">
                  <Label
                    htmlFor="prompt"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    提示词 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="描述你想要生成的图像，例如：一只可爱的橙色小猫在花园里玩耍，阳光明媚，超现实主义风格"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-32 text-base resize-none focus:ring-2 focus:ring-blue-500 border-gray-200"
                  />
                  <p className="text-sm text-gray-500">
                    已输入 {prompt.length}{" "}
                    字符，建议使用详细的描述以获得更好的效果
                  </p>
                </div>

                {/* 图片上传区域 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-600" />
                    参考图片 (可选)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>上传图片将自动切换到图生图模式</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>

                  {!inputImagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer">
                      <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
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

                <Separator className="my-8" />

                {/* 参数设置 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    生成参数
                  </h3>

                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                      <TabsTrigger
                        value="basic"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        基础设置
                      </TabsTrigger>
                      <TabsTrigger
                        value="advanced"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        高级设置
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            纵横比
                          </Label>
                          <Select
                            value={aspectRatio}
                            onValueChange={setAspectRatio}
                          >
                            <SelectTrigger className="bg-white border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1:1">正方形 (1:1)</SelectItem>
                              <SelectItem value="16:9">横向 (16:9)</SelectItem>
                              <SelectItem value="9:16">竖向 (9:16)</SelectItem>
                              <SelectItem value="4:3">标准 (4:3)</SelectItem>
                              <SelectItem value="3:4">肖像 (3:4)</SelectItem>
                            </SelectContent>
                          </Select>
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
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-6 mt-6">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                              生成步数: {steps[0]}
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>更多步数通常产生更高质量的图像</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Slider
                            value={steps}
                            onValueChange={setSteps}
                            min={1}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>快速 (1)</span>
                            <span>平衡 (28)</span>
                            <span>精细 (50)</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                              引导强度: {guidance[0]}
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>控制AI对提示词的遵循程度</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Slider
                            value={guidance}
                            onValueChange={setGuidance}
                            min={1}
                            max={20}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>创意 (1)</span>
                            <span>平衡 (3.5)</span>
                            <span>精确 (20)</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="seed"
                            className="text-sm font-medium text-gray-700"
                          >
                            随机种子 (可选)
                          </Label>
                          <Input
                            id="seed"
                            type="number"
                            placeholder="留空使用随机种子"
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                            className="bg-white border-gray-200"
                          />
                          <p className="text-xs text-gray-500">
                            使用相同种子和参数可以复现相同结果
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="space-y-1">
                            <Label
                              htmlFor="safety-mode"
                              className="text-sm font-medium text-gray-700"
                            >
                              安全模式
                            </Label>
                            <p className="text-xs text-gray-500">
                              过滤不当内容
                            </p>
                          </div>
                          <Switch
                            id="safety-mode"
                            checked={safety}
                            onCheckedChange={setSafety}
                          />
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
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wand2 className="h-4 w-4 text-green-600" />
                  </div>
                  操作面板
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      开始生成
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between text-sm font-medium">
                      <span>生成进度</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                    <p className="text-xs text-gray-600 text-center">
                      预计需要 30-60 秒，请耐心等待...
                    </p>
                  </div>
                )}

                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full h-10"
                  disabled={isGenerating}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重置表单
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
                    生成结果
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
                        ? "⏳ 运行中"
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
                        alt="生成的图片"
                        className="w-full h-auto transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end">
                        <p className="text-white text-sm p-4">
                          点击下载按钮保存图片
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={downloadImage}
                      variant="outline"
                      className="w-full h-10 border-green-200 hover:bg-green-50"
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
                      {task.error || "生成失败，请重试"}
                    </AlertDescription>
                  </Alert>
                ) : task ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mb-4" />
                    <p className="text-base font-medium text-gray-700 mb-2">
                      正在生成图片
                    </p>
                    <p className="text-sm text-gray-500">
                      AI 正在处理您的请求...
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-medium text-gray-700">
                        等待生成
                      </p>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        输入提示词并点击&ldquo;开始生成&rdquo;按钮，AI
                        将为您创作精美图片
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

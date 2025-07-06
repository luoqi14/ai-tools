"use client";

import { useState, useCallback } from "react";
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
  TooltipProvider,
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
} from "lucide-react";

interface Task {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: { image_url: string };
  error?: string;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string>("");
  const [task, setTask] = useState<Task | null>(null);
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
        const response = await fetch(
          `http://localhost:5000/api/image-generation/status/${taskId}`
        );
        const data = await response.json();

        setTask(data.task);

        // 更新进度
        const progressValue = Math.min((attempts / maxAttempts) * 90 + 10, 90);
        setProgress(progressValue);

        if (data.task.status === "completed") {
          setProgress(100);
          setIsGenerating(false);
          showAlert("success", "图片生成成功！");
        } else if (data.task.status === "failed") {
          setIsGenerating(false);
          showAlert("error", data.task.error || "生成失败");
        } else {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error("轮询状态失败:", error);
        attempts++;
        setTimeout(poll, 2000);
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
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("aspect_ratio", aspectRatio);
      formData.append("output_format", outputFormat);
      formData.append("steps", steps[0].toString());
      formData.append("guidance", guidance[0].toString());
      formData.append("safety_tolerance", safety ? "2" : "6");
      if (seed) formData.append("seed", seed);
      if (inputImage) formData.append("input_image", inputImage);

      const response = await fetch(
        "http://localhost:5000/api/image-generation/generate",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        await pollTaskStatus(data.task_id);
      } else {
        setIsGenerating(false);
        showAlert("error", data.message || "生成失败");
      }
    } catch (error) {
      console.error("生成失败:", error);
      setIsGenerating(false);
      showAlert("error", "网络错误，请检查后端服务");
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
  };

  const mode = inputImage ? "image-to-image" : "text-to-image";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              AI 图像生成
            </h1>
            <p className="text-lg text-gray-600">
              基于 Flux Kontext 的专业图像生成工具
            </p>
          </div>

          {alert && (
            <Alert
              className={`mb-6 ${
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
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* 左侧：输入和参数区域 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    图像生成控制台
                  </CardTitle>
                  <CardDescription>
                    当前模式:{" "}
                    <Badge variant="outline">
                      {mode === "text-to-image" ? "文生图" : "图生图"}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 提示词输入 */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-sm font-medium">
                      提示词 <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="prompt"
                      placeholder="描述你想要生成的图像，例如：一只可爱的橙色小猫在花园里玩耍，阳光明媚，超现实主义风格"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-24 resize-none"
                    />
                  </div>

                  {/* 图片上传区域 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      参考图片 (可选)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>上传图片将切换到图生图模式</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>

                    {!inputImagePreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <Label
                          htmlFor="image-upload"
                          className="cursor-pointer"
                        >
                          <span className="text-sm text-gray-600">
                            点击上传图片
                          </span>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </Label>
                        <p className="text-xs text-gray-500 mt-2">
                          支持 JPG, PNG, WebP，最大 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border">
                        <img
                          src={inputImagePreview}
                          alt="预览"
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          移除
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* 参数设置 */}
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">基础设置</TabsTrigger>
                      <TabsTrigger value="advanced">高级设置</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>纵横比</Label>
                          <Select
                            value={aspectRatio}
                            onValueChange={setAspectRatio}
                          >
                            <SelectTrigger>
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

                        <div className="space-y-2">
                          <Label>输出格式</Label>
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
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>生成步数: {steps[0]}</Label>
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
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>引导强度: {guidance[0]}</Label>
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
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="seed">随机种子 (可选)</Label>
                          <Input
                            id="seed"
                            type="number"
                            placeholder="留空使用随机种子"
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="safety-mode"
                            className="flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            安全模式
                          </Label>
                          <Switch
                            id="safety-mode"
                            checked={safety}
                            onCheckedChange={setSafety}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：结果显示区域 */}
            <div className="space-y-6">
              {/* 操作按钮 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">操作面板</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full"
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
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>生成进度</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}

                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="w-full"
                    disabled={isGenerating}
                  >
                    重置表单
                  </Button>
                </CardContent>
              </Card>

              {/* 结果显示 */}
              {task && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      生成结果
                      <Badge
                        variant={
                          task.status === "completed"
                            ? "default"
                            : task.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {task.status === "completed"
                          ? "完成"
                          : task.status === "failed"
                          ? "失败"
                          : task.status === "running"
                          ? "运行中"
                          : "等待中"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {task.status === "completed" && task.result?.image_url ? (
                      <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border">
                          <img
                            src={task.result.image_url}
                            alt="生成的图片"
                            className="w-full h-auto"
                          />
                        </div>
                        <Button
                          onClick={downloadImage}
                          variant="outline"
                          className="w-full"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          下载图片
                        </Button>
                      </div>
                    ) : task.status === "failed" ? (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {task.error || "生成失败，请重试"}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mb-4" />
                        <p className="text-sm text-gray-600">正在生成图片...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

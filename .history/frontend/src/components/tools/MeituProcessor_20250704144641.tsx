"use client";

import { useState, useCallback, useEffect } from "react";
import {
  api,
  MeituProcessingFunction,
  MeituProcessingRequest,
  MeituProcessingTask,
  MeituFunctionsResponse,
  ParameterConfig,
  ParameterGroup,
  PeopleType,
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
  Trash2,
  Loader2,
} from "lucide-react";

export default function MeituProcessor() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);

  // 参数配置
  const [functionsData, setFunctionsData] =
    useState<MeituFunctionsResponse | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [peopleTypes, setPeopleTypes] = useState<PeopleType[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载参数配置
  useEffect(() => {
    const loadFunctions = async () => {
      try {
        const data = await api.getMeituFunctions();
        setFunctionsData(data);
        setPeopleTypes(data.people_types);

        // 初始化参数默认值
        const initialParams: Record<string, any> = {};
        Object.values(data.parameter_groups).forEach((group) => {
          Object.entries(group.parameters).forEach(([key, config]) => {
            initialParams[key] = config.default;
          });
        });
        setParameters(initialParams);
      } catch (error) {
        console.error("加载参数配置失败:", error);
        setError("加载参数配置失败");
      } finally {
        setLoading(false);
      }
    };

    loadFunctions();
  }, []);

  // 处理图片选择
  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          setError("图片大小不能超过10MB");
          return;
        }

        if (!file.type.startsWith("image/")) {
          setError("请选择有效的图片文件");
          return;
        }

        setSelectedImage(file);
        setProcessedImage(null);
        setError(null);

        // 创建预览
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    },
    []
  );

  // 处理参数变化
  const handleParameterChange = useCallback((key: string, value: any) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 处理数组参数变化
  const handleArrayParameterChange = useCallback(
    (key: string, index: number, value: any) => {
      setParameters((prev) => {
        const newArray = [...(prev[key] || [])];
        newArray[index] = value;
        return { ...prev, [key]: newArray };
      });
    },
    []
  );

  // 轮询状态
  const pollTaskStatus = useCallback(async (taskId: string) => {
    const maxAttempts = 60; // 最多轮询60次
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await api.getMeituTaskStatus(taskId);

        if (!status) {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000); // 2秒后重试
          } else {
            setError("任务查询超时，请稍后重试");
            setIsProcessing(false);
          }
          return;
        }

        if (status.status === "completed") {
          setProcessedImage(status.result?.processed_image || null);
          setIsProcessing(false);
          setProgress(100);
          toast.success("图片处理完成！");
        } else if (status.status === "failed") {
          setError(status.error || "处理失败");
          setIsProcessing(false);
          setProgress(0);
          toast.error("图片处理失败");
        } else {
          // 继续轮询
          const newProgress = Math.min(90, (attempts / maxAttempts) * 100);
          setProgress(newProgress);

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000);
          } else {
            setError("处理超时，请稍后重试");
            setIsProcessing(false);
          }
        }
      } catch (error) {
        console.error("轮询状态失败:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError("状态查询失败");
          setIsProcessing(false);
        }
      }
    };

    poll();
  }, []);

  // 处理图片
  const handleProcess = useCallback(async () => {
    if (!selectedImage) {
      setError("请先选择图片");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(10);

    try {
      const requestData: MeituProcessingRequest = {
        image: selectedImage,
        ...parameters,
      };

      const response = await api.processMeituImage(requestData);

      if (response.error) {
        setError(response.error);
        setIsProcessing(false);
        return;
      }

      setTaskId(response.task_id);
      setProgress(20);

      // 开始轮询
      pollTaskStatus(response.task_id);
    } catch (error) {
      console.error("处理失败:", error);
      setError("处理失败，请重试");
      setIsProcessing(false);
    }
  }, [selectedImage, parameters, pollTaskStatus]);

  // 重置所有状态
  const handleReset = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    setProcessedImage(null);
    setError(null);
    setProgress(0);
    setTaskId(null);
    setIsProcessing(false);

    // 重置参数为默认值
    if (functionsData) {
      const initialParams: Record<string, any> = {};
      Object.values(functionsData.parameter_groups).forEach((group) => {
        Object.entries(group.parameters).forEach(([key, config]) => {
          initialParams[key] = config.default;
        });
      });
      setParameters(initialParams);
    }
  }, [functionsData]);

  // 下载处理后的图片
  const handleDownload = useCallback(() => {
    if (processedImage) {
      const link = document.createElement("a");
      link.href = processedImage;
      link.download = `meitu-processed-${Date.now()}.jpg`;
      link.click();
    }
  }, [processedImage]);

  // 渲染参数控件
  const renderParameterControl = (key: string, config: ParameterConfig) => {
    const currentValue = parameters[key];

    switch (config.type) {
      case "slider":
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                {config.label}
              </Label>
              <span className="text-sm text-gray-500">{currentValue}</span>
            </div>
            <Slider
              value={[currentValue]}
              onValueChange={(value) => handleParameterChange(key, value[0])}
              min={config.min}
              max={config.max}
              step={1}
              className="w-full"
            />
          </div>
        );

      case "select":
        return (
          <div key={key} className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {config.label}
            </Label>
            <Select
              value={currentValue?.toString()}
              onValueChange={(value) =>
                handleParameterChange(key, parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map((option) => (
                  <SelectItem key={option.toString()} value={option.toString()}>
                    {option === 0 ? "关闭" : option === 1 ? "开启" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "array_slider":
        return (
          <div key={key} className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              {config.label}
            </Label>
            <div className="space-y-2">
              {peopleTypes.map((type, index) => (
                <div key={type.key} className="flex items-center space-x-3">
                  <Badge variant="outline" className="w-12 text-xs">
                    {type.name}
                  </Badge>
                  <div className="flex-1">
                    <Slider
                      value={[currentValue?.[index] || 0]}
                      onValueChange={(value) =>
                        handleArrayParameterChange(key, index, value[0])
                      }
                      min={config.min}
                      max={config.max}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">
                    {currentValue?.[index] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "array_select":
        return (
          <div key={key} className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              {config.label}
            </Label>
            <div className="space-y-2">
              {peopleTypes.map((type, index) => (
                <div key={type.key} className="flex items-center space-x-3">
                  <Badge variant="outline" className="w-12 text-xs">
                    {type.name}
                  </Badge>
                  <Select
                    value={currentValue?.[index]?.toString() || "0"}
                    onValueChange={(value) =>
                      handleArrayParameterChange(key, index, parseInt(value))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      {config.options?.map((option) => (
                        <SelectItem
                          key={option.toString()}
                          value={option.toString()}
                        >
                          {option === 0
                            ? "关闭"
                            : option === 1
                            ? "开启"
                            : option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
        <div className="max-w-6xl mx-auto pt-20">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto pt-20">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI智能修图
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            基于美图云修API的专业图片处理工具，支持AI美颜、智能调色、画质增强等多种功能
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：图片上传和预览 */}
          <div className="lg:col-span-1">
            <Card className="backdrop-blur-sm bg-white/80 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  图片上传
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 上传区域 */}
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-purple-400 transition-colors">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">点击上传图片</p>
                      <p className="text-xs text-gray-400">
                        支持JPG、PNG，最大10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* 原图预览 */}
                {imagePreview && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      原图预览
                    </Label>
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="原图"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                {/* 处理后图片预览 */}
                {processedImage && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      处理结果
                    </Label>
                    <div className="relative">
                      <img
                        src={processedImage}
                        alt="处理后"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                {/* 进度条 */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">处理进度</span>
                      <span className="text-sm text-purple-600">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* 错误提示 */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* 操作按钮 */}
                <div className="flex space-x-2">
                  <Button
                    onClick={handleProcess}
                    disabled={!selectedImage || isProcessing}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        开始处理
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-gray-300 text-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* 下载按钮 */}
                {processedImage && (
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载结果
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：参数控制 */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-sm bg-white/80 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  参数调整
                </CardTitle>
              </CardHeader>
              <CardContent>
                {functionsData && (
                  <Tabs
                    defaultValue={
                      Object.keys(functionsData.parameter_groups)[0]
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
                      {Object.entries(functionsData.parameter_groups).map(
                        ([key, group]) => (
                          <TabsTrigger
                            key={key}
                            value={key}
                            className="text-xs"
                          >
                            {group.name}
                          </TabsTrigger>
                        )
                      )}
                    </TabsList>

                    {Object.entries(functionsData.parameter_groups).map(
                      ([groupKey, group]) => (
                        <TabsContent
                          key={groupKey}
                          value={groupKey}
                          className="space-y-4 mt-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(group.parameters).map(
                              ([paramKey, config]) =>
                                renderParameterControl(paramKey, config)
                            )}
                          </div>
                        </TabsContent>
                      )
                    )}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

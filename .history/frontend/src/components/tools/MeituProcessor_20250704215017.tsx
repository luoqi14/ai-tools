"use client";

import { useState, useCallback, useEffect, useMemo, memo } from "react";
import {
  api,
  MeituFunctionsResponse,
  ParameterConfig,
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Settings,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Zap,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";

// 预设图片URL数组
const PRESET_IMAGES = [
  {
    id: 1,
    url: "https://jwsmed-test.oss-cn-hangzhou.aliyuncs.com/res/resource/manager/resource/d38e69ea327c47a88aba96aec8dce58a.png",
    name: "示例图片 1",
  },
  {
    id: 2,
    url: "https://jwsmed-test.oss-cn-hangzhou.aliyuncs.com/res/resource/manager/resource/60d4348fd95a46d3a5827f05c941e925.jpeg",
    name: "示例图片 2",
  },
  {
    id: 3,
    url: "https://jwsmed-test.oss-cn-hangzhou.aliyuncs.com/res/resource/manager/resource/51c7d5f071f648d6bdf53957a21ca79d.jpeg",
    name: "示例图片 3",
  },
  {
    id: 4,
    url: "https://jwsmed-test.oss-cn-hangzhou.aliyuncs.com/res/resource/manager/resource/066464f4c71646e8a95a19fea724aca5.jpeg",
    name: "示例图片 4",
  },
  {
    id: 5,
    url: "https://jwsmed-test.oss-cn-hangzhou.aliyuncs.com/res/resource/manager/resource/bbe711ace60347a1ae6a7673f3682a26.jpeg",
    name: "示例图片 5",
  },
  {
    id: 6,
    url: "https://jwsmed-test.oss-cn-hangzhou.aliyuncs.com/res/resource/manager/resource/93345342c2ba4e949cfa8af898451923.jpeg",
    name: "示例图片 6",
  },
  {
    id: 7,
    url: "https://jwsmed-test.oss-cn-hangzhou.aliyuncs.com/res/resource/manager/resource/4a368b891dc14d5fbb3209944c053891.jpg",
    name: "示例图片 7",
  },
];

// 优化：将参数控制组件拆分为独立的memo组件
const ParameterControl = memo(
  ({
    paramKey,
    config,
    currentValue,
    peopleTypes,
    onParameterChange,
    onArrayParameterChange,
  }: {
    paramKey: string;
    config: ParameterConfig;
    currentValue: number | number[];
    peopleTypes: PeopleType[];
    onParameterChange: (key: string, value: number) => void;
    onArrayParameterChange: (key: string, index: number, value: number) => void;
  }) => {
    const handleChange = useCallback(
      (value: number) => {
        onParameterChange(paramKey, value);
      },
      [paramKey, onParameterChange]
    );

    const handleArrayChange = useCallback(
      (index: number, value: number) => {
        onArrayParameterChange(paramKey, index, value);
      },
      [paramKey, onArrayParameterChange]
    );

    switch (config.type) {
      case "slider":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                {config.label}
              </Label>
              <span className="text-sm text-gray-500">
                {currentValue as number}
              </span>
            </div>
            <Slider
              value={[currentValue as number]}
              onValueChange={(value) => handleChange(value[0])}
              min={config.min}
              max={config.max}
              step={1}
              className="w-full"
            />
          </div>
        );

      case "select":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {config.label}
            </Label>
            <Select
              value={(currentValue as number)?.toString()}
              onValueChange={(value) => handleChange(parseInt(value))}
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
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              {config.label}
            </Label>
            <div className="space-y-2">
              {peopleTypes.map((type, index) => (
                <ArraySliderItem
                  key={type.key}
                  type={type}
                  index={index}
                  value={(currentValue as number[])?.[index] || 0}
                  config={config}
                  onChange={handleArrayChange}
                />
              ))}
            </div>
          </div>
        );

      case "array_select":
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              {config.label}
            </Label>
            <div className="space-y-2">
              {peopleTypes.map((type, index) => (
                <ArraySelectItem
                  key={type.key}
                  type={type}
                  index={index}
                  value={(currentValue as number[])?.[index] || 0}
                  config={config}
                  onChange={handleArrayChange}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  }
);

ParameterControl.displayName = "ParameterControl";

// 优化：数组滑块项组件
const ArraySliderItem = memo(
  ({
    type,
    index,
    value,
    config,
    onChange,
  }: {
    type: PeopleType;
    index: number;
    value: number;
    config: ParameterConfig;
    onChange: (index: number, value: number) => void;
  }) => {
    const handleChange = useCallback(
      (newValue: number) => {
        onChange(index, newValue);
      },
      [index, onChange]
    );

    return (
      <div className="flex items-center space-x-3">
        <Badge variant="outline" className="w-12 text-xs">
          {type.name}
        </Badge>
        <div className="flex-1">
          <Slider
            value={[value]}
            onValueChange={(val) => handleChange(val[0])}
            min={config.min}
            max={config.max}
            step={1}
            className="w-full"
          />
        </div>
        <span className="text-sm text-gray-500 w-12 text-right">{value}</span>
      </div>
    );
  }
);

ArraySliderItem.displayName = "ArraySliderItem";

// 优化：数组选择项组件
const ArraySelectItem = memo(
  ({
    type,
    index,
    value,
    config,
    onChange,
  }: {
    type: PeopleType;
    index: number;
    value: number;
    config: ParameterConfig;
    onChange: (index: number, value: number) => void;
  }) => {
    const handleChange = useCallback(
      (newValue: string) => {
        onChange(index, parseInt(newValue));
      },
      [index, onChange]
    );

    return (
      <div className="flex items-center space-x-3">
        <Badge variant="outline" className="w-12 text-xs">
          {type.name}
        </Badge>
        <Select value={value.toString()} onValueChange={handleChange}>
          <SelectTrigger className="flex-1">
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
  }
);

ArraySelectItem.displayName = "ArraySelectItem";

// 优化：参数组组件
const ParameterGroup = memo(
  ({
    groupKey,
    group,
    parameters,
    peopleTypes,
    onParameterChange,
    onArrayParameterChange,
    getGroupDescription,
  }: {
    groupKey: string;
    group: {
      name: string;
      parameters: Record<string, ParameterConfig>;
    };
    parameters: Record<string, number | number[]>;
    peopleTypes: PeopleType[];
    onParameterChange: (key: string, value: number) => void;
    onArrayParameterChange: (key: string, index: number, value: number) => void;
    getGroupDescription: (key: string) => string;
  }) => {
    return (
      <TabsContent key={groupKey} value={groupKey} className="space-y-6 mt-0">
        {/* 分组标题和描述 */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {group.name}
          </h3>
          <p className="text-sm text-gray-600">
            {getGroupDescription(groupKey)}
          </p>
        </div>

        {/* 参数网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(group.parameters).map(([paramKey, config]) => (
            <div
              key={paramKey}
              className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <ParameterControl
                paramKey={paramKey}
                config={config}
                currentValue={parameters[paramKey]}
                peopleTypes={peopleTypes}
                onParameterChange={onParameterChange}
                onArrayParameterChange={onArrayParameterChange}
              />
              {config.type.includes("array") && (
                <div className="mt-2 text-xs text-gray-500">
                  针对不同人群类型进行独立调节
                </div>
              )}
            </div>
          ))}
        </div>
      </TabsContent>
    );
  }
);

ParameterGroup.displayName = "ParameterGroup";

export default function MeituProcessor() {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // 参数配置
  const [functionsData, setFunctionsData] =
    useState<MeituFunctionsResponse | null>(null);
  const [parameters, setParameters] = useState<
    Record<string, number | number[]>
  >({});
  const [peopleTypes, setPeopleTypes] = useState<PeopleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingMode, setProcessingMode] = useState<"parameters" | "preset">(
    "parameters"
  );
  const [presetId, setPresetId] = useState<string>("MTyunxiu1c68684d55");

  // 优化：使用useMemo缓存计算结果
  const groupDescriptions = useMemo(
    () => ({
      ai_quality: "AI智能画质优化，提升图片清晰度和细节",
      ai_color: "AI智能调色，自动优化色彩平衡和曝光",
      hsl_adjustment: "HSL色彩调整，精细控制色相、饱和度、明度",
      basic_adjustment: "基础调整，控制对比度、亮度、色温等",
      face_optimization: "脸部优化，AI美颜、祛瑕疵、肌肤美化",
      face_shape: "脸型调整，瘦脸、大眼、面部轮廓优化",
      skin_color: "肤色调整，美白、肤色均匀、自然肤质",
      skin_smoothing: "皮肤磨皮，去除瑕疵、细纹，保持自然",
      body_shape: "全身美型，身材比例优化",
      body_optimization: "身体优化，局部调整和美化",
      hair_adjustment: "头发调整，发色、发量优化",
      facial_features: "五官塑造，精细调节面部特征",
      teeth_whitening: "牙齿美化，美白亮齿",
      makeup_adjustment: "妆容调整，自然妆效增强",
      other_settings: "其他设置，额外的处理选项",
    }),
    []
  );

  // 优化：使用useCallback缓存函数
  const getGroupDescription = useCallback(
    (groupKey: string): string => {
      return (
        groupDescriptions[groupKey as keyof typeof groupDescriptions] ||
        "专业的图片处理参数"
      );
    },
    [groupDescriptions]
  );

  // 优化：使用useCallback缓存图标获取函数
  const getGroupIcon = useCallback((groupKey: string) => {
    if (groupKey.includes("ai_quality")) return <Zap className="h-3 w-3" />;
    if (groupKey.includes("ai_color")) return <Palette className="h-3 w-3" />;
    if (groupKey.includes("hsl")) return <Sparkles className="h-3 w-3" />;
    if (groupKey.includes("basic")) return <Settings className="h-3 w-3" />;
    if (groupKey.includes("face")) return <ImageIcon className="h-3 w-3" />;
    return <Settings className="h-3 w-3" />;
  }, []);

  // 加载参数配置
  useEffect(() => {
    const loadFunctions = async () => {
      try {
        const data = await api.getMeituFunctions();
        setFunctionsData(data);
        setPeopleTypes(data.people_types);

        // 初始化参数默认值
        const initialParams: Record<string, number | number[]> = {};
        Object.values(data.parameter_groups).forEach((group) => {
          Object.entries(group.parameters).forEach(([key, config]) => {
            if (config.type.includes("array")) {
              // 对于数组类型，使用后端返回的默认值（应该已经是正确的数组格式）
              initialParams[key] = Array.isArray(config.default)
                ? [...(config.default as number[])]
                : data.people_types.map(() => config.default as number);
            } else {
              initialParams[key] = config.default as number;
            }
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
    (imageUrl: string, imageName: string) => {
      setSelectedImageUrl(imageUrl);
      setSelectedImageName(imageName);
      setProcessedImage(null);
      setError(null);
    },
    []
  );

  // 优化：使用useCallback缓存参数变化处理函数
  const handleParameterChange = useCallback((key: string, value: number) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 优化：使用useCallback缓存数组参数变化处理函数
  const handleArrayParameterChange = useCallback(
    (key: string, index: number, value: number) => {
      setParameters((prev) => {
        const currentArray = (prev[key] as number[]) || [];
        const newArray = [...currentArray];
        newArray[index] = value;
        return { ...prev, [key]: newArray };
      });
    },
    []
  );

  // 轮询状态
  const pollTaskStatus = useCallback(async (taskId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await api.getMeituTaskStatus(taskId);

        if (!status) {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000);
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
    if (!selectedImageUrl) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      let result;

      if (processingMode === "preset") {
        // 使用预设ID模式 - 传递图片URL而不是File对象
        result = await api.processMeituImageWithPresetUrl(
          selectedImageUrl,
          presetId
        );
      } else {
        // 使用全参数模式 - 传递图片URL而不是File对象
        const requestData = {
          imageUrl: selectedImageUrl,
          ...parameters,
        };
        result = await api.processMeituImageWithUrl(requestData);
      }

      if (result.error) {
        setError(result.error);
        setIsProcessing(false);
        return;
      }

      if (result.task_id) {
        setProgress(10);
        pollTaskStatus(result.task_id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "处理失败");
      setIsProcessing(false);
    }
  }, [selectedImageUrl, parameters, processingMode, presetId, pollTaskStatus]);

  // 重置
  const handleReset = useCallback(() => {
    setSelectedImageUrl(null);
    setSelectedImageName(null);
    setProcessedImage(null);
    setError(null);
    setProgress(0);
    setIsProcessing(false);
  }, []);

  // 下载结果
  const handleDownload = useCallback(() => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `processed_image_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage]);

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
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  图片选择
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  选择一张示例图片开始处理
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 图片选择网格 */}
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_IMAGES.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => handleImageSelect(image.url, image.name)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                        selectedImageUrl === image.url
                          ? "border-purple-500 ring-2 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-24 object-cover"
                      />
                      {selectedImageUrl === image.url && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                          <div className="bg-purple-500 rounded-full p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs font-medium truncate">
                          {image.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 原图预览 */}
                {selectedImageUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      原图预览
                    </Label>
                    <div className="relative">
                      <img
                        src={selectedImageUrl}
                        alt={selectedImageName || "原图"}
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
                    disabled={!selectedImageUrl || isProcessing}
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

                {/* 预设模式说明 */}
                {processingMode === "preset" && (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Zap className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        预设ID模式
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        使用预设ID：
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {presetId}
                        </code>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        此模式将使用预设的美化效果，无需调整详细参数，一键获得专业级的图片处理效果。
                      </p>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800">
                        <strong>预设ID说明：</strong>
                        预设ID是美图云修预先配置好的参数组合，每个ID对应特定的美化风格和效果。
                        您可以根据需要修改预设ID来尝试不同的处理效果。
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：参数控制 */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-sm bg-white/80 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  参数调整
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  精细调节各项参数，打造完美效果
                </CardDescription>

                {/* 处理模式选择 */}
                <div className="mt-4 space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    处理模式
                  </Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={
                        processingMode === "parameters" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setProcessingMode("parameters")}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      全参数模式
                    </Button>
                    <Button
                      variant={
                        processingMode === "preset" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setProcessingMode("preset")}
                      className="flex-1"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      预设ID模式
                    </Button>
                  </div>

                  {/* 预设ID输入 */}
                  {processingMode === "preset" && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">预设ID</Label>
                      <Input
                        value={presetId}
                        onChange={(e) => setPresetId(e.target.value)}
                        placeholder="请输入预设ID"
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        使用预设ID可以快速应用特定的美化效果，无需调整详细参数
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {functionsData && processingMode === "parameters" && (
                  <Tabs
                    defaultValue={
                      Object.keys(functionsData.parameter_groups)[0]
                    }
                    className="w-full"
                  >
                    {/* 标签页导航 */}
                    <div className="mb-6">
                      <TabsList className="w-full h-auto p-2 bg-gray-100/50">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 w-full">
                          {Object.entries(functionsData.parameter_groups).map(
                            ([key, group]) => (
                              <TabsTrigger
                                key={key}
                                value={key}
                                className="flex flex-col items-center justify-center p-3 min-h-[80px] text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-purple-200 hover:bg-white/70 cursor-pointer border border-transparent rounded-md relative z-10 w-full h-auto"
                              >
                                <div className="flex flex-col items-center space-y-1 pointer-events-none">
                                  {getGroupIcon(key)}
                                  <span className="text-center leading-tight text-[10px] sm:text-xs">
                                    {group.name}
                                  </span>
                                </div>
                              </TabsTrigger>
                            )
                          )}
                        </div>
                      </TabsList>
                    </div>

                    {/* 参数内容区域 */}
                    {Object.entries(functionsData.parameter_groups).map(
                      ([groupKey, group]) => (
                        <ParameterGroup
                          key={groupKey}
                          groupKey={groupKey}
                          group={group}
                          parameters={parameters}
                          peopleTypes={peopleTypes}
                          onParameterChange={handleParameterChange}
                          onArrayParameterChange={handleArrayParameterChange}
                          getGroupDescription={getGroupDescription}
                        />
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

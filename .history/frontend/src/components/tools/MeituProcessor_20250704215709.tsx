"use client";

import { useState, useEffect, memo, useRef } from "react";
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

// 分组描述 - 移到组件外部作为常量
const GROUP_DESCRIPTIONS = {
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
};

// 简化的参数控制组件 - React编译器会自动优化
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
    // React编译器会自动优化这些函数
    const handleChange = (value: number) => {
      onParameterChange(paramKey, value);
    };

    const handleArrayChange = (index: number, value: number) => {
      onArrayParameterChange(paramKey, index, value);
    };

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

// 简化的数组滑块项组件
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
    const handleChange = (newValue: number) => {
      onChange(index, newValue);
    };

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

// 简化的数组选择项组件
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
    const handleChange = (newValue: string) => {
      onChange(index, parseInt(newValue));
    };

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

// 简化的参数组组件
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
  // 性能监控
  const renderCount = useRef(0);
  renderCount.current += 1;

  // 状态管理
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedImage, setSelectedImage] = useState<string>(
    PRESET_IMAGES[0].url
  );
  const [customImage, setCustomImage] = useState<string>("");
  const [parameters, setParameters] = useState<
    Record<string, number | number[]>
  >({});
  const [presetId, setPresetId] = useState<string>("MTyunxiu1c68684d55");

  // 加载参数配置
  const [functionsData, setFunctionsData] =
    useState<MeituFunctionsResponse | null>(null);
  const [peopleTypes, setPeopleTypes] = useState<PeopleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // 轮询状态
  const [isPolling, setIsPolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);

  // 开发模式性能监控
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(`MeituProcessor 渲染次数: ${renderCount.current}`);
    }
  });

  // 加载函数配置
  useEffect(() => {
    const loadFunctions = async () => {
      try {
        const data = await api.getMeituFunctions();
        setFunctionsData(data);
        setPeopleTypes(data.people_types);

        // 初始化参数默认值
        const initialParams: Record<string, number | number[]> = {};
        Object.entries(data.parameter_groups).forEach(([groupKey, group]) => {
          Object.entries(group.parameters).forEach(([paramKey, config]) => {
            if (config.type.includes("array")) {
              initialParams[paramKey] = new Array(
                data.people_types.length
              ).fill(0);
            } else {
              initialParams[paramKey] = 0;
            }
          });
        });
        setParameters(initialParams);
      } catch (error) {
        console.error("加载函数配置失败:", error);
        toast.error("加载函数配置失败");
      }
    };

    loadFunctions();
  }, []);

  // 参数变化处理函数 - React编译器会自动优化
  const handleParameterChange = (key: string, value: number) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  // 数组参数变化处理函数 - React编译器会自动优化
  const handleArrayParameterChange = (
    key: string,
    index: number,
    value: number
  ) => {
    setParameters((prev) => {
      const currentArray = (prev[key] as number[]) || [];
      const newArray = [...currentArray];
      newArray[index] = value;
      return { ...prev, [key]: newArray };
    });
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    setIsPolling(true);
    setPollingProgress(0);

    const maxAttempts = 60; // 最多轮询60次
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        setPollingProgress((attempts / maxAttempts) * 100);

        const status = await api.getMeituTaskStatus(taskId);

        if (status.status === "completed") {
          setResult(status.result_url);
          setIsPolling(false);
          toast.success("图片处理完成！");
          return;
        } else if (status.status === "failed") {
          setIsPolling(false);
          toast.error("图片处理失败");
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // 2秒后继续轮询
        } else {
          setIsPolling(false);
          toast.error("处理超时，请重试");
        }
      } catch (error) {
        console.error("轮询状态失败:", error);
        setIsPolling(false);
        toast.error("获取处理状态失败");
      }
    };

    poll();
  };

  // 预设模式处理
  const handlePresetSubmit = async () => {
    if (!presetId) {
      toast.error("请选择预设ID");
      return;
    }

    const imageUrl = customImage || selectedImage;
    if (!imageUrl) {
      toast.error("请选择或输入图片URL");
      return;
    }

    setLoading(true);
    setResult(null);
    setTaskId(null);

    try {
      const response = await api.processMeituPreset(imageUrl, presetId);
      setTaskId(response.task_id);

      // 开始轮询
      await pollTaskStatus(response.task_id);
    } catch (error) {
      console.error("预设处理失败:", error);
      toast.error("预设处理失败");
    } finally {
      setLoading(false);
    }
  };

  // 自定义参数处理
  const handleCustomSubmit = async () => {
    const imageUrl = customImage || selectedImage;
    if (!imageUrl) {
      toast.error("请选择或输入图片URL");
      return;
    }

    setLoading(true);
    setResult(null);
    setTaskId(null);

    try {
      const response = await api.processMeituCustom(imageUrl, parameters);
      setTaskId(response.task_id);

      // 开始轮询
      await pollTaskStatus(response.task_id);
    } catch (error) {
      console.error("自定义处理失败:", error);
      toast.error("自定义处理失败");
    } finally {
      setLoading(false);
    }
  };

  // 重置参数
  const resetParameters = () => {
    if (!functionsData) return;

    const initialParams: Record<string, number | number[]> = {};
    Object.entries(functionsData.parameter_groups).forEach(
      ([groupKey, group]) => {
        Object.entries(group.parameters).forEach(([paramKey, config]) => {
          if (config.type.includes("array")) {
            initialParams[paramKey] = new Array(peopleTypes.length).fill(0);
          } else {
            initialParams[paramKey] = 0;
          }
        });
      }
    );
    setParameters(initialParams);
    toast.success("参数已重置");
  };

  // 获取分组描述 - React编译器会自动优化
  const getGroupDescription = (groupKey: string): string => {
    return (
      GROUP_DESCRIPTIONS[groupKey as keyof typeof GROUP_DESCRIPTIONS] ||
      "专业的图片处理参数"
    );
  };

  // 获取分组图标 - React编译器会自动优化
  const getGroupIcon = (groupKey: string) => {
    if (groupKey.includes("ai_quality")) return <Zap className="h-3 w-3" />;
    if (groupKey.includes("ai_color")) return <Palette className="h-3 w-3" />;
    if (groupKey.includes("hsl")) return <Sparkles className="h-3 w-3" />;
    if (groupKey.includes("basic")) return <Settings className="h-3 w-3" />;
    if (groupKey.includes("face")) return <ImageIcon className="h-3 w-3" />;
    return <Settings className="h-3 w-3" />;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">美图云修处理器</h1>
        <p className="text-gray-600">
          支持预设ID快速处理和全参数精细调节两种模式
        </p>
      </div>

      {/* 模式选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            处理模式
          </CardTitle>
          <CardDescription>
            选择预设ID模式快速处理，或使用自定义参数进行精细调节
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as "preset" | "custom")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">预设ID模式</TabsTrigger>
              <TabsTrigger value="custom">自定义参数模式</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* 图片选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            图片选择
          </CardTitle>
          <CardDescription>选择预设图片或输入自定义图片URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 预设图片网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {PRESET_IMAGES.map((image) => (
              <div
                key={image.id}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 ${
                  selectedImage === image.url
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => {
                  setSelectedImage(image.url);
                  setCustomImage("");
                }}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-white text-xs font-medium">{image.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 自定义图片URL */}
          <div className="space-y-2">
            <Label htmlFor="custom-image">自定义图片URL</Label>
            <Input
              id="custom-image"
              type="url"
              placeholder="输入图片URL..."
              value={customImage}
              onChange={(e) => {
                setCustomImage(e.target.value);
                if (e.target.value) {
                  setSelectedImage("");
                }
              }}
            />
          </div>

          {/* 当前选择的图片预览 */}
          {(selectedImage || customImage) && (
            <div className="space-y-2">
              <Label>当前选择的图片</Label>
              <div className="relative max-w-md">
                <img
                  src={customImage || selectedImage}
                  alt="当前选择"
                  className="w-full rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    toast.error("图片加载失败，请检查URL");
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预设ID模式 */}
      {mode === "preset" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              预设ID处理
            </CardTitle>
            <CardDescription>
              使用预设ID快速处理图片，一键应用专业效果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preset-id">预设ID</Label>
              <Select value={presetId} onValueChange={setPresetId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择预设ID" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MTyunxiu1c68684d55">
                    MTyunxiu1c68684d55 - 标准云修
                  </SelectItem>
                  <SelectItem value="MTyunxiu2a34567b89">
                    MTyunxiu2a34567b89 - 人像优化
                  </SelectItem>
                  <SelectItem value="MTyunxiu3c91234def">
                    MTyunxiu3c91234def - 风景增强
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handlePresetSubmit}
              disabled={loading || isPolling}
              className="w-full"
            >
              {loading || isPolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPolling ? "处理中..." : "提交中..."}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  开始处理
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 自定义参数模式 */}
      {mode === "custom" && functionsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              自定义参数调节
            </CardTitle>
            <CardDescription>
              精细调节各项参数，打造个性化处理效果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 参数控制按钮 */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={resetParameters}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                重置参数
              </Button>
              <Badge variant="secondary" className="flex items-center gap-1">
                <span>参数总数:</span>
                <span className="font-mono">
                  {Object.keys(functionsData.parameter_groups).reduce(
                    (total, groupKey) =>
                      total +
                      Object.keys(
                        functionsData.parameter_groups[groupKey].parameters
                      ).length,
                    0
                  )}
                </span>
              </Badge>
            </div>

            {/* 参数分组标签页 */}
            <Tabs
              defaultValue={Object.keys(functionsData.parameter_groups)[0]}
              className="w-full"
            >
              <div className="overflow-x-auto">
                <TabsList className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1 h-auto p-1">
                  {Object.entries(functionsData.parameter_groups).map(
                    ([key, group]) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="flex flex-col items-center gap-1 p-2 h-auto text-xs whitespace-normal"
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
                </TabsList>
              </div>

              {/* 参数组内容 */}
              <div className="mt-6">
                {Object.entries(functionsData.parameter_groups).map(
                  ([key, group]) => (
                    <ParameterGroup
                      key={key}
                      groupKey={key}
                      group={group}
                      parameters={parameters}
                      peopleTypes={peopleTypes}
                      onParameterChange={handleParameterChange}
                      onArrayParameterChange={handleArrayParameterChange}
                      getGroupDescription={getGroupDescription}
                    />
                  )
                )}
              </div>
            </Tabs>

            {/* 提交按钮 */}
            <Button
              onClick={handleCustomSubmit}
              disabled={loading || isPolling}
              className="w-full"
            >
              {loading || isPolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPolling ? "处理中..." : "提交中..."}
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  开始处理
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 处理进度 */}
      {isPolling && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              处理进度
            </CardTitle>
            <CardDescription>正在处理图片，请稍候...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>处理进度</span>
                <span>{Math.round(pollingProgress)}%</span>
              </div>
              <Progress value={pollingProgress} className="w-full" />
              {taskId && (
                <p className="text-xs text-gray-500">任务ID: {taskId}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 处理结果 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              处理结果
            </CardTitle>
            <CardDescription>
              图片处理完成，您可以查看和下载结果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-2xl mx-auto">
              <img
                src={result}
                alt="处理结果"
                className="w-full rounded-lg border border-gray-200 shadow-sm"
              />
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => window.open(result, "_blank")}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                下载图片
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 功能说明 */}
      <Alert>
        <ImageIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>使用说明：</strong>
          <br />• <strong>预设ID模式：</strong>
          选择预设ID，一键应用专业效果，适合快速处理
          <br />• <strong>自定义参数模式：</strong>
          精细调节200+个参数，打造个性化效果
          <br />
          • 支持多种图片格式，处理时间约30-60秒
          <br />• 数组参数支持针对不同人群类型进行独立调节
        </AlertDescription>
      </Alert>
    </div>
  );
}

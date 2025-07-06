"use client";

import {
  useState,
  useEffect,
  memo,
  useCallback,
  useMemo,
  useTransition,
  useDeferredValue,
} from "react";
import {
  api,
  MeituFunctionsResponse,
  ParameterConfig,
  PeopleType,
} from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  ImageComparison,
  ImageDisplay,
} from "@/components/ui/image-comparison";
import {
  Images,
  Settings,
  Sparkles,
  Loader2,
  Download,
  Trash2,
  Palette,
  Zap,
  User,
  Eye,
  Heart,
  Smile,
  Scissors,
  Brush,
  Sliders,
} from "lucide-react";

// 预设图片数据
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

// 分组描述
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

// 获取分组图标
const getGroupIcon = (groupKey: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    ai_quality: <Sparkles className="h-4 w-4" />,
    ai_color: <Palette className="h-4 w-4" />,
    hsl_adjustment: <Sliders className="h-4 w-4" />,
    basic_adjustment: <Settings className="h-4 w-4" />,
    face_optimization: <Smile className="h-4 w-4" />,
    face_shape: <User className="h-4 w-4" />,
    skin_color: <Brush className="h-4 w-4" />,
    skin_smoothing: <Eye className="h-4 w-4" />,
    body_shape: <Scissors className="h-4 w-4" />,
    body_optimization: <Zap className="h-4 w-4" />,
    hair_adjustment: <Brush className="h-4 w-4" />,
    facial_features: <Heart className="h-4 w-4" />,
    teeth_whitening: <Smile className="h-4 w-4" />,
    makeup_adjustment: <Palette className="h-4 w-4" />,
    other_settings: <Settings className="h-4 w-4" />,
  };
  return iconMap[groupKey] || <Settings className="h-4 w-4" />;
};

// 防抖Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 优化的参数管理Hook
function useOptimizedParameters(initialParams: {
  [key: string]: number | number[];
}) {
  const [parameters, setParameters] = useState(initialParams);
  const [isPending, startTransition] = useTransition();

  // 使用防抖来减少更新频率
  const debouncedParameters = useDebounce(parameters, 100);

  // 延迟更新非关键的参数显示
  const deferredParameters = useDeferredValue(debouncedParameters);

  const updateParameter = useCallback((key: string, value: number) => {
    startTransition(() => {
      setParameters((prev) => ({ ...prev, [key]: value }));
    });
  }, []);

  const updateArrayParameter = useCallback(
    (key: string, index: number, value: number) => {
      startTransition(() => {
        setParameters((prev) => {
          const current = prev[key] as number[];
          const newArray = [...current];
          newArray[index] = value;
          return { ...prev, [key]: newArray };
        });
      });
    },
    []
  );

  const resetParameters = useCallback(
    (newParams: { [key: string]: number | number[] }) => {
      startTransition(() => {
        setParameters(newParams);
      });
    },
    []
  );

  return {
    parameters: deferredParameters,
    updateParameter,
    updateArrayParameter,
    resetParameters,
    isPending,
  };
}

// 优化的参数控制组件
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
    // 使用 useMemo 缓存计算结果
    const memoizedValue = useMemo(() => currentValue, [currentValue]);

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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{config.label}</Label>
              <span className="text-sm text-muted-foreground">
                {memoizedValue as number}
              </span>
            </div>
            <Slider
              value={[memoizedValue as number]}
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
          <div className="space-y-3">
            <Label className="text-sm font-medium">{config.label}</Label>
            <Select
              value={(memoizedValue as number)?.toString()}
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
            <Label className="text-sm font-medium">{config.label}</Label>
            <div className="space-y-2">
              {peopleTypes.map((person, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {person.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(memoizedValue as number[])[index]}
                    </span>
                  </div>
                  <Slider
                    value={[(memoizedValue as number[])[index]]}
                    onValueChange={(value) =>
                      handleArrayChange(index, value[0])
                    }
                    min={config.min}
                    max={config.max}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "array_select":
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium">{config.label}</Label>
            <div className="space-y-2">
              {peopleTypes.map((person, index) => (
                <div key={index} className="space-y-2">
                  <span className="text-xs text-muted-foreground">
                    {person.name}
                  </span>
                  <Select
                    value={(memoizedValue as number[])[index]?.toString()}
                    onValueChange={(value) =>
                      handleArrayChange(index, parseInt(value))
                    }
                  >
                    <SelectTrigger>
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
  }
);

ParameterControl.displayName = "ParameterControl";

export default function MeituProcessor() {
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [customImage, setCustomImage] = useState<string>("");
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [presetId, setPresetId] = useState<string>("MTPLaitck9iliehdjl");
  const [functionsData, setFunctionsData] =
    useState<MeituFunctionsResponse | null>(null);
  const [peopleTypes, setPeopleTypes] = useState<PeopleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [isPolling, setIsPolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState(0);
  const [imageDrawerOpen, setImageDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

  // 使用优化的参数管理
  const {
    parameters,
    updateParameter,
    updateArrayParameter,
    resetParameters,
    isPending: isParametersPending,
  } = useOptimizedParameters({});

  useEffect(() => {
    loadFunctions();
  }, []);

  const loadFunctions = useCallback(async () => {
    try {
      const response = await api.getMeituFunctions();
      setFunctionsData(response);
      setPeopleTypes(response.people_types);

      // 初始化参数
      const initialParams: { [key: string]: number | number[] } = {};
      Object.entries(response.parameter_groups).forEach(([, group]) => {
        Object.entries(group.parameters).forEach(([paramKey, config]) => {
          if (
            config.type === "array_slider" ||
            config.type === "array_select"
          ) {
            initialParams[paramKey] = response.people_types.map(() =>
              typeof config.default === "number" ? config.default : 0
            );
          } else {
            initialParams[paramKey] =
              typeof config.default === "number" ? config.default : 0;
          }
        });
      });
      resetParameters(initialParams);
    } catch {
      toast.error("加载功能配置失败");
    }
  }, [resetParameters]);

  const pollTaskStatus = useCallback(async (taskId: string) => {
    setIsPolling(true);
    setPollingProgress(0);

    const poll = async () => {
      try {
        const response = await api.getMeituTaskStatus(taskId);

        if (response && response.status === "completed") {
          setResult(response.result?.processed_image || "");
          setIsPolling(false);
          setPollingProgress(100);
          toast.success("图片处理完成！");
        } else if (response && response.status === "failed") {
          setIsPolling(false);
          toast.error("图片处理失败");
        } else {
          // 继续轮询，简单递增进度
          setPollingProgress((prev) => Math.min(prev + 10, 90));
          setTimeout(poll, 2000);
        }
      } catch {
        setIsPolling(false);
        toast.error("获取处理状态失败");
      }
    };

    poll();
  }, []);

  const handlePresetSubmit = useCallback(async () => {
    if (!selectedImage && !customImage) {
      toast.error("请先选择图片");
      return;
    }

    setLoading(true);
    setResult("");
    try {
      const response = await api.processMeituImageWithPresetUrl(
        customImage || selectedImage,
        presetId
      );
      pollTaskStatus(response.task_id);
    } catch {
      toast.error("提交处理任务失败");
    } finally {
      setLoading(false);
    }
  }, [selectedImage, customImage, presetId, pollTaskStatus]);

  const handleCustomSubmit = useCallback(async () => {
    if (!selectedImage && !customImage) {
      toast.error("请先选择图片");
      return;
    }

    setLoading(true);
    setResult("");
    try {
      const response = await api.processMeituImageWithUrl({
        imageUrl: customImage || selectedImage,
        ...parameters,
      });
      pollTaskStatus(response.task_id);
    } catch {
      toast.error("提交处理任务失败");
    } finally {
      setLoading(false);
    }
  }, [selectedImage, customImage, parameters, pollTaskStatus]);

  const handleResetParameters = useCallback(() => {
    if (!functionsData) return;

    const initialParams: { [key: string]: number | number[] } = {};
    Object.entries(functionsData.parameter_groups).forEach(([, group]) => {
      Object.entries(group.parameters).forEach(([paramKey, config]) => {
        if (config.type === "array_slider" || config.type === "array_select") {
          initialParams[paramKey] = peopleTypes.map(() =>
            typeof config.default === "number" ? config.default : 0
          );
        } else {
          initialParams[paramKey] =
            typeof config.default === "number" ? config.default : 0;
        }
      });
    });
    resetParameters(initialParams);
    toast.success("参数已重置");
  }, [functionsData, peopleTypes, resetParameters]);

  const currentImageUrl = customImage || selectedImage;

  // 使用 useMemo 缓存参数组件列表
  const parameterGroups = useMemo(() => {
    if (!functionsData) return null;

    return Object.entries(functionsData.parameter_groups).map(
      ([groupKey, group]) => (
        <div key={groupKey} className="border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            {getGroupIcon(groupKey)}
            <h4 className="text-sm font-medium">{group.name}</h4>
          </div>
          <div className="space-y-4">
            {Object.entries(group.parameters).map(([paramKey, config]) => (
              <ParameterControl
                key={paramKey}
                paramKey={paramKey}
                config={config}
                currentValue={
                  parameters[paramKey] ||
                  (typeof config.default === "number" ? config.default : 0)
                }
                peopleTypes={peopleTypes}
                onParameterChange={updateParameter}
                onArrayParameterChange={updateArrayParameter}
              />
            ))}
          </div>
        </div>
      )
    );
  }, [
    functionsData,
    parameters,
    peopleTypes,
    updateParameter,
    updateArrayParameter,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* 顶部工具栏 */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImageDrawerOpen(true)}
              className="flex items-center gap-2"
            >
              <Images className="h-4 w-4" />
              选择图片
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsDrawerOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              参数设置
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {mode === "preset" ? "预设模式" : "自定义模式"}
            </Badge>
            {(loading || isPolling || isParametersPending) && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {isPolling
                    ? `处理中 ${Math.round(pollingProgress)}%`
                    : isParametersPending
                    ? "参数更新中..."
                    : "提交中..."}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="pt-16 p-4">
        <div className="max-w-6xl mx-auto">
          {/* 图片显示区域 */}
          <div
            className="relative w-full"
            style={{ height: "calc(100vh - 8rem)" }}
          >
            {!currentImageUrl && !result && (
              <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center space-y-4">
                  <Images className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="text-lg font-medium text-muted-foreground">
                      选择图片开始处理
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      点击左上角&quot;选择图片&quot;按钮
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentImageUrl && !result && (
              <ImageDisplay
                src={currentImageUrl}
                alt="待处理图片"
                className="h-full"
              />
            )}

            {currentImageUrl && result && (
              <ImageComparison
                beforeImage={currentImageUrl}
                afterImage={result}
                className="h-full"
              />
            )}

            {/* 处理进度条 */}
            {isPolling && (
              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span>正在处理图片...</span>
                      <span>{Math.round(pollingProgress)}%</span>
                    </div>
                    <Progress value={pollingProgress} className="h-2" />
                  </div>
                </div>
              </div>
            )}

            {/* 下载按钮 */}
            {result && (
              <div className="absolute top-4 right-4">
                <Button
                  onClick={() => window.open(result, "_blank")}
                  className="bg-primary/90 hover:bg-primary backdrop-blur-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载结果
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图片选择抽屉 */}
      <Drawer
        open={imageDrawerOpen}
        onClose={() => setImageDrawerOpen(false)}
        side="left"
        className="w-80"
      >
        <DrawerHeader>
          <DrawerTitle>选择图片</DrawerTitle>
          <DrawerDescription>选择预设图片或输入自定义图片URL</DrawerDescription>
        </DrawerHeader>

        <DrawerContent>
          <div className="space-y-6">
            {/* 预设图片 */}
            <div>
              <h3 className="text-sm font-medium mb-3">预设图片</h3>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_IMAGES.map((image) => (
                  <div
                    key={image.id}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 ${
                      selectedImage === image.url
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setSelectedImage(image.url);
                      setCustomImage("");
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium">
                        {image.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 自定义URL */}
            <div>
              <h3 className="text-sm font-medium mb-3">自定义图片URL</h3>
              <Input
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

            {/* 当前选择预览 */}
            {(selectedImage || customImage) && (
              <div>
                <h3 className="text-sm font-medium mb-3">当前选择</h3>
                <div className="aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={customImage || selectedImage}
                    alt="当前选择"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      toast.error("图片加载失败，请检查URL");
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* 参数设置抽屉 */}
      <Drawer
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        side="right"
        className="w-80"
      >
        <DrawerHeader>
          <DrawerTitle>参数设置</DrawerTitle>
          <DrawerDescription>选择处理模式并调整参数</DrawerDescription>
        </DrawerHeader>

        <DrawerContent>
          <div className="space-y-6">
            {/* 模式选择 */}
            <div>
              <h3 className="text-sm font-medium mb-3">处理模式</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={mode === "preset" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("preset")}
                  className="justify-start"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  预设模式
                </Button>
                <Button
                  variant={mode === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("custom")}
                  className="justify-start"
                >
                  <Sliders className="h-4 w-4 mr-2" />
                  自定义模式
                </Button>
              </div>
            </div>

            {/* 预设模式 */}
            {mode === "preset" && (
              <div>
                <h3 className="text-sm font-medium mb-3">预设选择</h3>
                <Select value={presetId} onValueChange={setPresetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择预设" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* 通用预设 */}
                    <SelectItem value="MTPLaitck9iliehdjl">通用</SelectItem>
                    <SelectItem value="MTyunxiu1ec89c0754">婚纱</SelectItem>
                    <SelectItem value="MTyunxiu1b0f2f1ef4">儿童</SelectItem>
                    <SelectItem value="MTyunxiu18999e08b4">亲子</SelectItem>
                    <SelectItem value="MTyunxiu1ac5500f04">孕妇</SelectItem>
                    <SelectItem value="MTyunxiu1cf002d724">人像写真</SelectItem>
                    <SelectItem value="MTyunxiu1cc6fb8b44">闺蜜写真</SelectItem>
                    <SelectItem value="MTyunxiu150ef1fef4">证件照</SelectItem>
                    <SelectItem value="MTyunxiu1373acc5c4">毕业照</SelectItem>

                    {/* 肤质预设 */}
                    <SelectItem value="MTPLh2gafom51mn8ri">肤质</SelectItem>
                    <SelectItem value="MTyunxiu1a1cf5ec14">原肤</SelectItem>
                    <SelectItem value="MTyunxiu1e6d832634">质感肌</SelectItem>
                    <SelectItem value="MTyunxiu1e2b7807c4">磨皮</SelectItem>
                    <SelectItem value="MTyunxiu1d8edfbaa4">奶油肌</SelectItem>
                    <SelectItem value="MTyunxiu1e7746b4c4">透亮肌</SelectItem>

                    {/* 婚纱预设 */}
                    <SelectItem value="MTPLyfzcuff3nd258a">婚纱</SelectItem>
                    <SelectItem value="MTyunxiu114c15dfe4">黑色内景</SelectItem>
                    <SelectItem value="MTyunxiu1d0470e514">白色内景</SelectItem>
                    <SelectItem value="MTyunxiu19f034b8e4">灰色内景</SelectItem>
                    <SelectItem value="MTyunxiu171723cba4">中式</SelectItem>
                    <SelectItem value="MTyunxiu136caecb24">清新韩式</SelectItem>
                    <SelectItem value="MTyunxiu1a6a57aca4">森系园林</SelectItem>
                    <SelectItem value="MTyunxiu1f55e3ebb4">蓝色大海</SelectItem>
                    <SelectItem value="MTyunxiu11306c72c4">璀璨夜景</SelectItem>
                    {/* 自定义 */}
                    <SelectItem value="MTyunxiu1c68684d55">牙齿贴面</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 自定义模式 */}
            {mode === "custom" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">参数调节</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetParameters}
                    className="h-8 px-2"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    重置
                  </Button>
                </div>

                <div className="space-y-4">
                  {isParametersPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      参数更新中...
                    </div>
                  )}
                  {parameterGroups}
                </div>
              </div>
            )}

            {/* 处理按钮 */}
            <div className="border-t pt-4">
              <Button
                onClick={
                  mode === "preset" ? handlePresetSubmit : handleCustomSubmit
                }
                disabled={
                  loading || isPolling || (!selectedImage && !customImage)
                }
                className="w-full"
                size="lg"
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
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

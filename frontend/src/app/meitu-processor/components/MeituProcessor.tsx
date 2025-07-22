"use client";

import NextImage from "next/image";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Compare } from "@/components/ui/compare";
import { BlurFade } from "@/components/magicui/blur-fade";

import { BorderBeam } from "@/components/magicui/border-beam";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { ShinyButton } from "@/components/magicui/shiny-button";
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
import { NeonGradientCard } from "@/components/magicui/neon-gradient-card";
import { ImagePicker } from "@/components/ui/image-picker";

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
    url: "https://jwsmed-test.oss-cn-hangzhou.aliyuncs.com/res/resource/manager/resource/93345342c2ba4e949cfa8af898451923.jpeg",
    name: "示例图片 5",
  },
  {
    id: 6,
    url: "https://jwsmed-test.oss-cn-hangzhou.aliyuncs.com/res/resource/manager/resource/4a368b891dc14d5fbb3209944c053891.jpg",
    name: "示例图片 6",
  },
];

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

// 懒加载的参数组组件
const LazyParameterGroup = memo(
  ({
    groupKey,
    group,
    parameters,
    peopleTypes,
    updateParameter,
    updateArrayParameter,
  }: {
    groupKey: string;
    group: { name: string; parameters: { [key: string]: ParameterConfig } };
    parameters: { [key: string]: number | number[] };
    peopleTypes: PeopleType[];
    updateParameter: (key: string, value: number) => void;
    updateArrayParameter: (key: string, index: number, value: number) => void;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className="border rounded-lg p-3">
        <div
          className="flex items-center gap-2 mb-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {getGroupIcon(groupKey)}
          <h4 className="text-sm font-medium">{group.name}</h4>
          <div className="ml-auto">{isExpanded ? "▼" : "▶"}</div>
        </div>
        {isExpanded && (
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
        )}
      </div>
    );
  }
);

LazyParameterGroup.displayName = "LazyParameterGroup";

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
  const [selectedImage, setSelectedImage] = useState("");
  const [customImage, setCustomImage] = useState("");

  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [presetId, setPresetId] = useState("MTyunxiu1c68684d55");
  const [functionsData, setFunctionsData] =
    useState<MeituFunctionsResponse | null>(null);
  const [peopleTypes, setPeopleTypes] = useState<PeopleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState(0);
  const [imageDrawerOpen, setImageDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 模式切换的性能优化
  const [isModeTransition, startModeTransition] = useTransition();
  const deferredMode = useDeferredValue(mode);

  // 使用优化的参数管理
  const {
    parameters,
    updateParameter,
    updateArrayParameter,
    resetParameters,
    isPending: isParametersPending,
  } = useOptimizedParameters({});

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

  useEffect(() => {
    loadFunctions();
  }, [loadFunctions]);

  const pollTaskStatus = useCallback(async (taskId: string) => {
    setIsPolling(true);
    setPollingProgress(0);
    let pollCount = 0;
    const maxPollCount = 30; // 最多轮询30次（60秒）

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
          pollCount++;
          if (pollCount >= maxPollCount) {
            setIsPolling(false);
            toast.error("处理超时，请重试");
            return;
          }
          setPollingProgress((prev) => Math.min(prev + 10, 90));
          setTimeout(poll, 2000);
        }
      } catch (error: unknown) {
        setIsPolling(false);

        // 检查是否是404错误（任务不存在）
        const isNotFound =
          (error as { response?: { status?: number } })?.response?.status ===
          404;

        if (isNotFound) {
          toast.error("任务不存在，可能处理请求失败");
        } else {
          const errorMessage =
            (
              error as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            )?.response?.data?.message ||
            (error as { message?: string })?.message ||
            "获取处理状态失败";
          toast.error(errorMessage);
        }

        console.error("轮询错误:", error);
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

      // 检查是否有错误或task_id为空
      if (response.error || !response.task_id) {
        toast.error(response.error || "提交处理任务失败");
        return;
      }

      // 只有成功获取到task_id才开始轮询
      pollTaskStatus(response.task_id);
    } catch (error: unknown) {
      // 显示具体的错误信息
      const errorMessage =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "提交处理任务失败";
      toast.error(errorMessage);
      console.error("预设处理错误:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedImage, customImage, presetId, pollTaskStatus]);

  const handleImageSelect = useCallback(async (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("图片文件不能超过10MB");
      return;
    }

    setUploadingImage(true);

    try {
      // 清理之前的状态
      setResult("");

      // 创建本地预览URL
      const localPreviewUrl = URL.createObjectURL(file);

      // 先设置本地预览，让用户立即看到图片
      setCustomImage(localPreviewUrl);
      setSelectedImage(""); // 清空预设图片选择

      // 上传到Telegraph图床获取URL（美图API需要）
      const response = await api.uploadImageToTelegraph(file);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      // 上传成功，更新为图床URL（用于美图API调用）
      setCustomImage(response.image_url);

      console.log("本地预览URL:", localPreviewUrl);
      console.log("图床URL（用于API）:", response.image_url);
      toast.success("图片上传成功！");
    } catch (error) {
      console.error("上传图片失败:", error);
      toast.error("上传图片失败，请重试");
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const handleCustomSubmit = useCallback(async () => {
    if (!selectedImage && !customImage) {
      toast.error("请先选择图片");
      return;
    }

    setLoading(true);
    setResult("");
    try {
      // 统一使用URL处理API（因为所有图片都已经上传到图床获取了URL）
      const response = await api.processMeituImageWithUrl({
        imageUrl: customImage || selectedImage,
        ...parameters,
      });

      // 检查是否有错误或task_id为空
      if (response.error || !response.task_id) {
        toast.error(response.error || "提交处理任务失败");
        return;
      }

      // 只有成功获取到task_id才开始轮询
      pollTaskStatus(response.task_id);
    } catch (error: unknown) {
      // 显示具体的错误信息
      const errorMessage =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "提交处理任务失败";
      toast.error(errorMessage);
      console.error("自定义处理错误:", error);
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

  // 计算图片在容器中的实际尺寸（保持宽高比）
  const calculateImageDimensions = useCallback((img: HTMLImageElement) => {
    const containerHeight = window.innerHeight - 32; // 减去padding
    const containerWidth = Math.min(1536, window.innerWidth - 32); // max-w-6xl 和 padding

    const imageAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth: number;
    let displayHeight: number;

    if (imageAspectRatio > containerAspectRatio) {
      // 图片更宽，以宽度为准
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
    } else {
      // 图片更高，以高度为准
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
    }

    return {
      width: displayWidth,
      height: displayHeight,
    };
  }, []);

  // 当图片URL改变时，加载图片并计算尺寸
  useEffect(() => {
    if (!currentImageUrl) {
      setImageDimensions(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const dimensions = calculateImageDimensions(img);
      setImageDimensions(dimensions);
    };
    img.onerror = () => {
      setImageDimensions(null);
    };
    img.src = currentImageUrl;
  }, [currentImageUrl, calculateImageDimensions]);

  // 监听窗口大小变化，重新计算尺寸
  useEffect(() => {
    if (!currentImageUrl || !imageDimensions) return;

    const handleResize = () => {
      const img = new Image();
      img.onload = () => {
        const dimensions = calculateImageDimensions(img);
        setImageDimensions(dimensions);
      };
      img.src = currentImageUrl;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentImageUrl, imageDimensions, calculateImageDimensions]);

  // 使用 useMemo 缓存参数组件列表，只在自定义模式时渲染，使用懒加载组件
  const parameterGroups = useMemo(() => {
    if (!functionsData || deferredMode !== "custom") return null;

    return Object.entries(functionsData.parameter_groups).map(
      ([groupKey, group]) => (
        <LazyParameterGroup
          key={groupKey}
          groupKey={groupKey}
          group={group}
          parameters={parameters}
          peopleTypes={peopleTypes}
          updateParameter={updateParameter}
          updateArrayParameter={updateArrayParameter}
        />
      )
    );
  }, [
    functionsData,
    deferredMode,
    parameters,
    peopleTypes,
    updateParameter,
    updateArrayParameter,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* 主内容区域 */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* 图片显示区域 */}
          <div
            className="relative w-full"
            style={{ height: "calc(100vh - 2rem)" }}
          >
            {!currentImageUrl && !result && (
              <NeonGradientCard>
                <div className="relative flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <Images className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                      <p className="text-lg font-medium text-muted-foreground">
                        选择图片开始处理
                      </p>
                    </div>
                  </div>
                </div>
              </NeonGradientCard>
            )}

            {currentImageUrl && !result && (
              <div className="flex items-center justify-center h-full">
                <div className="relative rounded-lg overflow-hidden">
                  <NextImage
                    src={currentImageUrl}
                    alt="待处理图片"
                    width={imageDimensions?.width || 800}
                    height={imageDimensions?.height || 600}
                    className="object-contain rounded-lg"
                    style={{
                      width: imageDimensions?.width || "auto",
                      height: imageDimensions?.height || "auto",
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }}
                  />
                  <BorderBeam
                    size={500}
                    duration={8}
                    className="rounded-lg"
                    borderWidth={4}
                  />
                </div>
              </div>
            )}

            {currentImageUrl && result && (
              <div className="flex items-center justify-center h-full">
                <div
                  className="relative rounded-lg overflow-hidden"
                  style={{
                    width: imageDimensions?.width || "auto",
                    height: imageDimensions?.height || "auto",
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                >
                  <Compare
                    firstImage={result}
                    secondImage={currentImageUrl}
                    className="w-full h-full rounded-lg"
                    slideMode="hover"
                    showHandlebar={true}
                    autoplay={true}
                  />
                  <BorderBeam
                    size={500}
                    duration={8}
                    className="rounded-lg z-1000"
                    borderWidth={4}
                  />
                  <BorderBeam
                    duration={8}
                    delay={4}
                    size={500}
                    borderWidth={4}
                    className="rounded-lg z-1000"
                  />
                </div>
              </div>
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

            {/* 浮动操作按钮 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20">
              {/* 下载按钮 */}
              {result && (
                <RainbowButton
                  onClick={() => window.open(result, "_blank")}
                  size="default"
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载结果
                </RainbowButton>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-row gap-4">
                <Sheet open={imageDrawerOpen} onOpenChange={setImageDrawerOpen}>
                  <SheetTrigger asChild>
                    <Button
                      size="icon"
                      className="bg-primary/90 hover:bg-primary backdrop-blur-sm rounded-full"
                    >
                      <Images className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-80 overflow-y-auto"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <SheetHeader>
                      <SheetTitle>选择图片</SheetTitle>
                      <SheetDescription>
                        选择预设图片或输入自定义图片URL
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                      {/* 图片墙 */}
                      <div className="grid grid-cols-3 gap-3">
                        {PRESET_IMAGES.map((image, index) => (
                          <BlurFade
                            key={image.id}
                            delay={0.1 + index * 0.05}
                            inView
                          >
                            <div
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
                              <NextImage
                                src={image.url}
                                alt={image.name}
                                width={120}
                                height={120}
                                className="w-full h-full object-cover"
                                unoptimized={true} // 预设图片可能是静态资源，但为了保险起见跳过优化
                              />
                              {selectedImage === image.url && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                                    <Images className="h-4 w-4" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </BlurFade>
                        ))}
                      </div>

                      <Input
                        type="url"
                        placeholder="输入自定义图片URL..."
                        value={customImage}
                        onChange={(e) => {
                          setCustomImage(e.target.value);
                          if (e.target.value) {
                            setSelectedImage("");
                          }
                        }}
                        className="w-full"
                      />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          或拍照/上传图片
                        </Label>
                        <ImagePicker
                          onImageSelect={handleImageSelect}
                          trigger={
                            <Button
                              variant="outline"
                              className="w-full h-12 flex items-center gap-2"
                              disabled={uploadingImage}
                            >
                              {uploadingImage ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>上传中...</span>
                                </>
                              ) : (
                                <>
                                  <Images className="h-4 w-4" />
                                  <span>选择图片</span>
                                </>
                              )}
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet
                  open={settingsDrawerOpen}
                  onOpenChange={setSettingsDrawerOpen}
                >
                  <SheetTrigger asChild>
                    <Button
                      size="icon"
                      className="bg-primary/90 hover:bg-primary backdrop-blur-sm rounded-full"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 flex flex-col">
                    <SheetHeader>
                      <SheetTitle>参数设置</SheetTitle>
                      <SheetDescription>
                        选择处理模式并调整参数
                      </SheetDescription>
                    </SheetHeader>

                    {/* 可滚动的内容区域 */}
                    <div className="flex flex-col flex-1 mt-6 overflow-hidden">
                      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                        {/* 状态显示 */}
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {mode === "preset" ? "预设模式" : "自定义模式"}
                            {isModeTransition && (
                              <span className="ml-1">切换中...</span>
                            )}
                          </Badge>
                          {(loading ||
                            isPolling ||
                            isParametersPending ||
                            isModeTransition) && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-xs">
                                {isPolling
                                  ? `处理中 ${Math.round(pollingProgress)}%`
                                  : isModeTransition
                                  ? "模式切换中..."
                                  : isParametersPending
                                  ? "参数更新中..."
                                  : "提交中..."}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 模式选择 */}
                        <div>
                          <h3 className="text-sm font-medium mb-3">处理模式</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant={
                                mode === "preset" ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                startModeTransition(() => {
                                  setMode("preset");
                                });
                              }}
                              className="justify-start"
                              disabled={isModeTransition}
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              预设模式
                            </Button>
                            <Button
                              variant={
                                mode === "custom" ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                startModeTransition(() => {
                                  setMode("custom");
                                });
                              }}
                              className="justify-start"
                              disabled={isModeTransition}
                            >
                              <Sliders className="h-4 w-4 mr-2" />
                              自定义模式
                            </Button>
                          </div>
                        </div>

                        {/* 预设模式内容 */}
                        {mode === "preset" && (
                          <div>
                            <h3 className="text-sm font-medium mb-3">
                              预设选择
                            </h3>
                            <Select
                              value={presetId}
                              onValueChange={setPresetId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择预设" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* 通用预设 */}
                                <SelectItem value="MTyunxiu1ec89c0754">
                                  婚纱
                                </SelectItem>
                                <SelectItem value="MTyunxiu1b0f2f1ef4">
                                  儿童
                                </SelectItem>
                                <SelectItem value="MTyunxiu18999e08b4">
                                  亲子
                                </SelectItem>
                                <SelectItem value="MTyunxiu1ac5500f04">
                                  孕妇
                                </SelectItem>
                                <SelectItem value="MTyunxiu1cf002d724">
                                  人像写真
                                </SelectItem>
                                <SelectItem value="MTyunxiu1cc6fb8b44">
                                  闺蜜写真
                                </SelectItem>
                                <SelectItem value="MTyunxiu150ef1fef4">
                                  证件照
                                </SelectItem>
                                <SelectItem value="MTyunxiu1373acc5c4">
                                  毕业照
                                </SelectItem>

                                {/* 肤质预设 */}
                                <SelectItem value="MTPLh2gafom51mn8ri">
                                  肤质
                                </SelectItem>
                                <SelectItem value="MTyunxiu1a1cf5ec14">
                                  原肤
                                </SelectItem>
                                <SelectItem value="MTyunxiu1e6d832634">
                                  质感肌
                                </SelectItem>
                                <SelectItem value="MTyunxiu1e2b7807c4">
                                  磨皮
                                </SelectItem>
                                <SelectItem value="MTyunxiu1d8edfbaa4">
                                  奶油肌
                                </SelectItem>
                                <SelectItem value="MTyunxiu1e7746b4c4">
                                  透亮肌
                                </SelectItem>

                                {/* 婚纱预设 */}
                                <SelectItem value="MTPLyfzcuff3nd258a">
                                  婚纱
                                </SelectItem>
                                <SelectItem value="MTyunxiu114c15dfe4">
                                  黑色内景
                                </SelectItem>
                                <SelectItem value="MTyunxiu1d0470e514">
                                  白色内景
                                </SelectItem>
                                <SelectItem value="MTyunxiu19f034b8e4">
                                  灰色内景
                                </SelectItem>
                                <SelectItem value="MTyunxiu171723cba4">
                                  中式
                                </SelectItem>
                                <SelectItem value="MTyunxiu1b4a6e6234">
                                  外景
                                </SelectItem>
                                <SelectItem value="MTyunxiu1c68684d55">
                                  牙齿贴面
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* 自定义模式内容 */}
                        {mode === "custom" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium">
                                自定义参数
                              </h3>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetParameters}
                                className="text-xs"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                重置
                              </Button>
                            </div>
                            {isModeTransition ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                  加载参数中...
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {deferredMode === "custom" && parameterGroups}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 固定在底部的处理按钮 */}
                    <div className="pt-4 border-t mt-4">
                      <ShinyButton
                        onClick={
                          mode === "preset"
                            ? handlePresetSubmit
                            : handleCustomSubmit
                        }
                        disabled={loading || isPolling || !currentImageUrl}
                        className="w-full"
                      >
                        {loading || isPolling ? (
                          <span>{isPolling ? "处理中..." : "提交中..."}</span>
                        ) : (
                          <span>开始处理</span>
                        )}
                      </ShinyButton>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

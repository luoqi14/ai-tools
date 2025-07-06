"use client";

import { useState, useEffect, memo } from "react";
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

// 参数控制组件
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
    const handleChange = (value: number) => {
      onParameterChange(paramKey, value);
    };

    const handleArrayChange = (index: number, value: number) => {
      onArrayParameterChange(paramKey, index, value);
    };

    switch (config.type) {
      case "slider":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{config.label}</Label>
              <span className="text-sm text-muted-foreground">
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
          <div className="space-y-3">
            <Label className="text-sm font-medium">{config.label}</Label>
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
            <Label className="text-sm font-medium">{config.label}</Label>
            <div className="space-y-2">
              {peopleTypes.map((person, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {person.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(currentValue as number[])[index]}
                    </span>
                  </div>
                  <Slider
                    value={[(currentValue as number[])[index]]}
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
                    value={(currentValue as number[])[index]?.toString()}
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

export default function MeituProcessor() {
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [customImage, setCustomImage] = useState<string>("");
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [presetId, setPresetId] = useState<string>("MTyunxiu1c68684d55");
  const [parameters, setParameters] = useState<{
    [key: string]: number | number[];
  }>({});
  const [functionsData, setFunctionsData] =
    useState<MeituFunctionsResponse | null>(null);
  const [peopleTypes, setPeopleTypes] = useState<PeopleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [isPolling, setIsPolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState(0);
  const [imageDrawerOpen, setImageDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

  useEffect(() => {
    loadFunctions();
  }, []);

  const loadFunctions = async () => {
    try {
      const response = await api.getMeituFunctions();
      setFunctionsData(response);
      setPeopleTypes(response.people_types);

      // 初始化参数
      const initialParams: { [key: string]: number | number[] } = {};
      Object.entries(response.parameter_groups).forEach(([groupKey, group]) => {
        Object.entries(group.parameters).forEach(([paramKey, config]) => {
          if (
            config.type === "array_slider" ||
            config.type === "array_select"
          ) {
            initialParams[paramKey] = response.people_types.map(() =>
              typeof config.default === "number" ? config.default : 0
            );
          } else {
            initialParams[paramKey] = config.default;
          }
        });
      });
      setParameters(initialParams);
    } catch (error) {
      toast.error("加载功能配置失败");
    }
  };

  const handleParameterChange = (key: string, value: number) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  const handleArrayParameterChange = (
    key: string,
    index: number,
    value: number
  ) => {
    setParameters((prev) => {
      const current = prev[key] as number[];
      const newArray = [...current];
      newArray[index] = value;
      return { ...prev, [key]: newArray };
    });
  };

  const pollTaskStatus = async (taskId: string) => {
    setIsPolling(true);
    setPollingProgress(0);

    const poll = async () => {
      try {
        const response = await api.getMeituTaskStatus(taskId);

        if (response.status === "completed") {
          setResult(response.result.result_url);
          setIsPolling(false);
          setPollingProgress(100);
          toast.success("图片处理完成！");
        } else if (response.status === "failed") {
          setIsPolling(false);
          toast.error("图片处理失败");
        } else {
          setPollingProgress(response.progress || 0);
          setTimeout(poll, 2000);
        }
      } catch (error) {
        setIsPolling(false);
        toast.error("获取处理状态失败");
      }
    };

    poll();
  };

  const handlePresetSubmit = async () => {
    if (!selectedImage && !customImage) {
      toast.error("请先选择图片");
      return;
    }

    setLoading(true);
    setResult("");
    try {
      const response = await api.processMeituPreset({
        image_url: customImage || selectedImage,
        preset_id: presetId,
      });
      pollTaskStatus(response.task_id);
    } catch (error) {
      toast.error("提交处理任务失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async () => {
    if (!selectedImage && !customImage) {
      toast.error("请先选择图片");
      return;
    }

    setLoading(true);
    setResult("");
    try {
      const response = await api.processMeituCustom({
        image_url: customImage || selectedImage,
        parameters,
      });
      pollTaskStatus(response.task_id);
    } catch (error) {
      toast.error("提交处理任务失败");
    } finally {
      setLoading(false);
    }
  };

  const resetParameters = () => {
    if (!functionsData) return;

    const initialParams: { [key: string]: number | number[] } = {};
    Object.entries(functionsData.parameter_groups).forEach(
      ([groupKey, group]) => {
        Object.entries(group.parameters).forEach(([paramKey, config]) => {
          if (
            config.type === "array_slider" ||
            config.type === "array_select"
          ) {
            initialParams[paramKey] = peopleTypes.map(() => config.default);
          } else {
            initialParams[paramKey] = config.default;
          }
        });
      }
    );
    setParameters(initialParams);
    toast.success("参数已重置");
  };

  const currentImageUrl = customImage || selectedImage;

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
            {(loading || isPolling) && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {isPolling
                    ? `处理中 ${Math.round(pollingProgress)}%`
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
                      点击左上角"选择图片"按钮
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
                      className="w-full h-full object-cover"
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
                    className="w-full h-full object-cover"
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
                    <SelectItem value="MTyunxiu1c68684d55">
                      标准云修 - 通用优化
                    </SelectItem>
                    <SelectItem value="MTyunxiu2a34567b89">
                      人像优化 - 美颜增强
                    </SelectItem>
                    <SelectItem value="MTyunxiu3c91234def">
                      风景增强 - 色彩提升
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 自定义模式 */}
            {mode === "custom" && functionsData && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">参数调节</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetParameters}
                    className="h-8 px-2"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    重置
                  </Button>
                </div>

                <div className="space-y-4">
                  {Object.entries(functionsData.parameter_groups).map(
                    ([groupKey, group]) => (
                      <div key={groupKey} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-3">
                          {getGroupIcon(groupKey)}
                          <h4 className="text-sm font-medium">{group.name}</h4>
                        </div>
                        <div className="space-y-4">
                          {Object.entries(group.parameters).map(
                            ([paramKey, config]) => (
                              <ParameterControl
                                key={paramKey}
                                paramKey={paramKey}
                                config={config}
                                currentValue={
                                  parameters[paramKey] || config.default
                                }
                                peopleTypes={peopleTypes}
                                onParameterChange={handleParameterChange}
                                onArrayParameterChange={
                                  handleArrayParameterChange
                                }
                              />
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
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

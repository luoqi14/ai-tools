"use client";

import { useState } from "react";
import { Upload, Wand2, Download, Loader2, X, Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GeneratedImage {
  url: string;
  width?: number;
  height?: number;
}

interface TaskResult {
  status: string;
  result?: {
    images: GeneratedImage[];
    seed?: number;
    has_nsfw_concepts?: boolean[];
  };
  error?: string;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // 高级设置
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 处理文件上传
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:8003/api/image-generation/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      if (result.success) {
        setUploadedImage(result.data.base64_image);
      } else {
        alert("图片上传失败: " + result.message);
      }
    } catch {
      alert("上传失败，请检查网络连接");
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string): Promise<TaskResult> => {
    const maxAttempts = 60; // 最多轮询5分钟
    const interval = 5000; // 5秒间隔

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(
          `http://localhost:8003/api/image-generation/status/${taskId}`
        );
        const result = await response.json();

        if (result.success) {
          const taskData = result.data;

          if (taskData.status === "Ready") {
            return {
              status: "completed",
              result: taskData.result,
            };
          } else if (taskData.status === "Error") {
            return {
              status: "failed",
              error: taskData.result?.error || "生成失败",
            };
          }
          // Task-Pending, Task-Running 继续轮询
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        console.error("轮询错误:", error);
      }
    }

    return {
      status: "timeout",
      error: "任务超时，请重试",
    };
  };

  // 统一的图像生成函数
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("请输入提示词");
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      // 构建请求参数
      const requestData: {
        prompt: string;
        aspect_ratio: string;
        output_format: string;
        input_image?: string;
      } = {
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        output_format: "jpeg",
      };

      // 如果有上传的图片，自动启用图生图模式
      if (uploadedImage) {
        requestData.input_image = uploadedImage;
      }

      // 发起生成请求
      const response = await fetch(
        "http://localhost:8003/api/image-generation/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();

      if (result.success) {
        const taskId = result.data.task_id;
        setCurrentTaskId(taskId);

        // 开始轮询任务状态
        const taskResult = await pollTaskStatus(taskId);

        if (taskResult.status === "completed" && taskResult.result?.images) {
          setGeneratedImages(taskResult.result.images);
        } else {
          alert("生成失败: " + (taskResult.error || "未知错误"));
        }
      } else {
        alert("请求失败: " + result.message);
      }
    } catch (error) {
      alert("生成失败，请检查网络连接");
      console.error("生成错误:", error);
    } finally {
      setIsGenerating(false);
      setCurrentTaskId(null);
    }
  };

  // 移除上传的图片
  const removeUploadedImage = () => {
    setUploadedImage(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：设置面板 */}
        <Card>
          <CardHeader>
            <CardTitle>生成设置</CardTitle>
            <CardDescription>
              {uploadedImage
                ? "图像编辑模式：基于上传图片进行编辑"
                : "文本生成模式：从文字描述生成图像"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 提示词输入 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                提示词 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述您想要生成或编辑的图像内容..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 图片上传区域 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                上传图片{" "}
                <span className="text-gray-500">(可选，用于图像编辑)</span>
              </label>

              {uploadedImage ? (
                <div className="relative inline-block">
                  <img
                    src={uploadedImage}
                    alt="上传的图片"
                    className="w-full max-w-sm h-40 object-cover rounded-lg border"
                  />
                  <Button
                    onClick={removeUploadedImage}
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">点击上传图片</p>
                    <p className="text-xs text-gray-400 mt-1">
                      支持 PNG, JPG, JPEG, GIF, BMP, WEBP
                    </p>
                  </label>
                </div>
              )}
            </div>

            {/* 高级设置 */}
            <div>
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showAdvanced ? "隐藏" : "显示"}高级设置
              </Button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      纵横比
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1:1">正方形 (1:1)</option>
                      <option value="4:3">横向 (4:3)</option>
                      <option value="3:4">竖向 (3:4)</option>
                      <option value="16:9">宽屏 (16:9)</option>
                      <option value="9:16">手机屏 (9:16)</option>
                      <option value="21:9">超宽屏 (21:9)</option>
                      <option value="9:21">超长屏 (9:21)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 生成按钮 */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {currentTaskId ? "生成中..." : "提交任务..."}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {uploadedImage ? "编辑图像" : "生成图像"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 右侧：结果展示 */}
        <Card>
          <CardHeader>
            <CardTitle>生成结果</CardTitle>
            <CardDescription>生成的图像将在这里显示</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedImages.length > 0 ? (
              <div className="space-y-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`生成的图像 ${index + 1}`}
                      className="w-full rounded-lg shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                      <Button asChild variant="secondary" size="sm">
                        <a
                          href={image.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          下载
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Wand2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>还没有生成图像</p>
                <p className="text-sm text-gray-400 mt-1">
                  {uploadedImage ? "上传图片并输入编辑指令" : "输入文字描述"}
                  ，然后点击生成
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

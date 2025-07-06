"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Upload, Wand2, Settings, Download, Loader2 } from "lucide-react";

interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

interface GenerationResult {
  images: GeneratedImage[];
  prompt: string;
  seed?: number;
  has_nsfw_concepts?: boolean[];
}

export default function ImageGenerator() {
  const [activeTab, setActiveTab] = useState<"text2img" | "img2img">(
    "text2img"
  );
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [guidanceScale, setGuidanceScale] = useState(3.5);

  // 处理文件上传
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      "http://localhost:8003/api/image-generation/upload-image",
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();
    if (result.success) {
      setUploadedImage(result.data.url);
    } else {
      alert("图片上传失败: " + result.message);
    }
  };

  // 文生图
  const handleTextToImage = async () => {
    if (!prompt.trim()) {
      alert("请输入提示词");
      return;
    }

    setIsGenerating(true);

    const response = await fetch(
      "http://localhost:8003/api/image-generation/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          aspect_ratio: aspectRatio,
          guidance_scale: guidanceScale,
          num_images: 1,
          output_format: "jpeg",
        }),
      }
    );

    const result = await response.json();
    setIsGenerating(false);

    if (result.success) {
      setGeneratedImages(result.data.images);
    } else {
      alert("图像生成失败: " + result.message);
    }
  };

  // 图生图
  const handleImageToImage = async () => {
    if (!prompt.trim()) {
      alert("请输入提示词");
      return;
    }

    if (!uploadedImage) {
      alert("请先上传图片");
      return;
    }

    setIsGenerating(true);

    const response = await fetch(
      "http://localhost:8003/api/image-generation/image-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_url: uploadedImage,
          aspect_ratio: aspectRatio,
          guidance_scale: guidanceScale,
          num_images: 1,
          output_format: "jpeg",
        }),
      }
    );

    const result = await response.json();
    setIsGenerating(false);

    if (result.success) {
      setGeneratedImages(result.data.images);
    } else {
      alert("图像生成失败: " + result.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标签页切换 */}
      <div className="flex space-x-1 bg-white/10 rounded-xl p-1 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab("text2img")}
          className={`flex-1 py-3 px-6 rounded-lg transition-all duration-300 ${
            activeTab === "text2img"
              ? "bg-white/20 text-white shadow-lg"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Wand2 className="w-5 h-5 inline-block mr-2" />
          文生图
        </button>
        <button
          onClick={() => setActiveTab("img2img")}
          className={`flex-1 py-3 px-6 rounded-lg transition-all duration-300 ${
            activeTab === "img2img"
              ? "bg-white/20 text-white shadow-lg"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Upload className="w-5 h-5 inline-block mr-2" />
          图生图
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：控制面板 */}
        <div className="space-y-6">
          {/* 提示词输入 */}
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <label className="block text-white text-lg font-medium mb-3">
              提示词
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述您想要生成的图像..."
              className="w-full h-32 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
            />
          </div>

          {/* 图生图：上传图片 */}
          {activeTab === "img2img" && (
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <label className="block text-white text-lg font-medium mb-3">
                上传原图
              </label>
              <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  {uploadedImage ? (
                    <div>
                      <img
                        src={uploadedImage}
                        alt="上传的图片"
                        className="max-h-40 mx-auto rounded-lg mb-2"
                      />
                      <p className="text-white/70">点击更换图片</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-white/50 mx-auto mb-4" />
                      <p className="text-white/70">点击上传图片</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* 高级设置 */}
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-white" />
              <span className="text-white text-lg font-medium">高级设置</span>
            </div>

            <div className="space-y-4">
              {/* 纵横比 */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  纵横比
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="1:1">正方形 (1:1)</option>
                  <option value="4:3">横向 (4:3)</option>
                  <option value="3:4">竖向 (3:4)</option>
                  <option value="16:9">宽屏 (16:9)</option>
                  <option value="9:16">手机屏 (9:16)</option>
                </select>
              </div>

              {/* 引导比例 */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  引导比例: {guidanceScale}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={
              activeTab === "text2img" ? handleTextToImage : handleImageToImage
            }
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                {activeTab === "text2img" ? "生成图像" : "编辑图像"}
              </>
            )}
          </button>
        </div>

        {/* 右侧：结果展示 */}
        <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-white text-lg font-medium mb-4">生成结果</h3>

          {generatedImages.length > 0 ? (
            <div className="space-y-4">
              {generatedImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative group"
                >
                  <img
                    src={image.url}
                    alt={`生成的图像 ${index + 1}`}
                    className="w-full rounded-lg shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                    <a
                      href={image.url}
                      download
                      className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg transition-colors"
                    >
                      <Download className="w-6 h-6" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-white/50 py-12">
              <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>生成的图像将在这里显示</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

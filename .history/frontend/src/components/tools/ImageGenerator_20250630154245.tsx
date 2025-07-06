"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Upload, Wand2, Settings, Download, Loader2 } from "lucide-react";

interface GeneratedImage {
  url: string;
  width: number;
  height: number;
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
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw, Check } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel?: () => void;
  className?: string;
}

export function CameraCapture({
  onCapture,
  onCancel,
  className,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    // 先停止现有的摄像头流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsStreaming(false);
    setError("");
    setIsLoading(true);

    try {
      // 简单的前置摄像头约束
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "user", // 只使用前置摄像头
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      console.log("启动前置摄像头...", constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;

      // 等待视频准备就绪
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("视频加载超时")),
          5000
        );

        const onCanPlay = () => {
          clearTimeout(timeout);
          video.removeEventListener("canplay", onCanPlay);
          video.removeEventListener("error", onError);
          resolve();
        };

        const onError = () => {
          clearTimeout(timeout);
          video.removeEventListener("canplay", onCanPlay);
          video.removeEventListener("error", onError);
          reject(new Error("视频加载失败"));
        };

        video.addEventListener("canplay", onCanPlay);
        video.addEventListener("error", onError);
        video.play().catch(() => {
          // 忽略play错误，等待canplay事件
        });
      });

      setIsStreaming(true);
      setError("");
      console.log("前置摄像头启动成功");
    } catch (err) {
      console.error("摄像头启动失败:", err);
      setIsStreaming(false);

      let errorMessage = "无法访问摄像头";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "摄像头权限被拒绝，请允许摄像头访问";
        } else if (err.name === "NotFoundError") {
          errorMessage = "未找到摄像头设备";
        } else if (err.name === "NotReadableError") {
          errorMessage = "摄像头正在被其他应用使用";
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCapturedImage(null);
    setError(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // 设置canvas尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log("拍照前的视频状态:", {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      videoReadyState: video.readyState,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    });

    // 绘制视频帧到canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 检查canvas内容
    const imageData = context.getImageData(
      0,
      0,
      Math.min(10, canvas.width),
      Math.min(10, canvas.height)
    );
    const samplePixels = Array.from(imageData.data.slice(0, 12));
    console.log("Canvas样本像素数据 (前3个像素的RGBA):", samplePixels);

    // 转换为JPEG
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);

    console.log("Canvas转换结果:", {
      dataUrlLength: imageDataUrl.length,
      dataUrlPrefix: imageDataUrl.substring(0, 50),
      quality: "90%",
    });

    setCapturedImage(imageDataUrl);

    // 注意：不要停止摄像头流，保持运行以便重拍
    console.log("拍照成功", {
      width: canvas.width,
      height: canvas.height,
      streamActive: streamRef.current ? streamRef.current.active : false,
    });
  }, [isStreaming]);

  const retakePhoto = useCallback(async () => {
    console.log("开始重拍，当前状态:", {
      isStreaming,
      hasStream: !!streamRef.current,
      streamActive: streamRef.current ? streamRef.current.active : false,
    });

    setCapturedImage(null);

    // 为了确保可靠性，总是重新启动摄像头
    console.log("重拍：强制重新启动摄像头");
    await startCamera();
  }, [startCamera, isStreaming]);

  const confirmCapture = useCallback(() => {
    if (!capturedImage) return;

    console.log("开始确认捕获，原始图片数据:", {
      dataUrlLength: capturedImage.length,
      dataUrlPrefix: capturedImage.substring(0, 50),
    });

    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        console.log("Blob创建成功:", {
          size: blob.size,
          type: blob.type,
        });

        const file = new File([blob], "camera-photo.jpg", {
          type: "image/jpeg",
        });

        console.log("File对象创建成功:", {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });

        // 创建一个临时的URL来检查文件内容
        const tempUrl = URL.createObjectURL(file);
        console.log("临时文件URL:", tempUrl);

        onCapture(file);
        stopCamera();

        // 清理临时URL
        setTimeout(() => {
          URL.revokeObjectURL(tempUrl);
        }, 1000);
      })
      .catch((error) => {
        console.error("处理图片时出错:", error);
      });
  }, [capturedImage, onCapture, stopCamera]);

  // 自动启动摄像头
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className={`fixed inset-0 z-50 bg-black ${className}`}>
      {/* 顶部状态栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <span className="text-sm font-medium">前置摄像头</span>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                stopCamera();
                onCancel();
              }}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-32">
        {capturedImage ? (
          /* 显示拍摄的照片 */
          <div className="relative w-full max-w-sm mx-auto">
            <NextImage
              src={capturedImage}
              alt="拍摄的照片"
              width={400}
              height={300}
              className="w-full h-auto rounded-lg shadow-lg"
              unoptimized={true} // 拍摄的照片是blob URL，需要跳过优化
            />
          </div>
        ) : (
          /* 摄像头预览 */
          <div className="relative w-full max-w-sm mx-auto aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>正在启动摄像头...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white p-4">
                <div className="text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button
                    onClick={startCamera}
                    variant="outline"
                    className="text-white border-white hover:bg-white/20"
                  >
                    重试
                  </Button>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* 拍照按钮 - 在预览区域内 */}
            {isStreaming && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black shadow-lg"
                >
                  <Camera className="w-8 h-8" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {capturedImage ? (
          /* 照片确认按钮 */
          <div className="flex justify-center gap-4">
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              className=" border-white hover:bg-white/20"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              重拍
            </Button>
            <Button
              onClick={confirmCapture}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-5 h-5 mr-2" />
              确认使用
            </Button>
          </div>
        ) : (
          /* 拍照提示 */
          <div className="text-center text-white/80">
            <p className="text-sm">点击预览区域底部的 ⚪ 按钮拍照</p>
          </div>
        )}
      </div>

      {/* 隐藏的canvas用于拍照 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

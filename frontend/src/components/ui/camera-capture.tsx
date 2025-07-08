"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  CameraOff,
  RotateCcw,
  Check,
  X,
  Loader2,
  RefreshCw,
  FlipHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  ); // 默认后置摄像头
  const [isLoading, setIsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean;
    hasMultipleCameras: boolean;
    videoDevices: MediaDeviceInfo[];
  }>({ isMobile: false, hasMultipleCameras: false, videoDevices: [] });

  // 检测设备信息
  useEffect(() => {
    const checkDevice = async () => {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      let hasMultipleCameras = false;
      let videoDevices: MediaDeviceInfo[] = [];
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter((device) => device.kind === "videoinput");
        hasMultipleCameras = videoDevices.length > 1;
        console.log("检测到的摄像头设备:", videoDevices);
      } catch (err) {
        console.log("无法枚举设备:", err);
      }

      setDeviceInfo({ isMobile, hasMultipleCameras, videoDevices });
    };

    checkDevice();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // 停止现有流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("您的浏览器不支持摄像头功能");
      }

      // 优化的摄像头约束 - 提高分辨率和质量
      const baseConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          // 提高分辨率设置，支持4K
          width: { ideal: 1920, max: 3840, min: 640 },
          height: { ideal: 1080, max: 2160, min: 480 },
          frameRate: { ideal: 30, max: 60 },
          // 添加更多质量设置
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      };

      // 移动端特殊优化
      if (deviceInfo.isMobile) {
        baseConstraints.video = {
          ...baseConstraints.video,
          // 移动端优先高分辨率
          width: { ideal: 1920, max: 4096, min: 720 },
          height: { ideal: 1080, max: 3072, min: 540 },
          frameRate: { ideal: 30, max: 30 }, // 移动端稳定帧率
        };
      }

      console.log("请求摄像头权限...", baseConstraints);
      const stream = await navigator.mediaDevices.getUserMedia(baseConstraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // 设置视频属性
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;

        // 等待视频加载并播放
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          const timeout = setTimeout(
            () => reject(new Error("视频加载超时")),
            15000
          ); // 增加超时时间

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);

            // 输出视频实际分辨率
            console.log("摄像头实际分辨率:", {
              width: video.videoWidth,
              height: video.videoHeight,
              facingMode: facingMode,
            });

            resolve();
          };

          const onError = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            reject(new Error("视频加载失败"));
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("error", onError);

          // 尝试播放
          video.play().catch(reject);
        });

        setIsStreaming(true);
        console.log("摄像头启动成功");
      }
    } catch (err) {
      console.error("启动摄像头失败:", err);
      let errorMessage = "无法访问摄像头";

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "摄像头权限被拒绝，请在浏览器设置中允许摄像头访问";
        } else if (err.name === "NotFoundError") {
          errorMessage = "未找到摄像头设备";
        } else if (err.name === "NotReadableError") {
          errorMessage = "摄像头正在被其他应用使用";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "摄像头不支持请求的配置，尝试切换摄像头";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, deviceInfo.isMobile]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCapturedImage(null);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // 获取视频的实际尺寸
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    console.log("拍照时视频尺寸:", { videoWidth, videoHeight });

    // 设置canvas为视频的实际尺寸，确保高清晰度
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // 设置高质量渲染
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    // 绘制当前视频帧到canvas
    context.drawImage(video, 0, 0, videoWidth, videoHeight);

    // 转换为高质量图片数据URL
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95); // 提高质量到0.95
    setCapturedImage(imageDataUrl);

    // 停止摄像头
    stopCamera();
  }, [stopCamera]);

  const confirmCapture = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return;

    // 将canvas转换为高质量Blob，然后转换为File
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          console.log(
            "生成的图片文件大小:",
            (blob.size / 1024 / 1024).toFixed(2) + "MB"
          );
          onCapture(file);
        }
      },
      "image/jpeg",
      0.95 // 提高图片质量到0.95
    );
  }, [capturedImage, onCapture]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // 当facingMode改变时重启摄像头
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode, startCamera, isStreaming]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 移动端自动启动摄像头
  useEffect(() => {
    if (deviceInfo.isMobile && !isStreaming && !capturedImage && !error) {
      const timer = setTimeout(() => {
        startCamera();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [deviceInfo.isMobile, isStreaming, capturedImage, error, startCamera]);

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* 错误提示 */}
      {error && (
        <div className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive text-center mb-2">{error}</p>
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={startCamera}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </Button>
          </div>
        </div>
      )}

      {/* 摄像头预览区域 */}
      <div className="relative w-full max-w-sm aspect-[3/4] bg-muted rounded-xl overflow-hidden shadow-lg">
        {capturedImage ? (
          // 显示拍摄的照片
          <img
            src={capturedImage}
            alt="拍摄的照片"
            className="w-full h-full object-cover"
          />
        ) : (
          // 显示摄像头预览
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {/* 加载状态 */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  <p className="text-sm font-medium">正在启动摄像头...</p>
                </div>
              </div>
            )}
            {/* 无视频流时的占位符 */}
            {!isStreaming && !isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Camera className="h-16 w-16" />
                  <p className="text-sm text-center">
                    {deviceInfo.isMobile
                      ? "正在准备摄像头..."
                      : "点击下方按钮开启摄像头"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* 隐藏的canvas用于捕获图片 */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 前后摄像头切换按钮 - 移动端总是显示 */}
        {isStreaming && !capturedImage && deviceInfo.isMobile && (
          <Button
            size="icon"
            variant="outline"
            className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm h-12 w-12 border-2"
            onClick={switchCamera}
            title={
              facingMode === "user" ? "切换到后置摄像头" : "切换到前置摄像头"
            }
          >
            <FlipHorizontal className="h-6 w-6" />
          </Button>
        )}

        {/* 桌面端的摄像头切换按钮 */}
        {isStreaming &&
          !capturedImage &&
          !deviceInfo.isMobile &&
          deviceInfo.hasMultipleCameras && (
            <Button
              size="icon"
              variant="outline"
              className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm h-10 w-10"
              onClick={switchCamera}
              title={
                facingMode === "user" ? "切换到后置摄像头" : "切换到前置摄像头"
              }
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          )}

        {/* 当前摄像头模式指示器 */}
        {isStreaming && !capturedImage && (
          <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded-lg text-xs">
            {facingMode === "user" ? "前置" : "后置"}
          </div>
        )}
      </div>

      {/* 控制按钮 - 移动端优化 */}
      <div className="flex items-center justify-center gap-4 w-full px-4">
        {!isStreaming && !capturedImage && !deviceInfo.isMobile && (
          <Button
            onClick={startCamera}
            disabled={isLoading}
            size="lg"
            className="flex items-center gap-2 min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                启动中...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                开启摄像头
              </>
            )}
          </Button>
        )}

        {isStreaming && !capturedImage && (
          <>
            {/* 摄像头切换按钮 - 底部额外按钮 */}
            {deviceInfo.isMobile && (
              <Button
                variant="outline"
                onClick={switchCamera}
                size="lg"
                className="flex items-center gap-2 min-w-[80px]"
                title="切换摄像头"
              >
                <FlipHorizontal className="h-5 w-5" />
                切换
              </Button>
            )}
            <Button
              variant="outline"
              onClick={stopCamera}
              size="lg"
              className="flex items-center gap-2 min-w-[80px]"
            >
              <CameraOff className="h-5 w-5" />
              关闭
            </Button>
            <Button
              onClick={capturePhoto}
              size="lg"
              className="flex items-center gap-2 min-w-[80px] bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="h-5 w-5" />
              拍照
            </Button>
          </>
        )}

        {capturedImage && (
          <>
            <Button
              variant="outline"
              onClick={retakePhoto}
              size="lg"
              className="flex items-center gap-2 min-w-[80px]"
            >
              <RotateCcw className="h-5 w-5" />
              重拍
            </Button>
            <Button
              onClick={confirmCapture}
              size="lg"
              className="flex items-center gap-2 min-w-[80px] bg-green-600 hover:bg-green-700"
            >
              <Check className="h-5 w-5" />
              确认
            </Button>
          </>
        )}

        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            size="lg"
            className="flex items-center gap-2 min-w-[80px]"
          >
            <X className="h-5 w-5" />
            取消
          </Button>
        )}
      </div>
    </div>
  );
}

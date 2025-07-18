"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, Path, FabricImage, Control, util, Point } from "fabric";

interface GridConfig {
  enabled: boolean;
  size: number;
  color: string;
  opacity: number;
  lineWidth: number;
}

interface PathDrawingCanvasProps {
  backgroundImage?: string;
  onPathComplete?: (pathData: string) => void;
  onImageDropped?: () => void; // 新增：图片拖拽完成回调
  width?: number;
  height?: number;
  className?: string;
  showPathDrawing?: boolean; // 简化：只控制是否允许画笔功能
  gridConfig?: GridConfig; // 新增：网格配置
}

const PathDrawingCanvas: React.FC<PathDrawingCanvasProps> = ({
  backgroundImage,
  onPathComplete,
  onImageDropped,
  width = typeof window !== "undefined" ? window.innerWidth : 1920,
  height = typeof window !== "undefined" ? window.innerHeight : 1080,
  className = "",
  showPathDrawing = false,
  gridConfig = {
    enabled: true,
    size: 25,
    color: "#e5e5e5",
    opacity: 0.5,
    lineWidth: 1,
  },
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Path | null>(null);
  const [pathPoints, setPathPoints] = useState<string>("");
  const [, setDroppedImages] = useState<FabricImage[]>([]);

  // 创建网格背景图案
  const createGridDataURL = useCallback(() => {
    if (!gridConfig.enabled) return null;

    const { size, color, opacity, lineWidth } = gridConfig;

    // 创建一个临时canvas来绘制网格图案
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');

    if (!patternCtx) return null;

    // 设置图案尺寸
    patternCanvas.width = size;
    patternCanvas.height = size;

    // 设置背景为透明
    patternCtx.clearRect(0, 0, size, size);

    // 设置线条样式
    patternCtx.strokeStyle = color;
    patternCtx.lineWidth = lineWidth;
    patternCtx.globalAlpha = opacity;

    // 绘制网格线
    patternCtx.beginPath();
    // 垂直线
    patternCtx.moveTo(size, 0);
    patternCtx.lineTo(size, size);
    // 水平线
    patternCtx.moveTo(0, size);
    patternCtx.lineTo(size, size);
    patternCtx.stroke();

    // 返回data URL
    return patternCanvas.toDataURL();
  }, [gridConfig]);

  // 应用网格背景
  const applyGridBackground = useCallback(async (canvas: Canvas) => {
    if (!gridConfig.enabled) {
      canvas.backgroundColor = 'transparent';
      canvas.requestRenderAll();
      return;
    }

    const gridDataURL = createGridDataURL();
    if (gridDataURL) {
      // 使用CSS样式应用网格背景
      const canvasElement = canvas.getElement();
      canvasElement.style.backgroundImage = `url(${gridDataURL})`;
      canvasElement.style.backgroundRepeat = 'repeat';
      canvasElement.style.backgroundSize = `${gridConfig.size}px ${gridConfig.size}px`;
    }
  }, [gridConfig, createGridDataURL]);

  // 创建笔形状的光标
  const createPenCursor = () => {
    const svg = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 4L20 6L5 21L1 23L3 19L18 4L22 4Z" fill="#000" stroke="#fff" stroke-width="1.5"/>
      </svg>
    `;
    const encoded = btoa(svg);
    return `url(data:image/svg+xml;base64,${encoded}) 2 22, crosshair`;
  };

  // 创建自定义删除控制器
  const createDeleteControl = () => {
    const deleteIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#ff4444" stroke="#fff" stroke-width="2"/>
        <path d="M8 8L16 16M16 8L8 16" stroke="#fff" stroke-width="2"/>
      </svg>
    `;

    const encoded = btoa(deleteIcon);
    const img = document.createElement("img");
    img.src = `data:image/svg+xml;base64,${encoded}`;

    return new Control({
      x: 0.5,
      y: -0.5,
      offsetY: -16,
      offsetX: 16,
      cursorStyle: "pointer",
      mouseUpHandler: (eventData, transform) => {
        const canvas = transform.target.canvas;
        const target = transform.target;

        if (canvas && target) {
          // 从droppedImages状态中移除
          setDroppedImages((prev) => prev.filter((img) => img !== target));
          canvas.remove(target);
          canvas.renderAll();
        }
        return true;
      },
      render: (ctx, left, top) => {
        const size = 24;
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(util.degreesToRadians(0));
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
      },
    });
  };

  // 模式更新逻辑
  const updateCanvasMode = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const hasSelectedObject = canvas.getActiveObject() !== undefined;
    const shouldDrawing = showPathDrawing && !hasSelectedObject;

    if (shouldDrawing) {
      // 进入绘制模式
      canvas.isDrawingMode = true;
      canvas.selection = false;
      const penCursor = createPenCursor();
      canvas.freeDrawingCursor = penCursor;
    } else {
      // 进入选择模式
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.freeDrawingCursor = "default";
    }
  }, [showPathDrawing]);

  // 初始化 Fabric Canvas - 页面加载时创建，一直保持
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvasElement = canvasRef.current;
    const container = canvasElement.parentElement;

    // 获取容器的实际尺寸
    const containerWidth = container?.clientWidth || width;
    const containerHeight = container?.clientHeight || height;

    const canvas = new Canvas(canvasElement, {
      width: containerWidth,
      height: containerHeight,
      backgroundColor: "transparent",
      selection: true,
      preserveObjectStacking: true,
      isDrawingMode: false,
      defaultCursor: "default",
      hoverCursor: "default",
      moveCursor: "default",
    });

    fabricCanvasRef.current = canvas;

    // 应用网格背景
    applyGridBackground(canvas);

    // 添加缩放和平移功能
    // 鼠标滚轮缩放和触摸板双指手势
    canvas.on("mouse:wheel", function (opt) {
      const delta = opt.e.deltaY;
      const e = opt.e;

      if (e.ctrlKey) {
        // 缩放操作（触摸板双指缩放或Ctrl+滚轮）
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint(new Point(e.offsetX, e.offsetY), zoom);
      } else {
        // 平移操作（触摸板双指平移或普通滚轮）
        const vpt = canvas.viewportTransform;
        if (vpt) {
          // 处理水平和垂直滚动
          vpt[4] -= e.deltaX || 0;
          vpt[5] -= e.deltaY || 0;
          canvas.requestRenderAll();
        }
      }

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // 拖拽平移 - 使用Alt键或中键
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on("mouse:down", (opt) => {
      const evt = opt.e as MouseEvent;
      if (evt.altKey === true || evt.button === 1) {
        isDragging = true;
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        canvas.defaultCursor = "grab";
        canvas.hoverCursor = "grab";
      }
    });

    canvas.on("mouse:move", (opt) => {
      if (isDragging) {
        const e = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      }
    });

    canvas.on("mouse:up", () => {
      if (isDragging) {
        isDragging = false;
        canvas.selection = true;
        canvas.defaultCursor = "default";
        canvas.hoverCursor = "default";
      }
    });

    // 触摸板双指手势已通过mouse:wheel事件处理，无需额外的触摸事件

    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      if (container) {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        canvas.setDimensions({
          width: newWidth,
          height: newHeight,
        });

        // 重新设置背景图片以适应新尺寸
        if (canvas.backgroundImage) {
          const img = canvas.backgroundImage;

          // 为底部控件留出空间（大约300px）
          const bottomControlsHeight = 332;
          const availableHeight = newHeight - bottomControlsHeight;

          const scaleX = newWidth / img.width;
          const scaleY = availableHeight / img.height;
          const scale = Math.min(scaleX, scaleY);

          // 计算图片的实际尺寸
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          img.set({
            scaleX: scale,
            scaleY: scale,
            left: (newWidth - scaledWidth) / 2, // 水平居中
            top: (availableHeight - scaledHeight) / 2 + 16, // 在可用空间内垂直居中
          });

          canvas.renderAll();
        }
      }
    });

    if (container) {
      resizeObserver.observe(container);
    }

    // 监听拖拽事件
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 标记是否已经触发了回调，防止重复调用
      let callbackTriggered = false;

      try {
        const data = e.dataTransfer?.getData("application/json");
        if (data) {
          const imageData = JSON.parse(data);

          // 验证图片数据的有效性
          if (imageData && imageData.url) {
            // 获取画布相对位置
            const rect = canvasElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 立即调用拖拽完成回调，确保百宝箱能够自动关闭
            // 不依赖图片加载的成功与否
            if (onImageDropped && !callbackTriggered) {
              onImageDropped();
              callbackTriggered = true;
              console.log("Image drop callback triggered successfully");
            }

            // 创建图片对象
            FabricImage.fromURL(imageData.url, {
              crossOrigin: "anonymous",
            }).then((img) => {
              if (!img) {
                console.warn("Failed to load image from URL:", imageData.url);
                return;
              }

              // 智能缩放
              const maxSize = 200;
              const scale = Math.min(
                maxSize / img.width,
                maxSize / img.height,
                0.3
              );

              img.set({
                left: x - (img.width * scale) / 2,
                top: y - (img.height * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                evented: true,
              });

              // 设置自定义控制器
              img.controls.deleteControl = createDeleteControl();

              canvas.add(img);
              setDroppedImages((prev) => [...prev, img]);
              canvas.renderAll();

              console.log("Image successfully added to canvas");
            }).catch((error) => {
              console.error("Error loading image:", error);
              // 即使图片加载失败，回调已经在前面调用过了，所以百宝箱仍会关闭
            });
          } else {
            console.warn("Invalid image data received:", imageData);
          }
        } else {
          console.warn("No drag data received");
        }
      } catch (error) {
        console.error("Error handling drop:", error);

        // 在异常情况下，尝试触发回调作为后备机制
        // 但只有在之前没有触发过的情况下才触发
        if (!callbackTriggered && onImageDropped) {
          try {
            const rawData = e.dataTransfer?.getData("application/json");
            if (rawData) {
              onImageDropped();
              callbackTriggered = true;
              console.log("Image drop callback triggered as fallback");
            }
          } catch (parseError) {
            console.error("Error in fallback callback trigger:", parseError);
          }
        }
      }
    };

    const upperCanvas = canvas.upperCanvasEl;
    upperCanvas.addEventListener("dragover", handleDragOver);
    upperCanvas.addEventListener("drop", handleDrop);

    return () => {
      resizeObserver.disconnect();
      upperCanvas.removeEventListener("dragover", handleDragOver);
      upperCanvas.removeEventListener("drop", handleDrop);
      canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // 因为 updateCanvasMode 依赖于 showPathDrawing，
    // 所以所有调用它的监听器也需要在这个 effect 中管理。
    const handleSelectionCreated = () => updateCanvasMode();
    const handleSelectionUpdated = () => updateCanvasMode();
    const handleSelectionCleared = () => updateCanvasMode();

    canvas.on("selection:created", handleSelectionCreated);
    canvas.on("selection:updated", handleSelectionUpdated);
    canvas.on("selection:cleared", handleSelectionCleared);

    // 返回一个清理函数，它会在下一次 effect 运行前或组件卸载时执行
    return () => {
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:updated", handleSelectionUpdated);
      canvas.off("selection:cleared", handleSelectionCleared);
    };
  }, [updateCanvasMode]);

  // 监听showPathDrawing变化，更新模式
  useEffect(() => {
    updateCanvasMode();
  }, [showPathDrawing]);

  // 监听网格配置变化，更新网格背景
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    applyGridBackground(fabricCanvasRef.current);
  }, [gridConfig, applyGridBackground]);

  // 设置背景图片
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    if (backgroundImage) {
      FabricImage.fromURL(backgroundImage, {
        crossOrigin: "anonymous",
      }).then((img) => {
        if (!img) return;

        const containerWidth = canvas.width;
        const containerHeight = canvas.height;

        // 为底部控件留出空间（大约300px）
        const bottomControlsHeight = 332;
        const availableHeight = containerHeight - bottomControlsHeight;

        // 计算缩放比例以适应可用空间
        const scaleX = containerWidth / img.width;
        const scaleY = availableHeight / img.height;
        const scale = Math.min(scaleX, scaleY);

        // 计算图片的实际尺寸
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (containerWidth - scaledWidth) / 2, // 水平居中
          top: (availableHeight - scaledHeight) / 2 + 16, // 在可用空间内垂直居中
          selectable: false,
          evented: false,
        });

        canvas.backgroundImage = img;
        canvas.renderAll();
      });
    } else {
      canvas.backgroundImage = undefined;
      canvas.renderAll();
    }
  }, [backgroundImage]);

  // 清除所有路径对象
  const clearAllPaths = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    // 获取画布上的所有对象
    const objects = fabricCanvasRef.current.getObjects();

    // 移除所有路径对象
    objects.forEach((obj) => {
      if (obj instanceof Path) {
        fabricCanvasRef.current?.remove(obj);
      }
    });

    fabricCanvasRef.current.renderAll();
  }, []);

  // 开始绘制路径
  const startDrawing = useCallback(
    (event: unknown) => {
      if (!fabricCanvasRef.current || !fabricCanvasRef.current.isDrawingMode)
        return;

      const pointer = fabricCanvasRef.current.getPointer(
        (event as { e: MouseEvent }).e
      );

      // 清除画布上的所有路径
      clearAllPaths();

      setIsDrawing(true);
      setCurrentPath(null);
      setPathPoints(`M ${pointer.x} ${pointer.y}`);
    },
    [clearAllPaths]
  );

  // 绘制路径
  const drawPath = useCallback(
    (event: unknown) => {
      if (
        !isDrawing ||
        !fabricCanvasRef.current ||
        !fabricCanvasRef.current.isDrawingMode
      )
        return;

      const pointer = fabricCanvasRef.current.getPointer(
        (event as { e: MouseEvent }).e
      );

      const newPathPoints = pathPoints + ` L ${pointer.x} ${pointer.y}`;
      setPathPoints(newPathPoints);

      // 移除当前临时路径
      if (currentPath) {
        fabricCanvasRef.current.remove(currentPath);
      }

      // 创建新的临时路径显示
      const path = new Path(newPathPoints, {
        stroke: "#ff0000",
        strokeWidth: 2,
        fill: "",
        selectable: false,
        evented: false,
      });

      fabricCanvasRef.current.add(path);
      setCurrentPath(path);
      fabricCanvasRef.current.renderAll();
    },
    [isDrawing, pathPoints, currentPath]
  );

  // 完成绘制并闭合路径
  const finishDrawing = useCallback(() => {
    if (
      !isDrawing ||
      !fabricCanvasRef.current ||
      !pathPoints ||
      !fabricCanvasRef.current.isDrawingMode
    )
      return;

    // 移除临时路径
    if (currentPath) {
      fabricCanvasRef.current.remove(currentPath);
    }

    // 自动闭合路径
    const closedPath = pathPoints + " Z";

    // 创建最终的闭合路径
    const finalPath = new Path(closedPath, {
      stroke: "#ff0000",
      strokeWidth: 2,
      fill: "rgba(255, 0, 0, 0)",
      selectable: false,
      evented: false,
    });

    fabricCanvasRef.current.add(finalPath);
    fabricCanvasRef.current.renderAll();

    // 调用回调函数
    if (onPathComplete) {
      onPathComplete(closedPath);
    }

    // 重置状态
    setIsDrawing(false);
    setCurrentPath(null);
    setPathPoints("");
  }, [isDrawing, pathPoints, currentPath, onPathComplete]);

  // 绑定绘制事件
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    canvas.on("mouse:down", startDrawing);
    canvas.on("mouse:move", drawPath);
    canvas.on("mouse:up", finishDrawing);

    return () => {
      canvas.off("mouse:down", startDrawing);
      canvas.off("mouse:move", drawPath);
      canvas.off("mouse:up", finishDrawing);
    };
  }, [startDrawing, drawPath, finishDrawing]);

  // 获取合成图像数据
  const getCompositeImageData = useCallback(() => {
    if (!fabricCanvasRef.current) return null;

    const canvas = fabricCanvasRef.current;

    // 使用高质量设置导出，保持原图分辨率
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1.0, // 最高质量
      multiplier: window.devicePixelRatio || 1, // 考虑设备像素比
      enableRetinaScaling: true, // 启用高分辨率支持
    });

    return dataURL;
  }, []);

  // 检查是否有路径
  const hasPath = useCallback(() => {
    if (!fabricCanvasRef.current) return false;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();
    return objects.some((obj) => obj instanceof Path);
  }, []);

  // 检查是否有拖拽的图片
  const hasDroppedImages = useCallback(() => {
    if (!fabricCanvasRef.current) return false;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();
    return objects.some(
      (obj) => obj instanceof FabricImage && obj !== canvas.backgroundImage
    );
  }, []);

  // 清除路径
  const clearPath = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      if (obj instanceof Path) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
  }, []);

  // 清除拖拽的图片
  const clearDroppedImages = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      if (obj instanceof FabricImage && obj !== canvas.backgroundImage) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
  }, []);

  // 导出合成图像 - 保持原图尺寸，裁剪超出部分
  const exportCompositeImage = useCallback(() => {
    if (!fabricCanvasRef.current) return null;

    const canvas = fabricCanvasRef.current;
    const backgroundImage = canvas.backgroundImage;

    if (!backgroundImage) {
      // 如果没有背景图，使用当前canvas导出
      return canvas.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: 1,
      });
    }

    // 获取原图的真实尺寸
    const originalWidth = backgroundImage.width;
    const originalHeight = backgroundImage.height;

    // 获取背景图在canvas中的位置和缩放
    const bgLeft = backgroundImage.left || 0;
    const bgTop = backgroundImage.top || 0;
    const bgScaleX = backgroundImage.scaleX || 1;
    const bgScaleY = backgroundImage.scaleY || 1;

    // 计算背景图在canvas中的实际显示尺寸
    const displayWidth = originalWidth * bgScaleX;
    const displayHeight = originalHeight * bgScaleY;

    // 使用canvas的toDataURL方法，指定裁剪区域为背景图的显示区域
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1.0,
      multiplier: originalWidth / displayWidth, // 缩放到原图尺寸
      left: bgLeft,
      top: bgTop,
      width: displayWidth,
      height: displayHeight,
    });

    return dataURL;
  }, []);

  // 暴露方法给window对象
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const pathDrawingCanvas = {
        clearPath,
        exportCompositeImage,
        hasPath,
        clearDroppedImages,
        hasDroppedImages,
        getCompositeImageData,
      };

      (
        window as unknown as { pathDrawingCanvas: typeof pathDrawingCanvas }
      ).pathDrawingCanvas = pathDrawingCanvas;
    }
  }, [
    clearPath,
    exportCompositeImage,
    hasPath,
    clearDroppedImages,
    hasDroppedImages,
    getCompositeImageData,
  ]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: "none" }}
      />
    </div>
  );
};

export default PathDrawingCanvas;

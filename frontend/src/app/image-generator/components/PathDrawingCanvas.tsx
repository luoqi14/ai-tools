"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, Path, FabricImage, Control, util, Point } from "fabric";
import { useDroppable } from "@dnd-kit/core";

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

  // 使用dnd-kit的useDroppable hook
  const { setNodeRef } = useDroppable({
    id: 'canvas-drop-zone',
    data: {
      accepts: ['treasure-image'],
    },
  });

  // 处理dnd-kit拖拽数据的函数
  const handleDndKitDrop = useCallback((imageData: { id: string; url: string; thumbnailUrl?: string; file: File; timestamp: number }, dropPosition: { x: number; y: number }) => {
    if (!fabricCanvasRef.current) {
      console.error("Canvas not initialized");
      return;
    }

    const canvas = fabricCanvasRef.current;

    // 立即调用拖拽完成回调，确保百宝箱能够自动关闭
    if (onImageDropped) {
      onImageDropped();
    }

    // 验证图片数据的有效性
    if (!imageData || !imageData.url) {
      console.warn("Invalid image data received:", imageData);
      return;
    }

    // 添加加载超时处理
    const loadTimeout = setTimeout(() => {
      console.warn("Image loading timeout for URL:", imageData.url);
    }, 10000); // 10秒超时

    // 创建图片对象
    FabricImage.fromURL(imageData.url, {
      crossOrigin: "anonymous",
    }).then((img) => {
      clearTimeout(loadTimeout);

      if (!img) {
        console.warn("Failed to load image from URL:", imageData.url);
        return;
      }

      // 验证图片尺寸
      if (img.width <= 0 || img.height <= 0) {
        console.warn("Invalid image dimensions:", img.width, img.height);
        return;
      }

      // 智能缩放
      const maxSize = 200;
      const scale = Math.min(
        maxSize / img.width,
        maxSize / img.height,
        0.3
      );

      // 确保缩放值有效
      const finalScale = Math.max(0.1, Math.min(scale, 2.0));

      // 正确转换坐标：考虑viewport变换（缩放、平移等）
      // 获取canvas元素的位置信息
      const canvasElement = canvas.getElement();
      const rect = canvasElement.getBoundingClientRect();

      // 计算相对于canvas的坐标
      const relativeX = dropPosition.x - rect.left;
      const relativeY = dropPosition.y - rect.top;

      console.log('🎯 拖拽坐标调试信息:', {
        dropPosition,
        canvasRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        relative: { x: relativeX, y: relativeY },
        canvasSize: { width: canvas.width, height: canvas.height },
        zoom: canvas.getZoom(),
        viewportTransform: canvas.viewportTransform
      });

      // 手动进行viewport变换的逆变换
      const vpt = canvas.viewportTransform;
      let canvasPointer;

      if (vpt) {
        // 应用viewport变换的逆变换
        // vpt格式: [scaleX, skewY, skewX, scaleY, translateX, translateY]
        const scaleX = vpt[0];
        const scaleY = vpt[3];
        const translateX = vpt[4];
        const translateY = vpt[5];

        canvasPointer = {
          x: (relativeX - translateX) / scaleX,
          y: (relativeY - translateY) / scaleY
        };
      } else {
        // 没有变换，直接使用相对坐标
        canvasPointer = {
          x: relativeX,
          y: relativeY
        };
      }

      console.log('🎯 手动转换后的canvas坐标:', canvasPointer);

      img.set({
        left: canvasPointer.x - (img.width * finalScale) / 2,
        top: canvasPointer.y - (img.height * finalScale) / 2,
        scaleX: finalScale,
        scaleY: finalScale,
        selectable: true,
        evented: true,
      });

      // 设置自定义控制器
      try {
        img.controls.deleteControl = createDeleteControl();
      } catch (controlError) {
        console.warn("Failed to set delete control:", controlError);
      }

      canvas.add(img);
      setDroppedImages((prev) => [...prev, img]);
      canvas.renderAll();
    }).catch((error) => {
      clearTimeout(loadTimeout);
      console.error("Error loading image:", error);

      // 可以在这里添加用户友好的错误提示
      if (typeof window !== 'undefined' && (window as unknown as { showToast?: (type: string, title: string, message: string) => void }).showToast) {
        (window as unknown as { showToast: (type: string, title: string, message: string) => void }).showToast("error", "图片加载失败", "请尝试重新上传图片");
      }
    });
  }, [onImageDropped]);

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
      mouseUpHandler: (_eventData, transform) => {
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

    // 移动端触摸手势支持 - 使用原生DOM事件
    let lastTouchDistance = 0;
    let lastTouchCenter = { x: 0, y: 0 };
    let isTouchGesture = false;
    const upperCanvasElement = canvas.upperCanvasEl;

    // 计算两点间距离
    const getTouchDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // 计算两点中心
    const getTouchCenter = (touch1: Touch, touch2: Touch) => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    };

    // 触摸开始事件
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();


        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        lastTouchDistance = getTouchDistance(touch1, touch2);
        lastTouchCenter = getTouchCenter(touch1, touch2);
        isTouchGesture = true;

        // 暂时禁用Fabric.js的交互
        canvas.selection = false;
        if (canvas.isDrawingMode) {
          canvas.isDrawingMode = false;
        }
      }
    };

    // 触摸移动事件
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isTouchGesture) {
        e.preventDefault();
        e.stopPropagation();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const currentDistance = getTouchDistance(touch1, touch2);
        const currentCenter = getTouchCenter(touch1, touch2);

        // 缩放处理
        if (lastTouchDistance > 0) {
          const scale = currentDistance / lastTouchDistance;

          // 缩放阈值，避免过于敏感
          if (Math.abs(scale - 1) > 0.02) {
            let zoom = canvas.getZoom();
            zoom *= scale;

            // 限制缩放范围
            if (zoom > 20) zoom = 20;
            if (zoom < 0.1) zoom = 0.1;

            // 获取canvas相对位置
            const rect = upperCanvasElement.getBoundingClientRect();
            const centerPoint = new Point(
              currentCenter.x - rect.left,
              currentCenter.y - rect.top
            );

            canvas.zoomToPoint(centerPoint, zoom);
          }
        }

        // 平移处理
        if (lastTouchCenter.x !== 0 && lastTouchCenter.y !== 0) {
          const deltaX = currentCenter.x - lastTouchCenter.x;
          const deltaY = currentCenter.y - lastTouchCenter.y;

          // 平移阈值，避免过于敏感
          if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            const vpt = canvas.viewportTransform;
            if (vpt) {
              vpt[4] += deltaX;
              vpt[5] += deltaY;
              canvas.requestRenderAll();
            }
          }
        }

        lastTouchDistance = currentDistance;
        lastTouchCenter = currentCenter;
      }
    };

    // 触摸结束事件
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && isTouchGesture) {
        // 重新启用Fabric.js的交互
        canvas.selection = true;

        // 如果之前在绘制模式，重新启用
        if (showPathDrawing) {
          canvas.isDrawingMode = true;
        }

        // 重置状态
        lastTouchDistance = 0;
        lastTouchCenter = { x: 0, y: 0 };
        isTouchGesture = false;
      }
    };

    // 添加触摸事件监听器到 upper-canvas
    upperCanvasElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    upperCanvasElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    upperCanvasElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    upperCanvasElement.addEventListener('touchcancel', handleTouchEnd, { passive: false });

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

    // HTML5拖拽事件处理已移除，现在使用dnd-kit的useDroppable hook

    return () => {
      // 清理触摸事件监听器
      upperCanvasElement.removeEventListener('touchstart', handleTouchStart);
      upperCanvasElement.removeEventListener('touchmove', handleTouchMove);
      upperCanvasElement.removeEventListener('touchend', handleTouchEnd);
      upperCanvasElement.removeEventListener('touchcancel', handleTouchEnd);

      resizeObserver.disconnect();
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

      const pointer = fabricCanvasRef.current.getScenePoint(
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

      const pointer = fabricCanvasRef.current.getScenePoint(
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
        handleDndKitDrop, // 添加dnd-kit拖拽处理函数
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
    handleDndKitDrop,
  ]);

  return (
    <div
      ref={setNodeRef}
      className={`relative w-full h-full ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: "none" }}
      />
    </div>
  );
};

export default PathDrawingCanvas;

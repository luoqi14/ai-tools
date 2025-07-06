"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { IconDotsVertical } from "@tabler/icons-react";

interface CompareProps {
  firstImage?: string;
  secondImage?: string;
  className?: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
}

export const Compare = ({
  firstImage = "",
  secondImage = "",
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = "hover",
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000,
}: CompareProps) => {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const [, setIsMouseOver] = useState(false);
  const [imageRect, setImageRect] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
  } | null>(null);

  const sliderRef = useRef<HTMLDivElement>(null);
  const firstImageRef = useRef<HTMLImageElement>(null);
  const secondImageRef = useRef<HTMLImageElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // 计算图片实际显示区域
  const calculateImageRect = useCallback(() => {
    if (!sliderRef.current || !firstImageRef.current) return;

    const container = sliderRef.current.getBoundingClientRect();
    const img = firstImageRef.current;

    // 获取图片的原始尺寸
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (naturalWidth === 0 || naturalHeight === 0) return;

    // 计算在object-contain模式下的实际显示尺寸
    const containerAspect = container.width / container.height;
    const imageAspect = naturalWidth / naturalHeight;

    let displayWidth, displayHeight, left, top;

    if (imageAspect > containerAspect) {
      // 图片较宽，以容器宽度为准
      displayWidth = container.width;
      displayHeight = container.width / imageAspect;
      left = 0;
      top = (container.height - displayHeight) / 2;
    } else {
      // 图片较高，以容器高度为准
      displayHeight = container.height;
      displayWidth = container.height * imageAspect;
      left = (container.width - displayWidth) / 2;
      top = 0;
    }

    setImageRect({
      width: displayWidth,
      height: displayHeight,
      left,
      top,
    });
  }, []);

  // 图片加载完成后计算尺寸
  const handleImageLoad = useCallback(() => {
    calculateImageRect();
  }, [calculateImageRect]);

  // 窗口大小改变时重新计算
  useEffect(() => {
    const handleResize = () => {
      calculateImageRect();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateImageRect]);

  const startAutoplay = useCallback(() => {
    if (!autoplay) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress =
        (elapsedTime % (autoplayDuration * 2)) / autoplayDuration;
      const percentage = progress <= 1 ? progress * 100 : (2 - progress) * 100;

      setSliderXPercent(percentage);
      autoplayRef.current = setTimeout(animate, 16); // ~60fps
    };

    animate();
  }, [autoplay, autoplayDuration]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [startAutoplay, stopAutoplay]);

  function mouseEnterHandler() {
    setIsMouseOver(true);
    stopAutoplay();
  }

  function mouseLeaveHandler() {
    setIsMouseOver(false);
    if (slideMode === "hover") {
      setSliderXPercent(initialSliderPercentage);
    }
    if (slideMode === "drag") {
      setIsDragging(false);
    }
    startAutoplay();
  }

  const handleStart = useCallback(() => {
    if (slideMode === "drag") {
      setIsDragging(true);
    }
  }, [slideMode]);

  const handleEnd = useCallback(() => {
    if (slideMode === "drag") {
      setIsDragging(false);
    }
  }, [slideMode]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!sliderRef.current || !imageRect) return;
      if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
        const rect = sliderRef.current.getBoundingClientRect();
        const x = clientX - rect.left;

        // 限制在图片实际区域内
        const imageLeft = imageRect.left;
        const imageRight = imageRect.left + imageRect.width;

        if (x < imageLeft || x > imageRight) return;

        const relativeX = x - imageLeft;
        const percent = (relativeX / imageRect.width) * 100;

        requestAnimationFrame(() => {
          setSliderXPercent(Math.max(0, Math.min(100, percent)));
        });
      }
    },
    [slideMode, isDragging, imageRect]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleStart();
      handleMove(e.clientX);
    },
    [handleStart, handleMove]
  );
  const handleMouseUp = useCallback(() => handleEnd(), [handleEnd]);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => handleMove(e.clientX),
    [handleMove]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!autoplay) {
        handleStart();
        handleMove(e.touches[0].clientX);
      }
    },
    [handleStart, handleMove, autoplay]
  );

  const handleTouchEnd = useCallback(() => {
    if (!autoplay) {
      handleEnd();
    }
  }, [handleEnd, autoplay]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!autoplay) {
        handleMove(e.touches[0].clientX);
      }
    },
    [handleMove, autoplay]
  );

  // 计算滑块在图片区域内的位置
  const getSliderPosition = () => {
    if (!imageRect) return { left: "50%", display: "none" };

    const sliderLeft =
      imageRect.left + (imageRect.width * sliderXPercent) / 100;
    return {
      left: `${sliderLeft}px`,
      display: "block",
      height: `${imageRect.height}px`,
      top: `${imageRect.top}px`,
    };
  };

  return (
    <div
      ref={sliderRef}
      className={cn("overflow-hidden", className)}
      style={{
        position: "relative",
        cursor: slideMode === "drag" ? "grab" : "col-resize",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={mouseLeaveHandler}
      onMouseEnter={mouseEnterHandler}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <AnimatePresence initial={false}>
        {imageRect && (
          <motion.div
            className="w-px absolute z-30 bg-gradient-to-b from-transparent from-[5%] to-[95%] via-indigo-500 to-transparent"
            style={getSliderPosition()}
            transition={{ duration: 0 }}
          >
            <div className="w-36 h-full [mask-image:radial-gradient(100px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-indigo-400 via-transparent to-transparent z-20 opacity-50" />
            <div className="w-10 h-1/2 [mask-image:radial-gradient(50px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-cyan-400 via-transparent to-transparent z-10 opacity-100" />
            <div className="w-10 h-3/4 top-1/2 -translate-y-1/2 absolute -right-10 [mask-image:radial-gradient(100px_at_left,white,transparent)]">
              <MemoizedSparklesCore
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={1200}
                className="w-full h-full"
                particleColor="#FFFFFF"
              />
            </div>
            {showHandlebar && (
              <div className="h-5 w-5 rounded-md top-1/2 -translate-y-1/2 bg-white z-30 -right-2.5 absolute flex items-center justify-center shadow-[0px_-1px_0px_0px_#FFFFFF40]">
                <IconDotsVertical className="h-4 w-4 text-black" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-hidden w-full h-full relative z-20 pointer-events-none">
        <AnimatePresence initial={false}>
          {firstImage ? (
            <motion.div
              className={cn(
                "absolute inset-0 z-20 rounded-2xl shrink-0 w-full h-full select-none overflow-hidden",
                firstImageClassName
              )}
              style={{
                clipPath: imageRect
                  ? `polygon(0 0, ${
                      imageRect.left + (imageRect.width * sliderXPercent) / 100
                    }px 0, ${
                      imageRect.left + (imageRect.width * sliderXPercent) / 100
                    }px 100%, 0 100%)`
                  : `inset(0 ${100 - sliderXPercent}% 0 0)`,
              }}
              transition={{ duration: 0 }}
            >
              <img
                ref={firstImageRef}
                alt="first image"
                src={firstImage}
                className={cn(
                  "absolute inset-0 z-20 rounded-2xl shrink-0 w-full h-full select-none object-contain",
                  firstImageClassName
                )}
                draggable={false}
                onLoad={handleImageLoad}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {secondImage ? (
          <motion.img
            ref={secondImageRef}
            className={cn(
              "absolute top-0 left-0 z-[19] rounded-2xl w-full h-full select-none object-contain",
              secondImageClassname
            )}
            alt="second image"
            src={secondImage}
            draggable={false}
            onLoad={handleImageLoad}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const MemoizedSparklesCore = React.memo(SparklesCore);

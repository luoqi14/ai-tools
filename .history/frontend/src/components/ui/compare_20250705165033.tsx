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
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const firstImageRef = useRef<HTMLImageElement>(null);
  const secondImageRef = useRef<HTMLImageElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

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
      if (!firstImageRef.current) return;
      if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
        const rect = firstImageRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = (x / rect.width) * 100;

        requestAnimationFrame(() => {
          setSliderXPercent(Math.max(0, Math.min(100, percent)));
        });
      }
    },
    [slideMode, isDragging]
  );

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // 图片鼠标事件
  const handleImageMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMove(e.clientX);
    },
    [handleMove]
  );

  const handleImageMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart();
      handleMove(e.clientX);
    },
    [handleStart, handleMove]
  );

  const handleImageMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleImageMouseEnter = useCallback(() => {
    stopAutoplay();
  }, [stopAutoplay]);

  const handleImageMouseLeave = useCallback(() => {
    if (slideMode === "hover") {
      setSliderXPercent(initialSliderPercentage);
    }
    if (slideMode === "drag") {
      setIsDragging(false);
    }
    startAutoplay();
  }, [slideMode, initialSliderPercentage, startAutoplay]);

  // 触摸事件
  const handleImageTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!autoplay) {
        e.preventDefault();
        handleStart();
        handleMove(e.touches[0].clientX);
      }
    },
    [handleStart, handleMove, autoplay]
  );

  const handleImageTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!autoplay) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    },
    [handleMove, autoplay]
  );

  const handleImageTouchEnd = useCallback(() => {
    if (!autoplay) {
      handleEnd();
    }
  }, [handleEnd, autoplay]);

  // 获取滑块位置（基于第一张图片的位置）
  const getSliderStyle = () => {
    if (!firstImageRef.current || !imageLoaded) {
      return { display: "none" };
    }

    const imgRect = firstImageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) return { display: "none" };

    const sliderLeft =
      imgRect.left -
      containerRect.left +
      (imgRect.width * sliderXPercent) / 100;

    return {
      left: `${sliderLeft}px`,
      top: `${imgRect.top - containerRect.top}px`,
      height: `${imgRect.height}px`,
      display: "block",
    };
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* 背景图片 (secondImage) */}
      {secondImage && (
        <img
          ref={secondImageRef}
          src={secondImage}
          alt="second image"
          className={cn("w-full h-full object-contain", secondImageClassname)}
          draggable={false}
          onLoad={handleImageLoad}
        />
      )}

      {/* 前景图片 (firstImage) - 覆盖在背景图片上 */}
      {firstImage && (
        <img
          ref={firstImageRef}
          src={firstImage}
          alt="first image"
          className={cn(
            "absolute inset-0 w-full h-full object-contain cursor-col-resize",
            slideMode === "drag" && "cursor-grab",
            isDragging && "cursor-grabbing",
            firstImageClassName
          )}
          style={{
            clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`,
          }}
          draggable={false}
          onLoad={handleImageLoad}
          onMouseMove={handleImageMouseMove}
          onMouseDown={handleImageMouseDown}
          onMouseUp={handleImageMouseUp}
          onMouseEnter={handleImageMouseEnter}
          onMouseLeave={handleImageMouseLeave}
          onTouchStart={handleImageTouchStart}
          onTouchMove={handleImageTouchMove}
          onTouchEnd={handleImageTouchEnd}
        />
      )}

      {/* 滑块线条 */}
      <AnimatePresence initial={false}>
        {imageLoaded && firstImageRef.current && (
          <motion.div
            className="absolute w-px z-30 bg-gradient-to-b from-transparent from-[5%] to-[95%] via-indigo-500 to-transparent pointer-events-none"
            style={getSliderStyle()}
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
    </div>
  );
};

const MemoizedSparklesCore = React.memo(SparklesCore);

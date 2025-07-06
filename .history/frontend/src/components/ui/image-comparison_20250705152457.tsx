"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  beforeAlt?: string;
  afterAlt?: string;
}

export function ImageComparison({
  beforeImage,
  afterImage,
  className,
  beforeAlt = "处理前",
  afterAlt = "处理后",
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderPosition(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updateSliderPosition(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateSliderPosition = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden rounded-lg border bg-muted select-none",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Before Image */}
      <div className="absolute inset-0">
        <img
          src={beforeImage}
          alt={beforeAlt}
          className="w-full h-full object-contain"
          draggable={false}
        />
        <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
          {beforeAlt}
        </div>
      </div>

      {/* After Image */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: `polygon(${sliderPosition}% 0%, 100% 0%, 100% 100%, ${sliderPosition}% 100%)`,
        }}
      >
        <img
          src={afterImage}
          alt={afterAlt}
          className="w-full h-full object-contain"
          draggable={false}
        />
        <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
          {afterAlt}
        </div>
      </div>

      {/* Slider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
      >
        {/* Slider Handle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-col-resize">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-0.5 h-3 bg-gray-400 mx-0.5"></div>
            <div className="w-0.5 h-3 bg-gray-400 mx-0.5"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 单独的图片显示组件
export function ImageDisplay({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden rounded-lg border bg-muted",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}

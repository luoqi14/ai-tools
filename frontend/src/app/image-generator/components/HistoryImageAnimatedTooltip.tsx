"use client";

import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";

interface HistoryImageData {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  timestamp: number;
  file?: File;
  originalUrl?: string;
  sourceImageId?: string;
  originalUserInput?: string;
  optimizedPrompt?: string;
  chinesePrompt?: string;
  optimizationReason?: string;
}

interface HistoryImageAnimatedTooltipProps {
  imageData: HistoryImageData;
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const HistoryImageAnimatedTooltip = ({
  imageData,
  children,
  isOpen = false,
  onOpenChange
}: HistoryImageAnimatedTooltipProps) => {
  // 内部状态，仅在非受控模式下使用
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<number | null>(null);

  // 如果传入了isOpen和onOpenChange，则使用受控模式
  const isControlled = isOpen !== undefined && onOpenChange !== undefined;

  // 根据是否受控来决定使用哪个状态
  const isTooltipOpen = isControlled ? isOpen : internalHoveredIndex === 1;

  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0); // going to set this value on mouse move
  // rotate the tooltip
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  // translate the tooltip
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig,
  );
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const halfWidth = target.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth); // set the x value, which is then used in transform and rotate
  };

  // 处理鼠标进入事件
  const handleMouseEnter = () => {
    if (isControlled) {
      onOpenChange?.(true);
    } else {
      setInternalHoveredIndex(1);
    }
  };

  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalHoveredIndex(null);
    }
  };

  const hasDetailedInfo = imageData.originalUserInput || imageData.optimizedPrompt || imageData.optimizationReason;

  return (
    <div
      className="group relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="popLayout">
        {isTooltipOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.6 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 10,
              },
            }}
            exit={{ opacity: 0, y: 20, scale: 0.6 }}
            style={{
              translateX: translateX,
              rotate: rotate,
              whiteSpace: "normal",
            }}
            className="absolute -top-4 left-1/2 z-[9999] -translate-x-1/2 -translate-y-full rounded-md bg-black/95 backdrop-blur-sm px-4 py-2 text-xs text-left shadow-xl border border-white/20 max-w-[300px] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] break-words w-max"
          >
            <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
            <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

            {/* 小箭头 */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95"></div>
            
            <div className="relative z-30 space-y-3 text-left">

              {/* 原始用户输入 */}
              {imageData.originalUserInput && (
                <div>
                  <div className="text-white/90 text-xs leading-relaxed">
                    {imageData.originalUserInput}
                  </div>
                </div>
              )}

              {/* 优化后的提示词 */}
              {imageData.optimizedPrompt && imageData.optimizedPrompt !== imageData.originalUserInput && (
                <div>
                  <div className="text-white/90 text-xs leading-relaxed">
                    <div>{imageData.optimizedPrompt}</div>
                    <div>{imageData.chinesePrompt}</div>
                  </div>
                </div>
              )}

              {/* 优化原因 */}
              {imageData.optimizationReason && (
                <div>
                  <div className="text-white/70 text-xs leading-relaxed">
                    {imageData.optimizationReason}
                  </div>
                </div>
              )}

              {/* 如果没有详细信息，显示基本提示词 */}
              {!hasDetailedInfo && (
                <div>
                  <div className="text-white font-semibold mb-1.5 text-xs">提示词：</div>
                  <div className="text-white/90 text-xs leading-relaxed">
                    {imageData.prompt}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div onMouseMove={handleMouseMove}>
        {children}
      </div>
    </div>
  );
};

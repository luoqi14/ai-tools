"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedCircularProgressBarProps {
  value: number;
  max?: number;
  min?: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function AnimatedCircularProgressBar({
  value,
  max = 100,
  min = 0,
  gaugePrimaryColor = "#3b82f6",
  gaugeSecondaryColor = "#e5e7eb",
  className,
  size = 120,
  strokeWidth = 8,
  children,
}: AnimatedCircularProgressBarProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (value - min) / (max - min);
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugeSecondaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugePrimaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1,
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(percentage * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}

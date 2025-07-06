"use client";

import { cn } from "@/lib/utils";
import { CSSProperties, ReactNode } from "react";

interface ShimmerButtonProps {
  children: ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function ShimmerButton({
  children,
  className,
  shimmerColor = "#ffffff",
  shimmerSize = "150px",
  borderRadius = "100px",
  shimmerDuration = "3s",
  background = "radial-gradient(ellipse 80% 50% at 50% 120%, #7c3aed, #a855f7)",
  onClick,
  disabled = false,
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
          "--shimmer-duration": shimmerDuration,
          "--border-radius": borderRadius,
          background,
        } as CSSProperties
      }
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 text-white [border-radius:var(--border-radius)] transition-all duration-300 hover:scale-105 active:scale-95",
        "before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,var(--shimmer-color)_50%,transparent_75%,transparent_100%)] before:bg-[length:var(--shimmer-size)_100%] before:bg-[position:-100%_0] before:opacity-0 before:transition-[background-position_0s_ease_0s,opacity_0.5s_ease_0s] before:content-['']",
        "hover:before:animate-[shimmer_var(--shimmer-duration)_ease-in-out_infinite] hover:before:bg-[position:200%_0] hover:before:opacity-100",
        disabled &&
          "cursor-not-allowed opacity-50 hover:scale-100 active:scale-100",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="relative z-10 font-medium">{children}</span>
    </button>
  );
}

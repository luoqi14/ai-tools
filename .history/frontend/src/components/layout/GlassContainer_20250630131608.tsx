"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassContainerProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export default function GlassContainer({
  children,
  className = "",
  animate = true,
}: GlassContainerProps) {
  const content = (
    <div className={`glass-panel rounded-2xl border-white/20 ${className}`}>
      {children}
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {content}
    </motion.div>
  );
}

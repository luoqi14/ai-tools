"use client";

import React, { useEffect, useRef } from "react";
import { Canvas } from "fabric";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function TestPopoverPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 600,
      height: 400,
      backgroundColor: "#f0f0f0",
    });

    fabricCanvasRef.current = canvas;

    // 添加一些基本的事件监听
    canvas.on("mouse:down", (e) => {
      console.log("Fabric canvas mouse:down", e);
      // 手动关闭Popover
      setIsPopoverOpen(false);
    });

    canvas.on("mouse:up", (e) => {
      console.log("Fabric canvas mouse:up", e);
    });

    // 添加触摸事件监听
    const canvasElement = canvas.upperCanvasEl;
    
    const handleTouchStart = (e: TouchEvent) => {
      console.log("Canvas touchstart", e.touches.length);
      // 单指触摸时手动关闭Popover
      if (e.touches.length === 1) {
        setIsPopoverOpen(false);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      console.log("Canvas touchend", e.touches.length);
    };

    canvasElement.addEventListener('touchstart', handleTouchStart);
    canvasElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvasElement.removeEventListener('touchstart', handleTouchStart);
      canvasElement.removeEventListener('touchend', handleTouchEnd);
      canvas.dispose();
    };
  }, []);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Popover + Fabric.js 测试</h1>
      
      <div className="space-y-4">
        <p>测试说明：</p>
        <ul className="list-disc list-inside space-y-2">
          <li>点击按钮打开Popover</li>
          <li>然后点击下面的Fabric.js canvas区域</li>
          <li>观察Popover是否会关闭</li>
          <li>在桌面端和移动端分别测试</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Fabric.js Canvas</h2>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <canvas
            ref={canvasRef}
            className="border border-gray-200"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">打开 Popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" onInteractOutside={(e) => {
                        // 阻止因焦点丢失而关闭popover
                        e.preventDefault();
                      }}>
            <div className="space-y-2">
              <h4 className="font-medium">测试 Popover</h4>
              <p className="text-sm text-muted-foreground">
                这是一个测试Popover。点击canvas区域看看是否会关闭。
              </p>
              <div className="space-y-2">
                <Button size="sm" className="w-full">
                  测试按钮 1
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  测试按钮 2
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">普通 div 区域（对照组）</h2>
        <div 
          className="w-[600px] h-[200px] bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center cursor-pointer"
          onClick={() => console.log("Normal div clicked")}
        >
          <p>点击这个普通div区域测试Popover是否关闭</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">控制台日志</h3>
        <p className="text-sm text-gray-600">
          打开浏览器控制台查看点击事件的日志输出
        </p>
      </div>
    </div>
  );
}

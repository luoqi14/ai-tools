"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

export default function ShadcnTest() {
  return (
    <div className="min-h-screen bg-red-500 p-8">
      {/* 先测试基础 Tailwind 样式 */}
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-white text-center">
          shadcn/ui 组件测试
        </h1>

        {/* 如果背景是红色，说明 Tailwind 正常工作 */}
        <div className="bg-yellow-400 p-4 rounded text-center text-black">
          如果你看到红色背景和黄色卡片，说明 Tailwind CSS 正常工作！
        </div>

        {/* 测试原生 button */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            原生按钮
          </h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">
            原生 Tailwind 按钮
          </button>
        </div>

        {/* 测试 shadcn Button */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            shadcn/ui 按钮
          </h2>
          <div className="space-x-4">
            <Button>默认按钮</Button>
            <Button variant="outline">轮廓按钮</Button>
            <Button variant="destructive">危险按钮</Button>
          </div>
        </div>

        {/* 测试 shadcn Card */}
        <Card>
          <CardHeader>
            <CardTitle>卡片标题</CardTitle>
            <CardDescription>卡片描述</CardDescription>
          </CardHeader>
          <CardContent>
            <p>这是一个 shadcn/ui 卡片组件的内容。</p>
          </CardContent>
        </Card>

        {/* 原始样式测试 */}
        <div
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          这是一个使用内联样式的元素 - 如果显示绿色，说明不是样式加载问题
        </div>
      </div>
    </div>
  );
}

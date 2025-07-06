"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="leading-none font-medium">Dimensions</h4>
                <p className="text-muted-foreground text-sm">
                  Set the dimensions for the layer.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    defaultValue="100%"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxWidth">Max. width</Label>
                  <Input
                    id="maxWidth"
                    defaultValue="300px"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    defaultValue="25px"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxHeight">Max. height</Label>
                  <Input
                    id="maxHeight"
                    defaultValue="none"
                    className="col-span-2 h-8"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

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

        {/* 测试 Tooltip 动画 */}
        <TooltipProvider>
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Tooltip 动画测试
            </h2>
            <div className="space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">悬停我</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>这是一个 Tooltip 提示</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button>带图标的按钮</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>带图标的按钮说明</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary">
                    <Info className="w-4 h-4 mr-1" />
                    信息徽章
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>这是一个信息徽章的说明</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>

        {/* 测试 Alert 组件 */}
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>提示信息</AlertTitle>
            <AlertDescription>
              这是一个普通的提示信息，应该有淡入动画效果。
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误信息</AlertTitle>
            <AlertDescription>
              这是一个错误提示信息，应该有红色背景和动画效果。
            </AlertDescription>
          </Alert>
        </div>

        {/* 测试 Badge 组件 */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Badge 徽章测试
          </h2>
          <div className="space-x-2">
            <Badge>默认</Badge>
            <Badge variant="secondary">次要</Badge>
            <Badge variant="destructive">危险</Badge>
            <Badge variant="outline">轮廓</Badge>
          </div>
        </div>

        {/* 测试 Select 组件动画 */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Select 选择器动画测试
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                选择国家
              </label>
              <Select>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="请选择国家" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="china">中国</SelectItem>
                  <SelectItem value="usa">美国</SelectItem>
                  <SelectItem value="japan">日本</SelectItem>
                  <SelectItem value="uk">英国</SelectItem>
                  <SelectItem value="france">法国</SelectItem>
                  <SelectItem value="germany">德国</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                选择编程语言
              </label>
              <Select>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="请选择编程语言" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="golang">Go</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                选择框架
              </label>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择框架" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="vue">Vue.js</SelectItem>
                  <SelectItem value="angular">Angular</SelectItem>
                  <SelectItem value="svelte">Svelte</SelectItem>
                  <SelectItem value="nextjs">Next.js</SelectItem>
                  <SelectItem value="nuxtjs">Nuxt.js</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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

        {/* 动画效果说明 */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">
            动画效果检查清单
          </h2>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>Tooltip 应该有淡入淡出和缩放动画</li>
            <li>Button 悬停时应该有平滑的颜色过渡</li>
            <li>Alert 组件应该有淡入动画</li>
            <li>Badge 组件应该有微妙的悬停效果</li>
            <li>Select 下拉框应该有淡入淡出和缩放动画</li>
            <li>Select 列表项应该有悬停高亮效果</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

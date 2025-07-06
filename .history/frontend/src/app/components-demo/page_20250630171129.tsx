"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Star,
  Settings,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Download,
  Upload,
  Mail,
  Phone,
  User,
} from "lucide-react";

export default function ComponentsDemo() {
  const [sliderValue, setSliderValue] = useState([50]);
  const [progressValue, setProgressValue] = useState(65);
  const [switchChecked, setSwitchChecked] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            shadcn/ui 组件展示
          </h1>
          <p className="text-lg text-gray-600">
            测试和对比各种 UI 组件的实现效果
          </p>
        </div>

        {/* Tooltip 组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Tooltip 组件
            </CardTitle>
            <CardDescription>悬停显示提示信息的组件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
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
                  <Button>
                    <Heart className="h-4 w-4 mr-2" />
                    带图标的按钮
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>点击收藏此项目</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 bg-blue-100 rounded-lg cursor-help">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>这里有重要信息需要注意</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Button 组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Button 组件</CardTitle>
            <CardDescription>各种样式和状态的按钮</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-3">
                <Button>默认按钮</Button>
                <Button variant="destructive">危险按钮</Button>
                <Button variant="outline">轮廓按钮</Button>
                <Button variant="secondary">次要按钮</Button>
                <Button variant="ghost">幽灵按钮</Button>
                <Button variant="link">链接按钮</Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="sm">小按钮</Button>
                <Button size="default">默认大小</Button>
                <Button size="lg">大按钮</Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button disabled>禁用按钮</Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  下载
                </Button>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  上传
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input 和表单组件 */}
        <Card>
          <CardHeader>
            <CardTitle>输入组件</CardTitle>
            <CardDescription>各种输入控件和表单元素</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input id="email" type="email" placeholder="请输入邮箱" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">手机号码</Label>
                  <Input id="phone" type="tel" placeholder="请输入手机号" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">留言内容</Label>
                  <Textarea
                    id="message"
                    placeholder="请输入您的留言..."
                    className="min-h-20"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>选择国家</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择国家" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cn">中国</SelectItem>
                      <SelectItem value="us">美国</SelectItem>
                      <SelectItem value="jp">日本</SelectItem>
                      <SelectItem value="uk">英国</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>音量控制: {sliderValue[0]}%</Label>
                  <Slider
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>进度显示: {progressValue}%</Label>
                  <Progress value={progressValue} className="w-full" />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setProgressValue(Math.max(0, progressValue - 10))
                      }
                    >
                      -10
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        setProgressValue(Math.min(100, progressValue + 10))
                      }
                    >
                      +10
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badge 和状态组件 */}
        <Card>
          <CardHeader>
            <CardTitle>Badge 和状态组件</CardTitle>
            <CardDescription>各种状态标签和提示组件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Badge 标签</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge>默认</Badge>
                  <Badge variant="secondary">次要</Badge>
                  <Badge variant="destructive">错误</Badge>
                  <Badge variant="outline">轮廓</Badge>
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    成功
                  </Badge>
                  <Badge className="bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    热门
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Alert 提示</h4>
                <div className="space-y-3">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      这是一条普通的信息提示。
                    </AlertDescription>
                  </Alert>

                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      这是一条错误提示，请注意检查。
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Switch 和 Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>交互组件</CardTitle>
            <CardDescription>开关、标签页等交互元素</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">开关控制</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="notifications">通知推送</Label>
                    <p className="text-sm text-gray-500">接收系统通知和更新</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={switchChecked}
                    onCheckedChange={setSwitchChecked}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  当前状态: {switchChecked ? "已开启" : "已关闭"}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">标签页</h4>
                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="account">账户</TabsTrigger>
                    <TabsTrigger value="password">密码</TabsTrigger>
                    <TabsTrigger value="settings">设置</TabsTrigger>
                  </TabsList>

                  <TabsContent value="account" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input id="username" placeholder="输入用户名" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">个人简介</Label>
                      <Textarea id="bio" placeholder="介绍一下你自己..." />
                    </div>
                  </TabsContent>

                  <TabsContent value="password" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="current">当前密码</Label>
                      <Input id="current" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new">新密码</Label>
                      <Input id="new" type="password" />
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>邮件通知</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>短信通知</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>推送通知</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 综合示例 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              综合示例
            </CardTitle>
            <CardDescription>多个组件组合使用的真实场景</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  用户信息卡片
                </h4>
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      JD
                    </div>
                    <div>
                      <h5 className="font-medium">John Doe</h5>
                      <p className="text-sm text-gray-500">前端开发工程师</p>
                    </div>
                    <Badge className="ml-auto">活跃</Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>john.doe@example.com</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>已验证的邮箱地址</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>+86 138 0013 8000</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Mail className="h-4 w-4 mr-1" />
                      发送消息
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>管理用户设置</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">任务进度面板</h4>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">项目开发</span>
                      <Badge variant="secondary">进行中</Badge>
                    </div>
                    <Progress value={75} className="mb-2" />
                    <p className="text-xs text-gray-500">75% 完成</p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">UI 设计</span>
                      <Badge className="bg-green-500">已完成</Badge>
                    </div>
                    <Progress value={100} className="mb-2" />
                    <p className="text-xs text-gray-500">100% 完成</p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">测试验证</span>
                      <Badge variant="outline">待开始</Badge>
                    </div>
                    <Progress value={0} className="mb-2" />
                    <p className="text-xs text-gray-500">0% 完成</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 页面底部 */}
        <div className="text-center text-gray-500 text-sm py-8">
          <p>shadcn/ui 组件展示页面 · 用于测试和对比组件效果</p>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import MeituProcessor from "@/components/tools/MeituProcessor";

export const metadata: Metadata = {
  title: "美图处理 - AI 工具集",
  description: "使用美图秀秀 AI 技术为您的照片带来专业级的美化效果",
  keywords: ["美图处理", "AI美颜", "图片美化", "照片处理", "美图秀秀"],
};

export default function MeituProcessorPage() {
  return <MeituProcessor />;
}

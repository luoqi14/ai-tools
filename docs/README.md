# AI 工具集项目

一个现代化的 AI 工具集平台，采用前后端分离架构，提供极致简约的设计风格。

## 🎯 项目概述

### 技术架构

- **前端**: Next.js 15 + React 19 + Tailwind CSS + shadcn/ui + Magic UI + Aceternity UI + Motion
- **后端**: Flask + Flask-CORS + Python 3.8+
- **设计风格**: 极致简约
- **端口配置**: 前端 3003，后端 8003

### 核心特性

- 🎨 **现代设计**: 极致简约的用户界面
- ⚡ **高性能**: React 19 新特性，优化渲染性能
- 🛠️ **工具集成**: 多种实用 AI 工具集成
- 📱 **响应式**: 完美支持各种设备
- 🔄 **实时交互**: 流畅的动画和交互效果

## 🏗️ 项目结构

```
ai-tools/
├── frontend/                 # Next.js前端项目
│   ├── src/
│   │   ├── app/             # App Router页面
│   │   ├── components/      # React组件
│   │   │   ├── ui/         # shadcn/ui组件
│   │   │   ├── layout/     # 布局组件
│   │   │   └── tools/      # 工具组件
│   │   └── lib/            # 工具函数和API
│   └── public/             # 静态资源
├── backend/                 # Flask后端项目
│   ├── app/                # Flask应用
│   │   ├── routes/         # API路由
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   └── 配置文件
└── docs/                   # 项目文档
```

## 🛠️ 当前工具

### 已集成工具

- 🖼️ **AI 图像生成**: 基于 Black Forest Labs API 的图像生成
- 🎨 **美图云修**: 专业的人像美化处理
- 📝 **文本处理**: 格式化、清理、转换
- 💻 **代码生成**: AI 辅助代码生成
- 📊 **数据分析**: 可视化、统计分析
- 🔧 **JSON 格式化**: 数据格式化验证

### 计划添加

- 🤖 **ChatGPT 集成**
- 🎵 **音频处理**
- 📄 **文档转换**
- 🔐 **加密解密**
- 🌐 **网页抓取**

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Python >= 3.8
- npm 或 yarn

### 一键启动

```bash
# 克隆项目
git clone <repository-url>
cd ai-tools

# 使用启动脚本
./start.sh
```

### 手动启动

```bash
# 1. 启动后端
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py

# 2. 启动前端
cd frontend
npm install
npm run dev
```

### 访问应用

- **前端**: http://localhost:3003
- **后端**: http://localhost:8003

## 🚀 部署

### 静态部署 (推荐)

```bash
# 构建静态文件
cd frontend
npm run build

# 部署 out/ 目录到静态服务器
# 支持 Vercel、Netlify、GitHub Pages 等
```

### 传统部署

```bash
# Next.js 服务器模式
cd frontend
npm run build
npm run start
```

## 📖 文档

- **[开发指南](./DEVELOPMENT.md)** - 详细的开发文档和最佳实践

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送到分支: `git push origin feature/AmazingFeature`
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

**开始构建你的 AI 工具集！** 🚀

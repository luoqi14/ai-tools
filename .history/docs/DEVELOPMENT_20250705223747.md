# 开发指南

本文档为 AI 工具集项目的详细开发指南，帮助开发者快速上手项目开发。

## 🏗️ 开发环境设置

### 系统要求

- **Node.js**: >= 18.0.0 (推荐使用 LTS 版本)
- **Python**: >= 3.8 (推荐 3.10+)
- **Git**: 最新版本
- **IDE**: VS Code (推荐) 或其他支持 TypeScript 的编辑器

### 推荐的 VS Code 插件

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-python.python",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-python.flake8",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### 开发环境配置

```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-tools

# 2. 后端环境设置
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. 前端环境设置
cd ../frontend
npm install

# 4. 环境变量配置
cp .env.example .env.local
# 编辑 .env.local 设置必要的环境变量
```

## 🎯 项目架构详解

### 前端架构 (Next.js 15)

#### 技术栈详解

- **Next.js 15**: 使用 App Router，支持静态导出
- **React 19**: 最新特性，优化性能
- **TypeScript**: 严格类型检查
- **Tailwind CSS**: 原子化 CSS 框架
- **shadcn/ui**: 高质量组件库
- **Magic UI**: 动画组件库
- **Aceternity UI**: 现代 UI 组件
- **Motion**: 流畅动画库

#### 目录结构说明

```
frontend/src/
├── app/                    # App Router (Next.js 15+)
│   ├── layout.tsx         # 根布局组件
│   ├── page.tsx           # 首页
│   ├── globals.css        # 全局样式
│   ├── image-generator/   # 图像生成工具页面
│   └── meitu-processor/   # 美图处理工具页面
├── components/            # 可复用组件
│   ├── ui/               # shadcn/ui基础组件
│   ├── layout/           # 布局相关组件
│   │   └── GlassContainer.tsx
│   ├── magicui/          # Magic UI 组件
│   └── tools/            # 工具相关组件
│       ├── ImageGenerator.tsx
│       ├── MeituProcessor.tsx
│       └── ToolCard.tsx
├── lib/                  # 工具函数和配置
│   ├── utils.ts          # 通用工具函数
│   └── api.ts            # API调用封装
└── hooks/                # 自定义React Hooks
```

#### 组件设计原则

1. **职责单一**: 每个组件只负责一个功能
2. **可复用**: 通过 props 传递数据，避免硬编码
3. **类型安全**: 使用 TypeScript 定义所有接口
4. **性能优化**: 使用 React 19 新特性，避免不必要的重渲染
5. **可访问性**: 遵循 ARIA 标准

#### 样式系统

```css
/* 全局 CSS 变量 */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --border: 240 5.9% 90%;
  --radius: 0.5rem;
}

/* 暗色主题 */
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
}
```

### 后端架构 (Flask)

#### 技术栈详解

- **Flask**: 轻量级 Web 框架
- **Flask-CORS**: 跨域资源共享
- **Requests**: HTTP 请求库
- **Python-dotenv**: 环境变量管理

#### 目录结构说明

```
backend/
├── app/                   # Flask应用目录
│   ├── __init__.py       # 应用工厂
│   ├── routes/           # 路由模块
│   │   ├── __init__.py
│   │   ├── main.py       # 主要路由
│   │   ├── image_generation.py  # 图像生成API
│   │   └── meitu_processing.py  # 美图处理API
│   ├── models/           # 数据模型 (预留)
│   ├── services/         # 业务逻辑层 (预留)
│   └── utils/            # 工具函数
│       ├── api_helpers.py
│       └── file_helpers.py
├── config.py             # 配置文件
├── run.py               # 应用启动文件
├── requirements.txt     # Python依赖
└── temp/                # 临时文件目录
```

#### 设计模式

1. **蓝图模式**: 组织路由结构
2. **工厂模式**: 创建应用实例
3. **配置类**: 管理不同环境配置
4. **错误处理**: 统一错误响应格式

## 🔧 开发工作流

### 分支管理策略

```bash
# 主分支
main              # 生产环境代码，只接受来自 develop 的合并
develop          # 开发环境代码，功能分支的目标分支

# 功能分支
feature/tool-name      # 新工具开发
feature/ui-update     # UI更新
feature/api-optimization  # API优化

# 修复分支
bugfix/issue-123      # Bug修复
hotfix/critical-fix   # 紧急修复
```

### 提交规范

使用 Conventional Commits 规范：

```bash
# 功能添加
git commit -m "feat(image-gen): 添加图像生成工具"
git commit -m "feat(ui): 添加新的动画组件"

# Bug修复
git commit -m "fix(api): 修复API响应格式问题"
git commit -m "fix(ui): 修复按钮样式在暗色模式下的显示"

# 文档更新
git commit -m "docs: 更新开发指南"
git commit -m "docs(api): 添加API使用示例"

# 样式调整
git commit -m "style: 优化代码格式"
git commit -m "style(ui): 调整组件间距"

# 重构
git commit -m "refactor(api): 重构API调用逻辑"

# 性能优化
git commit -m "perf(frontend): 优化图片加载性能"

# 测试
git commit -m "test: 添加单元测试"
```

### 开发流程

1. **创建功能分支**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-tool
   ```

2. **开发和测试**

   ```bash
   # 开发过程中频繁提交
   git add .
   git commit -m "feat: 添加基础组件"

   # 运行测试
   npm run test        # 前端测试
   pytest             # 后端测试
   ```

3. **代码审查准备**

   ```bash
   # 确保代码符合规范
   npm run lint       # 前端代码检查
   npm run format     # 代码格式化
   flake8 .          # 后端代码检查
   ```

4. **提交 Pull Request**
   - 详细描述功能变更
   - 包含测试截图或视频
   - 关联相关 Issue

## 🎨 前端开发指南

### React 19 最佳实践

```tsx
// 使用新的 use() hook
import { use } from "react";

function UserProfile({ userPromise }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

// 避免使用传统的 useMemo, useCallback
// React 19 自动优化这些情况
function Component({ data }) {
  // 直接使用，无需 useMemo
  const processedData = data.map((item) => ({
    ...item,
    processed: true,
  }));

  return <div>{/* 渲染逻辑 */}</div>;
}
```

### 组件开发规范

```tsx
// 组件接口定义
interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

// 组件实现
export function ToolCard({
  title,
  description,
  icon,
  href,
  isActive = false,
  onClick,
}: ToolCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-background p-6",
        "hover:shadow-lg transition-all duration-200",
        isActive && "ring-2 ring-primary"
      )}
      whileHover={{ y: -4 }}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
```

### 状态管理

```tsx
// 使用 React 19 的内置状态管理
import { useState, useOptimistic } from "react";

function ImageGenerator() {
  const [images, setImages] = useState([]);
  const [optimisticImages, addOptimisticImage] = useOptimistic(
    images,
    (state, newImage) => [...state, newImage]
  );

  const generateImage = async (prompt: string) => {
    // 乐观更新
    addOptimisticImage({ id: Date.now(), prompt, status: "generating" });

    try {
      const result = await api.generateImage(prompt);
      setImages((prev) => [...prev, result]);
    } catch (error) {
      // 错误处理
      console.error("生成失败:", error);
    }
  };

  return (
    <div>
      {optimisticImages.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </div>
  );
}
```

### 动画开发

```tsx
import { motion, AnimatePresence } from "motion";

// 页面过渡动画
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// 列表动画
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedList({ items }) {
  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {item.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
```

## 🔌 后端开发指南

### API 设计规范

```python
# RESTful API 设计
from flask import Blueprint, request, jsonify
from ..utils.api_helpers import success_response, error_response

tools_bp = Blueprint('tools', __name__)

@tools_bp.route('/tools', methods=['GET'])
def get_tools():
    """获取工具列表"""
    try:
        tools = get_all_tools()
        return success_response(tools)
    except Exception as e:
        return error_response(str(e)), 500

@tools_bp.route('/tools/<int:tool_id>', methods=['GET'])
def get_tool(tool_id):
    """获取特定工具"""
    try:
        tool = get_tool_by_id(tool_id)
        if not tool:
            return error_response('工具不存在'), 404
        return success_response(tool)
    except Exception as e:
        return error_response(str(e)), 500
```

### 响应格式标准

```python
# 成功响应
def success_response(data=None, message="操作成功"):
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    })

# 错误响应
def error_response(message, code=None):
    response = {
        "success": False,
        "message": message
    }
    if code:
        response["code"] = code
    return jsonify(response)

# 分页响应
def paginated_response(data, page, per_page, total):
    return jsonify({
        "success": True,
        "data": data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page
        }
    })
```

### 错误处理

```python
from flask import Flask
from werkzeug.exceptions import HTTPException

def create_app():
    app = Flask(__name__)

    @app.errorhandler(404)
    def not_found(error):
        return error_response('资源不存在'), 404

    @app.errorhandler(500)
    def internal_error(error):
        return error_response('服务器内部错误'), 500

    @app.errorhandler(HTTPException)
    def handle_exception(e):
        return error_response(e.description), e.code

    return app
```

### 配置管理

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """基础配置"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False

class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
```

## 🧪 测试指南

### 前端测试

```bash
# 运行所有测试
npm run test

# 监视模式
npm run test:watch

# 覆盖率报告
npm run test:coverage

# E2E 测试
npm run test:e2e
```

```tsx
// 组件测试示例
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolCard } from "../ToolCard";

describe("ToolCard", () => {
  it("应该正确渲染工具卡片", () => {
    render(
      <ToolCard
        title="测试工具"
        description="测试描述"
        icon={<div>图标</div>}
        href="/test"
      />
    );

    expect(screen.getByText("测试工具")).toBeInTheDocument();
    expect(screen.getByText("测试描述")).toBeInTheDocument();
  });

  it("应该响应点击事件", () => {
    const handleClick = jest.fn();
    render(
      <ToolCard
        title="测试工具"
        description="测试描述"
        icon={<div>图标</div>}
        href="/test"
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText("测试工具"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 后端测试

```bash
# 运行测试
pytest

# 覆盖率报告
pytest --cov=app

# 详细输出
pytest -v
```

```python
# API 测试示例
import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as client:
        yield client

def test_get_tools(client):
    """测试获取工具列表"""
    response = client.get('/api/tools')
    assert response.status_code == 200

    data = response.get_json()
    assert data['success'] is True
    assert 'data' in data

def test_get_nonexistent_tool(client):
    """测试获取不存在的工具"""
    response = client.get('/api/tools/999')
    assert response.status_code == 404

    data = response.get_json()
    assert data['success'] is False
    assert '不存在' in data['message']
```

## 📦 构建和部署

### 前端构建

```bash
# 开发构建
npm run dev

# 生产构建
npm run build

# 静态导出
npm run build  # 自动生成 out/ 目录

# 预览构建结果
npm run preview
```

### 后端部署

```bash
# 开发环境
python run.py

# 生产环境
gunicorn -w 4 -b 0.0.0.0:8003 run:app

# 使用配置文件
gunicorn -c gunicorn.conf.py run:app
```

### Docker 部署

```dockerfile
# 前端 Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# 后端 Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8003
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8003", "run:app"]
```

## 🔍 调试和性能优化

### 前端调试

```tsx
// 使用 React DevTools
import { useDebugValue } from "react";

function useCustomHook(value) {
  useDebugValue(value, (v) => `Custom: ${v}`);
  return value;
}

// 性能监控
import { Profiler } from "react";

function onRenderCallback(id, phase, actualDuration) {
  console.log("Component:", id, "Phase:", phase, "Duration:", actualDuration);
}

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>;
```

### 后端调试

```python
# 日志配置
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# 性能监控
import time
from functools import wraps

def monitor_performance(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        logger.info(f'{func.__name__} 执行时间: {end_time - start_time:.2f}s')
        return result
    return wrapper
```

## 🛠️ 工具和插件

### 推荐工具

- **前端开发**: Vite, ESLint, Prettier, Husky
- **后端开发**: Black, Flake8, Pre-commit
- **测试**: Jest, Playwright, Pytest
- **部署**: Docker, Nginx, PM2
- **监控**: Sentry, LogRocket

### 代码质量

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "@typescript-eslint/recommended"],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

```python
# .flake8
[flake8]
max-line-length = 88
exclude = venv,migrations
ignore = E203,W503
```

---

**持续改进，追求卓越！** 🚀

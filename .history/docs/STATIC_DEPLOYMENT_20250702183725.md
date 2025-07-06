# 🚀 纯前端静态部署指南

## 架构说明

现在项目已经简化为**纯前端架构**：

```
静态前端 (Next.js导出) → 直接调用 → 后端API (Flask)
```

- ✅ **前端**: 纯静态文件，可部署到任何静态服务器
- ✅ **后端**: 独立运行，提供 API 服务
- ✅ **无需 Node.js 服务器**: 前端完全静态化

## 🏗️ 构建与部署

### 1. 前端构建

```bash
cd frontend

# 设置后端API地址
export NEXT_PUBLIC_API_BASE_URL=http://your-backend-domain.com

# 构建静态文件
npm run build

# 静态文件在 out/ 目录
ls out/
```

### 2. 前端部署选项

#### 选项 1: 使用任何静态服务器

```bash
# 使用 serve
npx serve out

# 使用 Python
cd out && python -m http.server 3000

# 使用 Nginx
# 将 out/ 目录内容复制到 /var/www/html/
```

#### 选项 2: 部署到 CDN/静态托管

- **Vercel**: `vercel --prod`
- **Netlify**: 拖放 `out/` 文件夹
- **GitHub Pages**: 上传到 gh-pages 分支
- **OSS/S3**: 上传静态文件

### 3. 后端部署

```bash
cd backend

# 设置环境变量
export BFL_API_KEY=your_api_key
export CORS_ORIGINS=https://your-frontend-domain.com

# 生产环境启动
gunicorn -w 4 -b 0.0.0.0:8003 run:app
```

## 🔧 环境配置

### 前端环境变量

```bash
# .env.local (本地开发)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8003

# .env.production (生产环境)
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

### 后端环境变量

```bash
# 生产环境
export CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
export BFL_API_KEY=your_api_key
export PORT=8003
```

## 📋 部署脚本

### 前端部署脚本 (deploy-frontend.sh)

```bash
#!/bin/bash
echo "🚀 部署前端..."

# 设置生产环境API地址
export NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com

# 构建
npm run build

# 部署到服务器 (示例)
rsync -avz out/ user@server:/var/www/html/

echo "✅ 前端部署完成！"
```

### 后端部署脚本 (deploy-backend.sh)

```bash
#!/bin/bash
echo "🚀 部署后端..."

# 安装依赖
pip install -r requirements.txt

# 设置环境变量
export CORS_ORIGINS=https://your-frontend-domain.com
export BFL_API_KEY=your_api_key

# 启动服务
gunicorn -w 4 -b 0.0.0.0:8003 run:app

echo "✅ 后端部署完成！"
```

## 🌐 Nginx 配置示例

### 前端 (静态文件)

```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 后端 (API 服务)

```nginx
server {
    listen 80;
    server_name your-backend-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers (可选，后端已配置)
        add_header Access-Control-Allow-Origin *;
    }
}
```

## 🐳 Docker 部署

### 前端 Dockerfile

```dockerfile
FROM nginx:alpine

# 复制构建好的静态文件
COPY out/ /usr/share/nginx/html/

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 后端 Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8003

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8003", "run:app"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "8003:8003"
    environment:
      - BFL_API_KEY=${BFL_API_KEY}
      - CORS_ORIGINS=http://localhost:3000
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

## 📱 开发流程

### 本地开发

```bash
# 1. 启动后端
cd backend && python run.py

# 2. 启动前端开发服务器
cd frontend && npm run dev

# 访问: http://localhost:3003
```

### 生产部署

```bash
# 1. 构建前端
cd frontend && npm run build

# 2. 部署静态文件到服务器

# 3. 启动后端服务
cd backend && gunicorn -w 4 -b 0.0.0.0:8003 run:app
```

## ✅ 优势

1. **简单**: 纯静态前端，无需 Node.js 服务器
2. **快速**: 静态文件加载速度快
3. **便宜**: 可部署到免费静态托管服务
4. **独立**: 前后端完全分离，独立部署
5. **灵活**: 前端可部署到 CDN，后端独立扩展

## 🔍 故障排查

### CORS 错误

- 检查后端 `CORS_ORIGINS` 配置
- 确保前端域名在允许列表中

### API 调用失败

- 检查 `NEXT_PUBLIC_API_BASE_URL` 配置
- 确保后端服务正常运行

### 静态文件 404

- 检查静态服务器配置
- 确保支持 SPA 路由 (try_files)

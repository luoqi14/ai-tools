# AI 工具集 Docker 部署指南

## 📋 概述

本项目使用 Docker 和 Docker Compose 进行容器化部署，包含：

- **后端**: Flask API 服务 (端口 8003)
- **前端**: Next.js 静态文件服务 (端口 3003)

## 🏗️ 架构

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   (静态文件)     │    │    (Flask)      │
│   Port: 3003    │    │   Port: 8003    │
└─────────────────┘    └─────────────────┘
```

## 🚀 快速部署

### 1. 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- 服务器内存: 最少 1GB 推荐 2GB
- 磁盘空间: 最少 3GB

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd ai-tools
```

### 3. 一键部署

```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 完整部署（构建镜像 + 启动服务）
./deploy.sh deploy
```

### 4. 检查服务状态

```bash
# 查看服务状态
./deploy.sh status

# 健康检查
./deploy.sh health

# 查看日志
./deploy.sh logs
```

## 🔧 详细部署步骤

### 1. 构建 Docker 镜像

```bash
# 构建所有镜像
./deploy.sh build

# 或者手动构建
docker-compose build --no-cache
```

### 2. 启动服务

```bash
# 启动所有服务
./deploy.sh up

# 或者手动启动
docker-compose up -d
```

## 📊 服务管理

### 常用命令

```bash
# 查看服务状态
./deploy.sh status

# 重启服务
./deploy.sh restart

# 停止服务
./deploy.sh down

# 查看实时日志
./deploy.sh logs

# 健康检查
./deploy.sh health

# 清理资源
./deploy.sh cleanup
```

### Docker Compose 命令

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]

# 重启特定服务
docker-compose restart [service_name]

# 进入容器
docker-compose exec [service_name] sh
```

## 🔍 故障排除

### 1. 服务无法启动

```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
sudo netstat -tulpn | grep :3003
sudo netstat -tulpn | grep :8003

# 检查Docker状态
sudo systemctl status docker
```

### 2. 前端无法访问后端

```bash
# 检查网络连接
docker network ls
docker network inspect ai-tools_ai-tools-network

# 检查环境变量
docker-compose exec frontend env
```

### 3. 容器构建失败

```bash
# 清理Docker缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

## 📈 性能优化

### 1. Docker 优化

```bash
# 清理无用镜像
docker system prune -a

# 查看镜像大小
docker images
```

### 2. 前端优化

- ✅ 静态文件部署，无需 Node.js 运行时
- ✅ 内置 nginx 提供文件服务
- ✅ 静态资源缓存配置
- ✅ Gzip 压缩支持

### 3. 后端优化

- ✅ Python 生产环境配置
- ✅ 非 root 用户运行
- ✅ 健康检查机制

## 🔐 安全配置

### 1. 防火墙设置

```bash
# 只允许必要端口 (如果直接暴露服务)
sudo ufw allow 3003  # 前端
sudo ufw allow 8003  # 后端
sudo ufw enable
```

### 2. 容器安全

- ✅ 使用非 root 用户运行容器
- ✅ 多阶段构建减少攻击面
- ✅ 定期更新基础镜像

### 3. 数据备份

```bash
# 备份脚本示例
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec backend tar -czf /tmp/backup_$DATE.tar.gz /app/data
docker cp ai-tools-backend:/tmp/backup_$DATE.tar.gz ./backups/
```

## 📞 支持

如果遇到问题，请：

1. 查看日志: `./deploy.sh logs`
2. 检查健康状态: `./deploy.sh health`
3. 查看本文档的故障排除部分

## 🔄 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
./deploy.sh deploy

# 或者分步执行
./deploy.sh down
./deploy.sh build
./deploy.sh up
```

## 📋 服务信息

### 端口映射

| 服务     | 容器端口 | 主机端口 | 说明         |
| -------- | -------- | -------- | ------------ |
| Frontend | 3003     | 3003     | 静态文件服务 |
| Backend  | 8003     | 8003     | API 服务     |

### 健康检查

- **前端**: `http://localhost:3003/health.html`
- **后端**: `http://localhost:8003/health`

### 技术栈

- **前端**: Next.js → 静态文件 + Nginx
- **后端**: Flask + Python 3.11
- **容器**: Docker + Docker Compose

## 🌐 Nginx 代理配置建议

如果您需要配置 Nginx 反向代理，可以参考以下配置：

```nginx
# 前端代理
location / {
    proxy_pass http://localhost:3003;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# 后端API代理
location /api/ {
    proxy_pass http://localhost:8003/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

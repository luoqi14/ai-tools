#!/bin/bash

# Frontend 清理脚本
# 删除不应该提交到 Git 的文件和目录

echo "🧹 开始清理 frontend 目录..."

cd frontend

# 删除构建输出
echo "删除构建输出..."
rm -rf .next/
rm -rf out/
rm -rf build/
rm -rf dist/

# 删除依赖
echo "删除依赖目录..."
rm -rf node_modules/

# 删除环境文件（保留 .env.example）
echo "删除环境文件..."
rm -f .env.local
rm -f .env.production
rm -f .env.development.local
rm -f .env.test.local

# 删除自动生成的文件
echo "删除自动生成的文件..."
rm -f next-env.d.ts

# 删除日志文件
echo "删除日志文件..."
rm -f *.log
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*
rm -f .pnpm-debug.log*

# 删除缓存目录
echo "删除缓存目录..."
rm -rf .cache/
rm -rf .parcel-cache/
rm -rf .eslintcache

# 删除系统文件
echo "删除系统文件..."
find . -name ".DS_Store" -delete
find . -name "._*" -delete
find . -name "Thumbs.db" -delete

echo "✅ Frontend 清理完成！"
echo ""
echo "保留的重要文件："
echo "- package.json"
echo "- pnpm-lock.yaml"
echo "- src/ 目录"
echo "- public/ 目录"
echo "- Dockerfile"
echo "- .env.example"
echo "- 配置文件 (*.config.*, tsconfig.json 等)"

cd .. 
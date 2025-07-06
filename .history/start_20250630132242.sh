#!/bin/bash

# AI工具集项目启动脚本

echo "🚀 启动AI工具集项目..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js (>= 18.0.0)"
    exit 1
fi

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python (>= 3.8)"
    exit 1
fi

# 获取当前目录
PROJECT_DIR=$(pwd)

echo "📁 项目目录: $PROJECT_DIR"

# 启动后端
echo "🔧 启动后端服务..."
cd "$PROJECT_DIR/backend"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📦 安装后端依赖..."
pip install -r requirements.txt

# 启动后端服务（后台运行）
echo "🏃 启动Flask服务 (端口8003)..."
nohup python run.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid

# 启动前端
echo "🎨 启动前端服务..."
cd "$PROJECT_DIR/frontend"

# 安装依赖
echo "📦 安装前端依赖..."
npm install

# 启动前端服务（后台运行）
echo "🏃 启动Next.js服务 (端口3003)..."
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid

echo "✅ 项目启动完成！"
echo ""
echo "🌐 访问地址:"
echo "   前端: http://localhost:3003"
echo "   后端: http://localhost:8003"
echo ""
echo "📋 进程信息:"
echo "   后端PID: $BACKEND_PID"
echo "   前端PID: $FRONTEND_PID"
echo ""
echo "🛑 停止服务:"
echo "   运行: ./stop.sh"
echo ""
echo "📝 日志文件:"
echo "   后端日志: logs/backend.log"
echo "   前端日志: logs/frontend.log"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -s http://localhost:8003/health > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务启动失败"
fi

if curl -s http://localhost:3003 > /dev/null; then
    echo "✅ 前端服务运行正常"
else
    echo "❌ 前端服务启动失败"
fi

echo ""
echo "🎉 AI工具集已启动完成！打开浏览器访问 http://localhost:3003" 
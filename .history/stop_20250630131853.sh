#!/bin/bash

# AI工具集项目停止脚本

echo "🛑 停止AI工具集项目..."

# 创建logs目录（如果不存在）
mkdir -p logs

# 停止后端服务
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "🔧 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm logs/backend.pid
        echo "✅ 后端服务已停止"
    else
        echo "⚠️  后端服务进程不存在"
        rm -f logs/backend.pid
    fi
else
    echo "⚠️  未找到后端服务PID文件"
fi

# 停止前端服务
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "🎨 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm logs/frontend.pid
        echo "✅ 前端服务已停止"
    else
        echo "⚠️  前端服务进程不存在"
        rm -f logs/frontend.pid
    fi
else
    echo "⚠️  未找到前端服务PID文件"
fi

# 清理可能的残留进程
echo "🧹 清理残留进程..."
pkill -f "python run.py" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

echo "✅ AI工具集项目已完全停止" 
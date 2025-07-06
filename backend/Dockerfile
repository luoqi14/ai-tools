# 使用官方Python运行时作为基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（利用层缓存）
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements文件（单独一层，利用缓存）
COPY requirements.txt .

# 安装Python依赖（利用pip缓存）
RUN --mount=type=cache,id=pip,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# 复制应用代码（代码变化不会影响依赖安装缓存）
COPY . .

# 创建非root用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 8003

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# 启动应用
CMD ["python", "run.py"] 
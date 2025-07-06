# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装pnpm（利用层缓存）
RUN npm install -g pnpm

# 复制package文件（单独一层，利用缓存）
COPY package.json pnpm-lock.yaml ./

# 配置pnpm缓存目录
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# 安装依赖（只有package.json变化时才重新安装）
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 复制应用代码（代码变化不会影响依赖安装缓存）
COPY . .

# 接收构建参数并设置为环境变量
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# 构建静态文件
RUN pnpm build

# 生产阶段 - 使用简单的静态文件服务器
FROM node:18-alpine AS runner

# 设置工作目录
WORKDIR /app

# 全局安装serve来提供静态文件服务（利用层缓存）
RUN npm install -g serve

# 复制构建的静态文件
COPY --from=builder /app/out ./public

# 创建健康检查文件
RUN echo '<!DOCTYPE html><html><head><title>Health Check</title></head><body><h1>OK</h1></body></html>' > ./public/health.html

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# 更改文件所有权
RUN chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3003

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health.html || exit 1

# 启动静态文件服务器 - 不使用 -s 参数，让 Next.js 静态路由正常工作
CMD ["serve", "public", "-l", "3003"] 
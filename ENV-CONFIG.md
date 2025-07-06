# 环境变量配置说明

## 📋 环境变量列表

### 必需的环境变量

| 变量名        | 说明                       | 默认值   | 示例                                   |
| ------------- | -------------------------- | -------- | -------------------------------------- |
| `BFL_API_KEY` | Black Forest Labs API 密钥 | 你的密钥 | `564cb439-9ba9-44d7-b885-bb2271a79224` |

### 可选的环境变量

| 变量名          | 说明           | 默认值                     | 示例                                                  |
| --------------- | -------------- | -------------------------- | ----------------------------------------------------- |
| `FLASK_ENV`     | Flask 运行环境 | `production`               | `development` / `production`                          |
| `SECRET_KEY`    | Flask 密钥     | `ai-tools-secret-key-2024` | `your-secret-key`                                     |
| `BACKEND_PORT`  | 后端服务端口   | `8003`                     | `8003`                                                |
| `FRONTEND_PORT` | 前端服务端口   | `3003`                     | `3003`                                                |
| `CORS_ORIGINS`  | 允许的跨域来源 | `http://localhost:3003`    | `https://ai.jarvismedical.asia,http://localhost:3003` |

## 🛠️ 配置方法

### 方法 1：创建 .env 文件（推荐）

在项目根目录创建 `.env` 文件：

```bash
# 创建环境变量文件
touch .env
```

在 `.env` 文件中添加：

```env
# Black Forest Labs API 密钥
BFL_API_KEY=564cb439-9ba9-44d7-b885-bb2271a79224

# Flask 配置
FLASK_ENV=production
SECRET_KEY=ai-tools-secret-key-2024

# 服务端口
BACKEND_PORT=8003
FRONTEND_PORT=3003

# CORS 配置
CORS_ORIGINS=https://ai.jarvismedical.asia,http://localhost:3003
```

### 方法 2：系统环境变量

```bash
# 导出环境变量
export BFL_API_KEY=564cb439-9ba9-44d7-b885-bb2271a79224
export FLASK_ENV=production
export SECRET_KEY=ai-tools-secret-key-2024
```

### 方法 3：Docker Compose 直接配置

如果不想创建 `.env` 文件，可以直接在 `docker-compose.yml` 中配置：

```yaml
environment:
  - BFL_API_KEY=564cb439-9ba9-44d7-b885-bb2271a79224
  - FLASK_ENV=production
  - SECRET_KEY=ai-tools-secret-key-2024
```

## 🔐 安全注意事项

1. **不要提交 .env 文件到版本控制**

   - `.env` 文件已被 `.gitignore` 忽略
   - 包含敏感信息，不应公开

2. **API 密钥安全**

   - 定期更换 API 密钥
   - 不要在日志中打印密钥
   - 使用环境变量而非硬编码

3. **生产环境配置**
   - 使用强密码作为 SECRET_KEY
   - 配置正确的 CORS_ORIGINS
   - 设置合适的端口

## 🚀 部署时的环境变量

### 开发环境

```bash
# 启动开发环境
./deploy.sh quick
```

### 生产环境

```bash
# 确保环境变量已设置
echo $BFL_API_KEY

# 启动生产环境
./deploy.sh deploy
```

## 🔍 验证环境变量

### 检查容器内的环境变量

```bash
# 进入后端容器
docker exec -it ai-tools-backend bash

# 查看环境变量
env | grep BFL_API_KEY
env | grep FLASK_ENV
```

### 测试 API 连接

```bash
# 测试后端健康检查
curl http://localhost:8003/health

# 测试图像生成 API（需要有效的 prompt）
curl -X POST http://localhost:8003/api/image-generation/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a beautiful sunset"}'
```

## 🛠️ 故障排除

### 常见问题

1. **BFL_API_KEY 未设置**

   - 错误：`BFL API密钥未配置`
   - 解决：确保在 `.env` 文件或环境变量中设置了 `BFL_API_KEY`

2. **API 调用失败**

   - 错误：`API调用失败: Unauthorized`
   - 解决：检查 API 密钥是否正确

3. **CORS 错误**
   - 错误：跨域请求被阻止
   - 解决：在 `CORS_ORIGINS` 中添加前端域名

### 调试命令

```bash
# 查看容器日志
docker logs ai-tools-backend

# 查看环境变量
docker exec ai-tools-backend env | grep BFL

# 重启服务
./deploy.sh restart
```

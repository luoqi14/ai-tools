#!/bin/bash

# AI Tools 环境变量快速设置脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 打印消息函数
print_message() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# 检查是否存在 .env 文件
check_env_file() {
    if [ -f ".env" ]; then
        print_warning ".env 文件已存在"
        read -p "是否要覆盖现有的 .env 文件？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "保留现有的 .env 文件"
            return 1
        fi
    fi
    return 0
}

# 创建 .env 文件
create_env_file() {
    print_info "创建 .env 文件..."
    
    # 默认的 BFL_API_KEY
    DEFAULT_BFL_API_KEY="564cb439-9ba9-44d7-b885-bb2271a79224"
    
    cat > .env << EOF
# AI Tools 项目环境变量配置
# 注意：此文件包含敏感信息，不要提交到版本控制

# Black Forest Labs API 密钥
BFL_API_KEY=${DEFAULT_BFL_API_KEY}

# Flask 配置
FLASK_ENV=production
SECRET_KEY=ai-tools-secret-key-2024

# 服务端口
BACKEND_PORT=8003
FRONTEND_PORT=3003

# CORS 配置（多个域名用逗号分隔）
CORS_ORIGINS=https://ai.jarvismedical.asia,http://localhost:3003

# Gemini AI 配置
# 请替换为您的 Gemini API 密钥
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash

# Nano Banana (Gemini 2.5 Flash Image) 配置
# 请替换为您的 Nano Banana API 密钥
NANO_BANANA_API_KEY=your-nano-banana-api-key-here
EOF

    print_message ".env 文件创建成功"
}

# 验证环境变量
verify_env() {
    print_info "验证环境变量..."
    
    if [ -f ".env" ]; then
        source .env
        
        if [ -z "$BFL_API_KEY" ]; then
            print_error "BFL_API_KEY 未设置"
            return 1
        fi

        # 检查 Gemini API 密钥（警告而不是错误，因为可能不是必需的）
        if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your-gemini-api-key-here" ]; then
            print_warning "GEMINI_API_KEY 未设置或使用默认值，Gemini 功能将不可用"
        fi

        # 检查 Nano Banana API 密钥（警告而不是错误，因为可能不是必需的）
        if [ -z "$NANO_BANANA_API_KEY" ] || [ "$NANO_BANANA_API_KEY" = "your-nano-banana-api-key-here" ]; then
            print_warning "NANO_BANANA_API_KEY 未设置或使用默认值，Nano Banana 功能将不可用"
        fi

        print_message "环境变量验证通过"
        echo "  BFL_API_KEY: ${BFL_API_KEY:0:8}..."
        echo "  FLASK_ENV: $FLASK_ENV"
        echo "  BACKEND_PORT: $BACKEND_PORT"
        echo "  FRONTEND_PORT: $FRONTEND_PORT"
        if [ -n "$GEMINI_API_KEY" ] && [ "$GEMINI_API_KEY" != "your-gemini-api-key-here" ]; then
            echo "  GEMINI_API_KEY: ${GEMINI_API_KEY:0:8}..."
            echo "  GEMINI_MODEL: $GEMINI_MODEL"
        fi
        if [ -n "$NANO_BANANA_API_KEY" ] && [ "$NANO_BANANA_API_KEY" != "your-nano-banana-api-key-here" ]; then
            echo "  NANO_BANANA_API_KEY: ${NANO_BANANA_API_KEY:0:8}..."
        fi
        
        return 0
    else
        print_error ".env 文件不存在"
        return 1
    fi
}

# 测试环境变量
test_env() {
    print_info "测试环境变量加载..."
    
    # 使用 docker-compose 检查环境变量
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        print_error "未找到 docker-compose 命令"
        return 1
    fi
    
    # 检查 docker-compose 配置
    $DOCKER_COMPOSE_CMD config > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_message "Docker Compose 配置验证通过"
    else
        print_error "Docker Compose 配置验证失败"
        return 1
    fi
}

# 显示使用说明
show_usage() {
    print_info "环境变量配置完成！"
    echo ""
    echo "接下来可以："
    echo "1. 启动服务：./deploy.sh deploy"
    echo "2. 快速部署：./deploy.sh quick"
    echo "3. 查看状态：./deploy.sh status"
    echo ""
    echo "如需修改环境变量，请编辑 .env 文件"
}

# 主函数
main() {
    print_message "开始设置 AI Tools 环境变量..."
    
    # 检查并创建 .env 文件
    if check_env_file; then
        create_env_file
    fi
    
    # 验证环境变量
    if verify_env; then
        # 测试 Docker Compose 配置
        if test_env; then
            show_usage
        else
            print_warning "Docker Compose 配置测试失败，但 .env 文件已创建"
        fi
    else
        print_error "环境变量验证失败"
        exit 1
    fi
    
    print_message "环境变量设置完成！🎉"
}

# 显示帮助
show_help() {
    echo "AI Tools 环境变量设置脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  setup       设置环境变量（默认）"
    echo "  verify      验证现有环境变量"
    echo "  test        测试 Docker Compose 配置"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0          # 设置环境变量"
    echo "  $0 verify   # 验证环境变量"
    echo "  $0 test     # 测试配置"
}

# 处理命令行参数
case "${1:-setup}" in
    "setup")
        main
        ;;
    "verify")
        verify_env
        ;;
    "test")
        test_env
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "未知选项: $1"
        show_help
        exit 1
        ;;
esac 
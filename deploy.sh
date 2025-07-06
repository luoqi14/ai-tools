#!/bin/bash

# AI Tools 项目部署脚本
# 支持缓存优化和并行构建

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="AI Tools"
COMPOSE_FILE="docker-compose.yml"

# 检测 Docker Compose 命令
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo -e "${RED}错误: 未找到 docker-compose 或 docker compose 命令${NC}"
    exit 1
fi

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# 检查 Docker 和 Docker Compose
check_docker() {
    print_info "检查 Docker 环境..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker 服务未运行，请启动 Docker"
        exit 1
    fi
    
    print_message "Docker 环境检查通过"
}

# 启用 BuildKit 以支持缓存
enable_buildkit() {
    print_info "启用 Docker BuildKit..."
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    print_message "BuildKit 已启用"
}

# 清理旧的容器和镜像
cleanup() {
    print_info "清理旧的容器和镜像..."
    
    # 停止并删除旧容器
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
    
    # 清理悬空镜像（但保留缓存）
    docker image prune -f 2>/dev/null || true
    
    print_message "清理完成"
}

# 构建镜像（利用缓存）
build_images() {
    print_info "构建 Docker 镜像（利用缓存）..."
    
    # 并行构建前端和后端
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE build --parallel --progress=plain
    
    print_message "镜像构建完成"
}

# 部署应用
deploy() {
    print_info "部署 $PROJECT_NAME..."
    
    # 启动服务
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up -d
    
    print_message "部署完成"
}

# 健康检查
health_check() {
    print_info "执行健康检查..."
    
    # 等待服务启动
    sleep 10
    
    # 检查后端服务
    if curl -f http://localhost:8003/health &> /dev/null; then
        print_message "后端服务健康检查通过"
    else
        print_warning "后端服务健康检查失败，请检查日志"
    fi
    
    # 检查前端服务
    if curl -f http://localhost:3003/health.html &> /dev/null; then
        print_message "前端服务健康检查通过"
    else
        print_warning "前端服务健康检查失败，请检查日志"
    fi
}

# 显示服务状态
show_status() {
    print_info "服务状态:"
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps
    
    print_info "服务访问地址:"
    echo "  前端: http://localhost:3003"
    echo "  后端: http://localhost:8003"
}

# 显示日志
show_logs() {
    print_info "显示服务日志..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs --tail=50
}

# 停止服务
stop() {
    print_info "停止 $PROJECT_NAME..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down
    print_message "服务已停止"
}

# 重启服务
restart() {
    print_info "重启 $PROJECT_NAME..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE restart
    print_message "服务已重启"
}

# 完整部署流程
full_deploy() {
    print_message "开始部署 $PROJECT_NAME..."
    
    check_docker
    enable_buildkit
    cleanup
    build_images
    deploy
    health_check
    show_status
    
    print_message "部署完成! 🎉"
}

# 快速部署（利用缓存）
quick_deploy() {
    print_message "快速部署 $PROJECT_NAME（利用缓存）..."
    
    check_docker
    enable_buildkit
    
    # 不清理，直接构建和部署
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE build --parallel
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up -d
    
    health_check
    show_status
    
    print_message "快速部署完成! ⚡"
}

# 显示使用帮助
show_help() {
    echo "AI Tools 部署脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  deploy      完整部署（清理+构建+部署）"
    echo "  quick       快速部署（利用缓存）"
    echo "  build       仅构建镜像"
    echo "  start       启动服务"
    echo "  stop        停止服务"
    echo "  restart     重启服务"
    echo "  status      显示服务状态"
    echo "  logs        显示服务日志"
    echo "  cleanup     清理旧容器和镜像"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 deploy   # 完整部署"
    echo "  $0 quick    # 快速部署"
    echo "  $0 logs     # 查看日志"
}

# 主函数
main() {
    case "${1:-help}" in
        "deploy")
            full_deploy
            ;;
        "quick")
            quick_deploy
            ;;
        "build")
            check_docker
            enable_buildkit
            build_images
            ;;
        "start")
            check_docker
            deploy
            ;;
        "stop")
            stop
            ;;
        "restart")
            restart
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 
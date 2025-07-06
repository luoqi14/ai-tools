#!/bin/bash

# AI工具集部署脚本
# 使用方法: ./deploy.sh [环境] [操作]
# 环境: prod (生产环境)
# 操作: build, up, down, restart, logs

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
}

# 构建镜像
build_images() {
    log_info "开始构建Docker镜像..."
    docker-compose build --no-cache
    log_success "Docker镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动AI工具集服务..."
    docker-compose up -d
    log_success "服务启动完成"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    check_health
}

# 停止服务
stop_services() {
    log_info "停止AI工具集服务..."
    docker-compose down
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启AI工具集服务..."
    docker-compose restart
    log_success "服务已重启"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    check_health
}

# 查看日志
view_logs() {
    log_info "查看服务日志..."
    docker-compose logs -f
}

# 健康检查
check_health() {
    log_info "检查服务健康状态..."
    
    # 检查后端健康状态
    if curl -f -s http://localhost:8003/health > /dev/null; then
        log_success "后端服务健康检查通过"
    else
        log_error "后端服务健康检查失败"
    fi
    
    # 检查前端健康状态
    if wget -q --spider http://localhost:3003/health.html 2>/dev/null; then
        log_success "前端服务健康检查通过"
    else
        log_error "前端服务健康检查失败"
    fi
}

# 显示服务状态
show_status() {
    log_info "服务状态:"
    docker-compose ps
    
    log_info "服务访问地址:"
    echo "前端: http://localhost:3003"
    echo "后端: http://localhost:8003"
    echo "注意: 生产环境请通过您配置的Nginx代理访问"
}

# 清理资源
cleanup() {
    log_info "清理Docker资源..."
    docker-compose down -v
    docker system prune -f
    log_success "资源清理完成"
}

# 主函数
main() {
    local action=${1:-"help"}
    
    case $action in
        "build")
            check_docker
            build_images
            ;;
        "up"|"start")
            check_docker
            start_services
            show_status
            ;;
        "down"|"stop")
            check_docker
            stop_services
            ;;
        "restart")
            check_docker
            restart_services
            show_status
            ;;
        "logs")
            view_logs
            ;;
        "status")
            show_status
            ;;
        "health")
            check_health
            ;;
        "cleanup")
            cleanup
            ;;
        "deploy")
            check_docker
            build_images
            start_services
            show_status
            ;;
        "help"|*)
            echo "AI工具集部署脚本"
            echo "使用方法: ./deploy.sh [操作]"
            echo ""
            echo "可用操作:"
            echo "  build    - 构建Docker镜像"
            echo "  up       - 启动服务"
            echo "  down     - 停止服务"
            echo "  restart  - 重启服务"
            echo "  logs     - 查看日志"
            echo "  status   - 查看状态"
            echo "  health   - 健康检查"
            echo "  cleanup  - 清理资源"
            echo "  deploy   - 完整部署（构建+启动）"
            echo "  help     - 显示帮助"
            ;;
    esac
}

# 执行主函数
main "$@" 
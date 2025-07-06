#!/bin/bash

# AI Tools 缓存管理脚本
# 用于管理 Docker 构建缓存和依赖缓存

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

# 显示缓存使用情况
show_cache_usage() {
    print_info "Docker 缓存使用情况:"
    
    # 显示系统使用情况
    docker system df
    
    echo ""
    print_info "Docker 卷使用情况:"
    docker volume ls
    
    echo ""
    print_info "Docker 镜像:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
}

# 清理构建缓存
clean_build_cache() {
    print_info "清理 Docker 构建缓存..."
    
    # 清理构建缓存
    docker builder prune -f
    
    print_message "构建缓存清理完成"
}

# 清理悬空镜像
clean_dangling_images() {
    print_info "清理悬空镜像..."
    
    # 清理悬空镜像
    docker image prune -f
    
    print_message "悬空镜像清理完成"
}

# 清理未使用的卷
clean_unused_volumes() {
    print_info "清理未使用的卷..."
    
    # 清理未使用的卷
    docker volume prune -f
    
    print_message "未使用的卷清理完成"
}

# 清理网络
clean_unused_networks() {
    print_info "清理未使用的网络..."
    
    # 清理未使用的网络
    docker network prune -f
    
    print_message "未使用的网络清理完成"
}

# 全面清理（保留缓存）
clean_safe() {
    print_info "执行安全清理（保留构建缓存）..."
    
    clean_dangling_images
    clean_unused_volumes
    clean_unused_networks
    
    print_message "安全清理完成"
}

# 深度清理（清理所有缓存）
clean_deep() {
    print_warning "执行深度清理（清理所有缓存）..."
    print_warning "这将删除所有构建缓存，下次构建会比较慢"
    
    # 询问确认
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "取消深度清理"
        return
    fi
    
    clean_build_cache
    clean_dangling_images
    clean_unused_volumes
    clean_unused_networks
    
    # 清理系统缓存
    docker system prune -a -f
    
    print_message "深度清理完成"
}

# 优化缓存
optimize_cache() {
    print_info "优化 Docker 缓存..."
    
    # 只清理悬空镜像，保留构建缓存
    clean_dangling_images
    
    # 清理未使用的卷和网络
    clean_unused_volumes
    clean_unused_networks
    
    print_message "缓存优化完成"
}

# 重置所有缓存
reset_cache() {
    print_warning "重置所有缓存..."
    print_warning "这将删除项目相关的所有 Docker 资源"
    
    # 询问确认
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "取消重置"
        return
    fi
    
    # 停止项目容器
    if command -v docker-compose &> /dev/null; then
        docker-compose down --remove-orphans 2>/dev/null || true
    elif docker compose version &> /dev/null; then
        docker compose down --remove-orphans 2>/dev/null || true
    fi
    
    # 删除项目镜像
    docker images | grep -E "(ai-tools|ai_tools)" | awk '{print $3}' | xargs -r docker rmi -f
    
    # 删除项目卷
    docker volume ls | grep -E "(ai-tools|ai_tools)" | awk '{print $2}' | xargs -r docker volume rm
    
    # 清理构建缓存
    clean_build_cache
    
    print_message "缓存重置完成"
}

# 显示帮助信息
show_help() {
    echo "AI Tools 缓存管理脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  status      显示缓存使用情况"
    echo "  clean       安全清理（保留构建缓存）"
    echo "  optimize    优化缓存（清理无用文件）"
    echo "  deep        深度清理（清理所有缓存）"
    echo "  reset       重置项目缓存"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 status     # 查看缓存使用情况"
    echo "  $0 clean      # 安全清理"
    echo "  $0 optimize   # 优化缓存"
}

# 主函数
main() {
    case "${1:-help}" in
        "status")
            show_cache_usage
            ;;
        "clean")
            clean_safe
            ;;
        "optimize")
            optimize_cache
            ;;
        "deep")
            clean_deep
            ;;
        "reset")
            reset_cache
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
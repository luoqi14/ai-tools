from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """
    API首页端点
    """
    return jsonify({
        'message': 'AI工具集后端API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'tools': '/api/tools',
            'health': '/health'
        }
    })

@main_bp.route('/health')
def health_check():
    """
    健康检查端点
    """
    return jsonify({
        'status': 'ok',
        'message': '服务运行正常'
    }) 
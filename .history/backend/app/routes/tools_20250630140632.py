from flask import Blueprint, jsonify, request, Response
import requests
import random

tools_bp = Blueprint('tools', __name__)

# 模拟工具数据
TOOLS_DATA = [
    {
        'id': 'text-processor',
        'name': '文本处理',
        'description': '文本格式化、清理和转换工具',
        'icon': 'FileText',
        'category': 'text',
        'status': 'active'
    },
    {
        'id': 'image-processor',
        'name': '图像处理',
        'description': '图像压缩、格式转换和基础编辑',
        'icon': 'Image',
        'category': 'media',
        'status': 'active'
    },
    {
        'id': 'code-generator',
        'name': '代码生成',
        'description': 'AI辅助代码生成和优化工具',
        'icon': 'Code',
        'category': 'development',
        'status': 'active'
    },
    {
        'id': 'data-analyzer',
        'name': '数据分析',
        'description': '数据可视化和统计分析工具',
        'icon': 'BarChart',
        'category': 'analysis',
        'status': 'active'
    },
    {
        'id': 'api-tester',
        'name': 'API测试',
        'description': 'RESTful API测试和调试工具',
        'icon': 'Zap',
        'category': 'development',
        'status': 'active'
    },
    {
        'id': 'json-formatter',
        'name': 'JSON格式化',
        'description': 'JSON数据格式化和验证工具',
        'icon': 'Braces',
        'category': 'text',
        'status': 'active'
    }
]

@tools_bp.route('/tools')
def get_tools():
    """
    获取所有工具列表
    """
    return jsonify({
        'success': True,
        'data': TOOLS_DATA,
        'total': len(TOOLS_DATA)
    })

@tools_bp.route('/tools/<tool_id>')
def get_tool(tool_id):
    """
    获取特定工具信息
    """
    tool = next((t for t in TOOLS_DATA if t['id'] == tool_id), None)
    
    if not tool:
        return jsonify({
            'success': False,
            'message': '工具不存在'
        }), 404
    
    return jsonify({
        'success': True,
        'data': tool
    })

@tools_bp.route('/tools/categories')
def get_categories():
    """
    获取工具分类
    """
    categories = list(set(tool['category'] for tool in TOOLS_DATA))
    
    return jsonify({
        'success': True,
        'data': categories
    }) 
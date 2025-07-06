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
    },
    {
        'id': 'image-processor',
        'name': '图像处理',
        'description': '图像压缩、格式转换和基础编辑',
        'icon': 'Image',
        'category': 'media',
    },
    {
        'id': 'code-generator',
        'name': '代码生成',
        'description': 'AI辅助代码生成和优化工具',
        'icon': 'Code',
        'category': 'development',
    },
    {
        'id': 'data-analyzer',
        'name': '数据分析',
        'description': '数据可视化和统计分析工具',
        'icon': 'BarChart',
        'category': 'analysis',
    },
    {
        'id': 'api-tester',
        'name': 'API测试',
        'description': 'RESTful API测试和调试工具',
        'icon': 'Zap',
        'category': 'development',
    },
    {
        'id': 'json-formatter',
        'name': 'JSON格式化',
        'description': 'JSON数据格式化和验证工具',
        'icon': 'Braces',
        'category': 'text',
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

@tools_bp.route('/bing-image')
def get_bing_image():
    """
    代理获取必应随机图片
    """
    try:
        # 必应图片API列表
        bing_apis = [
            'https://api.vvhan.com/api/bing?rand=sj'
        ]
        
        # 随机选择一个API
        api_url = random.choice(bing_apis)
        
        # 获取图片
        response = requests.get(api_url, timeout=10, allow_redirects=True)
        
        if response.status_code == 200:
            # 确定内容类型
            content_type = response.headers.get('content-type', 'image/jpeg')
            
            # 返回图片数据
            return Response(
                response.content,
                mimetype=content_type,
                headers={
                    'Cache-Control': 'no-cache, no-store, must-revalidate',  # 不缓存，确保每次都是新图片
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Access-Control-Allow-Origin': '*'
                }
            )
        else:
            return jsonify({
                'success': False,
                'message': '获取图片失败'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取图片时发生错误: {str(e)}'
        }), 500
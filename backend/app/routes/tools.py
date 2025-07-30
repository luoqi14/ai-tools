from flask import Blueprint, jsonify, request, Response
import requests
import random

tools_bp = Blueprint('tools', __name__)

# 实际工具数据
TOOLS_DATA = [
    {
        'id': 'email-sender',
        'name': '发送邮件',
        'description': '群发邮件工具',
        'icon': 'Mail',
        'category': 'communication',
        'url': 'https://tools-old.lumiidental.com/email'
    },
    {
        'id': 'invisalign-split',
        'name': '隐适美账单分割',
        'description': '文本文件处理',
        'icon': 'FileText',
        'category': 'file',
        'url': 'https://tools-old.lumiidental.com/file/ysm/'
    },
    {
        'id': 'supplier-split',
        'name': '供应商账单拆分',
        'description': '文本文件处理',
        'icon': 'FileText',
        'category': 'file',
        'url': 'https://tools-old.lumiidental.com/file/supplier/'
    },
    {
        'id': 'mm-image-recognition',
        'name': 'MM商品图片识别',
        'description': '图片识别输出结构化数据',
        'icon': 'Image',
        'category': 'ai',
        'url': 'https://tools-old.lumiidental.com/image/recognition/'
    },
    {
        'id': 'video-enhance',
        'name': '视频增强',
        'description': 'LLM输入视频分析及调用ffmpeg处理',
        'icon': 'Video',
        'category': 'ai',
        'url': 'https://tools-video.lumiidental.com'
    },
    {
        'id': 'image-generator',
        'name': 'AI图像生成',
        'description': 'Flux Kontext文生图和图生图',
        'icon': 'Palette',
        'category': 'ai',
        'url': '/image-generator'
    },
    {
        'id': 'meitu-processor',
        'name': '美图处理',
        'description': '美图秀秀AI智能美颜、特效、滤镜',
        'icon': 'Sparkles',
        'category': 'ai',
        'url': '/meitu-processor'
    },
    {
        'id': 'performance-score',
        'name': '绩效计分',
        'description': '绩效评估和计分工具',
        'icon': 'BarChart3',
        'category': 'business',
        'url': 'https://tools-performance-score.lumiidental.com'
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
    # 必应图片API列表
    bing_apis = [
        'https://api.bimg.cc/random?w=1920&h=1080&mkt=zh-CN',
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
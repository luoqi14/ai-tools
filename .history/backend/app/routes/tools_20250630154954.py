from flask import Blueprint, jsonify, request, Response
import requests
import random
import fal_client
import os
import base64
from io import BytesIO

tools_bp = Blueprint('tools', __name__)

# 实际工具数据
TOOLS_DATA = [
    {
        'id': 'email-sender',
        'name': '发送邮件',
        'description': '群发邮件工具',
        'icon': 'Mail',
        'category': 'communication',
        'url': 'https://tool.jarvismedical.asia/email'
    },
    {
        'id': 'invisalign-split',
        'name': '隐适美账单分割',
        'description': '文本文件处理',
        'icon': 'FileText',
        'category': 'file',
        'url': 'https://tool.jarvismedical.asia/file/ysm/'
    },
    {
        'id': 'supplier-split',
        'name': '供应商账单拆分',
        'description': '文本文件处理',
        'icon': 'FileText',
        'category': 'file',
        'url': 'https://tool.jarvismedical.asia/file/supplier'
    },
    {
        'id': 'mm-image-recognition',
        'name': 'MM商品图片识别',
        'description': '图片识别输出结构化数据',
        'icon': 'Image',
        'category': 'ai',
        'url': 'https://tool.jarvismedical.asia/image/recognition'
    },
    {
        'id': 'video-enhance',
        'name': '视频增强',
        'description': 'LLM输入视频分析及调用ffmpeg处理',
        'icon': 'Video',
        'category': 'ai',
        'url': 'https://video.jarvismedical.asia/'
    },
    {
        'id': 'image-generator',
        'name': 'AI图像生成',
        'description': 'Flux Kontext文生图和图生图',
        'icon': 'Palette',
        'category': 'ai',
        'url': '/image-generator'
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
        'https://api.vvhan.com/api/bing?rand=sj',
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

@tools_bp.route('/image-generation/text-to-image', methods=['POST'])
def text_to_image():
    """
    文生图API
    """
    data = request.get_json()
    
    if not data or 'prompt' not in data:
        return jsonify({
            'success': False,
            'message': '缺少prompt参数'
        }), 400
    
    prompt = data.get('prompt')
    aspect_ratio = data.get('aspect_ratio', '1:1')
    guidance_scale = data.get('guidance_scale', 3.5)
    num_images = data.get('num_images', 1)
    output_format = data.get('output_format', 'jpeg')
    
    # 设置FAL API密钥
    fal_key = os.getenv('FAL_KEY')
    if not fal_key:
        return jsonify({
            'success': False,
            'message': 'FAL API密钥未配置'
        }), 500
    
    # 配置fal客户端
    fal_client.api_key = fal_key
    
    try:
        # 调用FLUX Kontext API进行文生图
        result = fal_client.subscribe(
            "fal-ai/flux-pro/kontext",
            arguments={
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "guidance_scale": guidance_scale,
                "num_images": num_images,
                "output_format": output_format,
                "sync_mode": True
            }
        )
        
        return jsonify({
            'success': True,
            'data': {
                'images': result['images'],
                'prompt': result.get('prompt', prompt),
                'seed': result.get('seed'),
                'has_nsfw_concepts': result.get('has_nsfw_concepts', [])
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'图像生成失败: {str(e)}'
        }), 500

@tools_bp.route('/image-generation/image-to-image', methods=['POST'])
def image_to_image():
    """
    图生图API
    """
    data = request.get_json()
    
    if not data or 'prompt' not in data or 'image_url' not in data:
        return jsonify({
            'success': False,
            'message': '缺少prompt或image_url参数'
        }), 400
    
    prompt = data.get('prompt')
    image_url = data.get('image_url')
    aspect_ratio = data.get('aspect_ratio', '1:1')
    guidance_scale = data.get('guidance_scale', 3.5)
    num_images = data.get('num_images', 1)
    output_format = data.get('output_format', 'jpeg')
    
    # 设置FAL API密钥
    fal_key = os.getenv('FAL_KEY')
    if not fal_key:
        return jsonify({
            'success': False,
            'message': 'FAL API密钥未配置'
        }), 500
    
    # 配置fal客户端
    fal_client.api_key = fal_key
    
    try:
        # 调用FLUX Kontext API进行图生图
        result = fal_client.subscribe(
            "fal-ai/flux-pro/kontext",
            arguments={
                "prompt": prompt,
                "image_url": image_url,
                "aspect_ratio": aspect_ratio,
                "guidance_scale": guidance_scale,
                "num_images": num_images,
                "output_format": output_format,
                "sync_mode": True
            }
        )
        
        return jsonify({
            'success': True,
            'data': {
                'images': result['images'],
                'prompt': result.get('prompt', prompt),
                'seed': result.get('seed'),
                'has_nsfw_concepts': result.get('has_nsfw_concepts', [])
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'图像生成失败: {str(e)}'
        }), 500

@tools_bp.route('/image-generation/upload-image', methods=['POST'])
def upload_image():
    """
    上传图片并返回URL，用于图生图功能
    """
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'message': '没有上传文件'
        }), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({
            'success': False,
            'message': '没有选择文件'
        }), 400
    
    if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')):
        try:
            # 设置FAL API密钥
            fal_key = os.getenv('FAL_KEY')
            if not fal_key:
                return jsonify({
                    'success': False,
                    'message': 'FAL API密钥未配置'
                }), 500
            
            # 配置fal客户端
            fal_client.api_key = fal_key
            
            # 上传文件到FAL存储
            uploaded_file = fal_client.upload_file(file)
            
            return jsonify({
                'success': True,
                'data': {
                    'url': uploaded_file
                }
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'文件上传失败: {str(e)}'
            }), 500
    else:
        return jsonify({
            'success': False,
            'message': '不支持的文件格式'
        }), 400
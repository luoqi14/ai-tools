from flask import Blueprint, jsonify, request
import requests
import os
import base64
from io import BytesIO
from PIL import Image
from ..utils.gemini_service import get_gemini_service, image_generation_factory

image_generation_bp = Blueprint('image_generation', __name__)

# Black Forest Labs 官方API配置
BFL_API_BASE = "https://api.bfl.ai/v1"
BFL_KONTEXT_ENDPOINT = f"{BFL_API_BASE}/flux-kontext-pro"

@image_generation_bp.route('/generate', methods=['POST'])
def generate_image():
    """
    统一的图像生成接口，支持多种模型切换
    支持文生图和图生图，根据model_type参数选择模型
    支持JSON和FormData两种格式
    """
    # 处理不同的请求格式
    if request.content_type and 'application/json' in request.content_type:
        # JSON格式
        data = request.get_json()
        input_image_file = None
    else:
        # FormData格式
        data = {}
        for key, value in request.form.items():
            data[key] = value

        # 处理文件上传
        input_image_file = None
        if 'input_image' in request.files:
            input_image_file = request.files['input_image']

    if not data or 'prompt' not in data:
        return jsonify({
            'success': False,
            'message': '缺少prompt参数'
        }), 400

    # 获取模型类型，默认为 nano-banana
    model_type = data.get('model_type', 'nano-banana')

    try:
        # 使用工厂模式获取对应的服务
        service = image_generation_factory.get_service(model_type)

        # 处理输入图像
        input_image = None
        if input_image_file and input_image_file.filename:
            # 从文件上传处理
            try:
                file_content = input_image_file.read()
                input_image = Image.open(BytesIO(file_content))
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': f'图像文件处理失败: {str(e)}'
                }), 400
        elif 'input_image' in data and data['input_image']:
            # 从JSON数据处理（base64格式）
            try:
                if data['input_image'].startswith('data:'):
                    # 处理data URI格式
                    header, base64_data = data['input_image'].split(',', 1)
                    image_data = base64.b64decode(base64_data)
                    input_image = Image.open(BytesIO(image_data))
                else:
                    # 直接base64数据
                    image_data = base64.b64decode(data['input_image'])
                    input_image = Image.open(BytesIO(image_data))
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': f'base64图像解析失败: {str(e)}'
                }), 400

        # 准备参数
        kwargs = {}
        for key, value in data.items():
            if key not in ['prompt', 'model_type', 'input_image']:
                kwargs[key] = value

        # 调用对应的服务生成图像
        result = service.generate_image(
            prompt=data['prompt'],
            input_image=input_image,
            **kwargs
        )

        if result['success']:
            return jsonify({
                'success': True,
                'data': result
            })
        else:
            return jsonify({
                'success': False,
                'message': result.get('message', '图像生成失败')
            }), 400

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'服务调用失败: {str(e)}'
        }), 500

@image_generation_bp.route('/status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """
    查询任务状态和结果
    支持不同模型的任务查询
    """
    # 获取模型类型参数，默认为 flux（因为只有 flux 有异步任务）
    model_type = request.args.get('model_type', 'flux')

    try:
        # 使用工厂模式获取对应的服务
        service = image_generation_factory.get_service(model_type)

        # 调用对应服务的状态查询方法
        result = service.get_task_status(task_id)

        if result['success']:
            return jsonify({
                'success': True,
                'data': result
            })
        else:
            return jsonify({
                'success': False,
                'message': result.get('message', '状态查询失败')
            }), 400

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'状态查询异常: {str(e)}'
        }), 500


# 保留原有的 FLUX 专用状态查询接口（向后兼容）
@image_generation_bp.route('/status-flux/<task_id>', methods=['GET'])
def get_flux_task_status(task_id):
    """
    FLUX 专用任务状态查询（向后兼容）
    """
    api_key = os.getenv('BFL_API_KEY')
    if not api_key:
        return jsonify({
            'success': False,
            'message': 'BFL API密钥未配置'
        }), 500

    headers = {
        'x-key': api_key
    }

    try:
        # 查询任务状态
        status_url = f"{BFL_API_BASE}/get_result"
        response = requests.get(f"{status_url}?id={task_id}", headers=headers)

        if response.status_code == 200:
            result = response.json()

            # 将BFL API的状态转换为我们的状态格式
            bfl_status = result.get('status', 'unknown')

            # 转换状态映射
            if bfl_status == 'Ready':
                status = 'completed'
            elif bfl_status in ['Task not found', 'Error']:
                status = 'failed'
            elif bfl_status in ['Pending', 'Request Moderated']:
                status = 'pending'
            else:
                status = 'running'

            # 构建返回数据
            task_data = {
                'id': task_id,
                'status': status,
                'result': None,
                'error': None
            }

            # 如果任务完成，提取结果
            if status == 'completed' and result.get('result'):
                task_data['result'] = {
                    'image_url': result['result'].get('sample')
                }

            # 如果任务失败，提取错误信息
            if status == 'failed':
                if bfl_status == 'Task not found':
                    task_data['error'] = '任务不存在或已过期'
                else:
                    task_data['error'] = result.get('error', bfl_status)

            return jsonify({
                'success': True,
                'data': task_data
            })
        else:
            error_detail = ''
            try:
                error_data = response.json()
                error_detail = error_data.get('detail', '')
            except:
                pass
                
            return jsonify({
                'success': False,
                'message': f'查询任务状态失败: {error_detail}' if error_detail else '查询任务状态失败'
            }), response.status_code
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'查询失败: {str(e)}'
        }), 500

@image_generation_bp.route('/upload', methods=['POST'])
def upload_image():
    """
    上传图片并转换为base64，用于图生图功能
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
            # 读取文件内容并转换为base64
            file_content = file.read()
            base64_image = base64.b64encode(file_content).decode('utf-8')
            
            # 获取文件MIME类型
            content_type = file.content_type or 'image/jpeg'
            data_uri = f"data:{content_type};base64,{base64_image}"
            
            return jsonify({
                'success': True,
                'data': {
                    'base64_image': data_uri,
                    'file_size': len(file_content),
                    'content_type': content_type
                }
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'文件处理失败: {str(e)}'
            }), 500
    else:
        return jsonify({
            'success': False,
            'message': '不支持的文件格式，请上传 PNG, JPG, JPEG, GIF, BMP 或 WEBP 格式的图片'
        }), 400 

@image_generation_bp.route('/proxy-image', methods=['GET'])
def proxy_image():
    """
    代理获取BFL API返回的图片，解决CORS问题
    """
    image_url = request.args.get('url')
    if not image_url:
        return jsonify({
            'success': False,
            'message': '缺少图片URL参数'
        }), 400
    
    # 验证URL是否来自BFL域名
    if not 'bfl.ai' in image_url:
        return jsonify({
            'success': False,
            'message': '只允许代理BFL域名的图片'
        }), 403
    
    try:
        # 代理请求图片
        response = requests.get(image_url, timeout=30)
        
        if response.status_code == 200:
            # 返回图片数据
            from flask import Response
            return Response(
                response.content,
                mimetype=response.headers.get('content-type', 'image/jpeg'),
                headers={
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Cache-Control': 'public, max-age=3600'  # 缓存1小时
                }
            )
        else:
            return jsonify({
                'success': False,
                'message': f'获取图片失败: HTTP {response.status_code}'
            }), response.status_code
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'代理图片失败: {str(e)}'
        }), 500

@image_generation_bp.route('/generate-prompts', methods=['POST'])
def generate_prompts():
    """
    使用Gemini生成3条适合FLUX Kontext的提示词
    支持文本输入和图片输入
    """
    try:
        # 检查是否是多部分表单数据（包含图片）
        if 'multipart/form-data' in request.content_type:
            # 处理包含图片的请求
            user_input = request.form.get('user_input', '').strip()
            
            input_image = None
            input_image_mime_type = None
            
            # 检查是否有图片文件
            if 'image' in request.files:
                image_file = request.files['image']
                if image_file and image_file.filename:
                    # 读取图片数据
                    input_image = image_file.read()
                    input_image_mime_type = image_file.content_type
            
            # 检查是否有文本输入或图片输入
            if not user_input and not input_image:
                return jsonify({
                    'success': False,
                    'message': '请提供文本描述或上传图片'
                }), 400
        else:
            # 处理JSON请求（仅文本）
            data = request.get_json()
            if not data:
                return jsonify({
                    'success': False,
                    'message': '请求数据格式错误'
                }), 400
            
            user_input = data.get('user_input', '').strip()
            input_image = None
            input_image_mime_type = None
            
            # 检查是否有文本输入
            if not user_input:
                return jsonify({
                    'success': False,
                    'message': '请提供文本描述'
                }), 400
        
        # 调用Gemini服务生成提示词
        gemini_service = get_gemini_service()
        prompts = gemini_service.generate_flux_prompts(user_input, input_image, input_image_mime_type)
        
        return jsonify({
            'success': True,
            'data': {
                'prompts': prompts
            }
        })
        
    except Exception as e:
        # 记录详细错误信息
        print(f"生成提示词失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e),
            'error_type': 'gemini_api_error'
        }), 500


@image_generation_bp.route('/models', methods=['GET'])
def get_available_models():
    """
    获取所有可用的图像生成模型配置
    """
    try:
        models = image_generation_factory.get_available_models()
        return jsonify({
            'success': True,
            'data': {
                'models': models,
                'default_model': 'nano-banana'
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取模型配置失败: {str(e)}'
        }), 500
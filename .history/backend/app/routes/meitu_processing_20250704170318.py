from flask import Blueprint, request, jsonify
import os
import hashlib
import time
import uuid
import json
import requests
import base64
from datetime import datetime
from ..utils.api_helpers import success_response, error_response
from ..utils.file_helpers import allowed_file, save_uploaded_file

meitu_bp = Blueprint('meitu', __name__)

# 美图API配置
MEITU_API_CONFIG = {
    'app_id': '358162',
    'app_key': '72585d8db5084613989dce2baefe09a0',
    'secret_id': '6ec41b8f4f7e4768919440fe1ceca19a',
    'base_url': 'https://api.yunxiu.meitu.com',
    'process_endpoint': '/openapi/super_realphotolocal_async',
    'query_endpoint': '/openapi/query'
}

# 推荐的people_type配置
PEOPLE_TYPE_CONFIG = [
    {"age": [15, 49], "gender": 1, "key": "man", "name": "男"},
    {"age": [15, 49], "gender": 0, "key": "woman", "name": "女"},
    {"age": [0, 14], "gender": 0, "key": "child", "name": "儿童"},
    {"age": [50, 100], "gender": 0, "key": "oldwoman", "name": "老年女"},
    {"age": [50, 100], "gender": 1, "key": "oldman", "name": "老年男"}
]

# 默认输出配置
DEFAULT_OUTPUT_CONFIG = {
    "format": "jpg",
    "preview_size": "3000", 
    "qualityKey": 12,
    "resize_height": 0,
    "resize_width": 0,
    "water_mark": 0,
    "file_size_limit": [0.8, 1.3]
}

# 存储任务状态的内存字典（生产环境应使用数据库）
TASK_STORAGE = {}

def get_default_all_params():
    """
    获取所有参数的默认值
    """
    return {
        # AI 画质优化
        "bright_low_dark_image_flag": 0,
        "highpass_background_coef": 0,
        "highpass_body_coef": 0,
        "film_granularity": 0,
        
        # AI 智能调色
        "background_detain_alpha": 0,
        "awb_norm_coef": 0,
        "awb_pure_coef": 0,
        "exposure_norm_coef": 0,
        "exposure_pure_coef": 0,
        "dehaze_coef": 0,
        "radio": 0,
        "exposure_flag": 0,
        
        # 基础调整
        "saturability": 0,
        "constrast": 0,
        "highlight": 0,
        "whiteness": 0,
        "blackness": 0,
        "temperature": 0,
        "vibrance": 0,
        "exposure": 0,
        "sharpness": 0,
        "hue": 0,
        "shadow": 0,
        
        # 脸部优化（数组，5个元素对应5种人群）
        "face_beauty_alpha": [0, 0, 0, 0, 0],
        "face_restore_alpha": [0, 0, 0, 0, 0],
        "fleck_clean_flag": [0, 0, 0, 0, 0],
        "lip_remove_alpha": [0, 0, 0, 0, 0],
        "wrinkle_nasolabial_removal_alpha": [0, 0, 0, 0, 0],
        "black_head_clean_flag": [0, 0, 0, 0, 0],
        "remove_pouch": [0, 0, 0, 0, 0],
        "wrinkle_neck_removal_alpha": [0, 0, 0, 0, 0],
        "wrinkle_cheek_removal_alpha": [0, 0, 0, 0, 0],
        "double_chin": [0, 0, 0, 0, 0],
        "double_chin_alpha": [0, 0, 0, 0, 0],
        "wrinkle_forehead_removal_alpha": [0, 0, 0, 0, 0],
        "wrinkle_periorbital_removal_alpha": [0, 0, 0, 0, 0],
        "shiny_clean_alpha": [0, 0, 0, 0, 0],
        "nevus_removal_flag": [0, 0, 0, 0, 0],
        
        # 滤镜
        "filter": {
            "filter_id": "",
            "filters_lut_alpha": 50,
            "filter_is_black": 0
        },
        
        # 皮肤磨皮
        "smooth_face_skin_alpha": [0, 0, 0, 0, 0],
        "smooth_not_face_skin_alpha": [0, 0, 0, 0, 0],
        "face_balance_alpha": [0, 0, 0, 0, 0],
        "sharpen_alpha": [0, 0, 0, 0, 0],
        
        # 设置
        "child_teeth_beauty_flag": 0,
        
        # 牙齿美化
        "white_teeth": [0, 0, 0, 0, 0],
        "teeth_beauty": [0, 0, 0, 0, 0],
        
        # 智能增高
        "heighten": 0,
        
        # 服饰美化
        "rmw_rink": 0
    }

@meitu_bp.route('/functions', methods=['GET'])
def get_functions():
    """
    获取所有处理功能列表
    """
    # 返回参数分类信息
    parameter_groups = {
        'ai_quality': {
            'name': 'AI 画质优化',
            'parameters': {
                'bright_low_dark_image_flag': {'type': 'select', 'options': [0, 1], 'default': 0, 'label': '暗图矫正'},
                'highpass_background_coef': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '背景锐化'},
                'highpass_body_coef': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '人像锐化'},
                'film_granularity': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '颗粒感'}
            }
        },
        'ai_color': {
            'name': 'AI 智能调色',
            'parameters': {
                'background_detain_alpha': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '纯色背景祛瑕疵'},
                'awb_norm_coef': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '智能白平衡_常规背景'},
                'awb_pure_coef': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '智能白平衡_纯色背景'},
                'exposure_norm_coef': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '智能曝光_常规背景'},
                'exposure_pure_coef': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '智能曝光_纯色背景'},
                'dehaze_coef': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '智能去雾'},
                'radio': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '背景增强'},
                'exposure_flag': {'type': 'select', 'options': [0, 1], 'default': 0, 'label': '智能曝光开关'}
            }
        },
        'basic_adjust': {
            'name': '基础调整',
            'parameters': {
                'saturability': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '饱和度'},
                'constrast': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '对比度'},
                'highlight': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '高光'},
                'whiteness': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '白色'},
                'blackness': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '黑色'},
                'temperature': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色温'},
                'vibrance': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '自然饱和度'},
                'exposure': {'type': 'slider', 'min': -500, 'max': 500, 'default': 0, 'label': '曝光'},
                'sharpness': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '清晰度'},
                'hue': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色调'},
                'shadow': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '阴影'}
            }
        },
        'face_optimize': {
            'name': '脸部优化',
            'parameters': {
                'face_beauty_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': 'AI美颜'},
                'face_restore_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': 'AI修复'},
                'fleck_clean_flag': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '祛斑祛痘_脸部'},
                'lip_remove_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛唇纹'},
                'remove_pouch': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛黑眼圈'},
                'shiny_clean_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛油光'}
            }
        },
        'skin_smooth': {
            'name': '皮肤磨皮',
            'parameters': {
                'smooth_face_skin_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '高低频_脸部'},
                'smooth_not_face_skin_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '高低频_身体'},
                'face_balance_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '中性灰_脸部'},
                'sharpen_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '皮肤纹理_脸部'}
            }
        },
        'teeth_beauty': {
            'name': '牙齿美化',
            'parameters': {
                'white_teeth': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '牙齿美白'},
                'teeth_beauty': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '牙齿修复'}
            }
        },
        'other': {
            'name': '其他设置',
            'parameters': {
                'heighten': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': 'AI增高'},
                'rmw_rink': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '衣服祛褶皱'},
                'child_teeth_beauty_flag': {'type': 'select', 'options': [0, 1], 'default': 0, 'label': '三岁儿童牙齿效果'}
            }
        }
    }
    
    return success_response({
        'parameter_groups': parameter_groups,
        'people_types': PEOPLE_TYPE_CONFIG
    })

@meitu_bp.route('/process', methods=['POST'])
def process_image():
    """
    处理图片的统一接口
    """
    try:
        # 获取上传的图片
        if 'image' not in request.files:
            return error_response('没有上传图片文件')
        
        image_file = request.files['image']
        if image_file.filename == '':
            return error_response('没有选择图片文件')
        
        if not allowed_file(image_file.filename):
            return error_response('不支持的文件格式')
        
        # 获取处理参数
        parameters = {}
        for key, value in request.form.items():
            if key != 'image':
                try:
                    # 尝试解析JSON格式的参数
                    if value.startswith('[') or value.startswith('{'):
                        parameters[key] = json.loads(value)
                    else:
                        parameters[key] = value
                except:
                    parameters[key] = value
        
        # 保存上传的图片
        image_path = save_uploaded_file(image_file)
        
        # 调用美图API处理
        result = call_meitu_api(image_path, parameters)
        
        return success_response(result)
        
    except Exception as e:
        return error_response(f'处理失败: {str(e)}')

@meitu_bp.route('/status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """
    查询任务状态
    """
    try:
        # 查询美图API任务状态
        result = query_meitu_task(task_id)
        return success_response(result)
        
    except Exception as e:
        return error_response(f'查询状态失败: {str(e)}')

def call_meitu_api(image_path, parameters):
    """
    调用美图云修API
    """
    # 读取图片文件并上传到临时服务器获取URL
    # 这里需要将本地图片上传到一个公开可访问的URL
    # 为了演示，我们模拟一个处理过程
    
    # 构建API请求参数
    all_params = get_default_all_params()
    all_params.update(parameters)
    
    # 构建请求数据
    request_data = {
        "parameter": {
            "all_params": all_params,
            "rsp_mask_version": 500,
            "preview_size": 3000,
            "people_type": PEOPLE_TYPE_CONFIG,
            "output": DEFAULT_OUTPUT_CONFIG
        },
        "media_info_list": [
            {
                "media_data": image_path,  # 实际应用中需要是公开URL
                "media_extra": {},
                "media_profiles": {
                    "media_data_type": "url",
                    "media_data_describe": "src"
                }
            }
        ],
        "extra": {}
    }
    
    # 构建API URL
    api_url = f"{MEITU_API_CONFIG['base_url']}{MEITU_API_CONFIG['process_endpoint']}"
    
    # 添加查询参数
    params = {
        'api_key': MEITU_API_CONFIG['api_key'],
        'api_secret': MEITU_API_CONFIG['api_secret']
    }
    
    # 为了演示，我们返回一个模拟的任务ID
    # 实际应用中应该调用真实的API
    task_id = str(uuid.uuid4())
    
    # 模拟API调用
    # response = requests.post(api_url, json=request_data, params=params)
    # result = response.json()
    
    # 模拟响应
    result = {
        'task_id': task_id,
        'status': 'processing',
        'message': '任务已提交，正在处理中...'
    }
    
    # 存储任务信息
    TASK_STORAGE[task_id] = {
        'status': 'processing',
        'created_at': datetime.now().isoformat(),
        'parameters': parameters,
        'image_path': image_path
    }
    
    return result

def query_meitu_task(task_id):
    """
    查询美图API任务状态
    """
    # 检查本地任务存储
    if task_id in TASK_STORAGE:
        task_info = TASK_STORAGE[task_id]
        
        # 模拟任务完成
        # 实际应用中应该调用真实的查询API
        if task_info['status'] == 'processing':
            # 模拟处理完成
            task_info['status'] = 'completed'
            task_info['result'] = {
                'processed_image': task_info['image_path'],  # 实际应用中应该是处理后的图片URL
                'processing_time': 3.5
            }
        
        return task_info
    else:
        return {
            'status': 'not_found',
            'message': '任务不存在或已过期'
        } 
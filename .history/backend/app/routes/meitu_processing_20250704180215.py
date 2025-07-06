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

# 美图API配置 - 使用真实密钥
MEITU_API_CONFIG = {
    'api_key': '358162',  # 根据文档，这是APPID
    'api_secret': '72585d8db5084613989dce2baefe09a0',  # 根据文档，这是APPKEY
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

def generate_signature(params, secret_id):
    """
    生成API签名
    """
    # 按字典序排序参数
    sorted_params = sorted(params.items())
    
    # 构建签名字符串
    param_string = '&'.join([f"{k}={v}" for k, v in sorted_params])
    sign_string = f"{param_string}&secret_id={secret_id}"
    
    # 计算MD5签名
    signature = hashlib.md5(sign_string.encode('utf-8')).hexdigest()
    
    return signature

def upload_image_to_base64(image_path):
    """
    将图片转换为base64编码
    """
    try:
        with open(image_path, 'rb') as image_file:
            image_data = image_file.read()
            base64_data = base64.b64encode(image_data).decode('utf-8')
            return f"data:image/jpeg;base64,{base64_data}"
    except Exception as e:
        print(f"图片转换失败: {e}")
        return None

def get_default_all_params():
    """
    获取所有参数的默认值 - 根据美图云修API文档完整配置
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
        
        # HSL 调整
        "hsl_sat_orange": 0,
        "hsl_sat_red": 0,
        "hsl_sat_yellow": 0,
        "hsl_sat_blue": 0,
        "hsl_sat_green": 0,
        "hsl_sat_magenta": 0,
        "hsl_sat_aqua": 0,
        "hsl_sat_violet": 0,
        "hsl_luma_orange": 0,
        "hsl_luma_red": 0,
        "hsl_luma_yellow": 0,
        "hsl_luma_blue": 0,
        "hsl_luma_green": 0,
        "hsl_luma_magenta": 0,
        "hsl_luma_aqua": 0,
        "hsl_luma_violet": 0,
        "hsl_hue_orange": 0,
        "hsl_hue_red": 0,
        "hsl_hue_yellow": 0,
        "hsl_hue_magenta": 0,
        "hsl_hue_violet": 0,
        "hsl_hue_blue": 0,
        "hsl_hue_green": 0,
        "hsl_hue_aqua": 0,
        
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
        
        # 脸型调整
        "ai_shrink_head": [0, 0, 0, 0, 0],
        "face_forehead": [0, 0, 0, 0, 0],
        "middle_half_of_face": [0, 0, 0, 0, 0],
        "bottom_half_of_face": [0, 0, 0, 0, 0],
        "philtrum_warp": [0, 0, 0, 0, 0],
        "narrow_face": [0, 0, 0, 0, 0],
        "facial_contour": [0, 0, 0, 0, 0],
        "cheekbone_left": [0, 0, 0, 0, 0],
        "cheekbone_right": [0, 0, 0, 0, 0],
        "temple_left": [0, 0, 0, 0, 0],
        "temple_right": [0, 0, 0, 0, 0],
        "mandible_left": [0, 0, 0, 0, 0],
        "mandible_right": [0, 0, 0, 0, 0],
        "jaw_trans": [0, 0, 0, 0, 0],
        "face_trans": [0, 0, 0, 0, 0],
        "run_symmetry_list": [0, 0, 0, 0, 0],
        "face_symmetry": [0, 0, 0, 0, 0],
        "body_symmetry": [0, 0, 0, 0, 0],
        "threed_up_down": [0, 0, 0, 0, 0],
        "threed_left_right": [0, 0, 0, 0, 0],
        
        # 滤镜
        "filter": {
            "filter_id": "",
            "filters_lut_alpha": 50,
            "filter_is_black": 0
        },
        
        # 肤色调整
        "skin_tone_flag": [0, 0, 0, 0, 0],
        "body_dullness_remove_alpha": [0, 0, 0, 0, 0],
        "skin_tone_body_luma_alpha": [100, 100, 100, 100, 100],
        "skin_tone_body_hue_alpha": [100, 100, 100, 100, 100],
        "skin_color_path": [0, 0, 0, 0, 0],
        "skin_color_hue_skin_alpha": [0, 0, 0, 0, 0],
        "skin_color_hue_alpha": [0, 0, 0, 0, 0],
        "skin_red_alpha": [0, 0, 0, 0, 0],
        "skin_white_alpha": [0, 0, 0, 0, 0],
        "skin_hdr_alpha": [0, 0, 0, 0, 0],
        
        # 皮肤磨皮
        "smooth_face_skin_alpha": [0, 0, 0, 0, 0],
        "smooth_not_face_skin_alpha": [0, 0, 0, 0, 0],
        "face_balance_alpha": [0, 0, 0, 0, 0],
        "sharpen_alpha": [0, 0, 0, 0, 0],
        
        # 全身美型高阶版
        "multibody_beauty": [0, 0, 0, 0, 0],
        
        # 全身美型基础版
        "chest_enlarge": 0,
        "slim_hip": 0,
        "slim": 0,
        "slim_hand": 0,
        "slim_leg": 0,
        "slim_waist": 0,
        "shrink_head": 0,
        "lengthen": 0,
        
        # 设置
        "child_teeth_beauty_flag": 0,
        
        # 身体优化
        "skin_fleck_clean_flag": [0, 0, 0, 0, 0],
        "beauty_belly_alpha": [0, 0, 0, 0, 0],
        "flaw_clean_alpha": [0, 0, 0, 0, 0],
        "baby_remove_dander": [0, 0, 0, 0, 0],
        
        # 头发调整
        "fluffy_hair": [0, 0, 0, 0, 0],
        "black_hair": [0, 0, 0, 0, 0],
        
        # 五官塑造
        "nasal_tip": [0, 0, 0, 0, 0],
        "bridge_nose": [0, 0, 0, 0, 0],
        "shrink_nose": [0, 0, 0, 0, 0],
        "scale_nose": [0, 0, 0, 0, 0],
        "nose_longer": [0, 0, 0, 0, 0],
        "nasal_root": [0, 0, 0, 0, 0],
        "upperlip_enhance": [0, 0, 0, 0, 0],
        "lowerlip_enhance": [0, 0, 0, 0, 0],
        "mouth_trans": [0, 0, 0, 0, 0],
        "mouth_high": [0, 0, 0, 0, 0],
        "mouth_breadth": [0, 0, 0, 0, 0],
        "high_mouth": [0, 0, 0, 0, 0],
        "mouth_smile": [0, 0, 0, 0, 0],
        "eye_up_down_left": [0, 0, 0, 0, 0],
        "eye_up_down_right": [0, 0, 0, 0, 0],
        "eye_trans_left": [0, 0, 0, 0, 0],
        "eye_trans_right": [0, 0, 0, 0, 0],
        "eye_tilt_left": [0, 0, 0, 0, 0],
        "eye_tilt_right": [0, 0, 0, 0, 0],
        "eye_height_left": [0, 0, 0, 0, 0],
        "eye_height_right": [0, 0, 0, 0, 0],
        "eye_lid_left": [0, 0, 0, 0, 0],
        "eye_lid_right": [0, 0, 0, 0, 0],
        "eye_distance_left": [0, 0, 0, 0, 0],
        "eye_distance_right": [0, 0, 0, 0, 0],
        "eye_width_left": [0, 0, 0, 0, 0],
        "eye_width_right": [0, 0, 0, 0, 0],
        "inner_eye_corner_left": [0, 0, 0, 0, 0],
        "inner_eye_corner_right": [0, 0, 0, 0, 0],
        "eyebrow_tilt_left": [0, 0, 0, 0, 0],
        "eyebrow_tilt_right": [0, 0, 0, 0, 0],
        "eyebrow_height_left": [0, 0, 0, 0, 0],
        "eyebrow_height_right": [0, 0, 0, 0, 0],
        "eyebrow_distance_left": [0, 0, 0, 0, 0],
        "eyebrow_distance_right": [0, 0, 0, 0, 0],
        "eyebrow_ridge_left": [0, 0, 0, 0, 0],
        "eyebrow_ridge_right": [0, 0, 0, 0, 0],
        "eyebrow_size_left": [0, 0, 0, 0, 0],
        "eyebrow_size_right": [0, 0, 0, 0, 0],
        
        # 牙齿美化
        "white_teeth": [0, 0, 0, 0, 0],
        "teeth_beauty": [0, 0, 0, 0, 0],
        
        # 智能增高
        "heighten": 0,
        
        # 妆容调整
        "lipstick_deepen": [0, 0, 0, 0, 0],
        "highlight_alpha": [0, 0, 0, 0, 0],
        "facial_deepen": [0, 0, 0, 0, 0],
        "bright_eye": [0, 0, 0, 0, 0],
        "eyebrow_deepen": [0, 0, 0, 0, 0],
        "eyeshadow_deepen": [0, 0, 0, 0, 0],
        "shadow_light": [0, 0, 0, 0, 0],
        "facialdecals": [{"id": "", "color": "0;0;0;0", "alpha": 0}] * 5,
        "blush": [{"id": "", "color": "0;0;0;0", "alpha": 0}] * 5,
        "eyesocket": [{"id": "", "color": "0;0;0;0", "alpha": 0}] * 5,
        "eyelash": [{"id": "", "color": "0;0;0;0", "alpha": 0}] * 5,
        "eyeshadow": [{"id": "", "color": "0;0;0;0", "alpha": 0}] * 5,
        "mouth": [{"id": "", "color": "0;0;0;0", "alpha": 0}] * 5,
        "eyebrow": [{"id": "", "color": "0;0;0;0", "alpha": 0}] * 5,
        "eye": [{"id": "", "color": "0;0;0;0", "alpha": 0}] * 5,
        "feature": [{"id": "", "color": "0;0;0;0", "alpha": 0}] * 5,
        
        # 服饰美化
        "rmw_rink": 0
    }

@meitu_bp.route('/functions', methods=['GET'])
def get_functions():
    """
    获取所有处理功能列表
    """
    # 返回参数分类信息 - 根据美图云修API文档完整配置
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
        'hsl_adjust': {
            'name': 'HSL 调整',
            'parameters': {
                'hsl_sat_orange': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '饱和度_橙色'},
                'hsl_sat_red': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '饱和度_红色'},
                'hsl_sat_yellow': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '饱和度_黄色'},
                'hsl_sat_blue': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '饱和度_蓝色'},
                'hsl_sat_green': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '饱和度_绿色'},
                'hsl_sat_magenta': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '饱和度_品红'},
                'hsl_sat_aqua': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '饱和度_浅绿'},
                'hsl_sat_violet': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '饱和度_紫罗兰'},
                'hsl_luma_orange': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '明亮度_橙色'},
                'hsl_luma_red': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '明亮度_红色'},
                'hsl_luma_yellow': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '明亮度_黄色'},
                'hsl_luma_blue': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '明亮度_蓝色'},
                'hsl_luma_green': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '明亮度_绿色'},
                'hsl_luma_magenta': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '明亮度_品红'},
                'hsl_luma_aqua': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '明亮度_浅绿'},
                'hsl_luma_violet': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '明亮度_紫罗兰'},
                'hsl_hue_orange': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色相_橙色'},
                'hsl_hue_red': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色相_红色'},
                'hsl_hue_yellow': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色相_黄色'},
                'hsl_hue_magenta': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色相_品红'},
                'hsl_hue_violet': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色相_紫罗兰'},
                'hsl_hue_blue': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色相_蓝色'},
                'hsl_hue_green': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色相_绿色'},
                'hsl_hue_aqua': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '色相_浅绿'}
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
                'wrinkle_nasolabial_removal_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛法令纹'},
                'black_head_clean_flag': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '祛黑头/脂肪粒'},
                'remove_pouch': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛黑眼圈'},
                'wrinkle_neck_removal_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛颈纹'},
                'wrinkle_cheek_removal_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛面颊纹'},
                'double_chin': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '祛双下巴（旧版）'},
                'double_chin_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛双下巴（新版）'},
                'wrinkle_forehead_removal_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛抬头纹'},
                'wrinkle_periorbital_removal_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛眼周纹'},
                'shiny_clean_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '祛油光'},
                'nevus_removal_flag': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '祛痣_脸部'}
            }
        },
        'face_shape': {
            'name': '脸型调整',
            'parameters': {
                'ai_shrink_head': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '缩头'},
                'face_forehead': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '额头'},
                'middle_half_of_face': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '中庭'},
                'bottom_half_of_face': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '下庭'},
                'philtrum_warp': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '人中'},
                'narrow_face': {'type': 'array_slider', 'min': -200, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '脸宽'},
                'facial_contour': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '脸部轮廓平滑'},
                'cheekbone_left': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '颧骨_左'},
                'cheekbone_right': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '颧骨_右'},
                'temple_left': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '太阳穴_左'},
                'temple_right': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '太阳穴_右'},
                'mandible_left': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '下颌_左'},
                'mandible_right': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '下颌_右'},
                'jaw_trans': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '下巴高度'},
                'face_trans': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '下巴宽度'},
                'run_symmetry_list': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '对称液化开关'},
                'face_symmetry': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '五官对称'},
                'body_symmetry': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '上半身对称'},
                'threed_up_down': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '3D塑颜-上下'},
                'threed_left_right': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '3D塑颜-左右'}
            }
        },
        'skin_tone': {
            'name': '肤色调整',
            'parameters': {
                'skin_tone_flag': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '智能肤色'},
                'body_dullness_remove_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '肤色统一'},
                'skin_tone_body_luma_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [100, 100, 100, 100, 100], 'label': '明度'},
                'skin_tone_body_hue_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [100, 100, 100, 100, 100], 'label': '色彩'},
                'skin_color_path': {'type': 'array_select', 'options': [0, 1, 2, 3, 4], 'default': [0, 0, 0, 0, 0], 'label': '肤色选择'},
                'skin_color_hue_skin_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '肤色选择透明度'},
                'skin_color_hue_alpha': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '肤色偏好'},
                'skin_red_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '皮肤红润'},
                'skin_white_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '皮肤美白'},
                'skin_hdr_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '皮肤透亮'}
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
        'body_beauty': {
            'name': '全身美型',
            'parameters': {
                'multibody_beauty': {'type': 'array_slider', 'min': 0, 'max': 150, 'default': [0, 0, 0, 0, 0], 'label': '美型（多人液化）'},
                'chest_enlarge': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '丰胸'},
                'slim_hip': {'type': 'slider', 'min': -100, 'max': 100, 'default': 0, 'label': '美胯'},
                'slim': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '瘦身'},
                'slim_hand': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '瘦手臂'},
                'slim_leg': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '瘦腿'},
                'slim_waist': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '瘦腰'},
                'shrink_head': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '小头'},
                'lengthen': {'type': 'slider', 'min': 0, 'max': 100, 'default': 0, 'label': '长腿'}
            }
        },
        'body_optimize': {
            'name': '身体优化',
            'parameters': {
                'skin_fleck_clean_flag': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '祛斑祛痘_身体'},
                'beauty_belly_alpha': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '祛妊娠纹'},
                'flaw_clean_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '身体去瑕疵'},
                'baby_remove_dander': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '婴幼儿去瑕疵'}
            }
        },
        'hair_adjust': {
            'name': '头发调整',
            'parameters': {
                'fluffy_hair': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '头发蓬松'},
                'black_hair': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '发色加深'}
            }
        },
        'facial_features': {
            'name': '五官塑造',
            'parameters': {
                'nasal_tip': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '鼻子_鼻尖'},
                'bridge_nose': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '鼻子_鼻梁'},
                'shrink_nose': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '鼻子_鼻翼'},
                'scale_nose': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '鼻子_大小'},
                'nose_longer': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '鼻子_长短'},
                'nasal_root': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '鼻子_山根'},
                'upperlip_enhance': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '嘴巴_丰上唇'},
                'lowerlip_enhance': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '嘴巴_丰下唇'},
                'mouth_trans': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '嘴巴_大小'},
                'mouth_high': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '嘴巴_高度'},
                'mouth_breadth': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '嘴巴_宽度'},
                'high_mouth': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '嘴巴_上下'},
                'mouth_smile': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '嘴巴_微笑'},
                'eye_up_down_left': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '眼睛_左_上下'},
                'eye_up_down_right': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '眼睛_右_上下'},
                'eye_trans_left': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '眼睛_左_大小'},
                'eye_trans_right': {'type': 'array_slider', 'min': -100, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '眼睛_右_大小'}
            }
        },
        'teeth_beauty': {
            'name': '牙齿美化',
            'parameters': {
                'white_teeth': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '牙齿美白'},
                'teeth_beauty': {'type': 'array_select', 'options': [0, 1], 'default': [0, 0, 0, 0, 0], 'label': '牙齿修复'}
            }
        },
        'makeup': {
            'name': '妆容调整',
            'parameters': {
                'lipstick_deepen': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '唇妆增强'},
                'highlight_alpha': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '高光立体'},
                'facial_deepen': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '脸颊加深'},
                'bright_eye': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '亮眼'},
                'eyebrow_deepen': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '眉毛增强'},
                'eyeshadow_deepen': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '眼妆增强'},
                'shadow_light': {'type': 'array_slider', 'min': 0, 'max': 100, 'default': [0, 0, 0, 0, 0], 'label': '阴影立体'}
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

@meitu_bp.route('/process-preset', methods=['POST'])
def process_image_with_preset():
    """
    使用预设ID处理图片
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
        
        # 获取预设ID
        preset_id = request.form.get('preset_id', 'MTyunxiu1c68684d55')  # 默认使用您提供的预设ID
        
        # 保存上传的图片
        image_path = save_uploaded_file(image_file)
        
        # 调用预设ID方式的美图API
        result = call_meitu_preset_api(image_path, preset_id)
        
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
    调用美图云修API - 根据文档使用正确的参数格式
    """
    try:
        # 注意：根据文档，API不支持base64，只支持URL
        # 这里需要先将图片上传到一个公开可访问的URL
        # 为了演示，我们暂时使用模拟的URL
        
        # 构建API请求参数
        all_params = get_default_all_params()
        all_params.update(parameters)
        
        # 构建请求数据 - 按照文档格式
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
                    # 注意：文档说明不支持base64，只支持URL
                    # 这里需要将本地图片上传到公开URL
                    "media_data": "https://example.com/temp_image.jpg",  # 实际应用中需要上传图片获取URL
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
        
        # 准备查询参数 - 根据文档，api_key和api_secret作为查询参数
        query_params = {
            'api_key': MEITU_API_CONFIG['api_key'],
            'api_secret': MEITU_API_CONFIG['api_secret']
        }
        
        # 构建请求头
        headers = {
            'Content-Type': 'application/json'
        }
        
        print(f"调用美图API: {api_url}")
        print(f"查询参数: {query_params}")
        print(f"请求数据: {json.dumps(request_data, indent=2, ensure_ascii=False)}")
        
        # 调用真实API
        response = requests.post(
            api_url, 
            params=query_params,
            json=request_data, 
            headers=headers, 
            timeout=30
        )
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            
            # 检查API响应
            if result.get('code') == 0:
                msg_id = result.get('data', {}).get('msg_id')
                if msg_id:
                    # 存储任务信息
                    TASK_STORAGE[msg_id] = {
                        'status': 'processing',
                        'created_at': datetime.now().isoformat(),
                        'parameters': parameters,
                        'image_path': image_path,
                        'api_task_id': msg_id
                    }
                    
                    return {
                        'task_id': msg_id,
                        'status': 'processing',
                        'message': '任务已提交，正在处理中...'
                    }
                else:
                    raise Exception("API返回的msg_id为空")
            else:
                error_msg = result.get('message', '未知错误')
                raise Exception(f"API调用失败: {error_msg} (code: {result.get('code')})")
        else:
            raise Exception(f"HTTP请求失败: {response.status_code} - {response.text}")
            
    except Exception as e:
        # 如果API调用失败，返回错误信息
        print(f"美图API调用失败: {e}")
        return {
            'task_id': '',
            'status': 'failed',
            'error': str(e)
        }

def query_meitu_task(task_id):
    """
    查询美图API任务状态
    """
    try:
        # 检查本地任务存储
        if task_id not in TASK_STORAGE:
            return {
                'status': 'not_found',
                'message': '任务不存在或已过期'
            }
        
        task_info = TASK_STORAGE[task_id]
        
        # 如果任务已完成，直接返回结果
        if task_info['status'] in ['completed', 'failed']:
            return task_info
        
        # 构建查询API URL
        query_url = f"{MEITU_API_CONFIG['base_url']}{MEITU_API_CONFIG['query_endpoint']}"
        
        # 构建请求头
        headers = {
            'Content-Type': 'application/json'
        }
        
        # 构建查询请求数据 - 根据文档格式
        query_data = {
            'api_key': MEITU_API_CONFIG['api_key'],
            'api_secret': MEITU_API_CONFIG['api_secret'],
            'msg_id': task_id
        }
        
        # 调用查询API
        response = requests.post(query_url, json=query_data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('code') == 0:
                data = result.get('data', {})
                media_data = data.get('media_data')
                
                # 根据文档，如果有media_data说明处理完成
                if media_data:
                    task_info['status'] = 'completed'
                    task_info['result'] = {
                        'processed_image': media_data,
                        'processing_time': 3.5  # 模拟处理时间
                    }
                else:
                    # 检查是否有错误码
                    if result.get('code') == 29901:  # 图片还在处理中
                        task_info['status'] = 'processing'
                    elif result.get('code') == 29902:  # 任务ID已过期
                        task_info['status'] = 'failed'
                        task_info['error'] = '任务已过期'
                    else:
                        # 仍在处理中
                        task_info['status'] = 'processing'
                
                # 更新存储
                TASK_STORAGE[task_id] = task_info
                
                return task_info
            else:
                # 根据错误码处理
                error_code = result.get('code')
                if error_code == 29901:
                    task_info['status'] = 'processing'
                elif error_code == 29902:
                    task_info['status'] = 'failed'
                    task_info['error'] = '任务已过期'
                else:
                    error_msg = result.get('message', '查询失败')
                    task_info['status'] = 'failed'
                    task_info['error'] = error_msg
                TASK_STORAGE[task_id] = task_info
                return task_info
        else:
            raise Exception(f"HTTP请求失败: {response.status_code}")
            
    except Exception as e:
        print(f"查询任务状态失败: {e}")
        # 返回本地存储的状态
        if task_id in TASK_STORAGE:
            return TASK_STORAGE[task_id]
        else:
            return {
                'status': 'failed',
                'error': f'查询失败: {str(e)}'
            } 
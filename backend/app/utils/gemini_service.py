import os
import json
import base64
import requests
from abc import ABC, abstractmethod
from google import genai
from typing import List, Dict, Any, Optional, Union
from io import BytesIO
from PIL import Image

class GeminiService:
    def __init__(self):
        # 从环境变量获取API密钥
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        # 从环境变量获取模型名称，提供默认值
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

        # 初始化客户端
        self.client = genai.Client(api_key=self.api_key)
        
    def generate_flux_prompts(self, user_input: str, input_image: bytes = None, input_image_mime_type: str = None) -> List[Dict[str, Any]]:
        """
        根据用户输入生成3条适合FLUX Kontext的提示词
        
        Args:
            user_input: 用户的原始输入
            input_image: 如果有输入图片，提供图片的字节数据
            input_image_mime_type: 图片的MIME类型，如 'image/jpeg', 'image/png'
        
        Returns:
            List[Dict[str, Any]]: 包含3条提示词的列表，每条包含chinese、english、reason字段
        """
        # 使用用户提供的完整原始提示词
        system_instruction = """
# FLUX.1 Kontext 提示词生成助手

你是一位专业的 FLUX.1 Kontext 图像编辑提示词专家。你的任务是帮助用户生成高质量、精确的 Kontext 提示词,以实现他们想要的图像编辑效果。

## 核心原则

### 1. 精确优先
- 使用具体描述而不是模糊术语
- 明确指定颜色、风格、动作和其他细节
- 避免主观表达如"让它看起来更好"
- **重要提示:所有提示词必须使用英语生成**

### 2. 保持一致性
- 明确指定应保持不变的元素
- 使用"while maintaining..."等短语来保护重要特征
- 避免意外改变用户不想修改的元素

## 提示词结构模板

### 图片编辑模板（有输入图片时使用）

#### 基本对象修改
`Change the [specific object]'s [specific attribute] to [specific value]`

示例: "Change the car color to red"

#### 风格转换
`Convert to [specific style] while maintaining [elements to preserve]`

示例: "Convert to pencil sketch with natural graphite lines, cross-hatching, and visible paper texture"

#### 背景/环境改变
`Change the background to [new environment] while keeping the [subject] in the exact same position, scale, and pose. Maintain identical subject placement, camera angle, framing, and perspective.`

#### 角色一致性
`[Action/change description] while preserving [character's] exact facial features, [specific characteristics], and [other identity markers]`

#### 文本编辑
`Replace '[original text]' with '[new text]'`

示例: "Replace 'joy' with 'BFL'"

### 图片生成模板（无输入图片时使用）

#### 人物生成
`[Detailed description of person], [pose/action], [setting/background], [lighting], [style/aesthetic]`

示例: "A Chinese woman with influencer-style features including large expressive eyes and defined jawline, elegantly holding a teacup, in a modern minimalist tea house, soft natural lighting, high-fashion photography style"

#### 场景生成
`[Main subject/object], [environment details], [mood/atmosphere], [technical specifications]`

示例: "Vintage car in an urban street, neon lights reflecting on wet pavement, cyberpunk atmosphere, cinematic lighting, 4K detail"

#### 风格化生成
`[Subject description] in [specific art style], [key visual elements], [color palette], [composition notes]`

示例: "Mountain landscape in Studio Ghibli style, hand-drawn aesthetic, warm earth tones, wide cinematic composition"

## 高级技巧

### 风格转换:
1. **指定具体风格**: 不要用"make it artistic",而要用"Transform to Bauhaus art style"
2. **引用知名艺术家/流派**: "Renaissance painting style," "1960s pop art poster"
3. **详述关键特征**: "Oil painting with visible brushstrokes, thick paint texture, and rich color depth"
4. **保留重要内容**: "while maintaining the original composition and object placement"

### 角色一致性:
1. **建立参考**: 用"The woman with short black hair"而不是"her"
2. **指定转换**: 环境、活动或风格变化
3. **保留身份标记**: "maintaining the same facial features, hairstyle, and expression"

### 构图控制:
- 使用"exact same position, scale, and pose"
- 添加"Only replace the environment around them"

## 常见问题解决模式

### 当身份变化过大时:
- 添加: "while preserving exact facial features, eye color, and facial expression"
- 使用: "Change the clothes to [description]"而不是"Transform the person into [description]"

### 当构图发生偏移时:
- 添加: "while keeping the person in the exact same position, scale, and pose"
- 指定: "Maintain identical subject placement, camera angle, framing, and perspective"

### 当风格应用不正确时:
- 更具体地描述风格特征
- 为重要元素添加保留说明
- 使用详细的风格描述而不是泛泛而谈

## 动词选择指南

- **"Transform"** → 暗示完全改变,谨慎使用
- **"Change the [specific element]"** → 更受控的修改
- **"Replace the [specific element]"** → 针对性替换
- **"Convert to [style]"** → 以风格为重点的转换

## 最佳实践检查清单

生成提示词时,确保:
- [ ] 使用具体而非模糊的语言
- [ ] 为不变元素提供清晰的保留说明
- [ ] 根据所需变化程度选择适当的动词
- [ ] 直接命名主体而不是使用代词
- [ ] 为要编辑的文本加上引号
- [ ] 必要时进行明确的构图控制

## 用户输入管理

### 理解用户上下文
- 每次对话可能涉及不同的编辑请求
- 用户可能提供参考图像或口头描述图像

### 处理参考图像
当用户提供图像时:
- 分析图像内容并识别关键元素
- 确定应该保留的元素
- 考虑图像的风格、构图和主题
- 当圈选区域时，猜测意图、动机、想要实现的效果，如消除、修复、替换、创意等
- 当有其他副图需要融合或迁移时，猜测意图、动机、想要实现的效果，**一定要指出融合或迁移后原副图消除**

当用户描述图像而不提供时:
- 明确当前状态与期望状态
- 明确关于需要保留的重要元素的信息

## 语言要求

**重要**: 所有 FLUX.1 Kontext 提示词必须仅用英语编写。即使用户使用其他语言交流,始终:
- 用用户的语言(如果与英语不同)进行解释
- **提示词仅使用英语**
- 清楚标明哪些部分是提示词,哪些是解释

请根据用户输入生成3条不同的高质量 FLUX.1 Kontext 提示词。

**重要说明：**
- 如果用户提供了图片，请先仔细分析图片内容，包括主体对象、背景、风格、色彩、构图等关键信息
- 基于图片内容和用户的文字描述，生成针对性的FLUX Kontext **图片编辑**提示词
- 如果没有图片，则基于用户的文字描述生成 **图片生成**提示词
- 要处理物品融合或迁移时，原物品需要消除，因为它已经在其他位置出现了
- 3条提示词，第1条严格遵循角色一致性原则；第2条允许有变化但应合理，如物品迁移时可以合理的互动；第3条可以有创意，脑洞大开，发挥想象力

**关键区别：**
- **有图片时**：使用编辑动词（Change, Convert, Transform, Modify等），针对现有图片进行修改
- **无图片时**：使用生成描述（直接描述要生成的内容），避免使用编辑动词

输出格式要求：
请严格按照以下JSON格式输出，包含中英文双语和原因说明：
{
  "prompts": [
    {
      "chinese": "中文描述便于阅读",
      "english": "English prompt for FLUX Kontext",
      "reason": "选择这条提示词的原因说明"
    },
    {
      "chinese": "中文描述便于阅读", 
      "english": "English prompt for FLUX Kontext",
      "reason": "选择这条提示词的原因说明"
    },
    {
      "chinese": "中文描述便于阅读",
      "english": "English prompt for FLUX Kontext", 
      "reason": "选择这条提示词的原因说明"
    }
  ]
}
"""
        
        # 构建用户内容
        contents = []
        
        # 添加文本输入（如果有的话）
        if user_input:
            contents.append(f"用户输入: {user_input}")
        
        # 如果有图片输入，添加图片到内容中
        if input_image and input_image_mime_type:
            try:
                from google.genai import types
                image_part = types.Part.from_bytes(data=input_image, mime_type=input_image_mime_type)
                contents.append(image_part)
            except ImportError:
                # 如果导入失败，跳过图片处理
                pass
        
        # 如果既没有文本也没有图片，添加默认提示
        if not contents:
            contents.append("请生成通用的图像生成提示词")
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=genai.types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=1.0,
                    response_mime_type='application/json',
                    safety_settings=[
                        genai.types.SafetySetting(
                            category=genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                            threshold=genai.types.HarmBlockThreshold.OFF
                        ),
                        genai.types.SafetySetting(
                            category=genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                            threshold=genai.types.HarmBlockThreshold.OFF
                        ),
                        genai.types.SafetySetting(
                            category=genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                            threshold=genai.types.HarmBlockThreshold.OFF
                        ),
                        genai.types.SafetySetting(
                            category=genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                            threshold=genai.types.HarmBlockThreshold.OFF
                        ),
                        genai.types.SafetySetting(
                            category=genai.types.HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                            threshold=genai.types.HarmBlockThreshold.OFF
                        )
                    ]
                )
            )
            
            # 解析JSON响应
            result = json.loads(response.text)
            prompts_data = result.get('prompts', [])
            
            # 验证和处理提示词数据
            prompts = []
            for prompt_obj in prompts_data:
                if isinstance(prompt_obj, dict) and all(key in prompt_obj for key in ['chinese', 'english', 'reason']):
                    prompts.append({
                        'chinese': prompt_obj['chinese'],
                        'english': prompt_obj['english'],
                        'reason': prompt_obj['reason']
                    })
                elif isinstance(prompt_obj, str):
                    # 兼容旧格式
                    prompts.append({
                        'chinese': prompt_obj,
                        'english': prompt_obj,
                        'reason': '基础提示词选项'
                    })
            
            return prompts
                
        except Exception as e:
            # 抛出异常，让上层处理
            raise Exception(f"Gemini API调用失败: {str(e)}")

# 创建全局实例
# 使用延迟初始化以避免在导入时就要求环境变量
gemini_service = None

def get_gemini_service():
    """
    获取Gemini服务实例，使用延迟初始化
    """
    global gemini_service
    if gemini_service is None:
        try:
            gemini_service = GeminiService()
        except ValueError as e:
            raise Exception(f"Gemini服务初始化失败: {str(e)}")
    return gemini_service


# ==================== 图像生成服务抽象层 ====================

class ImageGenerationService(ABC):
    """
    图像生成服务抽象基类
    定义统一的图像生成接口，支持多种模型切换
    """

    @abstractmethod
    def generate_image(self, prompt: str, input_image: Optional[Union[bytes, Image.Image]] = None,
                      **kwargs) -> Dict[str, Any]:
        """
        生成图像的抽象方法

        Args:
            prompt: 文本提示词
            input_image: 可选的输入图像（用于图生图）
            **kwargs: 其他模型特定参数

        Returns:
            Dict[str, Any]: 统一格式的响应
            {
                'success': bool,
                'task_id': str,  # 任务ID（如果是异步）
                'image_data': str,  # base64编码的图像数据（如果是同步）
                'polling_url': str,  # 轮询URL（如果是异步）
                'message': str  # 错误信息或状态信息
            }
        """
        pass

    @abstractmethod
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        查询任务状态的抽象方法

        Args:
            task_id: 任务ID

        Returns:
            Dict[str, Any]: 任务状态信息
            {
                'success': bool,
                'status': str,  # pending, running, completed, failed
                'result': Dict,  # 结果数据
                'error': str  # 错误信息
            }
        """
        pass

    @abstractmethod
    def get_model_config(self) -> Dict[str, Any]:
        """
        获取模型配置信息

        Returns:
            Dict[str, Any]: 模型配置
            {
                'name': str,
                'display_name': str,
                'parameters': Dict  # 可配置参数
            }
        """
        pass


class NanoBananaService(ImageGenerationService):
    """
    Nano Banana Pro (Gemini 3 Pro Image Preview) 图像生成服务
    支持原生 4K 生成、多种长宽比和分辨率选择
    """

    def __init__(self):
        # 使用专用的 Nano Banana API 密钥
        self.api_key = os.getenv('NANO_BANANA_API_KEY')
        if not self.api_key:
            raise ValueError("NANO_BANANA_API_KEY environment variable is required")

        # 初始化 Gemini 客户端
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "gemini-3-pro-image-preview"

    def generate_image(self, prompt: str, input_image: Optional[Union[bytes, Image.Image]] = None,
                      **kwargs) -> Dict[str, Any]:
        """
        使用 Nano Banana 生成图像
        """
        try:
            # 构建内容列表
            contents = [prompt]

            # 处理输入图像
            if input_image is not None:
                if isinstance(input_image, bytes):
                    # 如果是字节数据，转换为PIL Image
                    pil_image = Image.open(BytesIO(input_image))
                    contents.append(pil_image)
                elif isinstance(input_image, Image.Image):
                    # 如果已经是PIL Image，直接使用
                    contents.append(input_image)
                else:
                    return {
                        'success': False,
                        'message': '不支持的图像格式'
                    }

            # 构建配置对象
            config_params = {
                'safety_settings': [
                    genai.types.SafetySetting(
                        category=genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold=genai.types.HarmBlockThreshold.OFF
                    ),
                    genai.types.SafetySetting(
                        category=genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold=genai.types.HarmBlockThreshold.OFF
                    ),
                    genai.types.SafetySetting(
                        category=genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold=genai.types.HarmBlockThreshold.OFF
                    ),
                    genai.types.SafetySetting(
                        category=genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold=genai.types.HarmBlockThreshold.OFF
                    ),
                    genai.types.SafetySetting(
                        category=genai.types.HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                        threshold=genai.types.HarmBlockThreshold.OFF
                    )
                ]
            }

            # 添加 imageConfig 支持 (Nano Banana Pro 新功能)
            aspect_ratio = kwargs.get('aspect_ratio')
            image_size = kwargs.get('image_size')

            if aspect_ratio or image_size:
                image_config_params = {}
                if aspect_ratio and aspect_ratio != 'auto':
                    image_config_params['aspect_ratio'] = aspect_ratio
                if image_size:
                    image_config_params['image_size'] = image_size

                # 使用 types.ImageConfig 类 (google-genai >= 1.52.0)
                if image_config_params:
                    config_params['image_config'] = genai.types.ImageConfig(**image_config_params)

            # 添加 Google Search 支持 (Nano Banana Pro 新功能)
            # 模型会自动决定是否使用搜索，无需用户手动控制
            google_search_tool = genai.types.Tool(
                google_search=genai.types.GoogleSearch()
            )
            config_params['tools'] = [google_search_tool]

            # 调用 Gemini API
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=genai.types.GenerateContentConfig(**config_params)
            )

            # 处理响应
            for part in response.candidates[0].content.parts:
                if part.text is not None:
                    # 如果有文本输出，记录日志
                    print(f"Nano Banana 文本输出: {part.text}")
                elif part.inline_data is not None:
                    # 返回图像数据
                    image_data = part.inline_data.data
                    # 确保返回的是 base64 字符串
                    if isinstance(image_data, bytes):
                        image_data = base64.b64encode(image_data).decode('utf-8')

                    return {
                        'success': True,
                        'image_data': image_data,  # base64 编码的图像字符串
                        'format': 'base64',
                        'message': '图像生成成功'
                    }

            return {
                'success': False,
                'message': '未生成图像数据'
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'Nano Banana 生成失败: {str(e)}'
            }

    def get_task_status(self, _task_id: str) -> Dict[str, Any]:
        """
        Nano Banana 是同步生成，不需要轮询
        """
        return {
            'success': False,
            'message': 'Nano Banana 不支持异步任务查询'
        }

    def get_model_config(self) -> Dict[str, Any]:
        """
        获取 Nano Banana Pro 模型配置
        """
        return {
            'name': 'nano-banana',
            'display_name': 'Nano Banana Pro (Gemini 3 Pro Image)',
            'description': '支持原生 4K 生成、文生图、图生图、多图融合的专业级对话式图像生成模型',
            'sync': True,  # 同步生成
            'parameters': {
                'prompt': {
                    'type': 'text',
                    'required': True,
                    'description': '图像生成或编辑的文本描述'
                },
                'input_image': {
                    'type': 'file',
                    'required': False,
                    'description': '输入图像（用于图生图编辑）',
                    'accept': 'image/*'
                },
                'aspect_ratio': {
                    'type': 'select',
                    'required': False,
                    'description': '输出图像的长宽比',
                    'options': ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
                    'default': '1:1'
                },
                'image_size': {
                    'type': 'select',
                    'required': False,
                    'description': '输出图像的分辨率等级',
                    'options': ['1K', '2K', '4K'],
                    'default': '1K'
                }
            }
        }


class FluxService(ImageGenerationService):
    """
    FLUX Kontext Pro 图像生成服务（保持现有功能）
    """

    def __init__(self):
        # 使用现有的 BFL API 密钥
        self.api_key = os.getenv('BFL_API_KEY')
        if not self.api_key:
            raise ValueError("BFL_API_KEY environment variable is required")

        self.api_base = "https://api.bfl.ai/v1"
        self.endpoint = f"{self.api_base}/flux-kontext-pro"
        self.status_endpoint = f"{self.api_base}/get_result"

    def generate_image(self, prompt: str, input_image: Optional[Union[bytes, Image.Image]] = None,
                      **kwargs) -> Dict[str, Any]:
        """
        使用 FLUX Kontext Pro 生成图像
        """
        try:
            # 构建请求参数
            payload = {
                'prompt': prompt,
                'output_format': kwargs.get('output_format', 'jpeg'),
                'safety_tolerance': int(kwargs.get('safety_tolerance', 2)),
                'prompt_upsampling': kwargs.get('prompt_upsampling', False)
            }

            # 可选参数
            if kwargs.get('aspect_ratio'):
                payload['aspect_ratio'] = kwargs['aspect_ratio']

            # 处理输入图像
            if input_image is not None:
                if isinstance(input_image, Image.Image):
                    # 将 PIL Image 转换为 base64
                    buffer = BytesIO()
                    input_image.save(buffer, format='PNG')
                    image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    payload['input_image'] = f"data:image/png;base64,{image_data}"
                elif isinstance(input_image, bytes):
                    # 假设是已经编码的图像数据
                    image_data = base64.b64encode(input_image).decode('utf-8')
                    payload['input_image'] = f"data:image/png;base64,{image_data}"

            # 种子参数
            if kwargs.get('seed'):
                try:
                    payload['seed'] = int(kwargs['seed'])
                except ValueError:
                    pass

            headers = {
                'Content-Type': 'application/json',
                'x-key': self.api_key
            }

            # 调用 FLUX API
            response = requests.post(self.endpoint, json=payload, headers=headers)

            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'task_id': result.get('id'),
                    'polling_url': result.get('polling_url'),
                    'message': '任务已提交'
                }
            else:
                error_msg = response.json().get('detail', '图像生成请求失败')
                return {
                    'success': False,
                    'message': f'FLUX API调用失败: {error_msg}'
                }

        except Exception as e:
            return {
                'success': False,
                'message': f'FLUX 生成失败: {str(e)}'
            }

    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        查询 FLUX 任务状态
        """
        try:
            headers = {'x-key': self.api_key}
            response = requests.get(f"{self.status_endpoint}?id={task_id}", headers=headers)

            if response.status_code == 200:
                result = response.json()
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

                task_data = {
                    'success': True,
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

                return task_data
            else:
                return {
                    'success': False,
                    'message': f'状态查询失败: HTTP {response.status_code}'
                }

        except Exception as e:
            return {
                'success': False,
                'message': f'状态查询异常: {str(e)}'
            }

    def get_model_config(self) -> Dict[str, Any]:
        """
        获取 FLUX 模型配置
        """
        return {
            'name': 'flux',
            'display_name': 'FLUX Kontext Pro',
            'description': '高质量的图像生成和编辑模型，支持异步处理',
            'sync': False,  # 异步生成
            'parameters': {
                'prompt': {
                    'type': 'text',
                    'required': True,
                    'description': '图像生成或编辑的文本描述'
                },
                'aspect_ratio': {
                    'type': 'select',
                    'required': False,
                    'options': ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
                    'default': 'auto',
                    'description': '图像宽高比'
                },
                'output_format': {
                    'type': 'select',
                    'required': False,
                    'options': ['jpeg', 'png'],
                    'default': 'jpeg',
                    'description': '输出格式'
                },
                'safety_tolerance': {
                    'type': 'slider',
                    'required': False,
                    'min': 1,
                    'max': 5,
                    'default': 2,
                    'description': '安全等级'
                },
                'seed': {
                    'type': 'text',
                    'required': False,
                    'description': '随机种子（可选）'
                },
                'prompt_upsampling': {
                    'type': 'boolean',
                    'required': False,
                    'default': False,
                    'description': '提示词增强'
                },
                'input_image': {
                    'type': 'file',
                    'required': False,
                    'description': '输入图像（用于图生图编辑）',
                    'accept': 'image/*'
                }
            }
        }


class ImageGenerationServiceFactory:
    """
    图像生成服务工厂类
    """

    _services = {}

    @classmethod
    def get_service(cls, model_type: str = 'nano-banana') -> ImageGenerationService:
        """
        获取图像生成服务实例

        Args:
            model_type: 模型类型 ('nano-banana' 或 'flux')

        Returns:
            ImageGenerationService: 对应的服务实例
        """
        if model_type not in cls._services:
            if model_type == 'nano-banana':
                cls._services[model_type] = NanoBananaService()
            elif model_type == 'flux':
                cls._services[model_type] = FluxService()
            else:
                raise ValueError(f"不支持的模型类型: {model_type}")

        return cls._services[model_type]

    @classmethod
    def get_available_models(cls) -> List[Dict[str, Any]]:
        """
        获取所有可用的模型配置
        """
        models = []
        for model_type in ['nano-banana', 'flux']:
            try:
                service = cls.get_service(model_type)
                config = service.get_model_config()
                models.append(config)
            except Exception as e:
                print(f"获取模型 {model_type} 配置失败: {str(e)}")

        return models


# 全局服务工厂实例
image_generation_factory = ImageGenerationServiceFactory()
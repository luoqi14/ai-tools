// API基础配置 - 通过环境变量配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8003';

// 工具数据类型定义
export interface Tool {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  url?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}

// 图像生成相关类型
export interface ImageGenerationTask {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: { image_url: string };
  error?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  aspect_ratio?: string;
  output_format?: string;
  safety_tolerance?: number;
  seed?: string;
  input_image?: File;
  prompt_upsampling?: boolean;
}

// 美图处理相关类型
export interface MeituProcessingTask {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: { processed_image: string };
  error?: string;
}

export interface MeituProcessingRequest {
  image: File;
  // 基础参数
  [key: string]: File | string | number | number[] | boolean | object;
}

// 新增：URL方式的美图处理请求类型
export interface MeituProcessingUrlRequest {
  imageUrl: string;
  // 基础参数
  [key: string]: string | number | number[] | boolean | object;
}

export interface ParameterConfig {
  type: 'slider' | 'select' | 'array_slider' | 'array_select';
  min?: number;
  max?: number;
  options?: (string | number)[];
  default: string | number | number[] | boolean;
  label: string;
}

export interface ParameterGroup {
  name: string;
  parameters: Record<string, ParameterConfig>;
}

export interface PeopleType {
  age: number[];
  gender: number;
  key: string;
  name: string;
}

export interface MeituFunctionsResponse {
  parameter_groups: Record<string, ParameterGroup>;
  people_types: PeopleType[];
}

// API调用函数
export const api = {
  // 获取所有工具
  async getTools(): Promise<Tool[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools`);
      const result: ApiResponse<Tool[]> = await response.json();
      
      if (!result.success) {
        console.error('获取工具列表失败:', result.message);
        return [];
      }
      
      return result.data || [];
    } catch (error) {
      console.error('获取工具列表网络错误:', error);
      return [];
    }
  },

  // 获取单个工具信息
  async getTool(id: string): Promise<Tool | null> {
    const response = await fetch(`${API_BASE_URL}/api/tools/${id}`);
    const result: ApiResponse<Tool> = await response.json();
    
    if (!result.success) {
      return null;
    }
    
    return result.data || null;
  },

  // 获取工具分类
  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools/categories`);
      const result: ApiResponse<string[]> = await response.json();
      
      if (!result.success) {
        console.error('获取分类失败:', result.message);
        return [];
      }
      
      return result.data || [];
    } catch (error) {
      console.error('获取分类网络错误:', error);
      return [];
    }
  },

  // 图像生成
  async generateImage(data: ImageGenerationRequest): Promise<{ task_id: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append("prompt", data.prompt);
      
      if (data.aspect_ratio) formData.append("aspect_ratio", data.aspect_ratio);
      if (data.output_format) formData.append("output_format", data.output_format);
      if (data.safety_tolerance !== undefined) formData.append("safety_tolerance", data.safety_tolerance.toString());
      if (data.seed) formData.append("seed", data.seed);
      if (data.prompt_upsampling !== undefined) formData.append("prompt_upsampling", data.prompt_upsampling.toString());
      if (data.input_image) formData.append("input_image", data.input_image);

      const response = await fetch(`${API_BASE_URL}/api/image-generation/generate`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!result.success) {
        return { task_id: '', error: result.message || '图像生成失败' };
      }
      
      return result.data;
    } catch (error) {
      return { task_id: '', error: error instanceof Error ? error.message : '网络错误' };
    }
  },

  // 查询任务状态
  async getTaskStatus(taskId: string): Promise<ImageGenerationTask | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/image-generation/status/${taskId}`);
      
      if (!response.ok) {
        console.warn(`状态查询HTTP错误: ${response.status}`);
        return null;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.warn('状态查询失败:', result.message);
        return null;
      }
      
      return result.data;
    } catch (error) {
      console.error('状态查询网络错误:', error);
      return null;
    }
  },

  // 获取必应背景图片
  getBingImageUrl(): string {
    const timestamp = Date.now();
    return `${API_BASE_URL}/api/bing-image?t=${timestamp}`;
  },

  // 美图处理相关API
  async getMeituFunctions(): Promise<MeituFunctionsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meitu-processing/functions`);
      const result = await response.json();
      
      if (!result.success) {
        console.error('获取处理功能失败:', result.message);
        return {
          parameter_groups: {},
          people_types: []
        };
      }
      
      return result.data;
    } catch (error) {
      console.error('获取处理功能网络错误:', error);
      return {
        parameter_groups: {},
        people_types: []
      };
    }
  },

  async processMeituImage(data: MeituProcessingRequest): Promise<{ task_id: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append("image", data.image);
      
      // 添加所有可选参数
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'image' && value !== undefined) {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'object' && value !== null) {
            formData.append(key, JSON.stringify(value));
          }
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/meitu-processing/process`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!result.success) {
        return { task_id: '', error: result.message || '美图处理失败' };
      }
      
      return result.data;
    } catch (error) {
      return { task_id: '', error: error instanceof Error ? error.message : '网络错误' };
    }
  },

  // 使用预设ID处理图片
  async processMeituImageWithPreset(imageFile: File, presetId: string = 'MTyunxiu1c68684d55'): Promise<{ task_id: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("preset_id", presetId);

      const response = await fetch(`${API_BASE_URL}/api/meitu-processing/process-preset`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!result.success) {
        return { task_id: '', error: result.message || '预设ID处理失败' };
      }
      
      return result.data;
    } catch (error) {
      return { task_id: '', error: error instanceof Error ? error.message : '网络错误' };
    }
  },

  // 新增：使用URL方式的全参数处理
  async processMeituImageWithUrl(data: MeituProcessingUrlRequest): Promise<{ task_id: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meitu-processing/process-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      // 检查HTTP状态码和响应内容
      if (!response.ok || !result.success) {
        return { task_id: '', error: result.message || `HTTP ${response.status}: 美图处理失败` };
      }
      
      return result.data;
    } catch (error) {
      return { task_id: '', error: error instanceof Error ? error.message : '网络错误' };
    }
  },

  // 新增：使用URL方式的预设ID处理
  async processMeituImageWithPresetUrl(imageUrl: string, presetId: string = 'MTyunxiu1c68684d55'): Promise<{ task_id: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meitu-processing/process-preset-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          preset_id: presetId,
        }),
      });

      const result = await response.json();
      
      // 检查HTTP状态码和响应内容
      if (!response.ok || !result.success) {
        return { task_id: '', error: result.message || `HTTP ${response.status}: 预设ID处理失败` };
      }
      
      return result.data;
    } catch (error) {
      return { task_id: '', error: error instanceof Error ? error.message : '网络错误' };
    }
  },

  async getMeituTaskStatus(taskId: string): Promise<MeituProcessingTask | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meitu-processing/status/${taskId}`);
      
      if (!response.ok) {
        console.warn(`状态查询HTTP错误: ${response.status}`);
        return null;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.warn('状态查询失败:', result.message);
        return null;
      }
      
      return result.data;
    } catch (error) {
      console.error('状态查询网络错误:', error);
      return null;
    }
  },

  async previewMeituProcessing(data: MeituProcessingRequest): Promise<{ preview_image?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append("image", data.image);
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'image' && value !== undefined) {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'object' && value !== null) {
            formData.append(key, JSON.stringify(value));
          }
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/meitu-processing/preview`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!result.success) {
        return { error: result.message || '预览失败' };
      }
      
      return { preview_image: result.data.preview_image };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '网络错误' };
    }
  },
};
 
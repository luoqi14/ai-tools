// API基础配置 - 直接连接后端
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
  steps?: number;
  guidance?: number;
  safety_tolerance?: number;
  seed?: string;
  input_image?: File;
}

// API调用函数
export const api = {
  // 获取所有工具
  async getTools(): Promise<Tool[]> {
    const response = await fetch(`${API_BASE_URL}/api/tools`);
    const result: ApiResponse<Tool[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '获取工具列表失败');
    }
    
    return result.data || [];
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
    const response = await fetch(`${API_BASE_URL}/api/tools/categories`);
    const result: ApiResponse<string[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '获取分类失败');
    }
    
    return result.data || [];
  },

  // 图像生成
  async generateImage(data: ImageGenerationRequest): Promise<{ task_id: string }> {
    const formData = new FormData();
    formData.append("prompt", data.prompt);
    
    if (data.aspect_ratio) formData.append("aspect_ratio", data.aspect_ratio);
    if (data.output_format) formData.append("output_format", data.output_format);
    if (data.steps) formData.append("steps", data.steps.toString());
    if (data.guidance) formData.append("guidance", data.guidance.toString());
    if (data.safety_tolerance) formData.append("safety_tolerance", data.safety_tolerance.toString());
    if (data.seed) formData.append("seed", data.seed);
    if (data.input_image) formData.append("input_image", data.input_image);

    const response = await fetch(`${API_BASE_URL}/api/image-generation/generate`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '图像生成失败');
    }
    
    return result.data;
  },

  // 查询任务状态
  async getTaskStatus(taskId: string): Promise<ImageGenerationTask> {
    const response = await fetch(`${API_BASE_URL}/api/image-generation/status/${taskId}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '查询任务状态失败');
    }
    
    return result.data;
  },

  // 获取必应背景图片
  getBingImageUrl(): string {
    const timestamp = Date.now();
    return `${API_BASE_URL}/api/bing-image?t=${timestamp}`;
  }
};

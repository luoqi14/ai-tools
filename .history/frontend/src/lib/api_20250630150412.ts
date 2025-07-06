// API基础配置
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-domain.com/api'
  : 'http://localhost:8003/api';

// 工具数据类型定义
export interface Tool {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}

// API调用函数
export const api = {
  // 获取所有工具
  async getTools(): Promise<Tool[]> {
    const response = await fetch(`${API_BASE_URL}/tools`);
    const result: ApiResponse<Tool[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '获取工具列表失败');
    }
    
    return result.data || [];
  },

  // 获取单个工具信息
  async getTool(id: string): Promise<Tool | null> {
    const response = await fetch(`${API_BASE_URL}/tools/${id}`);
    const result: ApiResponse<Tool> = await response.json();
    
    if (!result.success) {
      return null;
    }
    
    return result.data || null;
  },

  // 获取工具分类
  async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/tools/categories`);
    const result: ApiResponse<string[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '获取分类失败');
    }
    
    return result.data || [];
  }
};

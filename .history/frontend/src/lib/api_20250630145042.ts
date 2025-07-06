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
    try {
      const response = await fetch(`${API_BASE_URL}/tools`);
      const result: ApiResponse<Tool[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '获取工具列表失败');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('获取工具列表失败:', error);
      // 返回默认工具数据
      return getDefaultTools();
    }
  },

  // 获取单个工具信息
  async getTool(id: string): Promise<Tool | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/tools/${id}`);
      const result: ApiResponse<Tool> = await response.json();
      
      if (!result.success) {
        return null;
      }
      
      return result.data || null;
    } catch (error) {
      console.error('获取工具信息失败:', error);
      return null;
    }
  },

  // 获取工具分类
  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tools/categories`);
      const result: ApiResponse<string[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '获取分类失败');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('获取分类失败:', error);
      return ['text', 'media', 'development', 'analysis'];
    }
  }
};

// 默认工具数据（离线模式）
function getDefaultTools(): Tool[] {
  return [
    {
      id: 'text-processor',
      name: '文本处理',
      description: '文本格式化、清理和转换工具',
      icon: 'FileText',
      category: 'text',
    },
    {
      id: 'image-processor',
      name: '图像处理',
      description: '图像压缩、格式转换和基础编辑',
      icon: 'Image',
      category: 'media',
    },
    {
      id: 'code-generator',
      name: '代码生成',
      description: 'AI辅助代码生成和优化工具',
      icon: 'Code',
      category: 'development',
    },
    {
      id: 'data-analyzer',
      name: '数据分析',
      description: '数据可视化和统计分析工具',
      icon: 'BarChart',
      category: 'analysis',
    },
    {
      id: 'api-tester',
      name: 'API测试',
      description: 'RESTful API测试和调试工具',
      icon: 'Zap',
      category: 'development',
    },
    {
      id: 'json-formatter',
      name: 'JSON格式化',
      description: 'JSON数据格式化和验证工具',
      icon: 'Braces',
      category: 'text',
    }
  ];
} 
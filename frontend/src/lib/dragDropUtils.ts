/**
 * 拖拽功能工具函数
 * 提供性能监控、错误处理和兼容性检查
 */

// 性能监控接口
interface PerformanceMetrics {
  dragStartTime: number;
  dragEndTime: number;
  duration: number;
  imageLoadTime?: number;
}

// 拖拽事件类型
interface DragDropEvent {
  type: 'drag_start' | 'drag_end' | 'drop_success' | 'drop_error';
  timestamp: number;
  data?: unknown;
  error?: Error;
}

// 全局性能监控器
class DragDropPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private events: DragDropEvent[] = [];
  private maxHistorySize = 100;

  // 开始监控拖拽操作
  startDragMonitoring(): number {
    const startTime = performance.now();
    this.addEvent({
      type: 'drag_start',
      timestamp: startTime,
    });
    return startTime;
  }

  // 结束监控拖拽操作
  endDragMonitoring(startTime: number, success: boolean = true, error?: Error): void {
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.metrics.push({
      dragStartTime: startTime,
      dragEndTime: endTime,
      duration,
    });

    this.addEvent({
      type: success ? 'drop_success' : 'drop_error',
      timestamp: endTime,
      error,
    });

    // 保持历史记录大小
    if (this.metrics.length > this.maxHistorySize) {
      this.metrics.shift();
    }

    // 性能警告
    if (duration > 1000) {
      console.warn(`拖拽操作耗时过长: ${duration.toFixed(2)}ms`);
    }
  }

  // 添加事件记录
  private addEvent(event: DragDropEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxHistorySize) {
      this.events.shift();
    }
  }

  // 获取性能统计
  getPerformanceStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const durations = this.metrics.map(m => m.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    return {
      totalOperations: this.metrics.length,
      averageDuration: avgDuration,
      maxDuration,
      minDuration,
      recentEvents: this.events.slice(-10),
    };
  }

  // 重置监控数据
  reset(): void {
    this.metrics = [];
    this.events = [];
  }
}

// 全局监控器实例
export const performanceMonitor = new DragDropPerformanceMonitor();

// 错误处理工具
export class DragDropErrorHandler {
  private static errorCounts: Map<string, number> = new Map();
  private static maxRetries = 3;

  // 处理拖拽错误
  static handleError(error: Error, context: string, retryCallback?: () => void): void {
    const errorKey = `${context}:${error.message}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    
    this.errorCounts.set(errorKey, currentCount + 1);

    console.error(`拖拽错误 [${context}]:`, error);

    // 记录错误到性能监控器
    performanceMonitor.endDragMonitoring(performance.now(), false, error);

    // 重试逻辑
    if (currentCount < this.maxRetries && retryCallback) {
      console.log(`尝试重试 (${currentCount + 1}/${this.maxRetries})`);
      setTimeout(retryCallback, 1000 * (currentCount + 1)); // 递增延迟
    } else if (currentCount >= this.maxRetries) {
      console.error(`重试次数已达上限，停止重试: ${errorKey}`);
    }
  }

  // 重置错误计数
  static resetErrorCounts(): void {
    this.errorCounts.clear();
  }

  // 获取错误统计
  static getErrorStats() {
    return Array.from(this.errorCounts.entries()).map(([key, count]) => ({
      error: key,
      count,
    }));
  }
}

// 兼容性检查工具
export class CompatibilityChecker {
  // 检查浏览器是否支持必要的API
  static checkBrowserSupport(): {
    supported: boolean;
    missingFeatures: string[];
  } {
    const missingFeatures: string[] = [];

    // 检查必要的API
    if (!window.File) missingFeatures.push('File API');
    if (!window.FileReader) missingFeatures.push('FileReader API');
    if (!window.URL || !window.URL.createObjectURL) missingFeatures.push('URL API');
    if (!window.performance) missingFeatures.push('Performance API');

    // 检查Canvas支持
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) missingFeatures.push('Canvas 2D Context');
    } catch {
      missingFeatures.push('Canvas API');
    }

    // 检查触摸事件支持
    if (!('ontouchstart' in window) && !window.navigator.maxTouchPoints) {
      // 这不是错误，只是信息
      console.info('触摸事件支持检测：可能不支持触摸操作');
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures,
    };
  }

  // 检查设备类型
  static getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      isMobile,
      isTablet,
      isTouchDevice,
      userAgent,
      platform: navigator.platform,
    };
  }
}

// 图片处理工具
export class ImageUtils {
  // 验证图片文件
  static validateImageFile(file: File): {
    valid: boolean;
    error?: string;
  } {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: '文件类型不是图片' };
    }

    // 检查文件大小 (10MB限制)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: '图片文件过大，请选择小于10MB的图片' };
    }

    // 检查文件名
    if (!file.name || file.name.length === 0) {
      return { valid: false, error: '无效的文件名' };
    }

    return { valid: true };
  }

  // 生成缩略图
  static async generateThumbnail(
    file: File, 
    maxWidth: number = 200, 
    maxHeight: number = 200,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }

      img.onload = () => {
        // 计算缩略图尺寸
        const { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        const newWidth = width * ratio;
        const newHeight = height * ratio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // 绘制缩略图
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // 转换为数据URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(thumbnailUrl);
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// 调试工具
export class DebugUtils {
  private static debugMode = process.env.NODE_ENV === 'development';

  // 调试日志
  static log(message: string, data?: unknown): void {
    if (this.debugMode) {
      console.log(`[DragDrop Debug] ${message}`, data || '');
    }
  }

  // 性能测量
  static measurePerformance<T>(
    name: string, 
    fn: () => T | Promise<T>
  ): T | Promise<T> {
    if (!this.debugMode) {
      return fn();
    }

    const start = performance.now();
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
      });
    } else {
      const end = performance.now();
      console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
  }

  // 导出调试信息
  static exportDebugInfo() {
    return {
      performanceStats: performanceMonitor.getPerformanceStats(),
      errorStats: DragDropErrorHandler.getErrorStats(),
      browserSupport: CompatibilityChecker.checkBrowserSupport(),
      deviceInfo: CompatibilityChecker.getDeviceInfo(),
      timestamp: new Date().toISOString(),
    };
  }
}

// 初始化兼容性检查
export function initializeDragDropSystem(): {
  success: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // 检查浏览器支持
  const { supported, missingFeatures } = CompatibilityChecker.checkBrowserSupport();
  
  if (!supported) {
    console.error('浏览器不支持必要的功能:', missingFeatures);
    return { success: false, warnings: missingFeatures };
  }

  // 检查设备信息
  const deviceInfo = CompatibilityChecker.getDeviceInfo();
  DebugUtils.log('设备信息', deviceInfo);

  if (deviceInfo.isMobile && !deviceInfo.isTouchDevice) {
    warnings.push('移动设备可能不支持触摸操作');
  }

  console.log('拖拽系统初始化成功');
  return { success: true, warnings };
}

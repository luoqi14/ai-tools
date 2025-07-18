import React from "react";

interface HistoryImageData {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  timestamp: number;
  file?: File;
  originalUrl?: string;
  sourceImageId?: string;
  originalUserInput?: string;
  optimizedPrompt?: string;
  chinesePrompt?: string;
  optimizationReason?: string;
}

interface AnimatedTooltipItem {
  id: number;
  name: string;
  designation: string;
  image: string;
  customContent?: React.ReactNode;
}

// 格式化时间
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 截断长文本
const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 创建自定义tooltip内容
const createTooltipContent = (imageData: HistoryImageData) => {
  const hasDetailedInfo = imageData.originalUserInput || imageData.optimizedPrompt || imageData.optimizationReason;

  return (
    <div className="space-y-2 text-left">
      {/* 生成时间 */}
      <div className="text-white/60 text-xs">
        {formatDate(imageData.timestamp)}
      </div>

      {/* 原始用户输入 */}
      {imageData.originalUserInput && (
        <div>
          <div className="text-blue-400 font-medium mb-1 text-xs">原始输入：</div>
          <div className="text-white text-xs leading-relaxed break-words">
            {truncateText(imageData.originalUserInput, 60)}
          </div>
        </div>
      )}

      {/* 优化后的提示词 */}
      {imageData.optimizedPrompt && imageData.optimizedPrompt !== imageData.originalUserInput && (
        <div>
          <div className="text-green-400 font-medium mb-1 text-xs">优化后提示词：</div>
          <div className="text-white text-xs leading-relaxed break-words">
            {truncateText(imageData.optimizedPrompt, 60)}
          </div>
        </div>
      )}

      {/* 优化原因 */}
      {imageData.optimizationReason && (
        <div>
          <div className="text-yellow-400 font-medium mb-1 text-xs">优化说明：</div>
          <div className="text-white/80 text-xs leading-relaxed break-words">
            {truncateText(imageData.optimizationReason, 80)}
          </div>
        </div>
      )}

      {/* 如果没有详细信息，显示基本提示词 */}
      {!hasDetailedInfo && (
        <div>
          <div className="text-gray-400 font-medium mb-1 text-xs">提示词：</div>
          <div className="text-white text-xs leading-relaxed break-words">
            {truncateText(imageData.prompt, 60)}
          </div>
        </div>
      )}

      {/* 图片来源信息 */}
      {imageData.sourceImageId && (
        <div className="pt-1 border-t border-white/10">
          <div className="text-purple-400 text-xs">
            基于历史图片生成
          </div>
        </div>
      )}
    </div>
  );
};

// 将历史图片数据转换为AnimatedTooltip所需的格式
export const convertHistoryImageToTooltipItem = (imageData: HistoryImageData): AnimatedTooltipItem => {
  return {
    id: parseInt(imageData.id.replace(/\D/g, '')) || Date.now(), // 提取数字作为id，如果没有则使用时间戳
    name: imageData.prompt,
    designation: formatDate(imageData.timestamp),
    image: imageData.thumbnailUrl || imageData.url,
    customContent: createTooltipContent(imageData),
  };
};

// 批量转换历史图片数据
export const convertHistoryImagesToTooltipItems = (historyImages: HistoryImageData[]): AnimatedTooltipItem[] => {
  return historyImages.map(convertHistoryImageToTooltipItem);
};

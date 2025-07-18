"use client";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  Card,
} from "@/components/ui/card";
import { MagicCard } from "@/components/magicui/magic-card";

interface PromptData {
  chinese: string;
  english: string;
  reason: string;
}

interface PromptSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompts: string[] | PromptData[];
  onSelect: (selectedPrompt: string) => void;
  originalInput: string;
}

export function PromptSelectionDialog({
  open,
  onOpenChange,
  prompts,
  onSelect,
  originalInput,
}: PromptSelectionDialogProps) {
  const handleSelect = (prompt: string) => {
    onSelect(prompt);
    onOpenChange(false);
  };



  // 处理不同格式的提示词数据
  const getPromptDisplay = (prompt: string | PromptData) => {
    if (typeof prompt === "string") {
      return {
        chinese: prompt,
        english: prompt,
        reason: "基础提示词选项",
      };
    }
    return prompt;
  };

  const getPromptValue = (prompt: string | PromptData) => {
    if (typeof prompt === "string") {
      return prompt;
    }
    return prompt.english;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            选择优化后的提示词
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {prompts.map((prompt, index) => {
            const promptData = getPromptDisplay(prompt);
            const promptValue = getPromptValue(prompt);

            return (
              <Card
                key={index}
                className="p-0 w-full shadow-none border-none cursor-pointer"
                onClick={() => handleSelect(promptValue)}
              >
                <MagicCard gradientColor="#D9D9D955">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <CardDescription className="text-sm leading-relaxed text-gray-600 font-mono bg-gray-50 p-2 rounded">
                        <div>{promptData.english}</div>
                        <div className="text-gray-500">
                          {promptData.chinese}
                        </div>
                      </CardDescription>
                      <CardDescription className="text-sm leading-relaxed text-gray-400">
                        {promptData.reason}
                      </CardDescription>
                    </div>
                  </CardContent>
                </MagicCard>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSelect(originalInput)}
          >
            使用原始输入
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { CameraCapture } from "@/components/ui/camera-capture";
import { Camera, FolderOpen, X } from "lucide-react";

interface ImagePickerProps {
  onImageSelect: (file: File) => void;
  trigger: React.ReactNode;
}

type PickerMode = "menu" | "camera" | "gallery";

export function ImagePicker({ onImageSelect, trigger }: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>("menu");

  const handleImageCapture = (file: File) => {
    onImageSelect(file);
    setOpen(false);
    setMode("menu");
  };

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      onImageSelect(files[0]);
      setOpen(false);
      setMode("menu");
    }
  };

  const handleCancel = () => {
    setMode("menu");
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setMode("menu");
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-lg font-semibold">
              {mode === "menu" && "选择图片"}
              {mode === "camera" && "拍照"}
              {mode === "gallery" && "从相册选择"}
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              {mode === "menu" && "请选择获取图片的方式"}
              {mode === "camera" && "使用摄像头拍摄照片"}
              {mode === "gallery" && "从设备相册中选择图片"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            {mode === "menu" && (
              <div className="space-y-4">
                {/* 拍照按钮 */}
                <Button
                  className="w-full flex items-center justify-center gap-3 h-14 text-base font-medium bg-blue-600 hover:bg-blue-700"
                  onClick={() => setMode("camera")}
                >
                  <Camera className="h-6 w-6" />
                  <span>拍照</span>
                </Button>

                {/* 相册选择按钮 */}
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 h-14 text-base font-medium"
                  onClick={() => setMode("gallery")}
                >
                  <FolderOpen className="h-6 w-6" />
                  <span>从相册选择</span>
                </Button>
              </div>
            )}

            {mode === "camera" && (
              <div className="space-y-4">
                <CameraCapture
                  onCapture={handleImageCapture}
                  onCancel={handleCancel}
                />
              </div>
            )}

            {mode === "gallery" && (
              <div className="space-y-6">
                <FileUpload onChange={handleFileUpload} />
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    size="lg"
                    className="flex items-center gap-2 min-w-[100px]"
                  >
                    <X className="h-5 w-5" />
                    返回
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter className="pt-4">
            {mode === "menu" && (
              <DrawerClose asChild>
                <Button variant="outline" size="lg" className="w-full">
                  取消
                </Button>
              </DrawerClose>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

import React, { PointerEvent } from "react";
import type { TimelineAction } from "./types";
import { getClipIcon, getClipLabel } from "./utils";
import "./DragPreview.css";

// 拖拽预览组件的属性类型定义
type DragPreviewProps = {
  // 拖拽中的片段对象
  clip: TimelineAction;
  // 预览框的左侧像素位置
  left: number;
  // 预览框的顶部像素位置
  top: number;
  // 预览框的宽度
  width: number;
  // 预览框的高度
  height: number;
  // 当前拖放位置是否合法
  isDropValid: boolean;
  // 鼠标/手指拖动时的回调
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  // 拖拽释放时的回调
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
};

// 拖拽预览组件
export const DragPreview: React.FC<DragPreviewProps> = ({
  clip,
  left,
  top,
  width,
  height,
  isDropValid,
  onPointerMove,
  onPointerUp,
}) => {
  // 根据拖放是否合法切换不同的样式
  const className = `drag-preview${isDropValid ? " drag-preview-valid" : " drag-preview-invalid"}`;
  return (
    <div
      className={className}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        left,
        top,
        width,
        height,
      }}
    >
      {/* 显示片段类型图标 */}
      <div className="drag-preview-icon">{getClipIcon(clip)}</div>
      {/* 显示片段标签 */}
      <div className="drag-preview-label">{getClipLabel(clip)}</div>
    </div>
  );
};

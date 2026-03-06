import type { PointerEvent, ReactNode } from "react";
import React from "react";
import type { TimelineAction } from "./types";
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
  // 额外 className（由外部Timeline汇总后传入）
  className?: string;
  // 当前拖放位置是否合法
  isDropValid: boolean;
  // 自定义内容
  content?: ReactNode;
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
  className,
  isDropValid,
  content,
  onPointerMove,
  onPointerUp,
}) => {
  // 根据拖放是否合法切换不同的样式
  const mergedClassName = `drag-preview${isDropValid ? " drag-preview-valid" : " drag-preview-invalid"}${className ? ` ${className}` : ""}`;
  return (
    <div
      className={mergedClassName}
      data-clip-kind={String(clip.kind ?? "unknown")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        left,
        top,
        width,
        height,
      }}
    >
      {content ?? (
        <div className="drag-preview-content">
          <div className="drag-preview-label">{clip.id}</div>
        </div>
      )}
    </div>
  );
};

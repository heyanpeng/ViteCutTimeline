import React, { PointerEvent, ReactNode } from "react";
import type { TimelineAction } from "./types";
import { getClipColor } from "./utils";
import "./ClipItem.css";

/**
 * ClipItemProps 定义时间线片段的属性类型
 */
type ClipItemProps = {
  // 当前片段对象
  clip: TimelineAction;
  // 用于渲染外观的片段（可能与clip不同，比如拖动预览时）
  renderClip: TimelineAction;
  // 片段左侧的绝对像素位置
  left: number;
  // 片段顶部的绝对像素位置
  top: number;
  // 片段宽度（像素）
  width: number;
  // 片段高度（像素）
  height: number;
  // 是否被选中
  isSelected: boolean;
  // 是否是正在被拖拽的源对象
  isDraggedSource: boolean;
  // 是否被淡化显示
  isDimmed: boolean;
  // 自定义渲染内容
  content?: ReactNode;
  // 鼠标/手指按下时的回调
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  // 鼠标/手指移动时的回调
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  // 鼠标/手指抬起时的回调
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  // 点击事件回调
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  // 双击事件回调
  onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  // 修剪手柄按下时的回调（side区分左右）
  onTrimPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    side: "left" | "right",
  ) => void;
  // 修剪手柄移动时的回调
  onTrimPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  // 修剪手柄抬起时的回调
  onTrimPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
};

/**
 * 时间线片段组件
 */
export const ClipItem: React.FC<ClipItemProps> = ({
  clip,
  renderClip,
  left,
  top,
  width,
  height,
  isSelected,
  isDraggedSource,
  isDimmed,
  content,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  onDoubleClick,
  onTrimPointerDown,
  onTrimPointerMove,
  onTrimPointerUp,
}) => {
  // 根据状态拼接样式
  const className = `clip-item${isSelected ? " clip-item-selected" : ""}${isDraggedSource ? " clip-item-dragging" : ""}${isDimmed ? " clip-item-dimmed" : ""}`;

  return (
    <div
      key={clip.id}
      data-clip-id={clip.id}
      className={className}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        left,
        top,
        width,
        height,
        background: getClipColor(renderClip), // 设置片段自身的背景色
      }}
    >
      {/* 左侧修剪手柄 */}
      <div
        className="clip-item-trim-handle clip-item-trim-left"
        onPointerDown={(event) => onTrimPointerDown(event, "left")}
        onPointerMove={onTrimPointerMove}
        onPointerUp={onTrimPointerUp}
      />
      {/* 右侧修剪手柄 */}
      <div
        className="clip-item-trim-handle clip-item-trim-right"
        onPointerDown={(event) => onTrimPointerDown(event, "right")}
        onPointerMove={onTrimPointerMove}
        onPointerUp={onTrimPointerUp}
      />
      {/* 默认或自定义内容 */}
      {content ?? (
        <>
          <div className="clip-item-content">
            <div className="clip-item-label">{clip.id}</div>
          </div>
        </>
      )}
    </div>
  );
};

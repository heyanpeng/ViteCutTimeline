import React, { PointerEvent, ReactNode } from "react";
import type { TimelineAction } from "./types";
import { getClipColor } from "./utils";
import "./ClipItem.css";

type ClipItemProps = {
  clip: TimelineAction;
  renderClip: TimelineAction;
  left: number;
  top: number;
  width: number;
  height: number;
  isSelected: boolean;
  isDraggedSource: boolean;
  isDimmed: boolean;
  content?: ReactNode;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTrimPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    side: "left" | "right",
  ) => void;
  onTrimPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onTrimPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
};

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
        background: getClipColor(renderClip),
      }}
    >
      <div
        className="clip-item-trim-handle clip-item-trim-left"
        onPointerDown={(event) => onTrimPointerDown(event, "left")}
        onPointerMove={onTrimPointerMove}
        onPointerUp={onTrimPointerUp}
      />
      <div
        className="clip-item-trim-handle clip-item-trim-right"
        onPointerDown={(event) => onTrimPointerDown(event, "right")}
        onPointerMove={onTrimPointerMove}
        onPointerUp={onTrimPointerUp}
      />
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

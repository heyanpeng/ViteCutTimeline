import React, { PointerEvent } from "react";
import type { Clip } from "./types";
import { getClipColor, getClipIcon, getClipLabel } from "./utils";

type ClipItemProps = {
  clip: Clip;
  renderClip: Clip;
  left: number;
  top: number;
  width: number;
  height: number;
  isSelected: boolean;
  isDraggedSource: boolean;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
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
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  onTrimPointerDown,
  onTrimPointerMove,
  onTrimPointerUp,
}) => {
  return (
    <div
      key={clip.id}
      data-clip-id={clip.id}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius: 8,
        background: getClipColor(renderClip),
        border: "1px solid #1d4ed8",
        boxShadow: isSelected ? "0 0 0 2px #fbbf24 inset" : "none",
        boxSizing: "border-box",
        cursor: isDraggedSource ? "grabbing" : "grab",
        overflow: "hidden",
        color: "#e2e8f0",
        padding: "6px 8px",
        fontSize: 12,
        opacity: isDraggedSource ? 0 : 1,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        onPointerDown={(event) => onTrimPointerDown(event, "left")}
        onPointerMove={onTrimPointerMove}
        onPointerUp={onTrimPointerUp}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: "ew-resize",
        }}
      />
      <div
        onPointerDown={(event) => onTrimPointerDown(event, "right")}
        onPointerMove={onTrimPointerMove}
        onPointerUp={onTrimPointerUp}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: "ew-resize",
        }}
      />
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: "rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {getClipIcon(renderClip)}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "16px",
          }}
        >
          {getClipLabel(renderClip)}
        </div>
      </div>
    </div>
  );
};


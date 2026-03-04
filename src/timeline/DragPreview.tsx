import React, { PointerEvent } from "react";
import type { Clip } from "./types";
import { getClipIcon, getClipLabel } from "./utils";

type DragPreviewProps = {
  clip: Clip;
  left: number;
  top: number;
  width: number;
  height: number;
  isDropValid: boolean;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
};

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
  return (
    <div
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius: 8,
        background: "#334155",
        border: isDropValid ? "1px solid #93c5fd" : "1px solid #f87171",
        boxSizing: "border-box",
        cursor: "grabbing",
        overflow: "hidden",
        color: "#e2e8f0",
        padding: "6px 8px",
        fontSize: 12,
        zIndex: 6,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
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
        {getClipIcon(clip)}
      </div>
      <div
        style={{
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: "16px",
        }}
      >
        {getClipLabel(clip)}
      </div>
    </div>
  );
};


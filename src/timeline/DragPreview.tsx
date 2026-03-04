import React, { PointerEvent } from "react";
import type { Clip } from "./types";
import { getClipIcon, getClipLabel } from "./utils";
import "./DragPreview.css";

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
      <div className="drag-preview-icon">
        {getClipIcon(clip)}
      </div>
      <div className="drag-preview-label">
        {getClipLabel(clip)}
      </div>
    </div>
  );
};

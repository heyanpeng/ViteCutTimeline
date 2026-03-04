import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

export type ClipKind = "text" | "solid" | "image" | "video" | "audio";

export interface TimelineAction {
  id: string;
  start: number;
  end: number;
  effectId: string;
  selected?: boolean;
  flexible?: boolean;
  movable?: boolean;
  disable?: boolean;
  minStart?: number;
  maxEnd?: number;

  layer?: number;
  title?: string;
  icon?: string;
  kind?: ClipKind;
  color?: string;
  inPoint?: number;
  outPoint?: number;
}

export interface TimelineRow {
  id: string;
  actions: TimelineAction[];
  rowHeight?: number;
  selected?: boolean;
  classNames?: string[];

  name?: string;
  role?: "main" | "audio" | "normal";
  height?: number;
}

export type TrackHeightPresets = {
  main?: number;
  normal?: number;
  video?: number;
  audio?: number;
  image?: number;
  text?: number;
  solid?: number;
};

export type TimelineProps = {
  editorData: TimelineRow[];
  duration: number;
  playing: boolean;
  playEndBehavior?: "stop" | "loop";
  currentTime?: number;
  showMinorTicks?: boolean;
  showHorizontalLines?: boolean;
  dragSnapToClipEdges?: boolean;
  trimSnapToClipEdges?: boolean;
  trimSnapToTimelineTicks?: boolean;
  trimSnapThresholdPx?: number;
  trimSnapTickMode?: "minor" | "major";
  initialTime?: number;
  minZoom?: number;
  maxZoom?: number;
  zoom?: number;
  rowHeight?: number;
  trackGap?: number;
  trackHeightPresets?: TrackHeightPresets;
  onEditorDataChange?: (next: TimelineRow[]) => void;
  onTimeChange?: (time: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onZoomChange?: (zoom: number) => void;
  onRulerPointerDown?: (time: number, event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onBlankAreaPointerDown?: (time: number, event: ReactPointerEvent<HTMLDivElement>) => void;
  onRulerDoubleClick?: (time: number, event: ReactMouseEvent<HTMLCanvasElement>) => void;
  onBlankAreaDoubleClick?: (time: number, event: ReactMouseEvent<HTMLDivElement>) => void;
};

export type DragState = {
  originRowId: string;
  previewRowId: string;
  insertRowIndex: number | null;
  insertLineY: number | null;
  actionId: string;
  action: TimelineAction;
  pointerId: number;
  startClientX: number;
  originStart: number;
  previewStart: number;
  commitStart: number | null;
  snappedTime: number | null;
  isDropValid: boolean;
};

export type PendingDragState = {
  rowId: string;
  action: TimelineAction;
  pointerId: number;
  startClientX: number;
  startClientY: number;
};

export type TrimState = {
  rowId: string;
  actionId: string;
  side: "left" | "right";
  pointerId: number;
  startClientX: number;
  origin: TimelineAction;
  preview: TimelineAction;
  snappedTime: number | null;
};

export type Selection = {
  rowId: string;
  actionId: string;
} | null;

export type TrackLayout = {
  id: string;
  index: number;
  top: number;
  height: number;
  bottom: number;
};

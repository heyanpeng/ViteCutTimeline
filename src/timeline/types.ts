import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

export interface Clip {
  id: string;
  startFrame: number;
  displayStart: number;
  duration: number;
  layer: number;
  title?: string;
  icon?: string;
  kind?: "text" | "solid" | "image" | "video" | "audio";
  color?: string;
}

export interface Track {
  id: string;
  name?: string;
  role?: "main" | "audio" | "normal";
  height?: number;
  clips: Clip[];
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
  tracks: Track[];
  fps: number;
  totalFrames: number;
  playing: boolean;
  playEndBehavior?: "stop" | "loop";
  currentFrame?: number;
  showMinorTicks?: boolean;
  showHorizontalLines?: boolean;
  dragSnapToClipEdges?: boolean;
  trimSnapToClipEdges?: boolean;
  trimSnapToTimelineTicks?: boolean;
  trimSnapThresholdPx?: number;
  trimSnapTickMode?: "minor" | "major";
  initialFrame?: number;
  minZoom?: number;
  maxZoom?: number;
  zoom?: number;
  rowHeight?: number;
  trackGap?: number;
  trackHeightPresets?: TrackHeightPresets;
  onTracksChange?: (next: Track[]) => void;
  onFrameChange?: (frame: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onZoomChange?: (zoom: number) => void;
  onRulerPointerDown?: (frame: number, event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onBlankAreaPointerDown?: (frame: number, event: ReactPointerEvent<HTMLDivElement>) => void;
  onRulerDoubleClick?: (frame: number, event: ReactMouseEvent<HTMLCanvasElement>) => void;
  onBlankAreaDoubleClick?: (frame: number, event: ReactMouseEvent<HTMLDivElement>) => void;
};

export type DragState = {
  originTrackId: string;
  previewTrackId: string;
  clipId: string;
  clip: Clip;
  pointerId: number;
  startClientX: number;
  originFrame: number;
  previewStartFrame: number;
  snappedFrame: number | null;
  isDropValid: boolean;
};

export type PendingDragState = {
  trackId: string;
  clip: Clip;
  pointerId: number;
  startClientX: number;
  startClientY: number;
};

export type TrimState = {
  trackId: string;
  clipId: string;
  side: "left" | "right";
  pointerId: number;
  startClientX: number;
  origin: Clip;
  preview: Clip;
  snappedFrame: number | null;
};

export type Selection = {
  trackId: string;
  clipId: string;
} | null;

export type TrackLayout = {
  id: string;
  index: number;
  top: number;
  height: number;
  bottom: number;
};

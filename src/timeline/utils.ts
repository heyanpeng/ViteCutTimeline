import { BASE_PX_PER_FRAME } from "./constants";
import type { Clip } from "./types";

export const frameToPixel = (
  frame: number,
  zoom: number,
  basePxPerFrame = BASE_PX_PER_FRAME,
) => frame * basePxPerFrame * zoom;

export const pixelToFrame = (
  pixel: number,
  zoom: number,
  basePxPerFrame = BASE_PX_PER_FRAME,
) => pixel / (basePxPerFrame * zoom);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getTickStepFrames = (pxPerFrame: number, fps: number) => {
  if (pxPerFrame >= 6) {
    const frameSteps = [1, 2, 5, 10, 20, 50, 100];
    const major = frameSteps.find((s) => s * pxPerFrame >= 70) ?? 100;
    return { major, minor: Math.max(1, Math.floor(major / 5)), unit: "frame" as const };
  }
  const secondSteps = [1, 2, 5, 10, 15, 30, 60];
  const majorSeconds = secondSteps.find((s) => s * fps * pxPerFrame >= 90) ?? 60;
  const major = majorSeconds * fps;
  return { major, minor: Math.max(1, Math.floor(major / 5)), unit: "second" as const };
};

export const formatTime = (frame: number, fps: number) => {
  const totalSec = Math.floor(frame / fps);
  const hour = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  if (hour > 0) {
    return `${hour.toString().padStart(2, "0")}:${min}:${sec}`;
  }
  return `${min}:${sec}`;
};

export const getClipEnd = (clip: Clip) => clip.startFrame + clip.duration;

export const getClipIcon = (clip: Clip) => {
  if (clip.icon) return clip.icon;
  switch (clip.kind) {
    case "text":
      return "T";
    case "image":
      return "🖼";
    case "solid":
      return "●";
    case "video":
      return "🎬";
    case "audio":
      return "♪";
    default:
      return "▣";
  }
};

export const getClipLabel = (clip: Clip) => clip.title ?? clip.id;

export const getClipColor = (clip: Clip) => {
  if (clip.color) return clip.color;
  switch (clip.kind) {
    case "text":
      return "#6f58d9";
    case "solid":
      return "#a64ac9";
    case "image":
      return "#3a7d44";
    case "audio":
      return "#0f766e";
    default:
      return "#2563eb";
  }
};


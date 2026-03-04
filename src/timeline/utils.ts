import { BASE_PX_PER_SECOND } from "./constants";
import type { TimelineAction } from "./types";

export const timeToPixel = (
  time: number,
  zoom: number,
  basePxPerSecond = BASE_PX_PER_SECOND,
) => time * basePxPerSecond * zoom;

export const pixelToTime = (
  pixel: number,
  zoom: number,
  basePxPerSecond = BASE_PX_PER_SECOND,
) => pixel / (basePxPerSecond * zoom);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getTickStepSeconds = (pxPerSecond: number) => {
  const majorStepsMs = [1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000];
  const majorMs = majorStepsMs.find((ms) => (ms / 1000) * pxPerSecond >= 90) ?? 300000;

  let minorMs = Math.max(1000, Math.floor(majorMs / 5));
  if (majorMs === 1000) {
    if (pxPerSecond >= 360) minorMs = 40;
    else if (pxPerSecond >= 180) minorMs = 100;
    else if (pxPerSecond >= 90) minorMs = 200;
    else if (pxPerSecond >= 45) minorMs = 500;
  }

  return {
    major: majorMs / 1000,
    minor: minorMs / 1000,
    majorMs,
    minorMs,
    unit: minorMs < 1000 ? ("subsecond" as const) : ("second" as const),
  };
};

export const formatTime = (time: number) => {
  const totalMs = Math.max(0, Math.floor(time * 1000));
  const totalSec = Math.floor(totalMs / 1000);
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

export const formatTimeWithMs = (time: number) => {
  const totalMs = Math.max(0, Math.floor(time * 1000));
  const totalSec = Math.floor(totalMs / 1000);
  const hour = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  const ms = (totalMs % 1000).toString().padStart(3, "0");
  if (hour > 0) {
    return `${hour.toString().padStart(2, "0")}:${min}:${sec}.${ms}`;
  }
  return `${min}:${sec}.${ms}`;
};

export const getActionDuration = (action: TimelineAction) => Math.max(0, action.end - action.start);

export const getClipIcon = (action: TimelineAction) => {
  if (action.icon) return action.icon;
  switch (action.kind) {
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

export const getClipLabel = (action: TimelineAction) => action.title ?? action.id;

export const getClipColor = (action: TimelineAction) => {
  if (action.color) return action.color;
  switch (action.kind) {
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

export const frameToPixel = timeToPixel;
export const pixelToFrame = pixelToTime;

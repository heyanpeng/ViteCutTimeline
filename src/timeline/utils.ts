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
  if (pxPerSecond >= 24) {
    const secondSteps = [0.04, 0.1, 0.2, 0.5, 1, 2, 5];
    const major = secondSteps.find((s) => s * pxPerSecond >= 90) ?? 5;
    return { major, minor: Math.max(0.04, major / 5), unit: "subsecond" as const };
  }
  const secondSteps = [1, 2, 5, 10, 15, 30, 60, 120, 300];
  const major = secondSteps.find((s) => s * pxPerSecond >= 90) ?? 300;
  return { major, minor: Math.max(1, major / 5), unit: "second" as const };
};

export const formatTime = (time: number) => {
  const totalSec = Math.floor(time);
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
  const safe = Math.max(0, time);
  const totalSec = Math.floor(safe);
  const hour = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  const ms = Math.floor((safe - totalSec) * 1000)
    .toString()
    .padStart(3, "0");
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

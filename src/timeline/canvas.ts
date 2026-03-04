import { RULER_HEIGHT } from "./constants";
import { clamp, formatTime, frameToPixel, getTickStepFrames, pixelToFrame } from "./utils";
import type { TrackLayout } from "./types";

type CommonDraw = {
  canvas: HTMLCanvasElement;
  viewportWidth: number;
  viewportHeight: number;
  scrollLeft: number;
  zoom: number;
  fps: number;
  totalFrames: number;
  showMinorTicks: boolean;
};

export const drawTimelineCanvas = ({
  canvas,
  viewportWidth,
  viewportHeight,
  scrollLeft,
  zoom,
  fps,
  totalFrames,
  showMinorTicks,
  showHorizontalLines,
  trackLayouts,
}: CommonDraw & {
  showHorizontalLines: boolean;
  trackLayouts: TrackLayout[];
}) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#0f1115";
  ctx.fillRect(0, 0, width, height);
  const pxPerFrame = frameToPixel(1, zoom);
  const tick = getTickStepFrames(pxPerFrame, fps);
  const startFrame = Math.max(0, Math.floor(pixelToFrame(scrollLeft, zoom)));
  const endFrame = Math.min(totalFrames, Math.ceil(pixelToFrame(scrollLeft + width, zoom)));

  if (showHorizontalLines) {
    ctx.strokeStyle = "#1c2028";
    ctx.lineWidth = 1;
    for (let i = 1; i < trackLayouts.length; i += 1) {
      const y = trackLayouts[i].top + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  const firstMinor = Math.floor(startFrame / tick.minor) * tick.minor;
  for (let frame = firstMinor; frame <= endFrame; frame += tick.minor) {
    const x = frameToPixel(frame, zoom) - scrollLeft;
    const isMajor = frame % tick.major === 0;
    if (!showMinorTicks && !isMajor) continue;
    ctx.strokeStyle = isMajor ? "#384254" : "#232936";
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
};

export const drawRulerCanvas = ({
  canvas,
  viewportWidth,
  scrollLeft,
  zoom,
  fps,
  totalFrames,
  showMinorTicks,
}: CommonDraw) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, viewportWidth);
  const height = RULER_HEIGHT;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#121722";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#2a3344";
  ctx.beginPath();
  ctx.moveTo(0, height - 0.5);
  ctx.lineTo(width, height - 0.5);
  ctx.stroke();

  const pxPerFrame = frameToPixel(1, zoom);
  const tick = getTickStepFrames(pxPerFrame, fps);
  const startFrame = Math.max(0, Math.floor(pixelToFrame(scrollLeft, zoom)));
  const endFrame = Math.min(totalFrames, Math.ceil(pixelToFrame(scrollLeft + width, zoom)));
  const firstMinor = Math.floor(startFrame / tick.minor) * tick.minor;
  const majorFrames: number[] = [];

  for (let frame = firstMinor; frame <= endFrame; frame += tick.minor) {
    const x = frameToPixel(frame, zoom) - scrollLeft;
    const isMajor = frame % tick.major === 0;
    if (!showMinorTicks && !isMajor) continue;
    const tickTop = isMajor ? height - 12 : height - 7;
    ctx.strokeStyle = isMajor ? "#7182a1" : "#4a5b77";
    ctx.beginPath();
    ctx.moveTo(x + 0.5, tickTop);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
    if (isMajor) majorFrames.push(frame);
  }

  ctx.fillStyle = "#b4c0d4";
  ctx.font = "11px ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  for (const frame of majorFrames) {
    const x = frameToPixel(frame, zoom) - scrollLeft;
    const label = tick.unit === "second" ? formatTime(frame, fps) : `${frame}f`;
    const textWidth = ctx.measureText(label).width;
    const textX = clamp(x + 4, 2, Math.max(2, width - textWidth - 2));
    ctx.fillText(label, textX, 2);
  }
};


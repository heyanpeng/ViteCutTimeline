import { RULER_HEIGHT } from "./constants";
import { clamp, formatTime, getTickStepSeconds, pixelToTime, timeToPixel } from "./utils";
import type { TrackLayout } from "./types";

type CommonDraw = {
  canvas: HTMLCanvasElement;
  viewportWidth: number;
  viewportHeight: number;
  scrollLeft: number;
  scrollTop: number;
  zoom: number;
  duration: number;
  showMinorTicks: boolean;
};

export const drawTimelineCanvas = ({
  canvas,
  viewportWidth,
  viewportHeight,
  scrollLeft,
  scrollTop,
  zoom,
  duration,
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

  if (showHorizontalLines) {
    ctx.strokeStyle = "#1c2028";
    ctx.lineWidth = 1;
    for (let i = 0; i < trackLayouts.length - 1; i += 1) {
      const current = trackLayouts[i];
      const next = trackLayouts[i + 1];
      const gapCenterY = (current.bottom + next.top) / 2 - scrollTop + 0.5;
      if (gapCenterY < -1 || gapCenterY > height + 1) continue;
      ctx.beginPath();
      ctx.moveTo(0, gapCenterY);
      ctx.lineTo(width, gapCenterY);
      ctx.stroke();
    }
  }

  const pxPerSecond = timeToPixel(1, zoom);
  const tick = getTickStepSeconds(pxPerSecond);
  const startMs = Math.max(0, Math.floor(pixelToTime(scrollLeft, zoom) * 1000));
  const endMs = Math.min(Math.floor(duration * 1000), Math.ceil(pixelToTime(scrollLeft + width, zoom) * 1000));
  const startIndex = Math.floor(startMs / tick.minorMs);
  const endIndex = Math.ceil(endMs / tick.minorMs);
  const majorEvery = Math.max(1, Math.floor(tick.majorMs / tick.minorMs));

  for (let i = startIndex; i <= endIndex; i += 1) {
    const tMs = i * tick.minorMs;
    const t = tMs / 1000;
    const x = timeToPixel(t, zoom) - scrollLeft;
    const isMajor = i % majorEvery === 0;
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
  scrollTop: _scrollTop,
  zoom,
  duration,
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

  const pxPerSecond = timeToPixel(1, zoom);
  const tick = getTickStepSeconds(pxPerSecond);
  const startMs = Math.max(0, Math.floor(pixelToTime(scrollLeft, zoom) * 1000));
  const endMs = Math.min(Math.floor(duration * 1000), Math.ceil(pixelToTime(scrollLeft + width, zoom) * 1000));
  const startIndex = Math.floor(startMs / tick.minorMs);
  const endIndex = Math.ceil(endMs / tick.minorMs);
  const majorEvery = Math.max(1, Math.floor(tick.majorMs / tick.minorMs));
  const majorTimesMs: number[] = [];

  for (let i = startIndex; i <= endIndex; i += 1) {
    const tMs = i * tick.minorMs;
    const t = tMs / 1000;
    const x = timeToPixel(t, zoom) - scrollLeft;
    const isMajor = i % majorEvery === 0;
    if (!showMinorTicks && !isMajor) continue;
    const tickTop = isMajor ? height - 12 : height - 7;
    ctx.strokeStyle = isMajor ? "#7182a1" : "#4a5b77";
    ctx.beginPath();
    ctx.moveTo(x + 0.5, tickTop);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
    if (isMajor) majorTimesMs.push(tMs);
  }

  ctx.fillStyle = "#b4c0d4";
  ctx.font = "11px ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  for (const tMs of majorTimesMs) {
    const t = tMs / 1000;
    const x = timeToPixel(t, zoom) - scrollLeft;
    const label = formatTime(t);
    if (label === "00:00" || label === "00:00:00") continue;
    const textWidth = ctx.measureText(label).width;
    const textX = clamp(x - textWidth - 4, 2, Math.max(2, width - textWidth - 2));
    ctx.fillText(label, textX, 2);
  }
};

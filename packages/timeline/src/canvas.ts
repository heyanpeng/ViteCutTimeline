import { RULER_HEIGHT } from "./constants";
import {
  clamp,
  formatTime,
  getTickStepSeconds,
  pixelToTime,
  timeToPixel,
} from "./utils";
import type { TrackLayout } from "./types";

// 公共绘制参数类型（包含画布元素、视口尺寸、滚动位置、缩放比例、时间轴时长、是否显示小刻度线等）
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

/**
 * 从 canvas 继承的 CSS 变量读取颜色，允许业务侧直接通过样式覆盖背景色。
 */
const readCanvasColorVar = (
  canvas: HTMLCanvasElement,
  name: string,
  fallback: string,
) => {
  const value = getComputedStyle(canvas).getPropertyValue(name).trim();
  return value || fallback;
};

/**
 * 绘制时间线主画布，包括背景、轨道水平线(可选)、时间刻度线
 */
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
  // 获取2D上下文
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 处理设备像素比以实现高清渲染
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // 填充背景色
  ctx.fillStyle = readCanvasColorVar(
    canvas,
    "--vitecut-timeline-bg-canvas-bg",
    "#0f1115",
  );
  ctx.fillRect(0, 0, width, height);

  // 可选：绘制轨道之间的水平线
  if (showHorizontalLines) {
    ctx.strokeStyle = readCanvasColorVar(
      canvas,
      "--vitecut-timeline-horizontal-line-color",
      "#1c2028",
    );
    ctx.lineWidth = 1;
    for (let i = 0; i < trackLayouts.length - 1; i += 1) {
      const current = trackLayouts[i];
      const next = trackLayouts[i + 1];
      // 轨道间隙垂直方向中心线位置
      const gapCenterY = (current.bottom + next.top) / 2 - scrollTop;
      if (gapCenterY < -1 || gapCenterY > height + 1) continue;
      ctx.beginPath();
      ctx.moveTo(0, gapCenterY);
      ctx.lineTo(width, gapCenterY);
      ctx.stroke();
    }
    /**
     * 补最后一条轨道底部线：
     * - 轨道间分隔线绘制在“gap 中心”；
     * - 末尾同样补一条，保证最后一条轨道底边视觉与中间轨道一致。
     */
    const first = trackLayouts[0];
    const last = trackLayouts[trackLayouts.length - 1];
    if (first && last) {
      const gapHalf = Math.max(0, first.top - RULER_HEIGHT);
      const lastBottomLineY = last.bottom - scrollTop + gapHalf;
      if (lastBottomLineY >= -1 && lastBottomLineY <= height + 1) {
        ctx.beginPath();
        ctx.moveTo(0, lastBottomLineY);
        ctx.lineTo(width, lastBottomLineY);
        ctx.stroke();
      }
    }
  }

  // 计算每秒对应的像素数（用于确定刻度密度和显示方式）
  const pxPerSecond = timeToPixel(1, zoom);
  // 自动取得适合当前缩放级别的刻度方案（主/次刻度时间间隔和毫秒数）
  const tick = getTickStepSeconds(pxPerSecond);
  // 可见区域的时间范围（毫秒，包含滚动偏移）
  const startMs = Math.max(0, Math.floor(pixelToTime(scrollLeft, zoom) * 1000));
  const endMs = Math.min(
    Math.floor(duration * 1000),
    Math.ceil(pixelToTime(scrollLeft + width, zoom) * 1000),
  );
  // 小刻度的起止索引
  const startIndex = Math.floor(startMs / tick.minorMs);
  const endIndex = Math.ceil(endMs / tick.minorMs);
  // N个小刻度一个大刻度线
  const majorEvery = Math.max(1, Math.floor(tick.majorMs / tick.minorMs));
  // 一个小刻度的像素间隔
  const minorStepPx = timeToPixel(tick.minor, zoom);
  // 次刻度过密时下采样（节省绘制性能，无需所有都渲染）
  const minorSampleEvery = minorStepPx < 5 ? 4 : minorStepPx < 9 ? 2 : 1;

  // 绘制所有时间刻度线
  for (let i = startIndex; i <= endIndex; i += 1) {
    const tMs = i * tick.minorMs;
    const t = tMs / 1000; // 秒
    const x = timeToPixel(t, zoom) - scrollLeft;
    const isMajor = i % majorEvery === 0;
    // 如果只显示主刻度，跳过非主刻度
    if (!showMinorTicks && !isMajor) continue;
    // 次刻度依密度下采样（过密就只绘制部分）
    if (!isMajor && i % minorSampleEvery !== 0) continue;
    // 主次刻度线颜色区分
    ctx.strokeStyle = isMajor
      ? readCanvasColorVar(
          canvas,
          "--vitecut-timeline-grid-major-line-color",
          "#36445e",
        )
      : readCanvasColorVar(
          canvas,
          "--vitecut-timeline-grid-minor-line-color",
          "#1b2230",
        );
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
};

/**
 * 绘制标尺（顶部的时间刻度带和标签）
 */
export const drawRulerCanvas = ({
  canvas,
  viewportWidth,
  scrollLeft,
  scrollTop: _scrollTop,
  zoom,
  duration,
  showMinorTicks,
}: CommonDraw) => {
  // 获取2D上下文
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 处理设备像素比以实现高清渲染
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, viewportWidth);
  const height = RULER_HEIGHT;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // 填充标尺背景
  ctx.fillStyle = readCanvasColorVar(
    canvas,
    "--vitecut-timeline-ruler-canvas-bg",
    "#121722",
  );
  ctx.fillRect(0, 0, width, height);

  // 绘制标尺底部边线
  ctx.strokeStyle = readCanvasColorVar(
    canvas,
    "--vitecut-timeline-ruler-border-color",
    "#2a3344",
  );
  ctx.beginPath();
  ctx.moveTo(0, height - 1);
  ctx.lineTo(width, height - 1);
  ctx.stroke();

  // 计算每秒对应的像素数、合适的刻度等级
  const pxPerSecond = timeToPixel(1, zoom);
  const tick = getTickStepSeconds(pxPerSecond);
  // 标尺上可见的时间范围（毫秒）
  const startMs = Math.max(0, Math.floor(pixelToTime(scrollLeft, zoom) * 1000));
  const endMs = Math.min(
    Math.floor(duration * 1000),
    Math.ceil(pixelToTime(scrollLeft + width, zoom) * 1000),
  );
  // 小刻度的起止索引
  const startIndex = Math.floor(startMs / tick.minorMs);
  const endIndex = Math.ceil(endMs / tick.minorMs);
  // majorEvery: N个小刻度为一个大刻度
  const majorEvery = Math.max(1, Math.floor(tick.majorMs / tick.minorMs));
  // 一个小刻度的像素间隔
  const minorStepPx = timeToPixel(tick.minor, zoom);
  // 依密度决定每隔几个绘一次次刻度
  const minorSampleEvery = minorStepPx < 5 ? 4 : minorStepPx < 9 ? 2 : 1;
  // 主刻度的时间点（用于后续文字标记输出）
  const majorTimesMs: number[] = [];

  // 绘制所有竖向的主/次刻度线
  for (let i = startIndex; i <= endIndex; i += 1) {
    const tMs = i * tick.minorMs;
    const t = tMs / 1000;
    const x = timeToPixel(t, zoom) - scrollLeft;
    const isMajor = i % majorEvery === 0;
    if (!showMinorTicks && !isMajor) continue;
    if (!isMajor && i % minorSampleEvery !== 0) continue;
    // 主刻度、次刻度线分别样式
    ctx.strokeStyle = isMajor
      ? readCanvasColorVar(
          canvas,
          "--vitecut-timeline-ruler-major-tick-color",
          "#7487aa",
        )
      : readCanvasColorVar(
          canvas,
          "--vitecut-timeline-ruler-minor-tick-color",
          "#3e506d",
        );
    ctx.beginPath();
    // 主刻度从顶端画到最底，次刻度可以短一些
    ctx.moveTo(x, isMajor ? 0 : 14);
    ctx.lineTo(x, height);
    ctx.stroke();
    // 记录主刻度点用于后续绘制文字
    if (isMajor) majorTimesMs.push(tMs);
  }

  // 设置时间文字样式
  ctx.fillStyle = readCanvasColorVar(
    canvas,
    "--vitecut-timeline-ruler-text-color",
    "#b4c0d4",
  );
  ctx.font =
    "11px ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  // 在主刻度线下绘制时间文本标签，避免出界
  for (const tMs of majorTimesMs) {
    const t = tMs / 1000;
    const x = timeToPixel(t, zoom) - scrollLeft;
    const label = formatTime(t);
    const textWidth = ctx.measureText(label).width;
    // 防止文本超出边界
    const textX = clamp(x + 4, 2, Math.max(2, width - textWidth - 2));
    ctx.fillText(label, textX, 2);
  }
};

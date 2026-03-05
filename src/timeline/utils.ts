import { BASE_PX_PER_SECOND } from "./constants";
import type { TimelineAction } from "./types";

/**
 * 将时间值（秒）转换为像素值
 * @param time - 时间（秒）
 * @param zoom - 缩放比例
 * @param basePxPerSecond - 每秒像素数（默认 BASE_PX_PER_SECOND）
 * @returns 对应的像素值
 */
export const timeToPixel = (
  time: number,
  zoom: number,
  basePxPerSecond = BASE_PX_PER_SECOND,
) => time * basePxPerSecond * zoom;

/**
 * 将像素值转换为时间值（秒）
 * @param pixel - 像素
 * @param zoom - 缩放比例
 * @param basePxPerSecond - 每秒像素数（默认 BASE_PX_PER_SECOND）
 * @returns 对应的时间（秒）
 */
export const pixelToTime = (
  pixel: number,
  zoom: number,
  basePxPerSecond = BASE_PX_PER_SECOND,
) => pixel / (basePxPerSecond * zoom);

/**
 * 限制数值在指定[min, max]区间内
 * @param value - 需要限制的数值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 被限制区间后的数值
 */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * 计算时间线主/次刻度间隔（单位：秒及毫秒）
 * @param pxPerSecond - 每秒对应的像素数
 * @returns major（主刻度秒数），minor（次刻度秒数），以及对应单位等
 */
export const getTickStepSeconds = (pxPerSecond: number) => {
  // 不同主刻度候选值（毫秒）
  const majorStepsMs = [
    1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000,
  ];
  // 找到一个主刻度：对应像素大于等于90，否则取300s
  const majorMs =
    majorStepsMs.find((ms) => (ms / 1000) * pxPerSecond >= 90) ?? 300000;

  // 次刻度不能小于1s，优先等于主刻度的1/5
  let minorMs = Math.max(1000, Math.floor(majorMs / 5));
  // 特殊处理主刻度=1s时的子步进
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

/**
 * 时间格式化，显示为 mm:ss 或 hh:mm:ss
 * @param time - 时间（秒）
 * @returns 格式化字符串
 */
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

/**
 * 时间格式化，显示为 mm:ss.SSS 或 hh:mm:ss.SSS（带毫秒）
 * @param time - 时间（秒）
 * @returns 格式化字符串
 */
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

/**
 * 获取 action 的时长（秒），保证不为负数
 * @param action - 时间线 Action
 */
export const getActionDuration = (action: TimelineAction) =>
  Math.max(0, action.end - action.start);

/**
 * 根据 Action 类型返回图标
 * @param action - 时间线 Action
 * @returns 图标字符串（emoji 或字母）
 */
export const getClipIcon = (action: TimelineAction) => {
  void action;
  return "▣";
};

/**
 * 获取剪辑 label（优先标题，无则取 ID）
 * @param action - 时间线 Action
 * @returns label 字符串
 */
export const getClipLabel = (action: TimelineAction) =>
  action.effectId || action.id;

/**
 * 根据 Action 类型获取剪辑颜色（如果有自定义 color 优先用自定义的）
 * @param action - 时间线 Action
 * @returns 颜色字符串（十六进制）
 */
export const getClipColor = (action: TimelineAction) => {
  const key = action.effectId || action.id;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 42%)`;
};

/**
 * 框架数与时间/像素简写（兼容旧用法）
 */
export const frameToPixel = timeToPixel;
export const pixelToFrame = pixelToTime;

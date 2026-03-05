import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

export type ClipKind = "text" | "solid" | "image" | "video" | "audio";

export interface TimelineAction {
  /** 动作id */
  id: string;
  /** 动作开始时间 */
  start: number;
  /** 动作结束时间 */
  end: number;
  /** 动作所对应的effectId */
  effectId: string;

  /** 动作是否被选中 */
  selected?: boolean;
  /** 动作是否可伸缩 */
  flexible?: boolean;
  /** 动作是否可移动 */
  movable?: boolean;
  /** 动作是否禁止运行 */
  disable?: boolean;

  /** 动作最小开始时间限制 */
  minStart?: number;
  /** 动作最大结束时间限制 */
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
  /** 动作行id */
  id: string;
  /** 行的动作列表 */
  actions: TimelineAction[];
  /** 自定义行高 */
  rowHeight?: number;
  /** 行是否选中 */
  selected?: boolean;
  /** 行的扩展类名 */
  classNames?: string[];

  name?: string;
  role?: "main" | "audio" | "normal";
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
  /** 编辑区的数据，包含所有的行及动作 */
  editorData: TimelineRow[];
  /** 时间轴的总时长（单位：秒） */
  duration: number;
  /** 是否处于播放状态 */
  playing: boolean;
  /** 播放结束时的行为（停止/循环），默认为"stop" */
  playEndBehavior?: "stop" | "loop";
  /** 当前播放时间（单位：秒） */
  currentTime?: number;
  /** 是否显示次级刻度线 */
  showMinorTicks?: boolean;
  /** 是否显示横向分割线 */
  showHorizontalLines?: boolean;
  /** 拖拽移动clip时，是否吸附到其他clip的边缘 */
  dragSnapToClipEdges?: boolean;
  /** 裁剪clip时，是否吸附到其他clip的边缘 */
  trimSnapToClipEdges?: boolean;
  /** 裁剪clip时，是否吸附到时间线刻度 */
  trimSnapToTimelineTicks?: boolean;
  /** 裁剪吸附判定阈值（像素，默认值通常为8） */
  trimSnapThresholdPx?: number;
  /** 裁剪吸附模式（吸附主刻度/次刻度） */
  trimSnapTickMode?: "minor" | "major";
  /** 初始时间（单位：秒，默认为0） */
  initialTime?: number;
  /** 最小缩放比例 */
  minZoom?: number;
  /** 最大缩放比例 */
  maxZoom?: number;
  /** 当前缩放比例 */
  zoom?: number;
  /** 单行轨道高度（像素，优先级低于trackHeightPresets） */
  rowHeight?: number;
  /** 轨道之间的间距（像素） */
  trackGap?: number;
  /** 轨道高度预设，根据内容类型定制高度 */
  trackHeightPresets?: TrackHeightPresets;
  /** 轨道控制区宽度（像素，默认184） */
  trackControlsWidth?: number;
  /** 轨道控制区渲染函数 */
  renderTrackControls?: (params: TrackControlRenderParams) => ReactNode;
  /** 开始移动回调 */
  onActionMoveStart?: (params: {
    action: TimelineAction;
    row: TimelineRow;
  }) => void;
  /** 移动回调（return false可阻止移动） */
  onActionMoving?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    start: number;
    end: number;
  }) => void | boolean;
  /** 移动结束回调（return false可阻止onChange触发） */
  onActionMoveEnd?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    start: number;
    end: number;
  }) => void;
  /** 开始改变大小回调 */
  onActionResizeStart?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    dir: "right" | "left";
  }) => void;
  /** 开始大小回调（return false可阻止改变） */
  onActionResizing?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    start: number;
    end: number;
    dir: "right" | "left";
  }) => void | boolean;
  /** 改变大小结束回调（return false可阻止onChange触发） */
  onActionResizeEnd?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    start: number;
    end: number;
    dir: "right" | "left";
  }) => void;
  onEditorDataChange?: (next: TimelineRow[]) => void;
  /** cursor开始拖拽事件 */
  onCursorDragStart?: (time: number) => void;
  /** cursor结束拖拽事件 */
  onCursorDragEnd?: (time: number) => void;
  /** cursor拖拽事件 */
  onCursorDrag?: (time: number) => void;
  /** 缩放事件 */
  onZoomChange?: (zoom: number) => void;
  /** 点击时间区域事件, 返回false时阻止设置时间 */
  onClickTimeArea?: (
    time: number,
    e: ReactMouseEvent<HTMLDivElement, MouseEvent>,
  ) => boolean | undefined;
  /** 点击行回调 */
  onClickRow?: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>,
    param: {
      row: TimelineRow;
      time: number;
    },
  ) => void;
  /** 点击动作回调 */
  onClickAction?: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>,
    param: {
      action: TimelineAction;
      row: TimelineRow;
      time: number;
    },
  ) => void;
  /** 点击动作回调（触发drag时不执行） */
  onClickActionOnly?: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>,
    param: {
      action: TimelineAction;
      row: TimelineRow;
      time: number;
    },
  ) => void;
  /** 双击行回调 */
  onDoubleClickRow?: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>,
    param: {
      row: TimelineRow;
      time: number;
    },
  ) => void;
  /** 双击动作回调 */
  onDoubleClickAction?: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>,
    param: {
      action: TimelineAction;
      row: TimelineRow;
      time: number;
    },
  ) => void;
};

export interface TimelineState {
  /** dom节点 */
  target: HTMLElement | null;
  /** 运行监听器，暂时未使用 */
  // listener: Emitter<EventTypes>;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 是否暂停中 */
  isPaused: boolean;
  /** 设置当前播放时间 */
  setTime: (time: number) => void;
  /** 获取当前播放时间 */
  getTime: () => number;
  /** 设置播放速率 */
  setPlayRate: (rate: number) => void;
  /** 设置播放速率 */
  getPlayRate: () => number;
  /** 重新渲染当前时间 */
  reRender: () => void;
  /** 播放 */
  play: (param: {
    /** 默认从头运行到尾, 优先级大于autoEnd */
    toTime?: number;
    /** 是否播放完后自动结束 */
    autoEnd?: boolean;
    /** 运行的actionId列表，不穿默认全部运行 */
    runActionIds?: string[];
  }) => boolean;
  /** 暂停 */
  pause: () => void;
  /** 设置scroll left */
  setScrollLeft: (val: number) => void;
  /** 设置scroll top */
  setScrollTop: (val: number) => void;
}

export type TrackControlState = {
  locked: boolean;
  hidden: boolean;
  muted: boolean;
};

export type TrackControlActions = {
  toggleLock: () => void;
  toggleHide: () => void;
  toggleMute: () => void;
  deleteTrack: () => void;
};

export type TrackControlRenderParams = {
  row: TimelineRow;
  state: TrackControlState;
  actions: TrackControlActions;
  isMainTrack: boolean;
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

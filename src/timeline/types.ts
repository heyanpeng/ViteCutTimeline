import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
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
  trackControlsWidth?: number;
  renderTrackControls?: (params: TrackControlRenderParams) => ReactNode;
  /**
   * @description 开始移动回调
   */
  onActionMoveStart?: (params: {
    action: TimelineAction;
    row: TimelineRow;
  }) => void;
  /**
   * @description 移动回调（return false可阻止移动）
   */
  onActionMoving?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    start: number;
    end: number;
  }) => void | boolean;
  /**
   * @description 移动结束回调（return false可阻止onChange触发）
   */
  onActionMoveEnd?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    start: number;
    end: number;
  }) => void;
  /**
   * @description 开始改变大小回调
   */
  onActionResizeStart?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    dir: "right" | "left";
  }) => void;
  /**
   * @description 开始大小回调（return false可阻止改变）
   */
  onActionResizing?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    start: number;
    end: number;
    dir: "right" | "left";
  }) => void | boolean;
  /**
   * @description 改变大小结束回调（return false可阻止onChange触发）
   */
  onActionResizeEnd?: (params: {
    action: TimelineAction;
    row: TimelineRow;
    start: number;
    end: number;
    dir: "right" | "left";
  }) => void;
  onEditorDataChange?: (next: TimelineRow[]) => void;
  /**
   * @description cursor开始拖拽事件
   */
  onCursorDragStart?: (time: number) => void;
  /**
   * @description cursor结束拖拽事件
   */
  onCursorDragEnd?: (time: number) => void;
  /**
   * @description cursor拖拽事件
   */
  onCursorDrag?: (time: number) => void;
  /**
   * @description 缩放事件
   */
  onZoomChange?: (zoom: number) => void;
  /**
   * @description 点击时间区域事件, 返回false时阻止设置时间
   */
  onClickTimeArea?: (
    time: number,
    e: ReactMouseEvent<HTMLDivElement, MouseEvent>,
  ) => boolean | undefined;
  /**
   * @description 点击行回调
   */
  onClickRow?: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>,
    param: {
      row: TimelineRow;
      time: number;
    },
  ) => void;
  /**
   * @description 点击动作回调
   */
  onClickAction?: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>,
    param: {
      action: TimelineAction;
      row: TimelineRow;
      time: number;
    },
  ) => void;
  /**
   * @description 点击动作回调（触发drag时不执行）
   */
  onClickActionOnly?: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>,
    param: {
      action: TimelineAction;
      row: TimelineRow;
      time: number;
    },
  ) => void;
  /**
   * @description 双击行回调
   */
  onDoubleClickRow?: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>,
    param: {
      row: TimelineRow;
      time: number;
    },
  ) => void;
  /**
   * @description 双击动作回调
   */
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
  /** 运行监听器 */
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

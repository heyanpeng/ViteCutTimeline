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

/** 轨道控制状态类型 */
export type TrackControlState = {
  /** 是否锁定轨道 */
  locked: boolean;
  /** 是否隐藏轨道 */
  hidden: boolean;
  /** 是否静音轨道 */
  muted: boolean;
};

/** 轨道控制支持的操作类型 */
export type TrackControlActions = {
  /** 切换锁定状态 */
  toggleLock: () => void;
  /** 切换隐藏状态 */
  toggleHide: () => void;
  /** 切换静音状态 */
  toggleMute: () => void;
  /** 删除轨道 */
  deleteTrack: () => void;
};

/** 轨道控制渲染参数类型 */
export type TrackControlRenderParams = {
  /** 当前轨道对象 */
  row: TimelineRow;
  /** 当前轨道的控制状态 */
  state: TrackControlState;
  /** 当前轨道支持的操作 */
  actions: TrackControlActions;
  /** 是否为主轨道 */
  isMainTrack: boolean;
};

/** 拖拽时的状态类型 */
export type DragState = {
  /** 起始拖动轨道的id */
  originRowId: string;
  /** 当前拖拽预览的轨道id */
  previewRowId: string;
  /** 插入轨道索引，null表示未插入 */
  insertRowIndex: number | null;
  /** 插入线条的Y坐标，null表示未显示 */
  insertLineY: number | null;
  /** 拖拽的动作id */
  actionId: string;
  /** 拖拽的动作对象 */
  action: TimelineAction;
  /** 拖拽使用的指针id */
  pointerId: number;
  /** 起始指针的clientX坐标 */
  startClientX: number;
  /** 动作原本的开始时间 */
  originStart: number;
  /** 拖拽过程中的预览开始时间 */
  previewStart: number;
  /** 用户真正提交拖拽时的开始时间，null为未提交 */
  commitStart: number | null;
  /** 吸附到的时间点，为null表示未吸附 */
  snappedTime: number | null;
  /** 当前拖拽目标是否合法 */
  isDropValid: boolean;
};

/** 拖拽待处理状态类型（还未判定是否合法时） */
export type PendingDragState = {
  /** 当前拖拽的轨道id */
  rowId: string;
  /** 拖拽的动作对象 */
  action: TimelineAction;
  /** 拖拽指针id */
  pointerId: number;
  /** 起始clientX */
  startClientX: number;
  /** 起始clientY */
  startClientY: number;
};

/** 裁剪（变更clip长度）时的状态类型 */
export type TrimState = {
  /** 轨道id */
  rowId: string;
  /** 被裁剪动作的id */
  actionId: string;
  /** 裁剪的方向（左/右） */
  side: "left" | "right";
  /** 裁剪指针id */
  pointerId: number;
  /** 起始指针clientX坐标 */
  startClientX: number;
  /** 裁剪前的动作（原始对象） */
  origin: TimelineAction;
  /** 裁剪中的预览动作（即时对象） */
  preview: TimelineAction;
  /** 当前边界吸附到的时间，null为未吸附 */
  snappedTime: number | null;
};

/** 时间轴选中项的数据类型（行与动作） */
export type Selection = {
  /** 轨道id */
  rowId: string;
  /** 动作id */
  actionId: string;
} | null;

/** 单个轨道的布局信息 */
export type TrackLayout = {
  /** 轨道id */
  id: string;
  /** 轨道顺序索引 */
  index: number;
  /** 距离顶部的像素 */
  top: number;
  /** 轨道高度 */
  height: number;
  /** 底部的像素 */
  bottom: number;
};

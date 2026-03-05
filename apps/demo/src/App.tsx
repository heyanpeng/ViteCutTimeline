import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Timeline, formatTimeWithMs, pixelToTime } from "@vitecut/timeline";
import type { Selection, TimelineAction, TimelineRow } from "@vitecut/timeline";
import "./App.css";

// Github 项目地址
const GITHUB_URL = "https://github.com/heyanpeng/ViteCutTimeline";

// 最小缩放比例
const MIN_ZOOM = 0.1;
// 最大缩放比例
const MAX_ZOOM = 8;

// 轨道之间的间距（像素）
const TRACK_GAP = 6;
// 轨道控制区宽度（像素）
const TRACK_CONTROLS_WIDTH = 135;
// 最后一个 clip 末尾的固定留白（像素）
const TIMELINE_END_PADDING_PX = 240;

// 轨道高度预设，根据内容类型定制高度
const TRACK_HEIGHT_PRESETS = {
  main: 70, // 主轨道
  video: 50, // 视频轨道
  audio: 50, // 音频轨道
  image: 40, // 图片轨道
  text: 40, // 文字轨道
  solid: 40, // 纯色块轨道
};

// 最小可编辑片段时长（单位：秒）
const MIN_EDIT_DURATION = 0.04;

/**
 * 简单地返回action自身
 * @param data TimelineAction
 * @returns TimelineAction
 */
const a = (data: TimelineAction): TimelineAction => data;

/**
 * 构造Demo的数据
 * @returns {TimelineRow[]}
 */
const createDemoRows = (): TimelineRow[] => [
  {
    id: "video-broll",
    name: "B-Roll",
    role: "normal",
    locked: false,
    hidden: false,
    muted: false,
    rowHeight: 50,
    actions: [
      a({
        id: "broll-01",
        effectId: "video",
        start: 5.2,
        end: 10.6,
        inPoint: 1.1,
        outPoint: 6.5,
        kind: "video",
        title: "Office Wide Shot",
      }),
      a({
        id: "broll-02",
        effectId: "video",
        start: 14.2,
        end: 20.4,
        inPoint: 0,
        outPoint: 6.2,
        kind: "video",
        title: "Device Close-up",
      }),
      a({
        id: "broll-03",
        effectId: "video",
        start: 30.2,
        end: 35.8,
        inPoint: 2.6,
        outPoint: 8.2,
        kind: "video",
        title: "Packaging Detail",
      }),
      a({
        id: "broll-04",
        effectId: "video",
        start: 37,
        end: 42.2,
        inPoint: 0.4,
        outPoint: 5.6,
        kind: "video",
        title: "Final Logo Reveal",
      }),
    ],
  },
  {
    id: "image",
    name: "Image",
    role: "normal",
    locked: false,
    hidden: false,
    muted: false,
    rowHeight: 40,
    actions: [
      a({
        id: "img-01",
        effectId: "image",
        start: 10.8,
        end: 13.8,
        kind: "image",
        title: "Infographic Card",
        icon: "🖼",
        color: "#3f6a8a",
      }),
      a({
        id: "img-02",
        effectId: "image",
        start: 24.2,
        end: 27,
        kind: "image",
        title: "Feature Slide",
        icon: "🖼",
        color: "#4c7f63",
      }),
      a({
        id: "img-03",
        effectId: "image",
        start: 42.2,
        end: 45.4,
        kind: "image",
        title: "End Card",
        icon: "🖼",
        color: "#3b5a7d",
      }),
    ],
  },
  {
    id: "text",
    name: "Text",
    role: "normal",
    locked: false,
    hidden: false,
    muted: false,
    rowHeight: 40,
    actions: [
      a({
        id: "txt-01",
        effectId: "text",
        start: 0.6,
        end: 4.8,
        kind: "text",
        title: "Welcome Title",
        icon: "𝑇",
        color: "#6f58d9",
      }),
      a({
        id: "txt-02",
        effectId: "text",
        start: 15.4,
        end: 21.6,
        kind: "text",
        title: "Key Message",
        icon: "𝑇",
        color: "#5b4bc2",
      }),
      a({
        id: "txt-03",
        effectId: "text",
        start: 34,
        end: 39.6,
        kind: "text",
        title: "CTA Overlay",
        icon: "𝑇",
        color: "#7a62dd",
      }),
    ],
  },
  {
    id: "video-main",
    name: "Main Video",
    role: "main",
    locked: false,
    hidden: false,
    muted: false,
    rowHeight: 70,
    actions: [
      a({
        id: "main-01",
        effectId: "video",
        start: 0,
        end: 11.5,
        inPoint: 0,
        outPoint: 11.5,
        kind: "video",
        title: "Opening Interview",
      }),
      a({
        id: "main-02",
        effectId: "video",
        start: 12,
        end: 26.8,
        inPoint: 3.4,
        outPoint: 18.2,
        kind: "video",
        title: "Product Story",
      }),
      a({
        id: "main-03",
        effectId: "video",
        start: 27.4,
        end: 43.6,
        inPoint: 0.8,
        outPoint: 17.0,
        kind: "video",
        title: "Closing Scene",
      }),
    ],
  },
  {
    id: "voice-over",
    name: "Voice",
    role: "audio",
    locked: false,
    hidden: false,
    muted: false,
    rowHeight: 50,
    actions: [
      a({
        id: "vo-01",
        effectId: "audio",
        start: 0,
        end: 22.6,
        inPoint: 0,
        outPoint: 22.6,
        kind: "audio",
        title: "Narration Part 1",
      }),
      a({
        id: "vo-02",
        effectId: "audio",
        start: 23.2,
        end: 45,
        inPoint: 1.2,
        outPoint: 23,
        kind: "audio",
        title: "Narration Part 2",
      }),
    ],
  },
  {
    id: "bgm",
    name: "Music",
    role: "audio",
    locked: false,
    hidden: false,
    muted: false,
    rowHeight: 50,
    actions: [
      a({
        id: "bgm-01",
        effectId: "audio",
        start: 0,
        end: 45.8,
        inPoint: 8,
        outPoint: 53.8,
        kind: "audio",
        title: "Background Music",
      }),
    ],
  },
];

/**
 * App主组件
 * @constructor
 */
export default function App() {
  // 编辑区数据
  const [editorData, setEditorData] = useState<TimelineRow[]>(() =>
    createDemoRows(),
  );
  // 播放状态
  const [playing, setPlaying] = useState(false);
  // 当前时间
  const [time, setTime] = useState(0);
  // 是否显示细刻度
  const [showMinorTicks, setShowMinorTicks] = useState(false);
  // 是否显示横线
  const [showHorizontalLines, setShowHorizontalLines] = useState(true);
  // 播放结束行为
  const [playEndBehavior, setPlayEndBehavior] = useState<"stop" | "loop">(
    "stop",
  );
  // 拖动时吸附clip边缘
  const [dragSnapToClipEdges, setDragSnapToClipEdges] = useState(true);
  // 拖动时吸附时间线刻度
  const [dragSnapToTimelineTicks, setDragSnapToTimelineTicks] = useState(true);
  // 裁剪时吸附时间线刻度
  const [trimSnapToTimelineTicks, setTrimSnapToTimelineTicks] = useState(true);
  // 裁剪时吸附clip边缘
  const [trimSnapToClipEdges, setTrimSnapToClipEdges] = useState(true);
  // 缩放
  const [zoom, setZoom] = useState(1);
  // 选中clip或行
  const [selection, setSelection] = useState<Selection>(null);
  const playRafRef = useRef<number | null>(null);
  const playLastTsRef = useRef<number | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const getRowControlState = useCallback(
    (rowId: string) => {
      const row = editorData.find((item) => item.id === rowId);
      return {
        locked: Boolean(row?.locked),
        hidden: Boolean(row?.hidden),
        muted: Boolean(row?.muted),
      };
    },
    [editorData],
  );

  /**
   * 根据selection找出选中的action
   */
  const selectedAction = useMemo(() => {
    if (!selection) return null;
    const row = editorData.find((item) => item.id === selection.rowId);
    if (!row) return null;
    return row.actions.find((item) => item.id === selection.actionId) ?? null;
  }, [editorData, selection]);
  const selectedRowLocked = useMemo(() => {
    if (!selection) return false;
    const row = editorData.find((item) => item.id === selection.rowId);
    return Boolean(row?.locked);
  }, [editorData, selection]);

  /**
   * 判断当前播放头是否在可以裁剪的位置
   */
  const canTrimToPlayhead = useMemo(() => {
    if (!selectedAction) return false;
    if (selectedRowLocked) return false;
    return time > selectedAction.start && time < selectedAction.end;
  }, [selectedAction, selectedRowLocked, time]);

  /**
   * 判断是否有选中可删除的action
   */
  const canDeleteSelected = useMemo(
    () => Boolean(selectedAction) && !selectedRowLocked,
    [selectedAction, selectedRowLocked],
  );
  const canCopySelected = useMemo(
    () => Boolean(selectedAction) && !selectedRowLocked,
    [selectedAction, selectedRowLocked],
  );

  /**
   * 判断当前播放头是否可以被split分割
   */
  const canSplitAtPlayhead = useMemo(() => {
    if (!selectedAction) return false;
    if (selectedRowLocked) return false;
    const left = time - selectedAction.start;
    const right = selectedAction.end - time;
    return left > MIN_EDIT_DURATION && right > MIN_EDIT_DURATION;
  }, [selectedAction, selectedRowLocked, time]);

  /**
   * 当前时间的格式化字符串
   */
  const currentTime = useMemo(() => formatTimeWithMs(time), [time]);
  const lastClipEnd = useMemo(() => {
    let maxEnd = 0;
    editorData.forEach((row) => {
      row.actions.forEach((action) => {
        maxEnd = Math.max(maxEnd, action.end);
      });
    });
    return Math.max(0, maxEnd);
  }, [editorData]);
  const timelineDuration = useMemo(() => {
    const paddingSeconds = pixelToTime(TIMELINE_END_PADDING_PX, zoom);
    const durationWithPadding = lastClipEnd + paddingSeconds;
    const mainViewportWidth = Math.max(0, stageWidth - TRACK_CONTROLS_WIDTH);
    const minDurationForViewport = pixelToTime(mainViewportWidth, zoom);
    return Math.max(1, durationWithPadding, minDurationForViewport);
  }, [lastClipEnd, stageWidth, zoom]);
  const playbackEnd = lastClipEnd;

  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const sync = () => setStageWidth(stageEl.clientWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stageEl);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (time <= timelineDuration) return;
    setTime(timelineDuration);
  }, [time, timelineDuration]);

  useEffect(() => {
    if (!playing) {
      if (playRafRef.current != null) cancelAnimationFrame(playRafRef.current);
      playRafRef.current = null;
      playLastTsRef.current = null;
      return;
    }
    if (playbackEnd <= 0) {
      setPlaying(false);
      return;
    }

    const tick = (now: number) => {
      const lastTs = playLastTsRef.current;
      playLastTsRef.current = now;
      if (lastTs == null) {
        playRafRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = (now - lastTs) / 1000;
      let shouldStop = false;
      setTime((prev) => {
        const next = prev + elapsed;
        if (next < playbackEnd) return next;
        if (playEndBehavior === "loop") return 0;
        shouldStop = true;
        return playbackEnd;
      });

      if (shouldStop) {
        setPlaying(false);
        playRafRef.current = null;
        playLastTsRef.current = null;
        return;
      }
      playRafRef.current = requestAnimationFrame(tick);
    };

    playRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (playRafRef.current != null) cancelAnimationFrame(playRafRef.current);
      playRafRef.current = null;
      playLastTsRef.current = null;
    };
  }, [playEndBehavior, playbackEnd, playing]);

  /**
   * 基于当前editorData+selection获取选中action上下文
   */
  const getSelectedActionContext = useCallback(
    (rows: TimelineRow[]) => {
      if (!selection) return null;
      const rowIndex = rows.findIndex((item) => item.id === selection.rowId);
      if (rowIndex < 0) return null;
      const row = rows[rowIndex];
      const actionIndex = row.actions.findIndex(
        (item) => item.id === selection.actionId,
      );
      if (actionIndex < 0) return null;
      const action = row.actions[actionIndex];
      return { rowIndex, actionIndex, row, action };
    },
    [selection],
  );

  /**
   * 生成分割后右侧clip的唯一id
   */
  const createSplitActionId = useCallback(
    (row: TimelineRow, baseId: string) => {
      const existing = new Set(row.actions.map((item) => item.id));
      let index = 1;
      let nextId = `${baseId}-split-${index}`;
      while (existing.has(nextId)) {
        index += 1;
        nextId = `${baseId}-split-${index}`;
      }
      return nextId;
    },
    [],
  );

  /**
   * 在播放头处分割选中clip
   */
  const handleSplitAtPlayhead = useCallback(() => {
    const ctx = getSelectedActionContext(editorData);
    if (!ctx) return;
    const { row, rowIndex, actionIndex, action } = ctx;
    if (Boolean(row.locked)) return;
    const left = time - action.start;
    const right = action.end - time;
    if (left <= MIN_EDIT_DURATION || right <= MIN_EDIT_DURATION) return;

    const sourceIn = Number(action.inPoint ?? 0);
    const sourceOut = Number(
      action.outPoint ?? sourceIn + (action.end - action.start),
    );
    const rightId = createSplitActionId(row, action.id);
    const leftAction: TimelineAction = {
      ...action,
      end: time,
      inPoint: sourceIn,
      outPoint: sourceIn + left,
    };
    const rightAction: TimelineAction = {
      ...action,
      id: rightId,
      start: time,
      inPoint: sourceIn + left,
      outPoint: sourceOut,
    };

    setEditorData((prev) =>
      prev.map((item, index) => {
        if (index !== rowIndex) return item;
        const actions = [...item.actions];
        actions.splice(actionIndex, 1, leftAction, rightAction);
        return { ...item, actions };
      }),
    );
    setSelection({ rowId: row.id, actionId: rightId });
    setPlaying(false);
  }, [createSplitActionId, editorData, getSelectedActionContext, time]);

  /**
   * 左裁剪到播放头
   */
  const handleTrimLeftToPlayhead = useCallback(() => {
    if (!canTrimToPlayhead) return;
    setEditorData((prev) => {
      const ctx = getSelectedActionContext(prev);
      if (!ctx) return prev;
      const { row, action } = ctx;
      if (Boolean(row.locked)) return prev;
      const nextStart = Math.min(Math.max(time, action.start), action.end);
      const delta = nextStart - action.start;
      return prev.map((track) => {
        if (track.id !== row.id) return track;
        return {
          ...track,
          actions: track.actions.map((item) =>
            item.id === action.id
              ? {
                  ...item,
                  start: nextStart,
                  inPoint: Number(item.inPoint ?? 0) + delta,
                }
              : item,
          ),
        };
      });
    });
    setPlaying(false);
  }, [canTrimToPlayhead, getSelectedActionContext, time]);

  /**
   * 右裁剪到播放头
   */
  const handleTrimRightToPlayhead = useCallback(() => {
    if (!canTrimToPlayhead) return;
    setEditorData((prev) => {
      const ctx = getSelectedActionContext(prev);
      if (!ctx) return prev;
      const { row, action } = ctx;
      if (Boolean(row.locked)) return prev;
      const nextEnd = Math.max(Math.min(time, action.end), action.start);
      const delta = nextEnd - action.end;
      return prev.map((track) => {
        if (track.id !== row.id) return track;
        return {
          ...track,
          actions: track.actions.map((item) =>
            item.id === action.id
              ? {
                  ...item,
                  end: nextEnd,
                  outPoint: Number(item.outPoint ?? item.inPoint ?? 0) + delta,
                }
              : item,
          ),
        };
      });
    });
    setPlaying(false);
  }, [canTrimToPlayhead, getSelectedActionContext, time]);

  /**
   * 删除当前选中的clip
   */
  const handleDeleteSelectedClip = useCallback(() => {
    if (!selection) return;
    setEditorData((prev) => {
      const locked = prev.find((track) => track.id === selection.rowId)?.locked;
      if (Boolean(locked)) return prev;
      const next = prev
        .map((track) => {
          if (track.id !== selection.rowId) return track;
          return {
            ...track,
            actions: track.actions.filter(
              (item) => item.id !== selection.actionId,
            ),
          };
        })
        .filter((track) => track.actions.length > 0);
      return next;
    });
    setSelection(null);
    setPlaying(false);
  }, [selection]);

  /**
   * 复制当前选中clip到新轨道（插入到当前轨道下方）
   */
  const handleCopySelectedToNewTrack = useCallback(() => {
    if (!selection) return;
    let nextSelection: Selection = null;
    setEditorData((prev) => {
      const rowIndex = prev.findIndex((track) => track.id === selection.rowId);
      if (rowIndex < 0) return prev;
      const sourceRow = prev[rowIndex];
      if (Boolean(sourceRow.locked)) return prev;
      const sourceAction = sourceRow.actions.find(
        (item) => item.id === selection.actionId,
      );
      if (!sourceAction) return prev;

      const rowIds = new Set(prev.map((track) => track.id));
      let rowSeq = prev.length + 1;
      let newRowId = `track-${rowSeq}`;
      while (rowIds.has(newRowId)) {
        rowSeq += 1;
        newRowId = `track-${rowSeq}`;
      }

      const actionIds = new Set(
        prev.flatMap((track) => track.actions.map((item) => item.id)),
      );
      let actionSeq = 1;
      let newActionId = `${sourceAction.id}-copy-${actionSeq}`;
      while (actionIds.has(newActionId)) {
        actionSeq += 1;
        newActionId = `${sourceAction.id}-copy-${actionSeq}`;
      }

      const copiedAction: TimelineAction = {
        ...sourceAction,
        id: newActionId,
      };
      const fallbackRowHeight =
        sourceAction.kind === "video"
          ? TRACK_HEIGHT_PRESETS.video
          : sourceAction.kind === "audio"
            ? TRACK_HEIGHT_PRESETS.audio
            : sourceAction.kind === "image"
              ? TRACK_HEIGHT_PRESETS.image
              : sourceAction.kind === "text"
                ? TRACK_HEIGHT_PRESETS.text
                : sourceAction.kind === "solid"
                  ? TRACK_HEIGHT_PRESETS.solid
                  : TRACK_HEIGHT_PRESETS.main;
      const newRow: TimelineRow = {
        id: newRowId,
        name: `${sourceRow.name ?? "Track"} Copy`,
        // Main track must be unique: copied clips always go to non-main rows.
        role: sourceAction.kind === "audio" ? "audio" : "normal",
        locked: false,
        hidden: false,
        muted: false,
        rowHeight: fallbackRowHeight,
        actions: [copiedAction],
      };

      const nextRows = [...prev];
      nextRows.splice(rowIndex, 0, newRow);
      nextSelection = { rowId: newRowId, actionId: newActionId };
      return nextRows;
    });
    if (nextSelection) setSelection(nextSelection);
    setPlaying(false);
  }, [selection]);

  /**
   * 点击timeline时间区，跳转播放头
   * @param nextTime
   * @returns {boolean}
   */
  const handleClickTimeArea = useCallback((nextTime: number) => {
    setPlaying(false);
    setTime(nextTime);
    return true;
  }, []);

  /**
   * 拖拽clip移动中的回调
   * @param _params
   * @returns {boolean}
   */
  const handleActionMoving = useCallback(
    (params: {
      action: TimelineAction;
      row: TimelineRow;
      start: number;
      end: number;
      targetRowId?: string;
      insertRowIndex?: number | null;
    }) => {
      // 锁定轨道禁止移动（源轨道或目标轨道）
      if (getRowControlState(params.row.id).locked) return false;
      if (params.targetRowId && getRowControlState(params.targetRowId).locked) {
        return false;
      }
      return true;
    },
    [getRowControlState],
  );

  /**
   * 拖拽clip移动结束的回调，写回start/end
   * @param params
   */
  const handleActionMoveEnd = useCallback(
    (params: {
      action: TimelineAction;
      row: TimelineRow;
      start: number;
      end: number;
      targetRowId?: string;
      insertRowIndex?: number | null;
    }) => {
      const { action, row, start, end, targetRowId, insertRowIndex } = params;
      if (getRowControlState(row.id).locked) return;
      setEditorData((prev) => {
        const originIndex = prev.findIndex((track) => track.id === row.id);
        if (originIndex < 0) return prev;
        const originRow = prev[originIndex];
        const originAction =
          originRow.actions.find((item) => item.id === action.id) ?? action;
        const movedAction: TimelineAction = { ...originAction, start, end };

        const rowsWithoutAction = prev.map((track) => ({
          ...track,
          actions: track.actions.filter((item) => item.id !== action.id),
        }));

        if (insertRowIndex != null) {
          const existingIds = new Set(
            rowsWithoutAction.map((track) => track.id),
          );
          let nextIndex = rowsWithoutAction.length + 1;
          let newId = `track-${nextIndex}`;
          while (existingIds.has(newId)) {
            nextIndex += 1;
            newId = `track-${nextIndex}`;
          }
          const role = movedAction.kind === "audio" ? "audio" : "normal";
          const rowHeight =
            movedAction.kind === "video"
              ? TRACK_HEIGHT_PRESETS.video
              : movedAction.kind === "audio"
                ? TRACK_HEIGHT_PRESETS.audio
                : movedAction.kind === "image"
                  ? TRACK_HEIGHT_PRESETS.image
                  : movedAction.kind === "text"
                    ? TRACK_HEIGHT_PRESETS.text
                    : movedAction.kind === "solid"
                      ? TRACK_HEIGHT_PRESETS.solid
                      : TRACK_HEIGHT_PRESETS.main;
          const newRow: TimelineRow = {
            id: newId,
            role,
            name: `Track ${nextIndex}`,
            locked: false,
            hidden: false,
            muted: false,
            rowHeight,
            actions: [movedAction],
          };
          const nextRows = [...rowsWithoutAction];
          const safeInsertIndex = Math.max(
            0,
            Math.min(insertRowIndex, nextRows.length),
          );
          nextRows.splice(safeInsertIndex, 0, newRow);
          return nextRows.filter((track) => track.actions.length > 0);
        }

        const nextRows = rowsWithoutAction.map((track) => {
          if (track.id !== targetRowId) return track;
          return {
            ...track,
            actions: [...track.actions, movedAction].sort(
              (a, b) => a.start - b.start,
            ),
          };
        });

        return nextRows.filter((track) => track.actions.length > 0);
      });
      setSelection({ rowId: targetRowId ?? row.id, actionId: action.id });
    },
    [getRowControlState],
  );

  /**
   * 裁剪resize中的约束检测回调
   * @param _params
   * @returns {boolean}
   */
  const handleActionResizing = useCallback(
    (params: {
      action: TimelineAction;
      row: TimelineRow;
      start: number;
      end: number;
      dir: "right" | "left";
    }) => {
      if (getRowControlState(params.row.id).locked) return false;
      return true;
    },
    [getRowControlState],
  );

  /**
   * 裁剪resize结束后写回start/end
   * @param params
   */
  const handleActionResizeEnd = useCallback(
    (params: {
      action: TimelineAction;
      row: TimelineRow;
      start: number;
      end: number;
      dir: "right" | "left";
    }) => {
      const { action, row, start, end, dir } = params;
      if (getRowControlState(row.id).locked) return;
      setEditorData((prev) =>
        prev.map((track) => {
          if (track.id !== row.id) return track;
          return {
            ...track,
            actions: track.actions.map((item) => {
              if (item.id !== action.id) return item;
              return dir === "left"
                ? { ...item, start, end: item.end }
                : { ...item, start: item.start, end };
            }),
          };
        }),
      );
    },
    [getRowControlState],
  );

  /**
   * 拖动播放头时更新当前时间
   * @param nextTime
   */
  const handleCursorDrag = useCallback((nextTime: number) => {
    setTime(nextTime);
  }, []);

  /**
   * 播放头拖动结束时同步当前时间
   * @param nextTime
   */
  const handleCursorDragEnd = useCallback((nextTime: number) => {
    setTime(nextTime);
  }, []);

  /**
   * 点击空白行时，跳转播放头并取消选择
   * @param _e
   * @param param
   */
  const handleClickRow = useCallback(
    (
      _e: React.MouseEvent<HTMLElement>,
      param: { row: TimelineRow; time: number },
    ) => {
      void param.row;
      setPlaying(false);
      setTime(param.time);
      setSelection(null);
    },
    [],
  );

  /**
   * 仅点击clip时，切换选中状态
   * @param _e
   * @param param
   */
  const handleClickActionOnly = useCallback(
    (
      _e: React.MouseEvent<HTMLElement>,
      param: { action: TimelineAction; row: TimelineRow; time: number },
    ) => {
      void param.time;
      setSelection({ rowId: param.row.id, actionId: param.action.id });
    },
    [],
  );

  /**
   * 双击clip时，播放头跳到该位置
   * @param _e
   * @param param
   */
  const handleDoubleClickAction = useCallback(
    (
      _e: React.MouseEvent<HTMLElement>,
      param: { action: TimelineAction; row: TimelineRow; time: number },
    ) => {
      void param.action;
      void param.row;
      setTime(param.time);
    },
    [],
  );

  /**
   * 当前时间进度百分比
   */
  const timeProgress = useMemo(
    () => ((time / timelineDuration) * 100).toFixed(1),
    [time, timelineDuration],
  );

  /**
   * 当前缩放的百分比
   */
  const zoomPercent = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);
  const getActionRender = useCallback((action: TimelineAction) => {
    const icon = String(action.icon ?? "▣");
    const title = String(action.title ?? action.effectId ?? action.id);
    const color = String(action.color ?? "#334155");
    return (
      <>
        <div className="clip-item-icon">{icon}</div>
        <div className="clip-item-content">
          <div className="clip-item-label" style={{ color: "#e2e8f0" }}>
            {title}
          </div>
          <div
            style={{
              fontSize: 10,
              lineHeight: "12px",
              opacity: 0.8,
              color: "#cbd5e1",
            }}
          >
            {action.effectId}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: color,
            opacity: 0.2,
            pointerEvents: "none",
          }}
        />
      </>
    );
  }, []);
  const renderTrackControls = useCallback(
    (row: TimelineRow) => {
      const state = getRowControlState(row.id);
      const role = (row as { role?: unknown }).role;
      const isMainTrack = role === "main";
      const actions = (row.actions ?? []) as Array<{ kind?: unknown }>;
      const hasAudioAction = actions.some((item) => item.kind === "audio");
      const hasVideoAction = actions.some((item) => item.kind === "video");
      const isAudioTrack = role === "audio" || hasAudioAction;
      const isVideoTrack = role === "main" || hasVideoAction;
      const showHideButton = !isAudioTrack;
      const showMuteButton = isAudioTrack || isVideoTrack;
      const hiddenStyle = {
        visibility: "hidden" as const,
        pointerEvents: "none" as const,
      };
      return (
        <div className="timeline-track-controls">
          <button
            type="button"
            className={`timeline-track-btn${state.locked ? " active" : ""}`}
            onClick={() =>
              setEditorData((prev) =>
                prev.map((track) =>
                  track.id === row.id
                    ? { ...track, locked: !Boolean(track.locked) }
                    : track,
                ),
              )
            }
            title={state.locked ? "Unlock Track" : "Lock Track"}
          >
            {state.locked ? "🔒" : "🔓"}
          </button>
          <button
            type="button"
            className={`timeline-track-btn${state.hidden ? " active" : ""}`}
            style={showHideButton ? undefined : hiddenStyle}
            onClick={() =>
              setEditorData((prev) =>
                prev.map((track) =>
                  track.id === row.id
                    ? { ...track, hidden: !Boolean(track.hidden) }
                    : track,
                ),
              )
            }
            title={state.hidden ? "Show Track" : "Hide Track"}
          >
            {state.hidden ? "🙈" : "👁"}
          </button>
          <button
            type="button"
            className={`timeline-track-btn${state.muted ? " active" : ""}`}
            style={showMuteButton ? undefined : hiddenStyle}
            onClick={() =>
              setEditorData((prev) =>
                prev.map((track) =>
                  track.id === row.id
                    ? { ...track, muted: !Boolean(track.muted) }
                    : track,
                ),
              )
            }
            title={state.muted ? "Unmute Track" : "Mute Track"}
          >
            {state.muted ? "🔇" : "🔊"}
          </button>
          <button
            type="button"
            className="timeline-track-btn danger"
            disabled={isMainTrack}
            onClick={() => {
              if (isMainTrack) return;
              setEditorData((prev) =>
                prev.filter((track) => track.id !== row.id),
              );
              if (selection?.rowId === row.id) setSelection(null);
            }}
            title={
              isMainTrack ? "Main Track cannot be deleted" : "Delete Track"
            }
          >
            🗑
          </button>
        </div>
      );
    },
    [getRowControlState, selection?.rowId],
  );

  return (
    <div className="demo-page">
      <header className="demo-header">
        <div className="demo-header-row">
          <div className="demo-brand">
            <div className="demo-title-group">
              <img
                className="demo-logo"
                src="/logo.png"
                alt="ViteCutTimeline Logo"
              />
            </div>
          </div>
          <a
            className="github-link"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
        <p className="demo-subtitle">
          Hybrid Canvas + DOM timeline with drag, trim, snapping and
          virtualization.
        </p>
      </header>

      <section className="panel">
        <div className="panel-row">
          <button
            type="button"
            className={`primary-btn play-btn ${playing ? "play-btn-playing" : "play-btn-paused"}`}
            onClick={() => setPlaying((v) => !v)}
          >
            <span className="play-btn-icon" aria-hidden="true">
              {playing ? "⏸" : "▶"}
            </span>
            <span>{playing ? "Pause" : "Play"}</span>
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setTime(0)}
          >
            Jump To Start
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setPlaying(false);
              setTime(playbackEnd);
            }}
          >
            Jump To End
          </button>
          <div className="meta-group">
            <span className="meta-item">Time {currentTime}</span>
            <span className="meta-item">Progress {timeProgress}%</span>
          </div>
        </div>

        <div className="panel-row panel-row-wrap">
          <fieldset className="control-group">
            <legend>Playback</legend>
            <label>
              <input
                type="checkbox"
                checked={playEndBehavior === "loop"}
                onChange={(e) =>
                  setPlayEndBehavior(e.target.checked ? "loop" : "stop")
                }
              />
              Loop At Last Clip End
            </label>
          </fieldset>

          <fieldset className="control-group">
            <legend>Grid</legend>
            <label>
              <input
                type="checkbox"
                checked={showMinorTicks}
                onChange={(e) => setShowMinorTicks(e.target.checked)}
              />
              Minor Ticks
            </label>
            <label>
              <input
                type="checkbox"
                checked={showHorizontalLines}
                onChange={(e) => setShowHorizontalLines(e.target.checked)}
              />
              Horizontal Lines
            </label>
          </fieldset>

          <fieldset className="control-group">
            <legend>Drag Snap</legend>
            <label>
              <input
                type="checkbox"
                checked={dragSnapToClipEdges}
                onChange={(e) => setDragSnapToClipEdges(e.target.checked)}
              />
              Clip Edges
            </label>
            <label>
              <input
                type="checkbox"
                checked={dragSnapToTimelineTicks}
                onChange={(e) => setDragSnapToTimelineTicks(e.target.checked)}
              />
              Timeline Ticks
            </label>
          </fieldset>

          <fieldset className="control-group">
            <legend>Trim Snap</legend>
            <label>
              <input
                type="checkbox"
                checked={trimSnapToTimelineTicks}
                onChange={(e) => setTrimSnapToTimelineTicks(e.target.checked)}
              />
              Timeline Ticks
            </label>
            <label>
              <input
                type="checkbox"
                checked={trimSnapToClipEdges}
                onChange={(e) => setTrimSnapToClipEdges(e.target.checked)}
              />
              Clip Edges
            </label>
          </fieldset>

          <fieldset className="control-group">
            <legend>Edit</legend>
            <button
              type="button"
              className="ghost-btn"
              onClick={handleTrimLeftToPlayhead}
              disabled={!canTrimToPlayhead}
            >
              Trim Left
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={handleSplitAtPlayhead}
              disabled={!canSplitAtPlayhead}
            >
              Split
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={handleTrimRightToPlayhead}
              disabled={!canTrimToPlayhead}
            >
              Trim Right
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={handleDeleteSelectedClip}
              disabled={!canDeleteSelected}
            >
              Delete
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={handleCopySelectedToNewTrack}
              disabled={!canCopySelected}
            >
              Copy To New Track
            </button>
          </fieldset>

          <fieldset className="control-group control-group-zoom">
            <legend>Zoom</legend>
            <button
              type="button"
              className="ghost-btn zoom-btn"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}
            >
              -
            </button>
            <input
              className="zoom-slider"
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <button
              type="button"
              className="ghost-btn zoom-btn"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}
            >
              +
            </button>
            <span className="zoom-value">{zoomPercent}</span>
          </fieldset>
          <p className="hint">Tip: Hold Ctrl/Cmd + mouse wheel to zoom.</p>
        </div>
      </section>

      <section ref={stageRef} className="stage">
        <Timeline
          // 时间轴编辑数据
          editorData={editorData}
          // 总时长
          duration={timelineDuration}
          // 播放状态
          playing={playing}
          // 当前播放时间
          currentTime={time}
          // 是否显示次级刻度线
          showMinorTicks={showMinorTicks}
          // 是否显示横向分割线
          showHorizontalLines={showHorizontalLines}
          // 裁剪时吸附到时间线刻度
          trimSnapToTimelineTicks={trimSnapToTimelineTicks}
          // 拖拽时吸附到素材边缘
          dragSnapToClipEdges={dragSnapToClipEdges}
          // 拖拽时吸附到时间线刻度
          dragSnapToTimelineTicks={dragSnapToTimelineTicks}
          // 裁剪时吸附到素材边缘
          trimSnapToClipEdges={trimSnapToClipEdges}
          // 最小缩放比例
          minZoom={MIN_ZOOM}
          // 最大缩放比例
          maxZoom={MAX_ZOOM}
          // 当前缩放比例
          zoom={zoom}
          // 轨道间距
          trackGap={TRACK_GAP}
          // 轨道高度预设
          trackHeightPresets={TRACK_HEIGHT_PRESETS}
          // 轨道控制区宽度由外部传入
          trackControlsWidth={TRACK_CONTROLS_WIDTH}
          // 轨道面板头部由外部渲染
          renderTrackPanelHeader={<span>Tracks</span>}
          // 轨道控制区逻辑在外部实现（先不影响轨道样式）
          renderTrackControls={renderTrackControls}
          // 自定义action渲染（业务样式在外部实现）
          getActionRender={getActionRender}
          // 缩放变化回调（用于Ctrl/Cmd+滚轮缩放时回写外部状态）
          onZoomChange={setZoom}
          // 拖拽移动过程中：若轨道已锁定则直接阻止移动
          onActionMoving={handleActionMoving}
          // 拖拽移动 clip 结束后：写回 start/end（若轨道未锁定）
          onActionMoveEnd={handleActionMoveEnd}
          // 音频 clip resize 约束：只允许缩短或恢复到素材原始时长，不允许拉长超出素材
          onActionResizing={handleActionResizing}
          // 改变 clip 长度结束后：写回 start/end（例如裁剪时长），锁定轨道则忽略
          // - 左侧 resize：只改变起始时间，结束时间保持不变
          // - 右侧 resize：只改变结束时间，起始时间保持不变
          onActionResizeEnd={handleActionResizeEnd}
          // 拖动光标事件，处理当前时间更新
          onCursorDrag={handleCursorDrag}
          // 光标拖动结束事件（常用于同步全局状态）
          onCursorDragEnd={handleCursorDragEnd}
          // 区域点击回调，跳到指定时间并暂停播放，需多处更新本地及全局播放状态
          onClickTimeArea={handleClickTimeArea}
          // 点击轨道行空白处：同样跳到该位置时间并暂停（时间线跟着动）
          onClickRow={handleClickRow}
          // 仅点击 clip 时：切换选中态（库会根据 selected 在 action 根节点加 class）
          onClickActionOnly={handleClickActionOnly}
          // 双击 clip：将播放头定位到双击位置
          onDoubleClickAction={handleDoubleClickAction}
        />
      </section>
    </div>
  );
}

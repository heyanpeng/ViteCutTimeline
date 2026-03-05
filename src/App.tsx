import { useCallback, useMemo, useState } from "react";
import { Timeline } from "./timeline/Timeline";
import type { Selection, TimelineAction, TimelineRow } from "./timeline/types";
import { formatTimeWithMs } from "./timeline/utils";
import "./App.css";

const DURATION = 120;
const GITHUB_URL = "https://github.com/heyanpeng/ViteCutTimeline";
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
const TRACK_GAP = 6;
const TRACK_HEIGHT_PRESETS = {
  main: 70,
  video: 50,
  audio: 50,
  image: 40,
  text: 40,
  solid: 40,
};
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
    id: "text",
    name: "Text",
    role: "normal",
    rowHeight: 40,
    actions: [
      a({
        id: "txt-1",
        effectId: "text",
        start: 1,
        end: 6,
        kind: "text",
        title: "Open Title",
        icon: "𝑇",
        color: "#6f58d9",
      }),
      a({
        id: "txt-2",
        effectId: "text",
        start: 18,
        end: 24,
        kind: "text",
        title: "Subtitle",
        icon: "𝑇",
        color: "#5b4bc2",
      }),
    ],
  },
  {
    id: "image",
    name: "Image",
    role: "normal",
    rowHeight: 40,
    actions: [
      a({
        id: "img-1",
        effectId: "image",
        start: 8,
        end: 13,
        kind: "image",
        title: "Hero Image",
        icon: "🖼",
        color: "#3a7d44",
      }),
      a({
        id: "img-2",
        effectId: "image",
        start: 25,
        end: 31,
        kind: "image",
        title: "Outro Card",
        icon: "🖼",
        color: "#2f6f39",
      }),
    ],
  },
  {
    id: "video-main",
    name: "Main Video",
    role: "main",
    rowHeight: 70,
    actions: [
      a({
        id: "v1",
        effectId: "video",
        start: 0,
        end: 16,
        inPoint: 0,
        outPoint: 16,
        kind: "video",
        title: "A-Roll 01",
      }),
      a({
        id: "v2",
        effectId: "video",
        start: 17,
        end: 36,
        inPoint: 2.2,
        outPoint: 21.2,
        kind: "video",
        title: "A-Roll 02",
      }),
    ],
  },
  {
    id: "audio",
    name: "Audio",
    role: "audio",
    rowHeight: 50,
    actions: [
      a({
        id: "a1",
        effectId: "audio",
        start: 0,
        end: 18,
        inPoint: 0,
        outPoint: 18,
        kind: "audio",
        title: "Voice Over",
      }),
      a({
        id: "a2",
        effectId: "audio",
        start: 18.5,
        end: 36,
        inPoint: 1,
        outPoint: 18.5,
        kind: "audio",
        title: "BGM",
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
  // 裁剪时吸附时间线刻度
  const [trimSnapToTimelineTicks, setTrimSnapToTimelineTicks] = useState(true);
  // 裁剪时吸附clip边缘
  const [trimSnapToClipEdges, setTrimSnapToClipEdges] = useState(true);
  // 缩放
  const [zoom, setZoom] = useState(1);
  // 选中clip或行
  const [selection, setSelection] = useState<Selection>(null);

  /**
   * 根据selection找出选中的action
   */
  const selectedAction = useMemo(() => {
    if (!selection) return null;
    const row = editorData.find((item) => item.id === selection.rowId);
    if (!row) return null;
    return row.actions.find((item) => item.id === selection.actionId) ?? null;
  }, [editorData, selection]);

  /**
   * 判断当前播放头是否在可以裁剪的位置
   */
  const canTrimToPlayhead = useMemo(() => {
    if (!selectedAction) return false;
    return time > selectedAction.start && time < selectedAction.end;
  }, [selectedAction, time]);

  /**
   * 判断是否有选中可删除的action
   */
  const canDeleteSelected = useMemo(
    () => Boolean(selectedAction),
    [selectedAction],
  );

  /**
   * 判断当前播放头是否可以被split分割
   */
  const canSplitAtPlayhead = useMemo(() => {
    if (!selectedAction) return false;
    const left = time - selectedAction.start;
    const right = selectedAction.end - time;
    return left > MIN_EDIT_DURATION && right > MIN_EDIT_DURATION;
  }, [selectedAction, time]);

  /**
   * 当前时间的格式化字符串
   */
  const currentTime = useMemo(() => formatTimeWithMs(time), [time]);

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
    const left = time - action.start;
    const right = action.end - time;
    if (left <= MIN_EDIT_DURATION || right <= MIN_EDIT_DURATION) return;

    const sourceIn = action.inPoint ?? 0;
    const sourceOut = action.outPoint ?? sourceIn + (action.end - action.start);
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
                  inPoint: (item.inPoint ?? 0) + delta,
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
                  outPoint: (item.outPoint ?? item.inPoint ?? 0) + delta,
                }
              : item,
          ),
        };
      });
    });
    setPlaying(false);
  }, [canTrimToPlayhead, getSelectedActionContext, time]);

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
    (_params: {
      action: TimelineAction;
      row: TimelineRow;
      start: number;
      end: number;
      targetRowId?: string;
      insertRowIndex?: number | null;
    }) => {
      return true;
    },
    [],
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
          const existingIds = new Set(rowsWithoutAction.map((track) => track.id));
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
            rowHeight,
            actions: [movedAction],
          };
          const nextRows = [...rowsWithoutAction];
          const safeInsertIndex = Math.max(
            0,
            Math.min(insertRowIndex, nextRows.length),
          );
          nextRows.splice(safeInsertIndex, 0, newRow);
          return nextRows.filter(
            (track) => !(track.role !== "main" && track.actions.length === 0),
          );
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

        return nextRows.filter(
          (track) => !(track.role !== "main" && track.actions.length === 0),
        );
      });
      setSelection({ rowId: targetRowId ?? row.id, actionId: action.id });
    },
    [],
  );

  /**
   * 裁剪resize中的约束检测回调
   * @param _params
   * @returns {boolean}
   */
  const handleActionResizing = useCallback(
    (_params: {
      action: TimelineAction;
      row: TimelineRow;
      start: number;
      end: number;
      dir: "right" | "left";
    }) => {
      return true;
    },
    [],
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
    [],
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
    () => ((time / DURATION) * 100).toFixed(1),
    [time],
  );

  /**
   * 当前缩放的百分比
   */
  const zoomPercent = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

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
            className="primary-btn play-btn"
            onClick={() => setPlaying((v) => !v)}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setTime(0)}
          >
            Jump To Start
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

      <section className="stage">
        <Timeline
          // 时间轴编辑数据
          editorData={editorData}
          // 总时长
          duration={DURATION}
          // 播放状态
          playing={playing}
          // 播放结束行为（停止/循环）
          playEndBehavior={playEndBehavior}
          // 当前播放时间
          currentTime={time}
          // 是否显示次级刻度线
          showMinorTicks={showMinorTicks}
          // 是否显示横向分割线
          showHorizontalLines={showHorizontalLines}
          // 裁剪时吸附到时间线刻度
          trimSnapToTimelineTicks={trimSnapToTimelineTicks}
          // 裁剪时吸附阈值（像素）
          // trimSnapThresholdPx={SNAP_PX}
          // 裁剪时吸附刻度模式（minor/major）
          // trimSnapTickMode={"major"}
          // 拖拽时吸附到素材边缘
          dragSnapToClipEdges={dragSnapToClipEdges}
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

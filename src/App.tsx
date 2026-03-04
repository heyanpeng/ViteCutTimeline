import { useCallback, useMemo, useRef, useState } from "react";
import { Timeline, type TimelineRef } from "./timeline/Timeline";
import type { TimelineAction, TimelineRow } from "./timeline/model";
import type { Selection } from "./timeline/types";
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

const a = (data: TimelineAction): TimelineAction => data;

const createDemoRows = (): TimelineRow[] => [
  {
    id: "text",
    name: "Text",
    role: "normal",
    height: 40,
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
    height: 40,
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
    height: 70,
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
    height: 50,
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

export default function App() {
  const timelineRef = useRef<TimelineRef | null>(null);
  const [editorData, setEditorData] = useState<TimelineRow[]>(() =>
    createDemoRows(),
  );
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [showMinorTicks, setShowMinorTicks] = useState(false);
  const [showHorizontalLines, setShowHorizontalLines] = useState(true);
  const [playEndBehavior, setPlayEndBehavior] = useState<"stop" | "loop">(
    "stop",
  );
  const [dragSnapToClipEdges, setDragSnapToClipEdges] = useState(true);
  const [trimSnapToTimelineTicks, setTrimSnapToTimelineTicks] = useState(false);
  const [trimSnapToClipEdges, setTrimSnapToClipEdges] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selection, setSelection] = useState<Selection>(null);

  const selectedAction = useMemo(() => {
    if (!selection) return null;
    const row = editorData.find((item) => item.id === selection.rowId);
    if (!row) return null;
    return row.actions.find((item) => item.id === selection.actionId) ?? null;
  }, [editorData, selection]);

  const canTrimToPlayhead = useMemo(() => {
    if (!selectedAction) return false;
    return time > selectedAction.start && time < selectedAction.end;
  }, [selectedAction, time]);
  const canDeleteSelected = useMemo(() => Boolean(selectedAction), [selectedAction]);

  const canSplitAtPlayhead = useMemo(() => {
    if (!selectedAction) return false;
    const left = time - selectedAction.start;
    const right = selectedAction.end - time;
    return left > MIN_EDIT_DURATION && right > MIN_EDIT_DURATION;
  }, [selectedAction, time]);

  const currentTime = useMemo(() => formatTimeWithMs(time), [time]);
  const onBlankAreaPointerDown = useCallback((nextTime: number) => {
    setTime(nextTime);
  }, []);
  const handleSeekFromRulerPointerDown = useCallback((nextTime: number) => {
    setTime(nextTime);
  }, []);
  const handleSeekFromRulerDoubleClick = useCallback((nextTime: number) => {
    setTime(nextTime);
  }, []);
  const timeProgress = useMemo(
    () => ((time / DURATION) * 100).toFixed(1),
    [time],
  );
  const zoomPercent = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

  return (
    <div className="demo-page">
      <header className="demo-header">
        <div className="demo-header-row">
          <div>
            <p className="demo-badge">Open Source Demo</p>
            <h1>VitCut Timeline Playground</h1>
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
              disabled={!canTrimToPlayhead}
              onClick={() => timelineRef.current?.trimLeftToPlayhead()}
            >
              Trim Left
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={!canSplitAtPlayhead}
              onClick={() => timelineRef.current?.splitAtPlayhead()}
            >
              Split
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={!canTrimToPlayhead}
              onClick={() => timelineRef.current?.trimRightToPlayhead()}
            >
              Trim Right
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={!canDeleteSelected}
              onClick={() => timelineRef.current?.deleteSelectedClip()}
            >
              Delete
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
            <button
              type="button"
              className="ghost-btn"
              onClick={() => timelineRef.current?.fitToContent()}
            >
              Fit
            </button>
            <span className="zoom-value">{zoomPercent}</span>
          </fieldset>
          <p className="hint">Tip: Hold Ctrl/Cmd + mouse wheel to zoom.</p>
        </div>
      </section>

      <section className="stage">
        <Timeline
          ref={timelineRef}
          editorData={editorData}
          duration={DURATION}
          playing={playing}
          playEndBehavior={playEndBehavior}
          currentTime={time}
          showMinorTicks={showMinorTicks}
          showHorizontalLines={showHorizontalLines}
          trimSnapToTimelineTicks={trimSnapToTimelineTicks}
          dragSnapToClipEdges={dragSnapToClipEdges}
          trimSnapToClipEdges={trimSnapToClipEdges}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          zoom={zoom}
          trackGap={TRACK_GAP}
          trackHeightPresets={TRACK_HEIGHT_PRESETS}
          onEditorDataChange={setEditorData}
          onTimeChange={setTime}
          onPlayingChange={setPlaying}
          onZoomChange={setZoom}
          onRulerPointerDown={handleSeekFromRulerPointerDown}
          onBlankAreaPointerDown={onBlankAreaPointerDown}
          onRulerDoubleClick={handleSeekFromRulerDoubleClick}
          onSelectionChange={setSelection}
        />
      </section>

    </div>
  );
}

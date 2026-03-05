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
    name: "Captions",
    role: "normal",
    height: 38,
    actions: [
      a({
        id: "cap-1",
        effectId: "text",
        start: 2,
        end: 8,
        kind: "text",
        title: "Episode Title",
        icon: "𝑇",
        color: "#7b61ff",
      }),
      a({
        id: "cap-2",
        effectId: "text",
        start: 14,
        end: 19,
        kind: "text",
        title: "Location Lower Third",
        icon: "𝑇",
        color: "#6e56e8",
      }),
      a({
        id: "cap-3",
        effectId: "text",
        start: 31,
        end: 36,
        kind: "text",
        title: "Key Point Callout",
        icon: "𝑇",
        color: "#624dd6",
      }),
      a({
        id: "cap-4",
        effectId: "text",
        start: 47,
        end: 55,
        kind: "text",
        title: "Chapter Marker",
        icon: "𝑇",
        color: "#755af3",
      }),
      a({
        id: "cap-5",
        effectId: "text",
        start: 72,
        end: 82,
        kind: "text",
        title: "CTA Overlay",
        icon: "𝑇",
        color: "#5a46c7",
      }),
    ],
  },
  {
    id: "image",
    name: "Graphics",
    role: "normal",
    height: 40,
    actions: [
      a({
        id: "gfx-1",
        effectId: "image",
        start: 6,
        end: 13,
        kind: "image",
        title: "Brand Logo Intro",
        icon: "🖼",
        color: "#0f8fb8",
      }),
      a({
        id: "gfx-2",
        effectId: "image",
        start: 33,
        end: 41,
        kind: "image",
        title: "Data Board",
        icon: "🖼",
        color: "#0d7ca1",
      }),
      a({
        id: "gfx-3",
        effectId: "image",
        start: 58,
        end: 66,
        kind: "image",
        title: "Comparison Chart",
        icon: "🖼",
        color: "#1399c4",
      }),
      a({
        id: "gfx-4",
        effectId: "image",
        start: 84,
        end: 92,
        kind: "image",
        title: "Outro Card",
        icon: "🖼",
        color: "#0b6d90",
      }),
    ],
  },
  {
    id: "video-broll",
    name: "B-Roll",
    role: "normal",
    height: 54,
    actions: [
      a({
        id: "b1",
        effectId: "video",
        start: 9,
        end: 16,
        inPoint: 4,
        outPoint: 11,
        kind: "video",
        title: "Office Wide Shot",
        color: "#2b5de8",
      }),
      a({
        id: "b2",
        effectId: "video",
        start: 22,
        end: 28,
        inPoint: 8,
        outPoint: 14,
        kind: "video",
        title: "Keyboard Macro",
        color: "#2752cf",
      }),
      a({
        id: "b3",
        effectId: "video",
        start: 43,
        end: 50,
        inPoint: 2.3,
        outPoint: 9.3,
        kind: "video",
        title: "Team Discussion",
        color: "#315feb",
      }),
      a({
        id: "b4",
        effectId: "video",
        start: 67,
        end: 76,
        inPoint: 12,
        outPoint: 21,
        kind: "video",
        title: "Product Close-up",
        color: "#2449bf",
      }),
    ],
  },
  {
    id: "video-main",
    name: "Main Camera",
    role: "main",
    height: 72,
    actions: [
      a({
        id: "v1",
        effectId: "video",
        start: 0,
        end: 18,
        inPoint: 0,
        outPoint: 18,
        kind: "video",
        title: "Host Intro",
        color: "#3a6bff",
      }),
      a({
        id: "v2",
        effectId: "video",
        start: 19,
        end: 38,
        inPoint: 2.2,
        outPoint: 21.2,
        kind: "video",
        title: "Problem Statement",
        color: "#3562eb",
      }),
      a({
        id: "v3",
        effectId: "video",
        start: 39,
        end: 57,
        inPoint: 5,
        outPoint: 23,
        kind: "video",
        title: "Workflow Breakdown",
        color: "#2f57d6",
      }),
      a({
        id: "v4",
        effectId: "video",
        start: 58,
        end: 79,
        inPoint: 10.6,
        outPoint: 31.6,
        kind: "video",
        title: "Feature Demo",
        color: "#4676ff",
      }),
      a({
        id: "v5",
        effectId: "video",
        start: 80,
        end: 96,
        inPoint: 3.5,
        outPoint: 19.5,
        kind: "video",
        title: "Wrap-up",
        color: "#2f5ee0",
      }),
    ],
  },
  {
    id: "voice-over",
    name: "Voice Over",
    role: "audio",
    height: 52,
    actions: [
      a({
        id: "vo-1",
        effectId: "audio",
        start: 0,
        end: 26,
        inPoint: 0,
        outPoint: 26,
        kind: "audio",
        title: "Narration - Intro",
        color: "#0f8a6f",
      }),
      a({
        id: "vo-2",
        effectId: "audio",
        start: 27,
        end: 63,
        inPoint: 4,
        outPoint: 40,
        kind: "audio",
        title: "Narration - Main",
        color: "#117f66",
      }),
      a({
        id: "vo-3",
        effectId: "audio",
        start: 64,
        end: 96,
        inPoint: 2.5,
        outPoint: 34.5,
        kind: "audio",
        title: "Narration - Outro",
        color: "#0d735c",
      }),
    ],
  },
  {
    id: "sfx",
    name: "SFX",
    role: "audio",
    height: 44,
    actions: [
      a({
        id: "fx-1",
        effectId: "audio",
        start: 7.8,
        end: 8.8,
        inPoint: 0.2,
        outPoint: 1.2,
        kind: "audio",
        title: "Whoosh In",
        color: "#e35c9a",
      }),
      a({
        id: "fx-2",
        effectId: "audio",
        start: 33.6,
        end: 34.8,
        inPoint: 1.1,
        outPoint: 2.3,
        kind: "audio",
        title: "Pop Accent",
        color: "#c94a87",
      }),
      a({
        id: "fx-3",
        effectId: "audio",
        start: 58.2,
        end: 59.6,
        inPoint: 0.5,
        outPoint: 1.9,
        kind: "audio",
        title: "Transition Rise",
        color: "#d85790",
      }),
      a({
        id: "fx-4",
        effectId: "audio",
        start: 84.5,
        end: 86,
        inPoint: 3,
        outPoint: 4.5,
        kind: "audio",
        title: "Outro Hit",
        color: "#b74378",
      }),
    ],
  },
  {
    id: "music",
    name: "Music",
    role: "audio",
    height: 48,
    actions: [
      a({
        id: "bgm-1",
        effectId: "audio",
        start: 0,
        end: 52,
        inPoint: 8,
        outPoint: 60,
        kind: "audio",
        title: "Main Theme A",
        color: "#1c9f85",
      }),
      a({
        id: "bgm-2",
        effectId: "audio",
        start: 52,
        end: 96,
        inPoint: 12,
        outPoint: 56,
        kind: "audio",
        title: "Main Theme B",
        color: "#198d76",
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
  const canDeleteSelected = useMemo(
    () => Boolean(selectedAction),
    [selectedAction],
  );

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

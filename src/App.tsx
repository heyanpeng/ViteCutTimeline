import { useCallback, useMemo, useState } from "react";
import { Timeline } from "./timeline/Timeline";
import type { TimelineAction, TimelineRow } from "./timeline/model";
import { formatTimeWithMs } from "./timeline/utils";
import "./App.css";

const DURATION = 120;
const GITHUB_URL = "https://github.com/heyanpeng/ViteCutTimeline";
const MIN_ZOOM = 0.25;
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

const a = (data: TimelineAction): TimelineAction => data;

const createDemoRows = (): TimelineRow[] => [
  {
    id: "text-1",
    name: "Text A",
    role: "normal",
    height: 40,
    actions: [
      a({ id: "txt-1", effectId: "text", start: 0.4, end: 3.8, kind: "text", title: "Open Title", icon: "𝑇", color: "#6f58d9" }),
      a({ id: "txt-2", effectId: "text", start: 8.5, end: 12.4, kind: "text", title: "Subtitle", icon: "𝑇", color: "#5b4bc2" }),
      a({ id: "txt-3", effectId: "text", start: 82.3, end: 91.8, kind: "text", title: "Ending Credits", icon: "𝑇", color: "#4f46b8" }),
    ],
  },
  {
    id: "solid-1",
    name: "Solid A",
    role: "normal",
    height: 40,
    actions: [
      a({ id: "solid-1", effectId: "solid", start: 2.2, end: 5.2, kind: "solid", title: "Flash", icon: "●", color: "#a64ac9" }),
      a({ id: "solid-2", effectId: "solid", start: 38.4, end: 44.1, kind: "solid", title: "Mask BG", icon: "●", color: "#9b3fbf" }),
      a({ id: "solid-3", effectId: "solid", start: 92.6, end: 103.2, kind: "solid", title: "Color Block", icon: "●", color: "#8f34b4" }),
    ],
  },
  {
    id: "image-1",
    name: "Image A",
    role: "normal",
    height: 40,
    actions: [
      a({ id: "img-1", effectId: "image", start: 12.5, end: 17.2, kind: "image", title: "Hero Image", icon: "🖼", color: "#3a7d44" }),
      a({ id: "img-2", effectId: "image", start: 54.2, end: 61.4, kind: "image", title: "Diagram", icon: "🖼", color: "#2f6f39" }),
      a({ id: "img-3", effectId: "image", start: 100.8, end: 108.7, kind: "image", title: "Outro Card", icon: "🖼", color: "#2a6333" }),
    ],
  },
  {
    id: "video-upper-a",
    name: "Video Upper A",
    role: "normal",
    height: 50,
    actions: [
      a({ id: "vu-a-1", effectId: "video", start: 1.1, end: 4.2, inPoint: 0, outPoint: 3.1, kind: "video", title: "B-roll 01" }),
      a({ id: "vu-a-2", effectId: "video", start: 17.3, end: 25.2, inPoint: 1.6, outPoint: 9.5, kind: "video", title: "B-roll 02" }),
      a({ id: "vu-a-3", effectId: "video", start: 32.5, end: 41.2, inPoint: 0.7, outPoint: 9.4, kind: "video", title: "B-roll 03" }),
    ],
  },
  {
    id: "video-main",
    name: "Video Main",
    role: "main",
    height: 70,
    actions: [
      a({ id: "v1", effectId: "video", start: 0, end: 10.5, inPoint: 0, outPoint: 10.5, kind: "video", title: "Main Video 01" }),
      a({ id: "v2", effectId: "video", start: 11.4, end: 26.2, inPoint: 1.2, outPoint: 16, kind: "video", title: "Main Video 02" }),
      a({ id: "v3", effectId: "video", start: 27.1, end: 42.4, inPoint: 0.6, outPoint: 15.9, kind: "video", title: "Main Video 03" }),
      a({ id: "v4", effectId: "video", start: 43.5, end: 61.1, inPoint: 2.2, outPoint: 19.8, kind: "video", title: "Main Video 04" }),
      a({ id: "v5", effectId: "video", start: 62.2, end: 82.3, inPoint: 3, outPoint: 23.1, kind: "video", title: "Main Video 05" }),
      a({ id: "v6", effectId: "video", start: 83.1, end: 111.8, inPoint: 1.5, outPoint: 30.2, kind: "video", title: "Main Video 06" }),
    ],
  },
  {
    id: "audio-vo",
    name: "Audio VO",
    role: "audio",
    height: 50,
    actions: [
      a({ id: "a-vo-1", effectId: "audio", start: 0, end: 29.5, inPoint: 0, outPoint: 29.5, kind: "audio", title: "Voice Over 01" }),
      a({ id: "a-vo-2", effectId: "audio", start: 31.1, end: 54.9, inPoint: 0.5, outPoint: 24.3, kind: "audio", title: "Voice Over 02" }),
      a({ id: "a-vo-3", effectId: "audio", start: 58, end: 101.2, inPoint: 1.1, outPoint: 44.3, kind: "audio", title: "Voice Over 03" }),
    ],
  },
  {
    id: "audio-music",
    name: "Audio Music",
    role: "audio",
    height: 50,
    actions: [
      a({ id: "a-bg-1", effectId: "audio", start: 0, end: 50.2, inPoint: 0, outPoint: 50.2, kind: "audio", title: "BGM 01" }),
      a({ id: "a-bg-2", effectId: "audio", start: 50.6, end: 86.4, inPoint: 0.3, outPoint: 36.1, kind: "audio", title: "BGM 02" }),
      a({ id: "a-bg-3", effectId: "audio", start: 86.8, end: 114.2, inPoint: 0.2, outPoint: 27.6, kind: "audio", title: "BGM 03" }),
    ],
  },
];

export default function App() {
  const [editorData, setEditorData] = useState<TimelineRow[]>(() => createDemoRows());
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [showMinorTicks, setShowMinorTicks] = useState(false);
  const [showHorizontalLines, setShowHorizontalLines] = useState(true);
  const [playEndBehavior, setPlayEndBehavior] = useState<"stop" | "loop">("stop");
  const [dragSnapToClipEdges, setDragSnapToClipEdges] = useState(true);
  const [trimSnapToTimelineTicks, setTrimSnapToTimelineTicks] = useState(false);
  const [trimSnapToClipEdges, setTrimSnapToClipEdges] = useState(false);
  const [zoom, setZoom] = useState(1);

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
  const timeProgress = useMemo(() => ((time / DURATION) * 100).toFixed(1), [time]);
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
          Hybrid Canvas + DOM timeline with drag, trim, snapping and virtualization.
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
        />
      </section>

      <section className="snippet">
        <h2>Usage</h2>
        <pre>
          {`<Timeline
  editorData={rows}
  duration={120}
  playing={playing}
  currentTime={time}
  onTimeChange={setTime}
/>`}
        </pre>
      </section>
    </div>
  );
}

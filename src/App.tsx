import { useCallback, useMemo, useState } from "react";
import { Timeline } from "./timeline/Timeline";
import type { Track } from "./timeline/model";
import "./App.css";

const FPS = 30;
const TOTAL_FRAMES = 30 * 120;
const GITHUB_URL = "https://github.com/heyanpeng/ViteCutTimeline";
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const TRACK_GAP = 6;
const TRACK_HEIGHT_PRESETS = {
  main: 60,
  video: 50,
  audio: 50,
  image: 40,
  text: 40,
  solid: 40,
};

const createDemoTracks = (): Track[] => [
  {
    id: "overlay-text",
    name: "Text",
    role: "normal",
    height: 40,
    clips: [
      {
        id: "o1",
        startFrame: 30,
        displayStart: 0,
        duration: 150,
        layer: 0,
        kind: "text",
        title: "Title",
        icon: "𝑇",
        color: "#6f58d9",
      },
    ],
  },
  {
    id: "overlay-solid",
    name: "Solid",
    role: "normal",
    height: 40,
    clips: [
      {
        id: "o2",
        startFrame: 220,
        displayStart: 0,
        duration: 120,
        layer: 0,
        kind: "solid",
        title: "Solid",
        icon: "●",
        color: "#a64ac9",
      },
    ],
  },
  {
    id: "overlay-image",
    name: "Image",
    role: "normal",
    height: 40,
    clips: [
      {
        id: "o3",
        startFrame: 380,
        displayStart: 0,
        duration: 160,
        layer: 0,
        kind: "image",
        title: "Image",
        icon: "🖼",
        color: "#3a7d44",
      },
    ],
  },
  {
    id: "broll",
    name: "B-roll",
    role: "normal",
    height: 50,
    clips: [
      {
        id: "b1",
        startFrame: 110,
        displayStart: 0,
        duration: 140,
        layer: 0,
        kind: "video",
        title: "B-roll 01",
      },
      {
        id: "b2",
        startFrame: 430,
        displayStart: 48,
        duration: 180,
        layer: 0,
        kind: "video",
        title: "B-roll 02",
      },
      {
        id: "b3",
        startFrame: 900,
        displayStart: 22,
        duration: 220,
        layer: 0,
        kind: "video",
        title: "B-roll 03",
      },
    ],
  },
  {
    id: "video-main",
    name: "Video Main",
    role: "main",
    height: 60,
    clips: [
      {
        id: "v1",
        startFrame: 0,
        displayStart: 0,
        duration: 220,
        layer: 0,
        kind: "video",
        title: "Main Video",
      },
      {
        id: "v2",
        startFrame: 250,
        displayStart: 35,
        duration: 260,
        layer: 0,
        kind: "video",
        title: "A-Roll 02",
      },
      {
        id: "v3",
        startFrame: 560,
        displayStart: 12,
        duration: 210,
        layer: 0,
        kind: "video",
        title: "A-Roll 03",
      },
    ],
  },
  {
    id: "audio",
    name: "Audio",
    role: "audio",
    height: 50,
    clips: [
      {
        id: "a1",
        startFrame: 0,
        displayStart: 0,
        duration: 520,
        layer: 0,
        kind: "audio",
        title: "Voice Over",
      },
      {
        id: "a2",
        startFrame: 540,
        displayStart: 0,
        duration: 460,
        layer: 0,
        kind: "audio",
        title: "BGM",
      },
    ],
  },
];

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(() => createDemoTracks());
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [showMinorTicks, setShowMinorTicks] = useState(true);
  const [showHorizontalLines, setShowHorizontalLines] = useState(true);
  const [playEndBehavior, setPlayEndBehavior] = useState<"stop" | "loop">(
    "stop",
  );
  const [dragSnapToClipEdges, setDragSnapToClipEdges] = useState(true);
  const [trimSnapToTimelineTicks, setTrimSnapToTimelineTicks] = useState(false);
  const [trimSnapToClipEdges, setTrimSnapToClipEdges] = useState(true);
  const [zoom, setZoom] = useState(1);

  const currentTime = useMemo(() => (frame / FPS).toFixed(2), [frame]);
  const handleSeekFromBlankDoubleClick = useCallback((nextFrame: number) => {
    setFrame(nextFrame);
  }, []);
  const handleSeekFromRulerPointerDown = useCallback((nextFrame: number) => {
    setFrame(nextFrame);
  }, []);
  const handleSeekFromRulerDoubleClick = useCallback((nextFrame: number) => {
    setFrame(nextFrame);
  }, []);
  const frameProgress = useMemo(
    () => ((frame / TOTAL_FRAMES) * 100).toFixed(1),
    [frame],
  );
  const zoomPercent = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

  return (
    <div className="demo-page">
      <header className="demo-header">
        <div className="demo-header-row">
          <div>
            <p className="demo-badge">Open Source Demo</p>
            <h1>Timeline Component Playground</h1>
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
            onClick={() => setFrame(0)}
          >
            Jump To Start
          </button>
          <div className="meta-group">
            <span className="meta-item">Frame {frame}</span>
            <span className="meta-item">Time {currentTime}s</span>
            <span className="meta-item">Progress {frameProgress}%</span>
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
          tracks={tracks}
          fps={FPS}
          totalFrames={TOTAL_FRAMES}
          playing={playing}
          playEndBehavior={playEndBehavior}
          currentFrame={frame}
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
          onTracksChange={setTracks}
          onFrameChange={setFrame}
          onPlayingChange={setPlaying}
          onZoomChange={setZoom}
          onRulerPointerDown={handleSeekFromRulerPointerDown}
          onBlankAreaDoubleClick={handleSeekFromBlankDoubleClick}
          onRulerDoubleClick={handleSeekFromRulerDoubleClick}
        />
      </section>

      <section className="snippet">
        <h2>Usage</h2>
        <pre>
          {`<Timeline
  tracks={tracks}
  fps={30}
  totalFrames={3600}
  playing={playing}
  currentFrame={frame}
  onFrameChange={setFrame}
/>`}
        </pre>
      </section>
    </div>
  );
}

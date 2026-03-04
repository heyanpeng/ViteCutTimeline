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
        id: "txt-1",
        startFrame: 12,
        displayStart: 0,
        duration: 96,
        layer: 0,
        kind: "text",
        title: "Open Title",
        icon: "𝑇",
        color: "#6f58d9",
      },
      {
        id: "txt-2",
        startFrame: 180,
        displayStart: 0,
        duration: 130,
        layer: 0,
        kind: "text",
        title: "Subtitle",
        icon: "𝑇",
        color: "#5b4bc2",
      },
      {
        id: "txt-3",
        startFrame: 3300,
        displayStart: 0,
        duration: 220,
        layer: 0,
        kind: "text",
        title: "Ending Credits",
        icon: "𝑇",
        color: "#4f46b8",
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
        id: "solid-1",
        startFrame: 320,
        displayStart: 0,
        duration: 90,
        layer: 0,
        kind: "solid",
        title: "Flash",
        icon: "●",
        color: "#a64ac9",
      },
      {
        id: "solid-2",
        startFrame: 1200,
        displayStart: 0,
        duration: 180,
        layer: 0,
        kind: "solid",
        title: "Mask BG",
        icon: "●",
        color: "#9b3fbf",
      },
      {
        id: "solid-3",
        startFrame: 3000,
        displayStart: 0,
        duration: 140,
        layer: 0,
        kind: "solid",
        title: "Color Block",
        icon: "●",
        color: "#8f34b4",
      },
    ],
  },
  {
    id: "overlay-text-2",
    name: "Text 2",
    role: "normal",
    height: 40,
    clips: [
      {
        id: "txt-4",
        startFrame: 520,
        displayStart: 0,
        duration: 140,
        layer: 0,
        kind: "text",
        title: "Caption A",
        icon: "𝑇",
        color: "#6a56cf",
      },
      {
        id: "txt-5",
        startFrame: 2040,
        displayStart: 0,
        duration: 180,
        layer: 0,
        kind: "text",
        title: "Caption B",
        icon: "𝑇",
        color: "#5b4bc2",
      },
      {
        id: "txt-6",
        startFrame: 3460,
        displayStart: 0,
        duration: 120,
        layer: 0,
        kind: "text",
        title: "End Tag",
        icon: "𝑇",
        color: "#5140b4",
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
        id: "img-1",
        startFrame: 420,
        displayStart: 0,
        duration: 150,
        layer: 0,
        kind: "image",
        title: "Hero Image",
        icon: "🖼",
        color: "#3a7d44",
      },
      {
        id: "img-2",
        startFrame: 1600,
        displayStart: 0,
        duration: 220,
        layer: 0,
        kind: "image",
        title: "Diagram",
        icon: "🖼",
        color: "#2f6f39",
      },
      {
        id: "img-3",
        startFrame: 3380,
        displayStart: 0,
        duration: 180,
        layer: 0,
        kind: "image",
        title: "Outro Card",
        icon: "🖼",
        color: "#2a6333",
      },
    ],
  },
  {
    id: "overlay-solid-2",
    name: "Solid 2",
    role: "normal",
    height: 40,
    clips: [
      {
        id: "solid-4",
        startFrame: 90,
        displayStart: 0,
        duration: 80,
        layer: 0,
        kind: "solid",
        title: "Blink",
        icon: "●",
        color: "#9e42c4",
      },
      {
        id: "solid-5",
        startFrame: 1480,
        displayStart: 0,
        duration: 200,
        layer: 0,
        kind: "solid",
        title: "Shape BG",
        icon: "●",
        color: "#8d33af",
      },
      {
        id: "solid-6",
        startFrame: 3260,
        displayStart: 0,
        duration: 170,
        layer: 0,
        kind: "solid",
        title: "Outro Mask",
        icon: "●",
        color: "#7e289f",
      },
    ],
  },
  {
    id: "overlay-image-2",
    name: "Image 2",
    role: "normal",
    height: 40,
    clips: [
      {
        id: "img-4",
        startFrame: 700,
        displayStart: 0,
        duration: 170,
        layer: 0,
        kind: "image",
        title: "Slide 01",
        icon: "🖼",
        color: "#37793f",
      },
      {
        id: "img-5",
        startFrame: 2280,
        displayStart: 0,
        duration: 230,
        layer: 0,
        kind: "image",
        title: "Slide 02",
        icon: "🖼",
        color: "#2f6b37",
      },
      {
        id: "img-6",
        startFrame: 3320,
        displayStart: 0,
        duration: 190,
        layer: 0,
        kind: "image",
        title: "Slide 03",
        icon: "🖼",
        color: "#2a6132",
      },
    ],
  },
  {
    id: "video-upper-a",
    name: "Video Upper A",
    role: "normal",
    height: 50,
    clips: [
      {
        id: "vu-a-1",
        startFrame: 80,
        displayStart: 0,
        duration: 170,
        layer: 0,
        kind: "video",
        title: "B-roll 01",
      },
      {
        id: "vu-a-2",
        startFrame: 520,
        displayStart: 48,
        duration: 240,
        layer: 0,
        kind: "video",
        title: "B-roll 02",
      },
      {
        id: "vu-a-3",
        startFrame: 980,
        displayStart: 22,
        duration: 260,
        layer: 0,
        kind: "video",
        title: "B-roll 03",
      },
    ],
  },
  {
    id: "video-upper-b",
    name: "Video Upper B",
    role: "normal",
    height: 50,
    clips: [
      {
        id: "vu-b-1",
        startFrame: 1350,
        displayStart: 10,
        duration: 210,
        layer: 0,
        kind: "video",
        title: "Cutaway 01",
      },
      {
        id: "vu-b-2",
        startFrame: 1880,
        displayStart: 36,
        duration: 280,
        layer: 0,
        kind: "video",
        title: "Cutaway 02",
      },
      {
        id: "vu-b-3",
        startFrame: 3200,
        displayStart: 4,
        duration: 320,
        layer: 0,
        kind: "video",
        title: "Outro Shot",
      },
    ],
  },
  {
    id: "video-main",
    name: "Video Main",
    role: "main",
    height: 70,
    clips: [
      {
        id: "v1",
        startFrame: 0,
        displayStart: 0,
        duration: 300,
        layer: 0,
        kind: "video",
        title: "Main Video",
      },
      {
        id: "v2",
        startFrame: 340,
        displayStart: 35,
        duration: 420,
        layer: 0,
        kind: "video",
        title: "A-Roll 02",
      },
      {
        id: "v3",
        startFrame: 790,
        displayStart: 12,
        duration: 360,
        layer: 0,
        kind: "video",
        title: "A-Roll 03",
      },
      {
        id: "v4",
        startFrame: 1180,
        displayStart: 20,
        duration: 520,
        layer: 0,
        kind: "video",
        title: "A-Roll 04",
      },
      {
        id: "v5",
        startFrame: 1760,
        displayStart: 60,
        duration: 740,
        layer: 0,
        kind: "video",
        title: "A-Roll 05",
      },
      {
        id: "v6",
        startFrame: 2560,
        displayStart: 30,
        duration: 980,
        layer: 0,
        kind: "video",
        title: "A-Roll 06",
      },
    ],
  },
  {
    id: "audio-vo",
    name: "Audio VO",
    role: "audio",
    height: 50,
    clips: [
      {
        id: "a-vo-1",
        startFrame: 0,
        displayStart: 0,
        duration: 900,
        layer: 0,
        kind: "audio",
        title: "Voice Over",
      },
      {
        id: "a-vo-2",
        startFrame: 980,
        displayStart: 0,
        duration: 700,
        layer: 0,
        kind: "audio",
        title: "Voice Over 02",
      },
      {
        id: "a-vo-3",
        startFrame: 1760,
        displayStart: 0,
        duration: 1200,
        layer: 0,
        kind: "audio",
        title: "Voice Over 03",
      },
    ],
  },
  {
    id: "audio-music",
    name: "Audio Music",
    role: "audio",
    height: 50,
    clips: [
      {
        id: "a-bg-1",
        startFrame: 0,
        displayStart: 0,
        duration: 1500,
        layer: 0,
        kind: "audio",
        title: "BGM",
      },
      {
        id: "a-bg-2",
        startFrame: 1520,
        displayStart: 0,
        duration: 1120,
        layer: 0,
        kind: "audio",
        title: "BGM 02",
      },
      {
        id: "a-bg-3",
        startFrame: 2680,
        displayStart: 0,
        duration: 840,
        layer: 0,
        kind: "audio",
        title: "BGM 03",
      },
    ],
  },
];

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(() => createDemoTracks());
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [showMinorTicks, setShowMinorTicks] = useState(false);
  const [showHorizontalLines, setShowHorizontalLines] = useState(true);
  const [playEndBehavior, setPlayEndBehavior] = useState<"stop" | "loop">(
    "stop",
  );
  const [dragSnapToClipEdges, setDragSnapToClipEdges] = useState(true);
  const [trimSnapToTimelineTicks, setTrimSnapToTimelineTicks] = useState(false);
  const [trimSnapToClipEdges, setTrimSnapToClipEdges] = useState(false);
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

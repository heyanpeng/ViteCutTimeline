**English** | [简体中文](README.zh-CN.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/heyanpeng/ViteCutTimeline/master/apps/demo/public/logo.png" alt="ViteCutTimeline Logo" height="80" />
</p>

A React timeline component for web-based video editors, powered by a Canvas + DOM hybrid rendering architecture. It supports drag-and-drop, trimming, splitting, snapping, zooming, and virtualized rendering.

- Live Demo: [https://timeline.vitecut.com/](https://timeline.vitecut.com/)
- GitHub Repo: [https://github.com/heyanpeng/ViteCutTimeline](https://github.com/heyanpeng/ViteCutTimeline)

## Screenshots

<p align="center">
  <img src="./docs/images/timeline-demo.png" alt="ViteCutTimeline Demo Screenshot" />
</p>

## Features

- Canvas + DOM hybrid rendering for both interaction precision and performance
- Fully controlled data model: `editorData` / `currentTime` / `playing` managed externally
- Rich event callbacks for move/resize/cursor/click/double-click interactions
- Clip drag-and-drop with cross-track movement and optional auto track insertion
- Left/right trimming with snapping to clip edges and timeline ticks
- Dynamic timeline duration support (content end + configurable trailing space)
- Custom action rendering (`getActionRender` and drag preview rendering)
- Track-level state support (lock/hide/mute/delete handled by host app)
- Virtualized rendering for large timeline data sets
- Playhead-driven editing

## Installation

```bash
npm install @vitecut/timeline
```

## Quick Start

```tsx
import { useMemo, useState } from "react";
import { Timeline, type TimelineRow } from "@vitecut/timeline";
import "@vitecut/timeline/style.css";

const initialRows: TimelineRow[] = [
  {
    id: "main-video",
    actions: [
      {
        id: "clip-1",
        effectId: "video",
        start: 0,
        end: 12
      },
    ],
  },
];

export default function Example() {
  const [editorData, setEditorData] = useState<TimelineRow[]>(initialRows);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const duration = useMemo(() => {
    const end = editorData
      .flatMap((row) => row.actions)
      .reduce((max, action) => Math.max(max, action.end), 0);
    return Math.max(30, end + 3);
  }, [editorData]);

  return (
    <Timeline
      editorData={editorData}
      duration={duration}
      playing={playing}
      currentTime={time}
      zoom={zoom}
      onZoomChange={setZoom}
      onEditorDataChange={setEditorData}
      onCursorDrag={setTime}
      onCursorDragEnd={setTime}
      onClickTimeArea={(nextTime) => {
        setPlaying(false);
        setTime(nextTime);
        return true;
      }}
      dragSnapToClipEdges
      trimSnapToClipEdges
      trimSnapToTimelineTicks
    />
  );
}
```

## Local Development

```bash
npm install
npm run dev
```

## Contributing

Issues and PRs are welcome.

## License

MIT is planned.  
If you intend to distribute publicly, add a root `LICENSE` file.

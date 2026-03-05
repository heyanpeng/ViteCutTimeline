**English** | [简体中文](README.zh-CN.md)

<p align="center">
  <img src="./public/logo.png" alt="ViteCutTimeline Logo" height="80" />
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
- Clip drag-and-drop with cross-track movement and auto track creation
- Left/right trimming with snapping to clip edges and timeline ticks
- Playhead-driven editing: split at playhead, trim to playhead, delete selected clip
- Zoom control and `fitToContent` viewport fitting
- Track-level controls: lock, hide, mute, delete (with main-track protection)
- Virtualized rendering for large timeline data sets
- Keyboard shortcuts (e.g. `Cmd/Ctrl + B`, `[` and `]`)

## Installation

```bash
npm install vite-cut-timeline
```

## Quick Start

```tsx
import { useRef, useState } from "react";
import { Timeline, type TimelineRef } from "vite-cut-timeline";
import type { TimelineRow } from "vite-cut-timeline";

const DURATION = 120;

const initialRows: TimelineRow[] = [
  {
    id: "main-video",
    name: "Main Video",
    role: "main",
    actions: [
      {
        id: "clip-1",
        effectId: "video",
        start: 0,
        end: 12,
        kind: "video",
        title: "Intro",
      },
    ],
  },
];

export default function Example() {
  const timelineRef = useRef<TimelineRef | null>(null);
  const [editorData, setEditorData] = useState<TimelineRow[]>(initialRows);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [zoom, setZoom] = useState(1);

  return (
    <Timeline
      ref={timelineRef}
      editorData={editorData}
      duration={DURATION}
      playing={playing}
      currentTime={time}
      onEditorDataChange={setEditorData}
      onPlayingChange={setPlaying}
      onTimeChange={setTime}
      zoom={zoom}
      onZoomChange={setZoom}
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

import React, {
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AUTO_SCROLL_EDGE_PX,
  AUTO_SCROLL_STEP_PX,
  CREATE_TRACK_GAP_PX,
  DRAG_START_THRESHOLD_PX,
  MIN_TRACK_HEIGHT,
  RULER_HEIGHT,
  SNAP_PX,
  VIRTUAL_BUFFER_PX,
} from "./constants";
import { drawRulerCanvas, drawTimelineCanvas } from "./canvas";
import { ClipItem } from "./ClipItem";
import { DragPreview } from "./DragPreview";
import type {
  Clip,
  DragState,
  PendingDragState,
  Selection,
  TimelineProps,
  Track,
  TrackLayout,
  TrimState,
} from "./types";
import {
  clamp,
  frameToPixel,
  getClipEnd,
  getTickStepFrames,
  pixelToFrame,
} from "./utils";
import "./Timeline.css";

export { frameToPixel, pixelToFrame } from "./utils";

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  fps,
  totalFrames,
  playing,
  playEndBehavior = "stop",
  currentFrame,
  showMinorTicks = true,
  showHorizontalLines = true,
  dragSnapToClipEdges = true,
  trimSnapToClipEdges = true,
  trimSnapToTimelineTicks = true,
  trimSnapThresholdPx = SNAP_PX,
  trimSnapTickMode = "minor",
  initialFrame = 0,
  minZoom = 0.25,
  maxZoom = 8,
  rowHeight = 52,
  onTracksChange,
  onFrameChange,
  onPlayingChange,
  onRulerPointerDown,
  onBlankAreaPointerDown,
  onRulerDoubleClick,
  onBlankAreaDoubleClick,
}) => {
  const isSourceBoundClip = useCallback((clip: Clip) => {
    return clip.kind === "video" || clip.kind === "audio";
  }, []);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rulerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const playheadRef = useRef<HTMLDivElement | null>(null);
  const scrubbingPointerIdRef = useRef<number | null>(null);
  const currentFrameRef = useRef(initialFrame);
  const rafRef = useRef<number | null>(null);
  const pendingCreateTrackIdRef = useRef<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState({ width: 0, height: 0, scrollLeft: 0, scrollTop: 0 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pendingDrag, setPendingDrag] = useState<PendingDragState | null>(null);
  const [trim, setTrim] = useState<TrimState | null>(null);
  const [selection, setSelection] = useState<Selection>(null);

  const totalContentWidth = frameToPixel(totalFrames, zoom);
  const lastClipEndFrame = useMemo(() => {
    let maxEnd = 0;
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        maxEnd = Math.max(maxEnd, getClipEnd(clip));
      });
    });
    return clamp(maxEnd, 0, totalFrames);
  }, [totalFrames, tracks]);
  const trackLayouts = useMemo<TrackLayout[]>(() => {
    let y = RULER_HEIGHT;
    return tracks.map((track, index) => {
      const height = Math.max(MIN_TRACK_HEIGHT, track.height ?? rowHeight);
      const layout: TrackLayout = { id: track.id, index, top: y, height, bottom: y + height };
      y += height;
      return layout;
    });
  }, [tracks, rowHeight]);

  const trackLayoutMap = useMemo(
    () => new Map(trackLayouts.map((layout) => [layout.id, layout])),
    [trackLayouts],
  );

  const totalHeight = trackLayouts.length > 0 ? trackLayouts[trackLayouts.length - 1].bottom : RULER_HEIGHT;
  const visibleLeft = viewport.scrollLeft - VIRTUAL_BUFFER_PX;
  const visibleRight = viewport.scrollLeft + viewport.width + VIRTUAL_BUFFER_PX;

  const visibleTracks = useMemo(
    () =>
      tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((clip) => {
          const left = frameToPixel(clip.startFrame, zoom);
          const right = frameToPixel(clip.startFrame + clip.duration, zoom);
          return right >= visibleLeft && left <= visibleRight;
        }),
      })),
    [tracks, zoom, visibleLeft, visibleRight],
  );

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    drawTimelineCanvas({
      canvas: canvasRef.current,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      scrollLeft: viewport.scrollLeft,
      zoom,
      fps,
      totalFrames,
      showMinorTicks,
      showHorizontalLines,
      trackLayouts,
    });
  }, [fps, showHorizontalLines, showMinorTicks, totalFrames, trackLayouts, viewport.height, viewport.scrollLeft, viewport.width, zoom]);

  const drawRuler = useCallback(() => {
    if (!rulerCanvasRef.current) return;
    drawRulerCanvas({
      canvas: rulerCanvasRef.current,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      scrollLeft: viewport.scrollLeft,
      zoom,
      fps,
      totalFrames,
      showMinorTicks,
    });
  }, [fps, showMinorTicks, totalFrames, viewport.height, viewport.scrollLeft, viewport.width, zoom]);

  const updatePlayheadPosition = useCallback(
    (frame: number) => {
      if (!playheadRef.current) return;
      const x = frameToPixel(frame, zoom) - (scrollRef.current?.scrollLeft ?? 0);
      playheadRef.current.style.transform = `translateX(${x}px)`;
    },
    [zoom],
  );

  useEffect(() => {
    updatePlayheadPosition(currentFrameRef.current);
  }, [updatePlayheadPosition]);

  useEffect(() => {
    if (currentFrame == null) return;
    const next = clamp(currentFrame, 0, totalFrames);
    currentFrameRef.current = next;
    updatePlayheadPosition(next);
  }, [currentFrame, totalFrames, updatePlayheadPosition]);

  useEffect(() => {
    const root = rootRef.current;
    const scrollEl = scrollRef.current;
    if (!root || !scrollEl) return;

    const syncViewport = () => {
      setViewport({
        width: scrollEl.clientWidth,
        height: scrollEl.clientHeight,
        scrollLeft: scrollEl.scrollLeft,
        scrollTop: scrollEl.scrollTop,
      });
      updatePlayheadPosition(currentFrameRef.current);
    };

    syncViewport();
    const ro = new ResizeObserver(syncViewport);
    ro.observe(root);
    scrollEl.addEventListener("scroll", syncViewport, { passive: true });
    return () => {
      ro.disconnect();
      scrollEl.removeEventListener("scroll", syncViewport);
    };
  }, [updatePlayheadPosition]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const preventPageZoomByWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };

    const preventGestureZoom = (event: Event) => {
      event.preventDefault();
    };

    root.addEventListener("wheel", preventPageZoomByWheel, { passive: false });
    root.addEventListener("gesturestart", preventGestureZoom, { passive: false });
    root.addEventListener("gesturechange", preventGestureZoom, { passive: false });
    root.addEventListener("gestureend", preventGestureZoom, { passive: false });

    return () => {
      root.removeEventListener("wheel", preventPageZoomByWheel);
      root.removeEventListener("gesturestart", preventGestureZoom);
      root.removeEventListener("gesturechange", preventGestureZoom);
      root.removeEventListener("gestureend", preventGestureZoom);
    };
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    drawRuler();
  }, [drawRuler]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    let lastTime = performance.now();
    let lastReported = Math.floor(currentFrameRef.current);

    const loop = (now: number) => {
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;
      const playbackEndFrame = Math.max(0, lastClipEndFrame);
      const nextFrame = clamp(currentFrameRef.current + elapsed * fps, 0, playbackEndFrame);
      currentFrameRef.current = nextFrame;
      updatePlayheadPosition(nextFrame);

      const rounded = Math.floor(nextFrame);
      if (rounded !== lastReported) {
        lastReported = rounded;
        onFrameChange?.(rounded);
      }

      if (nextFrame >= playbackEndFrame) {
        if (playEndBehavior === "loop" && playbackEndFrame > 0) {
          currentFrameRef.current = 0;
          updatePlayheadPosition(0);
          onFrameChange?.(0);
          rafRef.current = requestAnimationFrame(loop);
        } else {
          onPlayingChange?.(false);
        }
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTime = 0;
    };
  }, [fps, lastClipEndFrame, onFrameChange, onPlayingChange, playEndBehavior, playing, updatePlayheadPosition]);

  const snapFrame = useCallback(
    (clipId: string, proposedStart: number, duration: number) => {
      const thresholdFrames = pixelToFrame(SNAP_PX, zoom);
      const candidates: number[] = [Math.floor(currentFrameRef.current)];
      if (dragSnapToClipEdges) {
        tracks.forEach((track) => {
          track.clips.forEach((clip) => {
            if (clip.id === clipId) return;
            candidates.push(clip.startFrame, clip.startFrame + clip.duration);
          });
        });
      }

      let best: { delta: number; frame: number } | null = null;
      const movingEdges = [proposedStart, proposedStart + duration];
      for (const target of candidates) {
        for (const edge of movingEdges) {
          const delta = target - edge;
          if (Math.abs(delta) > thresholdFrames) continue;
          if (!best || Math.abs(delta) < Math.abs(best.delta)) {
            best = { delta, frame: target };
          }
        }
      }
      if (!best) return { startFrame: proposedStart, snappedFrame: null as number | null };
      return { startFrame: proposedStart + best.delta, snappedFrame: best.frame };
    },
    [dragSnapToClipEdges, tracks, zoom],
  );

  const getTrackIdByClientY = useCallback(
    (clientY: number) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl || tracks.length === 0) return null;
      const rect = scrollEl.getBoundingClientRect();
      const contentY = clientY - rect.top + scrollEl.scrollTop;
      const first = trackLayouts[0];
      const last = trackLayouts[trackLayouts.length - 1];
      if (!first || !last) return null;
      if (contentY <= first.top) return first.id;
      if (contentY >= last.bottom) return last.id;
      const hit = trackLayouts.find((layout) => contentY >= layout.top && contentY < layout.bottom);
      return hit?.id ?? last.id;
    },
    [trackLayouts, tracks.length],
  );

  useEffect(() => {
    const pendingId = pendingCreateTrackIdRef.current;
    if (!pendingId) return;
    if (tracks.some((track) => track.id === pendingId)) {
      pendingCreateTrackIdRef.current = null;
    }
  }, [tracks]);

  const createTrackFromId = useCallback(
    (id: string): Track => {
      const match = id.match(/(\d+)$/);
      const index = match ? Number(match[1]) : tracks.length + 1;
      return { id, name: `Track ${index}`, height: rowHeight, clips: [] };
    },
    [rowHeight, tracks.length],
  );

  const createNextTrack = useCallback((): Track => {
    const existingIds = new Set(tracks.map((track) => track.id));
    let index = tracks.length + 1;
    let id = `track-${index}`;
    while (existingIds.has(id)) {
      index += 1;
      id = `track-${index}`;
    }
    return { id, name: `Track ${index}`, height: rowHeight, clips: [] };
  }, [rowHeight, tracks]);

  const maybeAppendTrackForDrag = useCallback(
    (clientY: number) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl || !onTracksChange) return null;
      const rect = scrollEl.getBoundingClientRect();
      const contentY = clientY - rect.top + scrollEl.scrollTop;
      const lastTrackBottom = trackLayouts.length > 0 ? trackLayouts[trackLayouts.length - 1].bottom : RULER_HEIGHT;
      if (contentY <= lastTrackBottom + CREATE_TRACK_GAP_PX) return null;

      if (pendingCreateTrackIdRef.current) {
        return pendingCreateTrackIdRef.current;
      }

      const newTrack = createNextTrack();
      pendingCreateTrackIdRef.current = newTrack.id;
      onTracksChange([...tracks, newTrack]);
      return newTrack.id;
    },
    [createNextTrack, onTracksChange, trackLayouts, tracks],
  );

  const getOtherTrackClips = useCallback(
    (trackId: string, clipId: string) => {
      const track = tracks.find((item) => item.id === trackId);
      if (!track) return [];
      return track.clips
        .filter((clip) => clip.id !== clipId)
        .sort((a, b) => a.startFrame - b.startFrame);
    },
    [tracks],
  );

  const getValidStartIntervals = useCallback(
    (trackId: string, clipId: string, duration: number): Array<[number, number]> => {
      const others = getOtherTrackClips(trackId, clipId);
      const intervals: Array<[number, number]> = [];
      let cursor = 0;
      for (const other of others) {
        if (other.startFrame > cursor && other.startFrame - cursor >= duration) {
          intervals.push([cursor, other.startFrame - duration]);
        }
        cursor = Math.max(cursor, getClipEnd(other));
      }
      if (totalFrames - cursor >= duration) {
        intervals.push([cursor, totalFrames - duration]);
      }
      return intervals;
    },
    [getOtherTrackClips, totalFrames],
  );

  const resolveStartInTrack = useCallback(
    (trackId: string, clipId: string, duration: number, proposedStart: number) => {
      const intervals = getValidStartIntervals(trackId, clipId, duration);
      if (intervals.length === 0) return null;
      for (const [start, end] of intervals) {
        if (proposedStart >= start && proposedStart <= end) return proposedStart;
      }
      return null;
    },
    [getValidStartIntervals],
  );

  const snapTrimEdgeFrame = useCallback(
    (trackId: string, clipId: string, movingFrame: number) => {
      const thresholdFrames = pixelToFrame(trimSnapThresholdPx, zoom);
      let bestFrame: number | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      if (trimSnapToClipEdges) {
        const others = getOtherTrackClips(trackId, clipId);
        for (const clip of others) {
          const candidates = [clip.startFrame, getClipEnd(clip)];
          for (const candidate of candidates) {
            const distance = Math.abs(candidate - movingFrame);
            if (distance <= thresholdFrames && distance < bestDistance) {
              bestDistance = distance;
              bestFrame = candidate;
            }
          }
        }
      }

      if (trimSnapToTimelineTicks) {
        const pxPerFrame = frameToPixel(1, zoom);
        const tick = getTickStepFrames(pxPerFrame, fps);
        const step = trimSnapTickMode === "major" ? tick.major : tick.minor;
        const nearestTick = Math.round(movingFrame / step) * step;
        const clampedTick = clamp(nearestTick, 0, totalFrames);
        const distance = Math.abs(clampedTick - movingFrame);
        if (distance <= thresholdFrames && distance < bestDistance) {
          bestDistance = distance;
          bestFrame = clampedTick;
        }
      }

      if (bestFrame == null) return { frame: movingFrame, snappedFrame: null as number | null };
      return { frame: bestFrame, snappedFrame: bestFrame };
    },
    [
      fps,
      getOtherTrackClips,
      totalFrames,
      trimSnapThresholdPx,
      trimSnapTickMode,
      trimSnapToClipEdges,
      trimSnapToTimelineTicks,
      zoom,
    ],
  );

  const onClipPointerDown = (event: PointerEvent<HTMLDivElement>, trackId: string, clip: Clip) => {
    if (event.button !== 0) return;
    if (trim) return;
    event.preventDefault();
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    setSelection({ trackId, clipId: clip.id });
    setPendingDrag({
      trackId,
      clip,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
    });
  };

  const onClipPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) {
      if (!pendingDrag || pendingDrag.pointerId !== event.pointerId) return;
      const dx = event.clientX - pendingDrag.startClientX;
      const dy = event.clientY - pendingDrag.startClientY;
      if (Math.hypot(dx, dy) < DRAG_START_THRESHOLD_PX) return;
      setDrag({
        originTrackId: pendingDrag.trackId,
        previewTrackId: pendingDrag.trackId,
        clipId: pendingDrag.clip.id,
        clip: pendingDrag.clip,
        pointerId: pendingDrag.pointerId,
        startClientX: pendingDrag.startClientX,
        originFrame: pendingDrag.clip.startFrame,
        previewStartFrame: pendingDrag.clip.startFrame,
        snappedFrame: null,
        isDropValid: true,
      });
      setPendingDrag(null);
      return;
    }

    if (drag.pointerId !== event.pointerId) return;
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      const rect = scrollEl.getBoundingClientRect();
      if (event.clientY < rect.top + AUTO_SCROLL_EDGE_PX) {
        scrollEl.scrollTop = Math.max(0, scrollEl.scrollTop - AUTO_SCROLL_STEP_PX);
      } else if (event.clientY > rect.bottom - AUTO_SCROLL_EDGE_PX) {
        const maxTop = scrollEl.scrollHeight - scrollEl.clientHeight;
        scrollEl.scrollTop = Math.min(maxTop, scrollEl.scrollTop + AUTO_SCROLL_STEP_PX);
      }
      if (event.clientX < rect.left + AUTO_SCROLL_EDGE_PX) {
        scrollEl.scrollLeft = Math.max(0, scrollEl.scrollLeft - AUTO_SCROLL_STEP_PX);
      } else if (event.clientX > rect.right - AUTO_SCROLL_EDGE_PX) {
        const maxLeft = scrollEl.scrollWidth - scrollEl.clientWidth;
        scrollEl.scrollLeft = Math.min(maxLeft, scrollEl.scrollLeft + AUTO_SCROLL_STEP_PX);
      }
    }

    const dx = event.clientX - drag.startClientX;
    const deltaFrame = Math.round(pixelToFrame(dx, zoom));
    const proposed = clamp(drag.originFrame + deltaFrame, 0, totalFrames - drag.clip.duration);
    const snapped = snapFrame(drag.clipId, proposed, drag.clip.duration);
    const newTrackId = maybeAppendTrackForDrag(event.clientY);
    const targetTrackId = newTrackId ?? getTrackIdByClientY(event.clientY) ?? drag.previewTrackId;
    const resolvedStart = resolveStartInTrack(targetTrackId, drag.clipId, drag.clip.duration, snapped.startFrame);
    setDrag((prev) =>
      prev
        ? {
            ...prev,
            previewTrackId: targetTrackId,
            previewStartFrame: resolvedStart ?? snapped.startFrame,
            snappedFrame: resolvedStart != null && resolvedStart === snapped.startFrame ? snapped.snappedFrame : null,
            isDropValid: resolvedStart != null,
          }
        : prev,
    );
  };

  const onClipPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pendingDrag?.pointerId === event.pointerId) {
      setPendingDrag(null);
      return;
    }
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.isDropValid) {
      setDrag(null);
      return;
    }

    const movedClip: Clip = { ...drag.clip, startFrame: drag.previewStartFrame };
    const hasPreviewTrack = tracks.some((track) => track.id === drag.previewTrackId);
    const workingTracks = hasPreviewTrack ? tracks : [...tracks, createTrackFromId(drag.previewTrackId)];
    const next = workingTracks.map((track) => {
      if (track.id === drag.originTrackId && drag.originTrackId === drag.previewTrackId) {
        return {
          ...track,
          clips: track.clips.map((clip) => (clip.id === drag.clipId ? movedClip : clip)),
        };
      }
      if (track.id === drag.originTrackId) {
        return { ...track, clips: track.clips.filter((clip) => clip.id !== drag.clipId) };
      }
      if (track.id === drag.previewTrackId) {
        return { ...track, clips: [...track.clips, movedClip] };
      }
      return track;
    });

    onTracksChange?.(next);
    pendingCreateTrackIdRef.current = null;
    setDrag(null);
  };

  const onTrimPointerDown = (
    event: PointerEvent<HTMLDivElement>,
    trackId: string,
    clip: Clip,
    side: "left" | "right",
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    setSelection({ trackId, clipId: clip.id });
    setTrim({
      trackId,
      clipId: clip.id,
      side,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      origin: clip,
      preview: { ...clip },
      snappedFrame: null,
    });
  };

  const onTrimPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!trim || trim.pointerId !== event.pointerId) return;

    const others = getOtherTrackClips(trim.trackId, trim.clipId);
    const deltaFrame = Math.round(pixelToFrame(event.clientX - trim.startClientX, zoom));
    if (trim.side === "left") {
      const fixedEnd = getClipEnd(trim.origin);
      const leftBoundary = others.reduce((maxEnd, clip) => {
        const clipEnd = getClipEnd(clip);
        if (clipEnd <= fixedEnd && clipEnd > maxEnd) return clipEnd;
        return maxEnd;
      }, 0);
      const sourceBoundMinDelta = isSourceBoundClip(trim.origin)
        ? -trim.origin.displayStart
        : Number.NEGATIVE_INFINITY;
      const minDelta = Math.max(
        sourceBoundMinDelta,
        -trim.origin.startFrame,
        leftBoundary - trim.origin.startFrame,
      );
      const maxDelta = trim.origin.duration - 1;
      const delta = clamp(deltaFrame, minDelta, maxDelta);
      const proposedStart = trim.origin.startFrame + delta;
      const snapped = snapTrimEdgeFrame(trim.trackId, trim.clipId, proposedStart);
      const minStart = trim.origin.startFrame + minDelta;
      const maxStart = trim.origin.startFrame + maxDelta;
      const finalStart = clamp(snapped.frame, minStart, maxStart);
      setTrim((prev) =>
        prev
          ? {
              ...prev,
              preview: {
                ...prev.origin,
                startFrame: finalStart,
                displayStart: prev.origin.displayStart + (finalStart - prev.origin.startFrame),
                duration: fixedEnd - finalStart,
              },
              snappedFrame: finalStart === snapped.frame ? snapped.snappedFrame : null,
            }
          : prev,
      );
      return;
    }

    const minDelta = 1 - trim.origin.duration;
    const rightNeighborStart = others.reduce((minStart, clip) => {
      if (clip.startFrame >= getClipEnd(trim.origin) && clip.startFrame < minStart) return clip.startFrame;
      return minStart;
    }, Number.POSITIVE_INFINITY);
    const maxByTimeline = totalFrames - trim.origin.startFrame - trim.origin.duration;
    const maxByNeighbor =
      rightNeighborStart === Number.POSITIVE_INFINITY
        ? maxByTimeline
        : rightNeighborStart - trim.origin.startFrame - trim.origin.duration;
    const maxDelta = Math.min(maxByTimeline, maxByNeighbor);
    const delta = clamp(deltaFrame, minDelta, maxDelta);
    const proposedEnd = getClipEnd(trim.origin) + delta;
    const snapped = snapTrimEdgeFrame(trim.trackId, trim.clipId, proposedEnd);
    const minEnd = getClipEnd(trim.origin) + minDelta;
    const maxEnd = getClipEnd(trim.origin) + maxDelta;
    const finalEnd = clamp(snapped.frame, minEnd, maxEnd);
    setTrim((prev) =>
      prev
        ? {
            ...prev,
            preview: {
              ...prev.origin,
              duration: finalEnd - prev.origin.startFrame,
            },
            snappedFrame: finalEnd === snapped.frame ? snapped.snappedFrame : null,
          }
        : prev,
    );
  };

  const onTrimPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!trim || trim.pointerId !== event.pointerId) return;
    const next = tracks.map((track) => {
      if (track.id !== trim.trackId) return track;
      return {
        ...track,
        clips: track.clips.map((clip) => (clip.id === trim.clipId ? trim.preview : clip)),
      };
    });
    onTracksChange?.(next);
    setTrim(null);
  };

  const zoomAroundFrame = useCallback(
    (targetFrame: number, nextZoom: number, focusClientX?: number) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      const rect = scrollEl.getBoundingClientRect();
      const clampedZoom = clamp(nextZoom, minZoom, maxZoom);
      if (clampedZoom === zoom) return;
      const clientX = focusClientX ?? rect.left + rect.width / 2;
      const nextAnchorX = frameToPixel(targetFrame, clampedZoom);
      const nextScrollLeft = nextAnchorX - (clientX - rect.left);
      setZoom(clampedZoom);
      requestAnimationFrame(() => {
        scrollEl.scrollLeft = Math.max(0, nextScrollLeft);
      });
    },
    [maxZoom, minZoom, zoom],
  );

  const onWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();

    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const rect = scrollEl.getBoundingClientRect();
    const anchorX = event.clientX - rect.left + scrollEl.scrollLeft;
    const anchorFrame = pixelToFrame(anchorX, zoom);
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    zoomAroundFrame(anchorFrame, zoom * factor, event.clientX);
  };

  const frameFromClientX = useCallback(
    (clientX: number) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return 0;
      const rect = scrollEl.getBoundingClientRect();
      const contentX = clientX - rect.left + scrollEl.scrollLeft;
      return clamp(Math.round(pixelToFrame(contentX, zoom)), 0, totalFrames);
    },
    [totalFrames, zoom],
  );

  const seekToClientX = useCallback(
    (clientX: number) => {
      const frame = frameFromClientX(clientX);
      currentFrameRef.current = frame;
      updatePlayheadPosition(frame);
      onFrameChange?.(frame);
    },
    [frameFromClientX, onFrameChange, updatePlayheadPosition],
  );

  const onPlayheadPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    scrubbingPointerIdRef.current = event.pointerId;
    seekToClientX(event.clientX);
  };

  const onPlayheadPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (scrubbingPointerIdRef.current !== event.pointerId) return;
    seekToClientX(event.clientX);
  };

  const onPlayheadPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (scrubbingPointerIdRef.current !== event.pointerId) return;
    scrubbingPointerIdRef.current = null;
  };

  return (
    <div
      ref={rootRef}
      className="timeline-root"
      onWheel={onWheelZoom}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setSelection(null);
      }}
    >
      <div className="timeline-zoom-controls">
        <button
          type="button"
          className="timeline-zoom-btn"
          onClick={() => zoomAroundFrame(currentFrameRef.current, zoom * 1.2)}
        >
          +
        </button>
        <button
          type="button"
          className="timeline-zoom-btn"
          onClick={() => zoomAroundFrame(currentFrameRef.current, zoom / 1.2)}
        >
          -
        </button>
      </div>

      <canvas ref={canvasRef} className="timeline-bg-canvas" />
      <canvas
        ref={rulerCanvasRef}
        onPointerDown={(event) => {
          event.preventDefault();
          onRulerPointerDown?.(frameFromClientX(event.clientX), event);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          onRulerDoubleClick?.(frameFromClientX(event.clientX), event);
        }}
        className="timeline-ruler-canvas"
      />

      <div
        className="timeline-playhead-layer"
        style={{ width: viewport.width, height: viewport.height }}
      >
        <div
          ref={playheadRef}
          onPointerDown={onPlayheadPointerDown}
          onPointerMove={onPlayheadPointerMove}
          onPointerUp={onPlayheadPointerUp}
          className="timeline-playhead"
        >
          <div className="timeline-playhead-arrow" />
          <div className="timeline-playhead-line" />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="timeline-scroll timeline-scroll-area"
        onPointerDownCapture={(event) => {
          const target = event.target as HTMLElement;
          if (!target.closest("[data-clip-id]")) {
            setSelection(null);
            onBlankAreaPointerDown?.(frameFromClientX(event.clientX), event);
          }
        }}
        onDoubleClickCapture={(event) => {
          const target = event.target as HTMLElement;
          if (!target.closest("[data-clip-id]")) {
            onBlankAreaDoubleClick?.(frameFromClientX(event.clientX), event);
          }
        }}
      >
        <div className="timeline-content" style={{ width: totalContentWidth, height: totalHeight }}>
          {visibleTracks.map((track) => (
            <React.Fragment key={track.id}>
              {track.clips.map((clip) => {
                const isDraggedSource = drag?.originTrackId === track.id && drag.clipId === clip.id;
                const isTrimmedClip = trim?.trackId === track.id && trim.clipId === clip.id;
                const isSelected = selection?.trackId === track.id && selection.clipId === clip.id;
                const renderClip = isTrimmedClip ? trim.preview : clip;
                const left = frameToPixel(renderClip.startFrame, zoom);
                const width = Math.max(2, frameToPixel(renderClip.duration, zoom));
                const layout = trackLayoutMap.get(track.id);
                if (!layout) return null;
                const top = layout.top + 6;
                const clipHeight = Math.max(14, layout.height - 12);

                return (
                  <ClipItem
                    key={clip.id}
                    clip={clip}
                    renderClip={renderClip}
                    left={left}
                    top={top}
                    width={width}
                    height={clipHeight}
                    isSelected={isSelected}
                    isDraggedSource={isDraggedSource}
                    onPointerDown={(event) => onClipPointerDown(event, track.id, clip)}
                    onPointerMove={onClipPointerMove}
                    onPointerUp={onClipPointerUp}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelection({ trackId: track.id, clipId: clip.id });
                    }}
                    onTrimPointerDown={(event, side) => onTrimPointerDown(event, track.id, clip, side)}
                    onTrimPointerMove={onTrimPointerMove}
                    onTrimPointerUp={onTrimPointerUp}
                  />
                );
              })}
            </React.Fragment>
          ))}

          {drag && (
            <DragPreview
              clip={drag.clip}
              left={frameToPixel(drag.previewStartFrame, zoom)}
              top={(trackLayoutMap.get(drag.previewTrackId)?.top ?? RULER_HEIGHT) + 6}
              width={Math.max(2, frameToPixel(drag.clip.duration, zoom))}
              height={Math.max(14, (trackLayoutMap.get(drag.previewTrackId)?.height ?? rowHeight) - 12)}
              isDropValid={drag.isDropValid}
              onPointerMove={onClipPointerMove}
              onPointerUp={onClipPointerUp}
            />
          )}

          {drag?.snappedFrame != null && (
            <div
              className="timeline-snap-line"
              style={{ transform: `translateX(${frameToPixel(drag.snappedFrame, zoom)}px)` }}
            />
          )}

          {trim?.snappedFrame != null && (
            <div
              className="timeline-snap-line"
              style={{ transform: `translateX(${frameToPixel(trim.snappedFrame, zoom)}px)` }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

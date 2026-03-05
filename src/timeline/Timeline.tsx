import React, {
  forwardRef,
  PointerEvent,
  useImperativeHandle,
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
  DragState,
  PendingDragState,
  Selection,
  TimelineAction,
  TrackControlRenderParams,
  TimelineProps,
  TimelineRow,
  TimelineState,
  TrackLayout,
  TrimState,
} from "./types";
import {
  clamp,
  getActionDuration,
  getTickStepSeconds,
  pixelToTime,
  timeToPixel,
} from "./utils";
import "./Timeline.css";

const MIN_ACTION_DURATION = 0.04;

export {
  timeToPixel as frameToPixel,
  pixelToTime as pixelToFrame,
} from "./utils";

export const Timeline = forwardRef<TimelineState, TimelineProps>(
  (
    {
      editorData,
      duration,
      playing,
      playEndBehavior = "stop",
      currentTime,
      showMinorTicks = true,
      showHorizontalLines = true,
      dragSnapToClipEdges = true,
      dragSnapToTimelineTicks = false,
      trimSnapToClipEdges = true,
      trimSnapToTimelineTicks = true,
      trimSnapThresholdPx = SNAP_PX,
      trimSnapTickMode = "minor",
      initialTime = 0,
      minZoom = 0.25,
      maxZoom = 8,
      zoom: controlledZoom,
      rowHeight = 52,
      trackGap = 0,
      trackHeightPresets,
      trackControlsWidth = 184,
      renderTrackControls,
      onActionMoveStart,
      onActionMoving,
      onActionMoveEnd,
      onActionResizeStart,
      onActionResizing,
      onActionResizeEnd,
      onEditorDataChange,
      onCursorDragStart,
      onCursorDragEnd,
      onCursorDrag,
      onZoomChange,
      onClickTimeArea,
      onClickRow,
      onClickAction,
      onClickActionOnly,
      onDoubleClickRow,
      onDoubleClickAction,
    },
    ref,
  ) => {
    const isSourceBoundAction = useCallback((action: TimelineAction) => {
      return action.kind === "video" || action.kind === "audio";
    }, []);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rulerCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const playheadRef = useRef<HTMLDivElement | null>(null);
    const scrubbingPointerIdRef = useRef<number | null>(null);
    const currentTimeRef = useRef(initialTime);
    const playRateRef = useRef(1);
    const playRequestRef = useRef<{
      toTime?: number;
      autoEnd?: boolean;
      runActionIds?: string[];
    } | null>(null);
    const rafRef = useRef<number | null>(null);
    const isDragWhenClickRef = useRef(false);

    const [uncontrolledZoom, setUncontrolledZoom] = useState(1);
    const [viewport, setViewport] = useState({
      width: 0,
      height: 0,
      scrollLeft: 0,
      scrollTop: 0,
    });
    const [drag, setDrag] = useState<DragState | null>(null);
    const [pendingDrag, setPendingDrag] = useState<PendingDragState | null>(
      null,
    );
    const [trim, setTrim] = useState<TrimState | null>(null);
    const [selection, setSelection] = useState<Selection>(null);
    const [lockedRows, setLockedRows] = useState<Record<string, boolean>>({});
    const [hiddenRows, setHiddenRows] = useState<Record<string, boolean>>({});
    const [mutedRows, setMutedRows] = useState<Record<string, boolean>>({});
    const updateSelection = useCallback((next: Selection) => {
      setSelection(next);
    }, []);
    const toggleRowLock = useCallback((rowId: string) => {
      setLockedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
    }, []);
    const toggleRowHide = useCallback((rowId: string) => {
      setHiddenRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
    }, []);
    const toggleRowMute = useCallback((rowId: string) => {
      setMutedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
    }, []);
    const deleteTrackById = useCallback(
      (rowId: string) => {
        if (!onEditorDataChange) return;
        const target = editorData.find((row) => row.id === rowId);
        if (!target || target.role === "main") return;
        onEditorDataChange(editorData.filter((row) => row.id !== rowId));
        if (selection?.rowId === rowId) updateSelection(null);
      },
      [editorData, onEditorDataChange, selection?.rowId, updateSelection],
    );

    const zoom = clamp(controlledZoom ?? uncontrolledZoom, minZoom, maxZoom);
    const isRowLocked = useCallback(
      (rowId: string) => Boolean(lockedRows[rowId]),
      [lockedRows],
    );
    const isRowHidden = useCallback(
      (rowId: string) => Boolean(hiddenRows[rowId]),
      [hiddenRows],
    );
    const isRowMuted = useCallback(
      (rowId: string) => Boolean(mutedRows[rowId]),
      [mutedRows],
    );
    const contentBounds = useMemo(() => {
      let minStart = Number.POSITIVE_INFINITY;
      let maxEnd = 0;
      editorData.forEach((row) => {
        row.actions.forEach((action) => {
          minStart = Math.min(minStart, action.start);
          maxEnd = Math.max(maxEnd, action.end);
        });
      });
      return {
        minStart: Number.isFinite(minStart) ? minStart : 0,
        maxEnd,
      };
    }, [editorData]);
    const getDefaultTrackHeight = useCallback(
      (role?: TimelineRow["role"], kind?: TimelineAction["kind"]) => {
        if (role === "main") return trackHeightPresets?.main ?? rowHeight;
        if (role === "audio") return trackHeightPresets?.audio ?? rowHeight;
        if (kind === "video") return trackHeightPresets?.video ?? rowHeight;
        if (kind === "audio") return trackHeightPresets?.audio ?? rowHeight;
        if (kind === "image") return trackHeightPresets?.image ?? rowHeight;
        if (kind === "text") return trackHeightPresets?.text ?? rowHeight;
        if (kind === "solid") return trackHeightPresets?.solid ?? rowHeight;
        return trackHeightPresets?.normal ?? rowHeight;
      },
      [rowHeight, trackHeightPresets],
    );

    const totalContentWidth = timeToPixel(duration, zoom);
    const lastActionEnd = useMemo(() => {
      let maxEnd = 0;
      editorData.forEach((row) => {
        row.actions.forEach((action) => {
          maxEnd = Math.max(maxEnd, action.end);
        });
      });
      return clamp(maxEnd, 0, duration);
    }, [duration, editorData]);

    const trackLayouts = useMemo<TrackLayout[]>(() => {
      let y = RULER_HEIGHT;
      return editorData.map((row, index) => {
        const kind = row.actions[0]?.kind;
        const defaultHeight = getDefaultTrackHeight(row.role, kind);
        const height = Math.max(
          MIN_TRACK_HEIGHT,
          row.rowHeight ?? defaultHeight,
        );
        const layout: TrackLayout = {
          id: row.id,
          index,
          top: y,
          height,
          bottom: y + height,
        };
        y += height + trackGap;
        return layout;
      });
    }, [editorData, getDefaultTrackHeight, trackGap]);

    const trackLayoutMap = useMemo(
      () => new Map(trackLayouts.map((layout) => [layout.id, layout])),
      [trackLayouts],
    );
    const trackIndexMap = useMemo(
      () => new Map(editorData.map((row, index) => [row.id, index])),
      [editorData],
    );
    const mainTrackIndex = useMemo(
      () => editorData.findIndex((row) => row.role === "main"),
      [editorData],
    );

    const totalHeight =
      trackLayouts.length > 0
        ? trackLayouts[trackLayouts.length - 1].bottom
        : RULER_HEIGHT;
    const visibleLeft = viewport.scrollLeft - VIRTUAL_BUFFER_PX;
    const visibleRight =
      viewport.scrollLeft + viewport.width + VIRTUAL_BUFFER_PX;

    const visibleTracks = useMemo(
      () =>
        editorData.map((row) => ({
          ...row,
          actions: row.actions.filter((action) => {
            const left = timeToPixel(action.start, zoom);
            const right = timeToPixel(action.end, zoom);
            return right >= visibleLeft && left <= visibleRight;
          }),
        })),
      [editorData, visibleLeft, visibleRight, zoom],
    );

    const drawCanvas = useCallback(() => {
      if (!canvasRef.current) return;
      drawTimelineCanvas({
        canvas: canvasRef.current,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
        zoom,
        duration,
        showMinorTicks,
        showHorizontalLines,
        trackLayouts,
      });
    }, [
      duration,
      showHorizontalLines,
      showMinorTicks,
      trackLayouts,
      viewport.height,
      viewport.scrollLeft,
      viewport.scrollTop,
      viewport.width,
      zoom,
    ]);

    const drawRuler = useCallback(() => {
      if (!rulerCanvasRef.current) return;
      drawRulerCanvas({
        canvas: rulerCanvasRef.current,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
        zoom,
        duration,
        showMinorTicks,
      });
    }, [
      duration,
      showMinorTicks,
      viewport.height,
      viewport.scrollLeft,
      viewport.scrollTop,
      viewport.width,
      zoom,
    ]);

    const updatePlayheadPosition = useCallback(
      (time: number) => {
        if (!playheadRef.current) return;
        const x =
          timeToPixel(time, zoom) - (scrollRef.current?.scrollLeft ?? 0);
        playheadRef.current.style.transform = `translateX(${x}px)`;
      },
      [zoom],
    );
    const setCurrentTime = useCallback(
      (time: number, notify = true) => {
        const nextTime = clamp(time, 0, duration);
        currentTimeRef.current = nextTime;
        updatePlayheadPosition(nextTime);
        if (notify) onCursorDrag?.(nextTime);
        return nextTime;
      },
      [duration, onCursorDrag, updatePlayheadPosition],
    );

    useEffect(() => {
      updatePlayheadPosition(currentTimeRef.current);
    }, [updatePlayheadPosition]);

    useEffect(() => {
      if (currentTime == null) return;
      setCurrentTime(currentTime, false);
    }, [currentTime, setCurrentTime]);

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
        updatePlayheadPosition(currentTimeRef.current);
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

      root.addEventListener("wheel", preventPageZoomByWheel, {
        passive: false,
      });
      root.addEventListener("gesturestart", preventGestureZoom, {
        passive: false,
      });
      root.addEventListener("gesturechange", preventGestureZoom, {
        passive: false,
      });
      root.addEventListener("gestureend", preventGestureZoom, {
        passive: false,
      });

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
      let lastReported = currentTimeRef.current;

      const loop = (now: number) => {
        const elapsed = ((now - lastTime) / 1000) * playRateRef.current;
        lastTime = now;
        const requestToTime = playRequestRef.current?.toTime;
        const playbackEnd =
          requestToTime == null
            ? Math.max(0, lastActionEnd)
            : clamp(requestToTime, 0, duration);
        const nextTime = clamp(
          currentTimeRef.current + elapsed,
          0,
          playbackEnd,
        );
        currentTimeRef.current = nextTime;
        updatePlayheadPosition(nextTime);

        if (Math.abs(nextTime - lastReported) >= 0.01) {
          lastReported = nextTime;
          onCursorDrag?.(nextTime);
        }

        if (nextTime >= playbackEnd) {
          if (playEndBehavior === "loop" && playbackEnd > 0) {
            playRequestRef.current = null;
            currentTimeRef.current = 0;
            updatePlayheadPosition(0);
            onCursorDrag?.(0);
            rafRef.current = requestAnimationFrame(loop);
          } else {
            playRequestRef.current = null;
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
    }, [
      lastActionEnd,
      onCursorDrag,
      playEndBehavior,
      playing,
      updatePlayheadPosition,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        target: rootRef.current,
        isPlaying: playing,
        isPaused: !playing,
        setTime: (time: number) => {
          setCurrentTime(time);
        },
        getTime: () => currentTimeRef.current,
        setPlayRate: (rate: number) => {
          if (!Number.isFinite(rate) || rate <= 0) return;
          playRateRef.current = rate;
        },
        getPlayRate: () => playRateRef.current,
        reRender: () => {
          drawCanvas();
          drawRuler();
          updatePlayheadPosition(currentTimeRef.current);
        },
        play: (param) => {
          playRequestRef.current = param;
          return true;
        },
        pause: () => {
          playRequestRef.current = null;
        },
        setScrollLeft: (val: number) => {
          if (!scrollRef.current) return;
          scrollRef.current.scrollLeft = Math.max(0, val);
        },
        setScrollTop: (val: number) => {
          if (!scrollRef.current) return;
          scrollRef.current.scrollTop = Math.max(0, val);
        },
      }),
      [drawCanvas, drawRuler, playing, setCurrentTime, updatePlayheadPosition],
    );

    const snapStartTime = useCallback(
      (actionId: string, proposedStart: number, actionDuration: number) => {
        const thresholdTime = pixelToTime(SNAP_PX, zoom);
        const candidates: number[] = [currentTimeRef.current];
        if (dragSnapToClipEdges) {
          editorData.forEach((row) => {
            row.actions.forEach((action) => {
              if (action.id === actionId) return;
              candidates.push(action.start, action.end);
            });
          });
        }

        let best: { delta: number; time: number } | null = null;
        const movingEdges = [proposedStart, proposedStart + actionDuration];
        for (const target of candidates) {
          for (const edge of movingEdges) {
            const delta = target - edge;
            if (Math.abs(delta) > thresholdTime) continue;
            if (!best || Math.abs(delta) < Math.abs(best.delta)) {
              best = { delta, time: target };
            }
          }
        }
        if (dragSnapToTimelineTicks) {
          const tick = getTickStepSeconds(timeToPixel(1, zoom));
          const step = tick.minor;
          for (const edge of movingEdges) {
            const nearestTick = clamp(Math.round(edge / step) * step, 0, duration);
            const delta = nearestTick - edge;
            if (Math.abs(delta) > thresholdTime) continue;
            if (!best || Math.abs(delta) < Math.abs(best.delta)) {
              best = { delta, time: nearestTick };
            }
          }
        }
        if (!best)
          return { start: proposedStart, snappedTime: null as number | null };
        return { start: proposedStart + best.delta, snappedTime: best.time };
      },
      [dragSnapToClipEdges, dragSnapToTimelineTicks, duration, editorData, zoom],
    );

    const getTrackIdByClientY = useCallback(
      (clientY: number) => {
        const scrollEl = scrollRef.current;
        if (!scrollEl || editorData.length === 0) return null;
        const rect = scrollEl.getBoundingClientRect();
        const contentY = clientY - rect.top + scrollEl.scrollTop;
        const first = trackLayouts[0];
        const last = trackLayouts[trackLayouts.length - 1];
        if (!first || !last) return null;
        if (contentY <= first.top) return first.id;
        if (contentY >= last.bottom) return last.id;
        const hit = trackLayouts.find(
          (layout) => contentY >= layout.top && contentY < layout.bottom,
        );
        if (hit) return hit.id;
        const nearest = trackLayouts.reduce<{
          id: string;
          distance: number;
        } | null>((best, layout) => {
          const distance =
            contentY < layout.top
              ? layout.top - contentY
              : contentY > layout.bottom
                ? contentY - layout.bottom
                : 0;
          if (!best || distance < best.distance) {
            return { id: layout.id, distance };
          }
          return best;
        }, null);
        return nearest?.id ?? last.id;
      },
      [editorData.length, trackLayouts],
    );

    const createNextTrack = useCallback(
      (actionKind?: TimelineAction["kind"]): TimelineRow => {
        const existingIds = new Set(editorData.map((row) => row.id));
        let index = editorData.length + 1;
        let id = `track-${index}`;
        while (existingIds.has(id)) {
          index += 1;
          id = `track-${index}`;
        }
        const role = actionKind === "audio" ? "audio" : "normal";
        return {
          id,
          name: `Track ${index}`,
          role,
          rowHeight: getDefaultTrackHeight(role, actionKind),
          actions: [],
        };
      },
      [editorData, getDefaultTrackHeight],
    );

    const canCreateTrackAtIndex = useCallback(
      (action: TimelineAction, index: number) => {
        const movingKind = action.kind ?? "video";
        if (movingKind === "audio") {
          if (mainTrackIndex < 0) return true;
          return index > mainTrackIndex;
        }
        if (mainTrackIndex < 0) return true;
        return index <= mainTrackIndex;
      },
      [mainTrackIndex],
    );

    const canPlaceActionOnTrack = useCallback(
      (action: TimelineAction, targetTrackId: string) => {
        const targetTrackIndex = trackIndexMap.get(targetTrackId);
        if (targetTrackIndex == null) return false;
        const targetTrack = editorData[targetTrackIndex];
        if (!targetTrack) return false;
        const movingKind = action.kind ?? "video";
        const fixedKinds = new Set(
          targetTrack.actions
            .filter((item) => item.id !== action.id)
            .map((item) => item.kind ?? "video"),
        );
        if (fixedKinds.size > 0 && !fixedKinds.has(movingKind)) return false;

        if (targetTrack.role === "main" && movingKind !== "video") return false;
        if (targetTrack.role === "audio" && movingKind !== "audio")
          return false;
        if (movingKind === "audio" && targetTrack.role !== "audio")
          return false;
        if (
          movingKind !== "audio" &&
          mainTrackIndex >= 0 &&
          targetTrackIndex > mainTrackIndex
        )
          return false;
        if (
          movingKind === "audio" &&
          mainTrackIndex >= 0 &&
          targetTrackIndex <= mainTrackIndex
        )
          return false;
        return true;
      },
      [editorData, mainTrackIndex, trackIndexMap],
    );

    const getInsertTrackCandidate = useCallback(
      (clientY: number, action: TimelineAction) => {
        const scrollEl = scrollRef.current;
        if (!scrollEl) return null;
        const rect = scrollEl.getBoundingClientRect();
        const contentY = clientY - rect.top + scrollEl.scrollTop;
        const threshold = Math.max(4, CREATE_TRACK_GAP_PX / 2);

        for (let i = 0; i < trackLayouts.length - 1; i += 1) {
          const mid = (trackLayouts[i].bottom + trackLayouts[i + 1].top) / 2;
          if (Math.abs(contentY - mid) <= threshold) {
            const index = i + 1;
            if (!canCreateTrackAtIndex(action, index)) return null;
            return { index, lineY: mid };
          }
        }

        if (trackLayouts.length > 0) {
          const last = trackLayouts[trackLayouts.length - 1];
          const endLine = last.bottom + Math.max(2, trackGap / 2);
          if (
            contentY > last.bottom + CREATE_TRACK_GAP_PX &&
            canCreateTrackAtIndex(action, editorData.length)
          ) {
            return { index: editorData.length, lineY: endLine };
          }
        }

        return null;
      },
      [canCreateTrackAtIndex, editorData.length, trackGap, trackLayouts],
    );

    const getOtherTrackActions = useCallback(
      (rowId: string, actionId: string) => {
        const row = editorData.find((item) => item.id === rowId);
        if (!row) return [];
        return row.actions
          .filter((action) => action.id !== actionId)
          .sort((a, b) => a.start - b.start);
      },
      [editorData],
    );

    const getSelectedActionContext = useCallback(() => {
      if (!selection) return null;
      const trackIndex = editorData.findIndex(
        (row) => row.id === selection.rowId,
      );
      if (trackIndex < 0) return null;
      const row = editorData[trackIndex];
      const actionIndex = row.actions.findIndex(
        (action) => action.id === selection.actionId,
      );
      if (actionIndex < 0) return null;
      const action = row.actions[actionIndex];
      const playheadTime = currentTimeRef.current;
      if (playheadTime <= action.start || playheadTime >= action.end)
        return null;
      return { trackIndex, row, actionIndex, action, playheadTime };
    }, [editorData, selection]);

    const createSplitActionId = useCallback(
      (row: TimelineRow, baseId: string) => {
        const existing = new Set(row.actions.map((action) => action.id));
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

    const splitSelectedClipAtPlayhead = useCallback(() => {
      const ctx = getSelectedActionContext();
      if (!ctx || !onEditorDataChange) return;
      const { trackIndex, row, actionIndex, action, playheadTime } = ctx;
      if (playheadTime <= action.start || playheadTime >= action.end) return;

      const leftDuration = playheadTime - action.start;
      const rightDuration = action.end - playheadTime;
      if (
        leftDuration <= MIN_ACTION_DURATION ||
        rightDuration <= MIN_ACTION_DURATION
      )
        return;

      const sourceIn = action.inPoint ?? 0;
      const sourceOut = action.outPoint ?? sourceIn + getActionDuration(action);

      const rightAction: TimelineAction = {
        ...action,
        id: createSplitActionId(row, action.id),
        start: playheadTime,
        end: action.end,
        inPoint: sourceIn + leftDuration,
        outPoint: sourceOut,
      };
      const leftAction: TimelineAction = {
        ...action,
        start: action.start,
        end: playheadTime,
        inPoint: sourceIn,
        outPoint: sourceIn + leftDuration,
      };

      const next = editorData.map((item, index) => {
        if (index !== trackIndex) return item;
        const actions = [...item.actions];
        actions.splice(actionIndex, 1, leftAction, rightAction);
        return { ...item, actions };
      });
      onEditorDataChange(next);
      updateSelection({ rowId: row.id, actionId: rightAction.id });
    }, [
      createSplitActionId,
      editorData,
      getSelectedActionContext,
      onEditorDataChange,
      updateSelection,
    ]);

    const trimSelectedClipLeftToPlayhead = useCallback(() => {
      const ctx = getSelectedActionContext();
      if (!ctx || !onEditorDataChange) return;
      const { trackIndex, actionIndex, action, playheadTime } = ctx;
      if (playheadTime <= action.start || playheadTime >= action.end) return;

      const next = editorData.map((item, index) => {
        if (index !== trackIndex) return item;
        const actions = item.actions.map((current, currentIndex) => {
          if (currentIndex !== actionIndex) return current;
          const delta = playheadTime - current.start;
          return {
            ...current,
            start: playheadTime,
            inPoint: (current.inPoint ?? 0) + delta,
          };
        });
        return { ...item, actions };
      });
      onEditorDataChange(next);
    }, [editorData, getSelectedActionContext, onEditorDataChange]);

    const trimSelectedClipRightToPlayhead = useCallback(() => {
      const ctx = getSelectedActionContext();
      if (!ctx || !onEditorDataChange) return;
      const { trackIndex, actionIndex, action, playheadTime } = ctx;
      if (playheadTime <= action.start) return;

      const next = editorData.map((item, index) => {
        if (index !== trackIndex) return item;
        const actions = item.actions.map((current, currentIndex) => {
          if (currentIndex !== actionIndex) return current;
          const delta = playheadTime - current.end;
          return {
            ...current,
            end: playheadTime,
            outPoint:
              (current.outPoint ?? current.inPoint ?? 0) +
              getActionDuration(current) +
              delta,
          };
        });
        return { ...item, actions };
      });
      onEditorDataChange(next);
    }, [editorData, getSelectedActionContext, onEditorDataChange]);

    const deleteSelectedClip = useCallback(() => {
      if (!selection || !onEditorDataChange) return;
      const next = editorData
        .map((row) => {
          if (row.id !== selection.rowId) return row;
          return {
            ...row,
            actions: row.actions.filter(
              (action) => action.id !== selection.actionId,
            ),
          };
        })
        .filter((row) => !(row.role !== "main" && row.actions.length === 0));
      onEditorDataChange(next);
      updateSelection(null);
    }, [editorData, onEditorDataChange, selection, updateSelection]);

    const getValidStartIntervals = useCallback(
      (
        rowId: string,
        actionId: string,
        actionDuration: number,
      ): Array<[number, number]> => {
        const others = getOtherTrackActions(rowId, actionId);
        const intervals: Array<[number, number]> = [];
        let cursor = 0;
        for (const other of others) {
          if (other.start > cursor && other.start - cursor >= actionDuration) {
            intervals.push([cursor, other.start - actionDuration]);
          }
          cursor = Math.max(cursor, other.end);
        }
        if (duration - cursor >= actionDuration) {
          intervals.push([cursor, duration - actionDuration]);
        }
        return intervals;
      },
      [duration, getOtherTrackActions],
    );

    const resolveStartInTrack = useCallback(
      (
        rowId: string,
        actionId: string,
        actionDuration: number,
        proposedStart: number,
      ) => {
        const intervals = getValidStartIntervals(
          rowId,
          actionId,
          actionDuration,
        );
        if (intervals.length === 0) return null;
        for (const [start, end] of intervals) {
          if (proposedStart >= start && proposedStart <= end)
            return proposedStart;
        }
        const threshold = pixelToTime(SNAP_PX, zoom);
        let nearestBoundary: number | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (const [start, end] of intervals) {
          const startDistance = Math.abs(proposedStart - start);
          if (startDistance <= threshold && startDistance < nearestDistance) {
            nearestDistance = startDistance;
            nearestBoundary = start;
          }
          const endDistance = Math.abs(proposedStart - end);
          if (endDistance <= threshold && endDistance < nearestDistance) {
            nearestDistance = endDistance;
            nearestBoundary = end;
          }
        }
        if (nearestBoundary != null) return nearestBoundary;
        return null;
      },
      [getValidStartIntervals, zoom],
    );

    const snapTrimEdgeTime = useCallback(
      (
        rowId: string,
        actionId: string,
        movingTime: number,
        limits?: { min: number; max: number },
      ) => {
        const threshold = pixelToTime(trimSnapThresholdPx, zoom);
        let bestTime: number | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;
        let hasClipEdgeCandidate = false;
        const minLimit = limits?.min ?? 0;
        const maxLimit = limits?.max ?? duration;
        const isInRange = (time: number) =>
          time >= minLimit && time <= maxLimit;

        if (trimSnapToClipEdges) {
          editorData.forEach((row) => {
            row.actions.forEach((action) => {
              if (row.id === rowId && action.id === actionId) return;
              const candidates = [action.start, action.end];
              for (const candidate of candidates) {
                if (!isInRange(candidate)) continue;
                const distance = Math.abs(candidate - movingTime);
                if (distance <= threshold && distance < bestDistance) {
                  bestDistance = distance;
                  bestTime = candidate;
                  hasClipEdgeCandidate = true;
                }
              }
            });
          });
        }

        if (hasClipEdgeCandidate) {
          const snapped = bestTime ?? movingTime;
          return { time: snapped, snappedTime: snapped };
        }

        if (trimSnapToTimelineTicks) {
          const pxPerSecond = timeToPixel(1, zoom);
          const tick = getTickStepSeconds(pxPerSecond);
          const step = trimSnapTickMode === "major" ? tick.major : tick.minor;
          const nearestTick = Math.round(movingTime / step) * step;
          const clampedTick = clamp(nearestTick, 0, duration);
          if (!isInRange(clampedTick)) {
            if (bestTime == null)
              return { time: movingTime, snappedTime: null as number | null };
            return { time: bestTime, snappedTime: bestTime };
          }
          const distance = Math.abs(clampedTick - movingTime);
          if (distance <= threshold && distance < bestDistance) {
            bestDistance = distance;
            bestTime = clampedTick;
          }
        }

        if (bestTime == null)
          return { time: movingTime, snappedTime: null as number | null };
        return { time: bestTime, snappedTime: bestTime };
      },
      [
        duration,
        editorData,
        getOtherTrackActions,
        trimSnapThresholdPx,
        trimSnapTickMode,
        trimSnapToClipEdges,
        trimSnapToTimelineTicks,
        zoom,
      ],
    );

    const onClipPointerDown = (
      event: PointerEvent<HTMLDivElement>,
      rowId: string,
      action: TimelineAction,
    ) => {
      if (event.button !== 0) return;
      if (trim) return;
      if (isRowLocked(rowId)) return;
      event.preventDefault();
      isDragWhenClickRef.current = false;
      (event.currentTarget as HTMLDivElement).setPointerCapture(
        event.pointerId,
      );
      updateSelection({ rowId, actionId: action.id });
      setPendingDrag({
        rowId,
        action,
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
        isDragWhenClickRef.current = true;
        const startRow = editorData.find((row) => row.id === pendingDrag.rowId);
        if (startRow) {
          onActionMoveStart?.({
            action: pendingDrag.action,
            row: startRow,
          });
        }
        setDrag({
          originRowId: pendingDrag.rowId,
          previewRowId: pendingDrag.rowId,
          insertRowIndex: null,
          insertLineY: null,
          actionId: pendingDrag.action.id,
          action: pendingDrag.action,
          pointerId: pendingDrag.pointerId,
          startClientX: pendingDrag.startClientX,
          originStart: pendingDrag.action.start,
          previewStart: pendingDrag.action.start,
          commitStart: pendingDrag.action.start,
          snappedTime: null,
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
          scrollEl.scrollTop = Math.max(
            0,
            scrollEl.scrollTop - AUTO_SCROLL_STEP_PX,
          );
        } else if (event.clientY > rect.bottom - AUTO_SCROLL_EDGE_PX) {
          const maxTop = scrollEl.scrollHeight - scrollEl.clientHeight;
          scrollEl.scrollTop = Math.min(
            maxTop,
            scrollEl.scrollTop + AUTO_SCROLL_STEP_PX,
          );
        }
        if (event.clientX < rect.left + AUTO_SCROLL_EDGE_PX) {
          scrollEl.scrollLeft = Math.max(
            0,
            scrollEl.scrollLeft - AUTO_SCROLL_STEP_PX,
          );
        } else if (event.clientX > rect.right - AUTO_SCROLL_EDGE_PX) {
          const maxLeft = scrollEl.scrollWidth - scrollEl.clientWidth;
          scrollEl.scrollLeft = Math.min(
            maxLeft,
            scrollEl.scrollLeft + AUTO_SCROLL_STEP_PX,
          );
        }
      }

      const dx = event.clientX - drag.startClientX;
      const deltaTime = pixelToTime(dx, zoom);
      const actionDuration = getActionDuration(drag.action);
      const proposed = clamp(
        drag.originStart + deltaTime,
        0,
        duration - actionDuration,
      );
      const snapped = snapStartTime(drag.actionId, proposed, actionDuration);
      const visualStart = clamp(snapped.start, 0, duration - actionDuration);
      const insertCandidate = getInsertTrackCandidate(
        event.clientY,
        drag.action,
      );
      const targetRowId =
        getTrackIdByClientY(event.clientY) ?? drag.previewRowId;
      const canPlace = canPlaceActionOnTrack(drag.action, targetRowId);
      const resolvedStart = insertCandidate
        ? visualStart
        : canPlace
          ? resolveStartInTrack(
              targetRowId,
              drag.actionId,
              actionDuration,
              visualStart,
            )
          : null;
      const originRow = editorData.find((row) => row.id === drag.originRowId);
      const canMoveByCallback =
        resolvedStart != null && originRow
          ? onActionMoving?.({
              action: drag.action,
              row: originRow,
              start: resolvedStart,
              end: resolvedStart + actionDuration,
              targetRowId: insertCandidate ? undefined : targetRowId,
              insertRowIndex: insertCandidate?.index ?? null,
            }) !== false
          : resolvedStart != null;

      setDrag((prev) =>
        prev
          ? {
              ...prev,
              previewRowId: targetRowId,
              previewStart: visualStart,
              insertRowIndex: insertCandidate?.index ?? null,
              insertLineY: insertCandidate?.lineY ?? null,
              commitStart: canMoveByCallback ? resolvedStart : null,
              snappedTime:
                canMoveByCallback && resolvedStart != null
                  ? snapped.snappedTime
                  : null,
              isDropValid: canMoveByCallback && resolvedStart != null,
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

      const actionDuration = getActionDuration(drag.action);
      const movedAction: TimelineAction = {
        ...drag.action,
        start: drag.commitStart ?? drag.previewStart,
        end: (drag.commitStart ?? drag.previewStart) + actionDuration,
      };
      const insertedTrack =
        drag.insertRowIndex != null ? createNextTrack(drag.action.kind) : null;
      const workingRows =
        insertedTrack && drag.insertRowIndex != null
          ? (() => {
              const nextRows = [...editorData];
              nextRows.splice(drag.insertRowIndex, 0, insertedTrack);
              return nextRows;
            })()
          : editorData;
      const finalPreviewRowId = insertedTrack?.id ?? drag.previewRowId;
      const next = workingRows.map((row) => {
        if (
          row.id === drag.originRowId &&
          drag.originRowId === finalPreviewRowId
        ) {
          return {
            ...row,
            actions: row.actions.map((action) =>
              action.id === drag.actionId ? movedAction : action,
            ),
          };
        }
        if (row.id === drag.originRowId) {
          return {
            ...row,
            actions: row.actions.filter(
              (action) => action.id !== drag.actionId,
            ),
          };
        }
        if (row.id === finalPreviewRowId) {
          return { ...row, actions: [...row.actions, movedAction] };
        }
        return row;
      });
      const shouldDeleteEmptyOriginTrack =
        drag.originRowId !== finalPreviewRowId;
      const finalizedRows = shouldDeleteEmptyOriginTrack
        ? next.filter(
            (row) =>
              !(
                row.id === drag.originRowId &&
                row.actions.length === 0 &&
                row.role !== "main"
              ),
          )
        : next;
      const finalRow = finalizedRows.find(
        (row) => row.id === finalPreviewRowId,
      );
      const originRow = editorData.find((row) => row.id === drag.originRowId);
      if (originRow) {
        onActionMoveEnd?.({
          action: drag.action,
          row: originRow,
          start: movedAction.start,
          end: movedAction.end,
          targetRowId: finalRow?.id,
          insertRowIndex: drag.insertRowIndex,
        });
      }
      onEditorDataChange?.(finalizedRows);
      setDrag(null);
    };

    const onTrimPointerDown = (
      event: PointerEvent<HTMLDivElement>,
      rowId: string,
      action: TimelineAction,
      side: "left" | "right",
    ) => {
      if (event.button !== 0) return;
      if (isRowLocked(rowId)) return;
      event.preventDefault();
      event.stopPropagation();
      (event.currentTarget as HTMLDivElement).setPointerCapture(
        event.pointerId,
      );
      updateSelection({ rowId, actionId: action.id });
      const row = editorData.find((item) => item.id === rowId);
      if (row) {
        onActionResizeStart?.({
          action,
          row,
          dir: side,
        });
      }
      setTrim({
        rowId,
        actionId: action.id,
        side,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        origin: action,
        preview: { ...action },
        snappedTime: null,
      });
    };

    const onTrimPointerMove = (event: PointerEvent<HTMLDivElement>) => {
      if (!trim || trim.pointerId !== event.pointerId) return;

      const others = getOtherTrackActions(trim.rowId, trim.actionId);
      const deltaTime = pixelToTime(event.clientX - trim.startClientX, zoom);
      if (trim.side === "left") {
        const fixedEnd = trim.origin.end;
        const leftBoundary = others.reduce((maxEnd, action) => {
          if (action.end <= fixedEnd && action.end > maxEnd) return action.end;
          return maxEnd;
        }, 0);
        const sourceBoundMinDelta = isSourceBoundAction(trim.origin)
          ? -(trim.origin.inPoint ?? 0)
          : Number.NEGATIVE_INFINITY;
        const minDelta = Math.max(
          sourceBoundMinDelta,
          -trim.origin.start,
          leftBoundary - trim.origin.start,
        );
        const maxDelta = getActionDuration(trim.origin) - MIN_ACTION_DURATION;
        const delta = clamp(deltaTime, minDelta, maxDelta);
        const proposedStart = trim.origin.start + delta;
        const minStart = trim.origin.start + minDelta;
        const maxStart = trim.origin.start + maxDelta;
        const snapped = snapTrimEdgeTime(
          trim.rowId,
          trim.actionId,
          proposedStart,
          {
            min: minStart,
            max: maxStart,
          },
        );
        const finalStart = clamp(snapped.time, minStart, maxStart);
        const row = editorData.find((item) => item.id === trim.rowId);
        if (
          row &&
          onActionResizing?.({
            action: trim.origin,
            row,
            start: finalStart,
            end: fixedEnd,
            dir: "left",
          }) === false
        ) {
          return;
        }
        setTrim((prev) =>
          prev
            ? {
                ...prev,
                preview: {
                  ...prev.origin,
                  start: finalStart,
                  inPoint:
                    (prev.origin.inPoint ?? 0) +
                    (finalStart - prev.origin.start),
                  end: fixedEnd,
                },
                snappedTime:
                  finalStart === snapped.time ? snapped.snappedTime : null,
              }
            : prev,
        );
        return;
      }

      const minDelta = MIN_ACTION_DURATION - getActionDuration(trim.origin);
      const rightNeighborStart = others.reduce((minStart, action) => {
        if (action.start >= trim.origin.end && action.start < minStart)
          return action.start;
        return minStart;
      }, Number.POSITIVE_INFINITY);
      const maxByTimeline = duration - trim.origin.end;
      const maxByNeighbor =
        rightNeighborStart === Number.POSITIVE_INFINITY
          ? maxByTimeline
          : rightNeighborStart - trim.origin.end;
      const maxDelta = Math.min(maxByTimeline, maxByNeighbor);
      const delta = clamp(deltaTime, minDelta, maxDelta);
      const proposedEnd = trim.origin.end + delta;
      const minEnd = trim.origin.end + minDelta;
      const maxEnd = trim.origin.end + maxDelta;
      const snapped = snapTrimEdgeTime(trim.rowId, trim.actionId, proposedEnd, {
        min: minEnd,
        max: maxEnd,
      });
      const finalEnd = clamp(snapped.time, minEnd, maxEnd);
      const row = editorData.find((item) => item.id === trim.rowId);
      if (
        row &&
        onActionResizing?.({
          action: trim.origin,
          row,
          start: trim.origin.start,
          end: finalEnd,
          dir: "right",
        }) === false
      ) {
        return;
      }
      setTrim((prev) =>
        prev
          ? {
              ...prev,
              preview: {
                ...prev.origin,
                end: finalEnd,
                outPoint:
                  (prev.origin.outPoint ?? prev.origin.inPoint ?? 0) +
                  (finalEnd - prev.origin.end),
              },
              snappedTime:
                finalEnd === snapped.time ? snapped.snappedTime : null,
            }
          : prev,
      );
    };

    const onTrimPointerUp = (event: PointerEvent<HTMLDivElement>) => {
      if (!trim || trim.pointerId !== event.pointerId) return;
      const row = editorData.find((item) => item.id === trim.rowId);
      const action = row?.actions.find((item) => item.id === trim.actionId);
      if (row && action) {
        onActionResizeEnd?.({
          action,
          row,
          start: trim.preview.start,
          end: trim.preview.end,
          dir: trim.side,
        });
      }
      const next = editorData.map((row) => {
        if (row.id !== trim.rowId) return row;
        return {
          ...row,
          actions: row.actions.map((action) =>
            action.id === trim.actionId ? trim.preview : action,
          ),
        };
      });
      onEditorDataChange?.(next);
      setTrim(null);
    };

    const setZoomValue = useCallback(
      (next: number) => {
        const clamped = clamp(next, minZoom, maxZoom);
        if (controlledZoom == null) {
          setUncontrolledZoom(clamped);
        }
        onZoomChange?.(clamped);
        return clamped;
      },
      [controlledZoom, maxZoom, minZoom, onZoomChange],
    );

    const zoomAroundTime = useCallback(
      (targetTime: number, nextZoom: number, focusClientX?: number) => {
        const scrollEl = scrollRef.current;
        if (!scrollEl) return;
        const rect = scrollEl.getBoundingClientRect();
        const clampedZoom = setZoomValue(nextZoom);
        if (clampedZoom === zoom) return;
        const clientX = focusClientX ?? rect.left + rect.width / 2;
        const nextAnchorX = timeToPixel(targetTime, clampedZoom);
        const nextScrollLeft = nextAnchorX - (clientX - rect.left);
        requestAnimationFrame(() => {
          scrollEl.scrollLeft = Math.max(0, nextScrollLeft);
        });
      },
      [setZoomValue, zoom],
    );

    const onWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();

      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      const rect = scrollEl.getBoundingClientRect();
      const anchorX = event.clientX - rect.left + scrollEl.scrollLeft;
      const anchorTime = pixelToTime(anchorX, zoom);
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      zoomAroundTime(anchorTime, zoom * factor, event.clientX);
    };

    const timeFromClientX = useCallback(
      (clientX: number) => {
        const scrollEl = scrollRef.current;
        if (!scrollEl) return 0;
        const rect = scrollEl.getBoundingClientRect();
        const contentX = clientX - rect.left + scrollEl.scrollLeft;
        return clamp(pixelToTime(contentX, zoom), 0, duration);
      },
      [duration, zoom],
    );

    const seekToClientX = useCallback(
      (clientX: number) => {
        const time = timeFromClientX(clientX);
        setCurrentTime(time);
      },
      [setCurrentTime, timeFromClientX],
    );
    const dispatchTimeAreaClick = useCallback(
      (time: number, event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (onClickTimeArea?.(time, event) === false) return;
        setCurrentTime(time);
      },
      [onClickTimeArea, setCurrentTime],
    );

    const onPlayheadPointerDown = (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      (event.currentTarget as HTMLDivElement).setPointerCapture(
        event.pointerId,
      );
      scrubbingPointerIdRef.current = event.pointerId;
      seekToClientX(event.clientX);
      onCursorDragStart?.(currentTimeRef.current);
    };

    const onPlayheadPointerMove = (event: PointerEvent<HTMLDivElement>) => {
      if (scrubbingPointerIdRef.current !== event.pointerId) return;
      seekToClientX(event.clientX);
    };

    const onPlayheadPointerUp = (event: PointerEvent<HTMLDivElement>) => {
      if (scrubbingPointerIdRef.current !== event.pointerId) return;
      scrubbingPointerIdRef.current = null;
      onCursorDragEnd?.(currentTimeRef.current);
    };

    const onRootKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "b"
        ) {
          event.preventDefault();
          splitSelectedClipAtPlayhead();
          return;
        }
        if (event.key === "[") {
          event.preventDefault();
          trimSelectedClipLeftToPlayhead();
          return;
        }
        if (event.key === "]") {
          event.preventDefault();
          trimSelectedClipRightToPlayhead();
        }
      },
      [
        splitSelectedClipAtPlayhead,
        trimSelectedClipLeftToPlayhead,
        trimSelectedClipRightToPlayhead,
      ],
    );

    const renderTrackControlContent = useCallback(
      (row: TimelineRow) => {
        const isMainTrack = row.role === "main";
        const state = {
          locked: isRowLocked(row.id),
          hidden: isRowHidden(row.id),
          muted: isRowMuted(row.id),
        };
        const actions = {
          toggleLock: () => toggleRowLock(row.id),
          toggleHide: () => toggleRowHide(row.id),
          toggleMute: () => toggleRowMute(row.id),
          deleteTrack: () => deleteTrackById(row.id),
        };

        if (renderTrackControls) {
          return renderTrackControls({
            row,
            state,
            actions,
            isMainTrack,
          } satisfies TrackControlRenderParams);
        }

        return (
          <div className="timeline-track-controls">
            <button
              type="button"
              className={`timeline-track-btn${state.locked ? " active" : ""}`}
              onClick={actions.toggleLock}
              title={state.locked ? "Unlock Track" : "Lock Track"}
            >
              {state.locked ? "🔒" : "🔓"}
            </button>
            <button
              type="button"
              className={`timeline-track-btn${state.hidden ? " active" : ""}`}
              onClick={actions.toggleHide}
              title={state.hidden ? "Show Track" : "Hide Track"}
            >
              {state.hidden ? "🙈" : "👁"}
            </button>
            <button
              type="button"
              className={`timeline-track-btn${state.muted ? " active" : ""}`}
              onClick={actions.toggleMute}
              title={state.muted ? "Unmute Track" : "Mute Track"}
            >
              {state.muted ? "🔇" : "🔊"}
            </button>
            <button
              type="button"
              className="timeline-track-btn danger"
              disabled={isMainTrack}
              onClick={actions.deleteTrack}
              title={
                isMainTrack ? "Main Track cannot be deleted" : "Delete Track"
              }
            >
              🗑
            </button>
          </div>
        );
      },
      [
        deleteTrackById,
        isRowHidden,
        isRowLocked,
        isRowMuted,
        renderTrackControls,
        toggleRowHide,
        toggleRowLock,
        toggleRowMute,
      ],
    );

    return (
      <div
        ref={rootRef}
        className="timeline-root"
        tabIndex={0}
        onWheel={onWheelZoom}
        onKeyDown={onRootKeyDown}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) updateSelection(null);
        }}
      >
        <div
          className="timeline-track-panel"
          style={{ width: trackControlsWidth }}
        >
          <div className="timeline-track-panel-header">Tracks</div>
          <div className="timeline-track-panel-body">
            {trackLayouts.map((layout) => {
              const row = editorData[layout.index];
              if (!row) return null;
              const top = layout.top - RULER_HEIGHT - viewport.scrollTop;
              if (top + layout.height < -8 || top > viewport.height + 8)
                return null;
              const isMainTrack = row.role === "main";
              const hidden = isRowHidden(row.id);
              const locked = isRowLocked(row.id);
              return (
                <div
                  key={row.id}
                  className={`timeline-track-row${hidden ? " track-hidden" : ""}${locked ? " track-locked" : ""}`}
                  style={{ top, height: layout.height }}
                >
                  {renderTrackControlContent(row)}
                </div>
              );
            })}
          </div>
        </div>

        <div className="timeline-main" style={{ left: trackControlsWidth }}>
          <canvas ref={canvasRef} className="timeline-bg-canvas" />
          <canvas
            ref={rulerCanvasRef}
            onPointerDown={(event) => {
              event.preventDefault();
              const time = timeFromClientX(event.clientX);
              dispatchTimeAreaClick(
                time,
                event as unknown as React.MouseEvent<
                  HTMLDivElement,
                  MouseEvent
                >,
              );
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              const time = timeFromClientX(event.clientX);
              dispatchTimeAreaClick(
                time,
                event as unknown as React.MouseEvent<
                  HTMLDivElement,
                  MouseEvent
                >,
              );
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
                updateSelection(null);
                const rowId = getTrackIdByClientY(event.clientY);
                const row = rowId
                  ? editorData.find((item) => item.id === rowId)
                  : null;
                if (row) {
                  onClickRow?.(
                    event as unknown as React.MouseEvent<
                      HTMLElement,
                      MouseEvent
                    >,
                    {
                      row,
                      time: timeFromClientX(event.clientX),
                    },
                  );
                }
              }
            }}
            onDoubleClickCapture={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest("[data-clip-id]")) return;
              const rowId = getTrackIdByClientY(event.clientY);
              const row = rowId
                ? editorData.find((item) => item.id === rowId)
                : null;
              if (row) {
                onDoubleClickRow?.(
                  event as unknown as React.MouseEvent<HTMLElement, MouseEvent>,
                  {
                    row,
                    time: timeFromClientX(event.clientX),
                  },
                );
              }
            }}
          >
            <div
              className="timeline-content"
              style={{ width: totalContentWidth, height: totalHeight }}
            >
              {visibleTracks.map((row) => (
                <React.Fragment key={row.id}>
                  {row.actions.map((action) => {
                    const isDraggedSource =
                      drag?.originRowId === row.id &&
                      drag.actionId === action.id;
                    const isTrimmedClip =
                      trim?.rowId === row.id && trim.actionId === action.id;
                    const isSelected =
                      selection?.rowId === row.id &&
                      selection.actionId === action.id;
                    const isDimmed = isRowHidden(row.id);
                    const renderAction = isTrimmedClip ? trim.preview : action;
                    const left = timeToPixel(renderAction.start, zoom);
                    const width = Math.max(
                      2,
                      timeToPixel(getActionDuration(renderAction), zoom),
                    );
                    const layout = trackLayoutMap.get(row.id);
                    if (!layout) return null;
                    const top = layout.top;
                    const actionHeight = Math.max(14, layout.height);

                    return (
                      <ClipItem
                        key={action.id}
                        clip={action}
                        renderClip={renderAction}
                        left={left}
                        top={top}
                        width={width}
                        height={actionHeight}
                        isSelected={isSelected}
                        isDraggedSource={isDraggedSource}
                        isDimmed={isDimmed}
                        onPointerDown={(event) =>
                          onClipPointerDown(event, row.id, action)
                        }
                        onPointerMove={onClipPointerMove}
                        onPointerUp={onClipPointerUp}
                        onClick={(event) => {
                          event.stopPropagation();
                          updateSelection({
                            rowId: row.id,
                            actionId: action.id,
                          });
                          const clickTime = timeFromClientX(event.clientX);
                          onClickAction?.(event, {
                            action,
                            row,
                            time: clickTime,
                          });
                          if (!isDragWhenClickRef.current) {
                            onClickActionOnly?.(event, {
                              action,
                              row,
                              time: clickTime,
                            });
                          }
                          isDragWhenClickRef.current = false;
                        }}
                        onDoubleClick={(event) => {
                          event.stopPropagation();
                          const clickTime = timeFromClientX(event.clientX);
                          // Double-click action should move playhead to clicked time.
                          setCurrentTime(clickTime);
                          onDoubleClickAction?.(event, {
                            action,
                            row,
                            time: clickTime,
                          });
                        }}
                        onTrimPointerDown={(event, side) =>
                          onTrimPointerDown(event, row.id, action, side)
                        }
                        onTrimPointerMove={onTrimPointerMove}
                        onTrimPointerUp={onTrimPointerUp}
                      />
                    );
                  })}
                </React.Fragment>
              ))}

              {drag && (
                <DragPreview
                  clip={drag.action}
                  left={timeToPixel(drag.previewStart, zoom)}
                  top={
                    trackLayoutMap.get(drag.previewRowId)?.top ?? RULER_HEIGHT
                  }
                  width={Math.max(
                    2,
                    timeToPixel(getActionDuration(drag.action), zoom),
                  )}
                  height={Math.max(
                    14,
                    trackLayoutMap.get(drag.previewRowId)?.height ?? rowHeight,
                  )}
                  isDropValid={drag.isDropValid}
                  onPointerMove={onClipPointerMove}
                  onPointerUp={onClipPointerUp}
                />
              )}

              {drag?.insertLineY != null && (
                <div
                  className="timeline-insert-line"
                  style={{ transform: `translateY(${drag.insertLineY}px)` }}
                />
              )}

              {drag?.snappedTime != null && (
                <div
                  className="timeline-snap-line"
                  style={{
                    transform: `translateX(${timeToPixel(drag.snappedTime, zoom)}px)`,
                  }}
                />
              )}

              {trim?.snappedTime != null && (
                <div
                  className="timeline-snap-line"
                  style={{
                    transform: `translateX(${timeToPixel(trim.snappedTime, zoom)}px)`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

Timeline.displayName = "Timeline";

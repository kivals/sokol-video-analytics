"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useToasts } from "./Toasts";

// One baked detection frame: boxes are [x, y, w, h, score, trackId],
// all coords normalized to 0..1. Produced offline by YOLO (see
// public/detections/{cameraId}.json).
type Box = [number, number, number, number, number, number];
interface Track {
  fps: number;
  stride: number;
  frames: { t: number; boxes: Box[] }[];
  // trackId -> list of safety breaches flagged offline for that worker
  violators?: Record<string, string[]>;
}

const VIOLATION_LABEL: Record<string, string> = {
  no_helmet: "Без каски",
  no_vest: "Без жилета",
  no_mask: "Без маски",
};

function labelsFor(codes: string[]): string[] {
  return codes.map((c) => VIOLATION_LABEL[c] ?? "Нарушение ТБ");
}

// Draws a box around every worker by replaying pre-computed YOLO detections
// synced to the video's current time. Violators (missing PPE) are drawn red
// with one label per breach, and raise an interface notification when first
// seen. No runtime inference.
export default function DetectionOverlay({
  videoRef,
  cameraId,
  sourceLabel = "Камера",
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraId: string;
  sourceLabel?: string;
}) {
  const { push } = useToasts();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [violators, setViolators] = useState<Record<string, string[]>>({});
  const trackRef = useRef<Track | null>(null);
  const activeViolatorsRef = useRef<Set<string>>(new Set());
  const lastToastRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const active = activeViolatorsRef.current;
    const lastToast = lastToastRef.current;
    const TOAST_COOLDOWN_MS = 5000; // collapse bursts of the same breach

    function sync() {
      const v = videoRef.current;
      const track = trackRef.current;
      if (!v || !track || !track.frames.length) {
        return;
      }
      const interval = track.stride / track.fps;
      const idx = Math.min(
        track.frames.length - 1,
        Math.max(0, Math.round(v.currentTime / interval)),
      );
      const frameBoxes = track.frames[idx].boxes;
      setBoxes(frameBoxes);

      // Fire a notification the moment a violator enters the frame; clear it
      // once they leave, so a fresh entry (incl. after a loop) notifies again.
      const map = track.violators ?? {};
      const present = new Set<string>();
      for (const b of frameBoxes) {
        const id = String(b[5]);
        if (map[id]?.length) {
          present.add(id);
        }
      }
      for (const id of present) {
        if (!active.has(id)) {
          active.add(id);
          const title = `⚠ ${sourceLabel}: зафиксировано нарушение ТБ — ${labelsFor(map[id]).join(", ")}`;
          const now = performance.now();
          if (now - (lastToast.get(title) ?? -Infinity) > TOAST_COOLDOWN_MS) {
            lastToast.set(title, now);
            push({ type: "violation", title });
          }
        }
      }
      for (const id of [...active]) {
        if (!present.has(id)) {
          active.delete(id);
        }
      }
    }

    fetch(`/detections/${cameraId}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Track | null) => {
        if (!cancelled && data) {
          trackRef.current = data;
          setViolators(data.violators ?? {});
          sync();
        }
      })
      .catch(() => {});

    // rAF keeps boxes glued to the frame during smooth playback; the
    // seeked/timeupdate listeners also cover scrubbing and paused seeks
    // (rAF is suspended while the tab is backgrounded).
    function loop() {
      if (cancelled) {
        return;
      }
      sync();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    const v = videoRef.current;
    v?.addEventListener("seeked", sync);
    v?.addEventListener("timeupdate", sync);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      active.clear();
      v?.removeEventListener("seeked", sync);
      v?.removeEventListener("timeupdate", sync);
    };
  }, [videoRef, cameraId, sourceLabel, push]);

  return (
    <>
      {boxes.map((b, i) => {
        const breaches = violators[String(b[5])];
        const isViolator = !!breaches?.length;
        const color = isViolator ? "var(--danger)" : "var(--accent)";
        return (
          <div
            key={`${b[5]}-${i}`}
            className="pointer-events-none absolute border-2 transition-all duration-150 ease-linear"
            style={{
              left: `${b[0] * 100}%`,
              top: `${b[1] * 100}%`,
              width: `${b[2] * 100}%`,
              height: `${b[3] * 100}%`,
              borderColor: color,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
            }}
          >
            <div className="absolute bottom-full left-0 mb-0.5 flex flex-col items-start gap-px">
              {isViolator ? (
                labelsFor(breaches).map((lbl, j) => (
                  <span
                    key={j}
                    className="whitespace-nowrap px-1 text-[10px] font-semibold"
                    style={{ backgroundColor: color, color: "#0b0f14" }}
                  >
                    ⚠ {lbl}
                  </span>
                ))
              ) : (
                <span
                  className="whitespace-nowrap px-1 text-[10px] font-semibold"
                  style={{ backgroundColor: color, color: "#0b0f14" }}
                >
                  Рабочий {(b[4] * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

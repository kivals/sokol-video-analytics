"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ActionClass, Scenario } from "@/lib/types";
import { jitter, segmentAt } from "@/lib/scenario";
import ClassBadge from "./ClassBadge";

export default function VideoPlayer({
  scenario,
  classes,
  muted = true,
  loop = true,
  showZone = true,
  showBadge = true,
  onTime,
  className,
}: {
  scenario: Scenario;
  classes: ActionClass[];
  muted?: boolean;
  loop?: boolean;
  showZone?: boolean;
  showBadge?: boolean;
  onTime?: (t: number) => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reactionLag] = useState(() => 0.5 + Math.random());
  const byId = new Map(classes.map((c) => [c.id, c]));

  const [videoError, setVideoError] = useState(false);
  const [time, setTime] = useState(0);
  const [tick, setTick] = useState(0);

  const segment = segmentAt(scenario, time - reactionLag);
  const classInfo = segment ? (byId.get(segment.classId) ?? null) : null;
  const confidence = useMemo(
    () => (segment ? jitter(segment.confidence) : 0),
    [segment?.start, segment?.end, segment?.classId, tick],
  );

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 700);
    return () => clearInterval(id);
  }, []);

  function handleTimeUpdate() {
    const t = videoRef.current?.currentTime ?? 0;
    setTime(t);
    onTime?.(t);
  }

  return (
    <div className={`relative overflow-hidden rounded-lg bg-black ${className ?? ""}`}>
      {videoError ? (
        <div
          className="flex aspect-video w-full items-center justify-center text-sm text-[var(--muted)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #1a2230 0, #1a2230 2px, #0b0f14 2px, #0b0f14 8px)",
          }}
        >
          НЕТ СИГНАЛА
        </div>
      ) : (
        <video
          ref={videoRef}
          src={scenario.video}
          className="aspect-video w-full"
          autoPlay
          playsInline
          muted={muted}
          loop={loop}
          onTimeUpdate={handleTimeUpdate}
          onError={() => setVideoError(true)}
        />
      )}

      {showZone && !videoError && (
        <div
          className="absolute border-2 border-[var(--accent)]"
          style={{
            left: `${scenario.zone.x * 100}%`,
            top: `${scenario.zone.y * 100}%`,
            width: `${scenario.zone.w * 100}%`,
            height: `${scenario.zone.h * 100}%`,
          }}
        >
          <span className="absolute -top-5 left-0 text-xs text-[var(--accent)]">
            Рабочая зона
          </span>
          <span className="absolute -left-0.5 -top-0.5 h-2 w-2 border-l-2 border-t-2 border-[var(--accent)]" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 border-r-2 border-t-2 border-[var(--accent)]" />
          <span className="absolute -left-0.5 -bottom-0.5 h-2 w-2 border-l-2 border-b-2 border-[var(--accent)]" />
          <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 border-r-2 border-b-2 border-[var(--accent)]" />
        </div>
      )}

      {!videoError && (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 text-xs text-[var(--danger)]">
          <span className="h-2 w-2 rounded-full bg-[var(--danger)] animate-pulse" />
          LIVE
        </div>
      )}

      {showBadge && !videoError && (
        <div className="absolute left-3 top-3">
          <ClassBadge classInfo={classInfo} confidence={confidence} />
        </div>
      )}
    </div>
  );
}

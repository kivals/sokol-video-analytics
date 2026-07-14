"use client";

import { useRef } from "react";
import type { ActionClass, Scenario } from "@/lib/types";
import { scenarioDuration } from "@/lib/scenario";

export default function SegmentTimeline({
  scenario,
  classes,
  currentTime,
  onSeek,
}: {
  scenario: Scenario;
  classes: ActionClass[];
  currentTime: number;
  onSeek?: (t: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const duration = scenarioDuration(scenario);
  const byId = new Map(classes.map((c) => [c.id, c]));

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onSeek || !barRef.current || duration === 0) {
      return;
    }
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      className="relative flex h-3 w-full overflow-hidden rounded-full border border-[var(--border)] cursor-pointer"
    >
      {scenario.segments.map((seg, i) => (
        <div
          key={i}
          style={{
            width: duration ? `${((seg.end - seg.start) / duration) * 100}%` : 0,
            backgroundColor: byId.get(seg.classId)?.color ?? "var(--muted)",
          }}
        />
      ))}
      <div
        className="absolute top-0 h-full w-0.5 bg-white"
        style={{ left: duration ? `${(currentTime / duration) * 100}%` : 0 }}
      />
    </div>
  );
}

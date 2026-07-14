"use client";

import type { ActionClass } from "@/lib/types";

export default function ClassBadge({
  classInfo,
  confidence,
}: {
  classInfo: ActionClass | null;
  confidence: number;
}) {
  const pct = (confidence * 100).toFixed(1);

  if (!classInfo) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-[var(--panel)]/90 border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)]">
        <span className="h-2 w-2 rounded-full bg-[var(--muted)] animate-pulse" />
        Анализ…
      </div>
    );
  }

  const severityClass =
    classInfo.severity === "violation"
      ? "border-[var(--danger)] animate-[pulse-ring_1.2s_ease-out_infinite]"
      : classInfo.severity === "warning"
        ? "border-[var(--warn)] bg-[var(--warn)]/10"
        : "border-[var(--border)]";

  return (
    <div
      className={`flex items-center gap-2 rounded-full bg-[var(--panel)]/90 border px-3 py-1.5 text-sm text-[var(--text)] ${severityClass}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: classInfo.color }}
      />
      <span>{classInfo.name}</span>
      <span className="text-[var(--muted)]">{pct}%</span>
    </div>
  );
}

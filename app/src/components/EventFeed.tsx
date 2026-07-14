"use client";

import type { DerivedEvent } from "@/lib/scenario";

const SHIFT_START_HOUR = 8;

function formatTimestamp(seconds: number): string {
  const base = new Date();
  base.setHours(SHIFT_START_HOUR, 0, 0, 0);
  base.setSeconds(base.getSeconds() + seconds);
  return base.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const TYPE_LABEL: Record<DerivedEvent["type"], string> = {
  violation: "Нарушение",
  warning: "Внимание",
  info: "Инфо",
};

export default function EventFeed({
  events,
  cameraName,
}: {
  events: DerivedEvent[];
  cameraName: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="mb-2 text-sm font-medium text-[var(--text)]">
        События — {cameraName}
      </div>
      {events.length === 0 ? (
        <div className="text-sm text-[var(--muted)]">Событий не зафиксировано</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {events.map((ev, i) => {
            const rowClass =
              ev.type === "violation"
                ? "border-[var(--danger)]/40 bg-[var(--danger)]/10"
                : ev.type === "warning"
                  ? "border-[var(--warn)]/40 bg-[var(--warn)]/10"
                  : "border-[var(--border)]";
            const chipClass =
              ev.type === "violation"
                ? "bg-[var(--danger)]/20 text-[var(--danger)]"
                : ev.type === "warning"
                  ? "bg-[var(--warn)]/20 text-[var(--warn)]"
                  : "bg-[var(--panel-2)] text-[var(--muted)]";
            return (
              <li
                key={i}
                className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm ${rowClass}`}
              >
                <div className="flex flex-col">
                  <span className="text-[var(--text)]">{ev.title}</span>
                  <span className="text-xs text-[var(--muted)]">{formatTimestamp(ev.time)}</span>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${chipClass}`}>
                  {TYPE_LABEL[ev.type]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

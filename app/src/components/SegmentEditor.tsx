"use client";

import type { ActionClass, Segment } from "@/lib/types";

export default function SegmentEditor({
  segments,
  classes,
  currentTime,
  onChange,
}: {
  segments: Segment[];
  classes: ActionClass[];
  currentTime: number;
  onChange: (segments: Segment[]) => void;
}) {
  function updateSegment(index: number, patch: Partial<Segment>) {
    onChange(segments.map((seg, i) => (i === index ? { ...seg, ...patch } : seg)));
  }

  function removeSegment(index: number) {
    onChange(segments.filter((_, i) => i !== index));
  }

  function addFromCurrentTime() {
    const start = Math.round(currentTime * 10) / 10;
    const newSegment: Segment = {
      start,
      end: start + 10,
      classId: classes[0]?.id ?? "",
      confidence: 0.97,
    };
    onChange([...segments, newSegment]);
  }

  return (
    <div className="flex flex-col gap-3">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-[var(--muted)]">
            <th className="pb-2 font-normal">Начало, с</th>
            <th className="pb-2 font-normal">Конец, с</th>
            <th className="pb-2 font-normal">Класс</th>
            <th className="pb-2 font-normal">Уверенность</th>
            <th className="pb-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {segments.map((seg, i) => (
            <tr key={i} className="border-t border-[var(--border)]">
              <td className="py-1.5 pr-2">
                <input
                  type="number"
                  value={seg.start}
                  onChange={(e) => updateSegment(i, { start: Number(e.target.value) })}
                  className="w-20 rounded border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 text-[var(--text)]"
                />
              </td>
              <td className="py-1.5 pr-2">
                <input
                  type="number"
                  value={seg.end}
                  onChange={(e) => updateSegment(i, { end: Number(e.target.value) })}
                  className="w-20 rounded border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 text-[var(--text)]"
                />
              </td>
              <td className="py-1.5 pr-2">
                <select
                  value={seg.classId}
                  onChange={(e) => updateSegment(i, { classId: e.target.value })}
                  className="rounded border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 text-[var(--text)]"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-1.5 pr-2">
                <input
                  type="number"
                  min={0.9}
                  max={0.99}
                  step={0.01}
                  value={seg.confidence}
                  onChange={(e) => updateSegment(i, { confidence: Number(e.target.value) })}
                  className="w-20 rounded border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 text-[var(--text)]"
                />
              </td>
              <td className="py-1.5">
                <button
                  onClick={() => removeSegment(i)}
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--danger)] hover:border-[var(--danger)]"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={addFromCurrentTime}
        className="self-start rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--accent)]"
      >
        Добавить сегмент с текущего момента
      </button>
    </div>
  );
}

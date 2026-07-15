"use client";

import { useEffect, useState } from "react";
import type { ActionClass, Segment } from "@/lib/types";

// Controlled numeric input that round-trips through Number on every keystroke
// truncates a trailing "." or "," while typing (e.g. "0." -> 0 -> "0"), making it
// impossible to type decimals. Keep the raw text as local state while focused and
// only commit the parsed number on blur.
function NumberField({
  value,
  onCommit,
  className,
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(String(value));
    }
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={() => setFocused(true)}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        setFocused(false);
        const parsed = Number(text.replace(",", "."));
        if (!Number.isNaN(parsed)) {
          onCommit(parsed);
        }
      }}
      className={className}
    />
  );
}

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
                <NumberField
                  value={seg.start}
                  onCommit={(start) => updateSegment(i, { start })}
                  className="w-20 rounded border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 text-[var(--text)]"
                />
              </td>
              <td className="py-1.5 pr-2">
                <NumberField
                  value={seg.end}
                  onCommit={(end) => updateSegment(i, { end })}
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
                <NumberField
                  value={seg.confidence}
                  onCommit={(confidence) => updateSegment(i, { confidence })}
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

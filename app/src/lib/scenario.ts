import type { ActionClass, Scenario, Segment } from "./types";

export function scenarioDuration(s: Scenario): number {
  return s.segments.length ? s.segments[s.segments.length - 1].end : 0;
}

export function segmentAt(s: Scenario, t: number): Segment | null {
  const d = scenarioDuration(s);
  if (d === 0) { return null; }
  const time = t % d;
  return s.segments.find((seg) => time >= seg.start && time < seg.end) ?? null;
}

export interface DerivedEvent {
  time: number;
  type: "info" | "warning" | "violation";
  title: string;
}

export function deriveEvents(s: Scenario, classes: ActionClass[]): DerivedEvent[] {
  const byId = new Map(classes.map((c) => [c.id, c]));
  const events: DerivedEvent[] = [];
  for (let i = 1; i < s.segments.length; i++) {
    const prev = byId.get(s.segments[i - 1].classId);
    const next = byId.get(s.segments[i].classId);
    if (!prev || !next) { continue; }
    const type =
      next.severity === "violation" ? "violation" :
      next.severity === "warning" ? "warning" : "info";
    events.push({
      time: s.segments[i].start,
      type,
      title: `Смена действия: ${prev.name} → ${next.name}`,
    });
  }
  for (const e of s.events ?? []) {
    events.push({ time: e.time, type: e.type, title: e.title });
  }
  return events.sort((a, b) => a.time - b.time);
}

export interface ClassTime { classId: string; seconds: number; share: number }

export function timeByClass(s: Scenario): ClassTime[] {
  const total = scenarioDuration(s);
  const acc = new Map<string, number>();
  for (const seg of s.segments) {
    acc.set(seg.classId, (acc.get(seg.classId) ?? 0) + (seg.end - seg.start));
  }
  return [...acc.entries()].map(([classId, seconds]) => ({
    classId, seconds, share: total ? seconds / total : 0,
  }));
}

export function countViolations(s: Scenario, classes: ActionClass[]) {
  const byId = new Map(classes.map((c) => [c.id, c]));
  let violations = 0, warnings = 0;
  for (const seg of s.segments) {
    const sev = byId.get(seg.classId)?.severity;
    if (sev === "violation") { violations++; }
    if (sev === "warning") { warnings++; }
  }
  for (const e of s.events ?? []) {
    if (e.type === "violation") { violations++; }
    if (e.type === "warning") { warnings++; }
  }
  return { violations, warnings };
}

export function jitter(base: number, amplitude = 0.01): number {
  return Math.min(0.999, Math.max(0, base + (Math.random() * 2 - 1) * amplitude));
}

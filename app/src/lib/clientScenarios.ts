import type { Scenario } from "./types";

const keyFor = (id: string) => `sokol:scenario:${id}`;

export async function loadScenario(id: string): Promise<Scenario | null> {
  const raw = localStorage.getItem(keyFor(id));
  if (raw) {
    try {
      return JSON.parse(raw) as Scenario;
    } catch {
      // fall through to fetch
    }
  }
  const res = await fetch(`/api/annotations/${id}`);
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as Scenario;
}

export async function saveScenario(s: Scenario): Promise<void> {
  localStorage.setItem(keyFor(s.cameraId), JSON.stringify(s));
  fetch(`/api/annotations/${s.cameraId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(s),
  }).catch(() => {});
}

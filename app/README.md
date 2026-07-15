# СОКОЛ — video analytics platform (demo prototype)

A Next.js demo of a video-analytics platform for monitoring worker actions on a
factory floor. Six simulated camera feeds, per-camera event timeline, model
training panel, aggregate analytics dashboard, and a settings/annotation
editor. **All analytics are simulated** from static scenario JSON files — there
is no real ML/computer-vision running anywhere in this app.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Screens:

- `/` — monitoring grid (all 6 cameras)
- `/camera/[id]` — single camera detail (timeline, event feed, export)
- `/annotation` — scenario editor (zone + segments + point events)
- `/models` — model list + simulated training runs
- `/analytics` — aggregate charts across all cameras
- `/settings` — action classes, model parameters, stream sources

`npm run build` produces a production build; `npm run start` serves it.

## The 6 cameras

Camera metadata lives in `src/data/cameras.json` (id, display name, area,
video path). Each camera has a matching scenario file in
`src/data/scenarios/camera-N.json` describing:

- `zone` — the monitored rectangle (fractional `x`/`y`/`w`/`h`, 0–1)
- `segments` — a timeline of `{ start, end, classId, confidence }` action
  classes (must be contiguous/sorted, `classId` refers to `src/data/classes.json`)
- `events` — optional point-in-time events (`{ time, type, title }`) that
  trigger toasts on the monitoring page and appear in the camera's event feed

Edits made in `/annotation` are saved to `localStorage` under
`sokol:scenario:camera-N` and override the bundled JSON on load (survives a
dev-server restart; "Сбросить к исходной" clears the override).

## Replacing placeholder videos

Drop real footage into `public/videos/camera-1.mp4` … `camera-6.mp4`:

- Format: H.264 MP4, ideally with the `moov` atom at the front ("faststart")
  so the browser can read metadata without downloading the whole file
  (`ffmpeg -i in.mp4 -c copy -movflags +faststart camera-1.mp4`)
- Length: 2–4 minutes is enough to see all scenario segments loop
- Content: a static, unmoving camera angle — the annotation zone overlay and
  scenario timings are drawn in fixed screen-space coordinates and assume the
  frame doesn't pan/zoom

If a video file is missing (or fails to load), the player falls back to a
"НЕТ СИГНАЛА" placeholder instead of a black box.

## Preparing a scenario via `/annotation`

1. Pick a camera from the dropdown.
2. Draw/resize the working zone directly on the video frame.
3. Add or edit segments (start/end in seconds, action class, confidence) —
   segment class + confidence drive the badge shown on the video and the
   "Работник в зоне" / "нарушение" classification used throughout the app.
4. Add point events (e.g. "Отсутствует защитная каска") for one-off toast
   notifications at a specific timestamp.
5. Click **Сохранить** to persist to `localStorage` for local testing, or
   **Экспорт JSON** to download the scenario file — copy the downloaded file
   into `src/data/scenarios/camera-N.json` to make it the new baseline for
   everyone (not just your browser).

## Note on the simulation

There's no model inference in this app. Confidence scores, GPU/frame counters
in the header, per-camera FPS/latency, training loss/accuracy curves, and the
analytics dashboard are all derived from the static scenario JSONs plus
client-side randomness (jitter, random walks) — enough to feel alive in a demo
without needing real video processing.

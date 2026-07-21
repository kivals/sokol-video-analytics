# Detection pipeline (demo prep)

Offline tooling that bakes worker bounding boxes + ТБ-violation flags for
the СОКОЛ demo. No ML runs in the app — it only replays the JSON produced
here (see project `CLAUDE.md`).

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install ultralytics opencv-python pillow   # torch pulled by ultralytics
```

## Steps (run from repo root)

1. `python scripts/detect_workers.py` — YOLO11x + ByteTrack over
   `app/public/videos/camera-main.mp4` → writes the detection track to
   `app/public/detections/camera-1.json` (paths hardcoded near the top).
2. `python3 scripts/flag_violators.py` — rule-based PPE-violation
   flagging; updates the `violators` map and prints the registry that
   backs the ТБ table in `CLAUDE.md`.
3. `python scripts/render_preview.py` — burns boxes/labels/alert banner
   into `camera-1-detected-preview.mp4` (gitignored preview only).

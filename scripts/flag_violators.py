#!/usr/bin/env python3
"""Rule-based safety-violation flagging for the СОКОЛ demo.

Reads each camera's baked YOLO detection track and marks a worker as a
PPE violator (helmet + vest mandatory near serviced vehicles; some zones
also require a mask) when they are *working at a station* in a
vehicle-service zone. Workers just passing through — whose box travels
across the frame — and tiny far-away specks are left compliant, as is any
zone declared compliant (e.g. an entrance aisle).

Writes the `violators` map back into each detections file and prints a
human-readable registry (used to keep CLAUDE.md in sync).

Usage: python3 scripts/flag_violators.py
"""
import json
import math
from collections import defaultdict

MIN_FRAMES = 8       # skip short/noisy tracks
MIN_AREA = 0.0015    # skip tiny far-away specks
MAX_TRAVEL = 0.20    # box centroid range; above this the worker is passing through

# Per camera: detections file and the time-based zones of its archive.
# A zone tuple is (start, end, code, name); code "A" means compliant.
# `mask_zones` lists codes that additionally require a mask.
CAMERAS = {
    "camera-1": {
        "det": "app/public/detections/camera-1.json",
        "zones": [
            (0, 65, "A", "Входной проход"),
            (65, 125, "B", "Слесарный участок"),
            (125, 180, "C", "Ремонт под поднятыми кузовами"),
            (180, 235, "D", "Ремонт под поднятыми кузовами"),
            (235, 10**9, "E", "Ремонт двигателей"),
        ],
        "mask_zones": ["E"],
    },
    "camera-2": {
        "det": "app/public/detections/camera-2.json",
        # Whole facility is a truck-service area; the movement gate below
        # leaves aisle walkers compliant, so one zone is enough.
        "zones": [
            (0, 10**9, "S", "Цех обслуживания спецтехники"),
        ],
        "mask_zones": [],
    },
}


def zone_of(zones, t):
    for lo, hi, code, name in zones:
        if lo <= t < hi:
            return code, name
    return "A", "Вне зоны"


def mmss(t):
    return f"{int(t)//60:02d}:{int(t)%60:02d}"


def flag_camera(cam):
    try:
        d = json.load(open(cam["det"]))
    except FileNotFoundError:
        return None
    zones, mask_zones = cam["zones"], cam["mask_zones"]
    stat = defaultdict(lambda: {"n": 0, "area": 0.0, "tmin": 1e9, "tmax": 0,
                                "xs": [], "ys": [], "zones": defaultdict(int)})
    for fr in d["frames"]:
        for b in fr["boxes"]:
            x, y, w, h, _, tid = b
            s = stat[tid]
            s["n"] += 1
            s["area"] += w * h
            s["tmin"] = min(s["tmin"], fr["t"])
            s["tmax"] = max(s["tmax"], fr["t"])
            s["xs"].append(x + w / 2)
            s["ys"].append(y + h / 2)
            s["zones"][zone_of(zones, fr["t"])[0]] += 1

    violators, registry = {}, []
    zname = {c: n for _, _, c, n in zones}
    for tid, s in stat.items():
        if s["n"] < MIN_FRAMES:
            continue
        if s["area"] / s["n"] < MIN_AREA:            # too small/far to judge
            continue
        travel = math.hypot(max(s["xs"]) - min(s["xs"]),
                            max(s["ys"]) - min(s["ys"]))
        if travel > MAX_TRAVEL:                       # passing through, not working
            continue
        # Zone the worker by where they spend most frames, not first sighting.
        best = max(s["zones"], key=s["zones"].get)
        if best == "A":
            continue
        v = ["no_helmet", "no_vest"]
        if best in mask_zones:
            v.append("no_mask")
        violators[str(tid)] = v
        registry.append((s["tmin"], s["tmax"], zname.get(best, best), tid, v))

    d["violators"] = violators
    json.dump(d, open(cam["det"], "w"), ensure_ascii=False)
    return violators, registry


def main():
    LBL = {"no_helmet": "без каски", "no_vest": "без жилета", "no_mask": "без маски"}
    for cid, cam in CAMERAS.items():
        res = flag_camera(cam)
        if res is None:
            print(f"{cid}: detections not found — skipped")
            continue
        violators, registry = res
        print(f"\n{cid}: violators {len(violators)}")
        for tmin, tmax, name, tid, v in sorted(registry):
            print(f"  {mmss(tmin)}–{mmss(tmax)} | {name} | id{tid} | {', '.join(LBL[x] for x in v)}")


if __name__ == "__main__":
    main()

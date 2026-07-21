#!/usr/bin/env python3
"""Rule-based safety-violation flagging for the СОКОЛ demo.

Reads the baked YOLO detection track, and marks a worker as a PPE
violator (helmet + vest mandatory near serviced trucks; engine-bay area
also requires a mask) when they are *working at a station* in a
vehicle-service zone. Workers just passing through — whose box travels
across the frame — and tiny far-away specks are left compliant. The
entrance aisle (angle A) stays compliant for visual contrast.

Writes the `violators` map back into the detections file and prints a
human-readable registry (used to keep CLAUDE.md in sync).

Usage: python3 scripts/flag_violators.py
"""
import json
import math
from collections import defaultdict

DET = "app/public/detections/camera-1.json"
MIN_FRAMES = 8       # skip short/noisy tracks
MIN_AREA = 0.0015    # skip tiny far-away specks
MAX_TRAVEL = 0.20    # box centroid range; above this the worker is passing through

# The single-camera archive cuts between ~5 fixed views every ~60 s.
ZONES = [
    (65, 125, "B", "Слесарный участок"),
    (125, 180, "C", "Ремонт под поднятыми кузовами"),
    (180, 235, "D", "Ремонт под поднятыми кузовами"),
    (235, 10**9, "E", "Ремонт двигателей"),
]

def zone(t):
    for lo, hi, code, name in ZONES:
        if lo <= t < hi:
            return code, name
    return "A", "Входной проход"

def mmss(t):
    return f"{int(t)//60:02d}:{int(t)%60:02d}"

def main():
    d = json.load(open(DET))
    stat = defaultdict(lambda: {"n": 0, "area": 0.0, "tmin": 1e9, "tmax": 0,
                                "xs": [], "ys": []})
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

    violators, registry = {}, []
    for tid, s in stat.items():
        if s["n"] < MIN_FRAMES:
            continue
        if s["area"] / s["n"] < MIN_AREA:            # too small/far to judge
            continue
        travel = math.hypot(max(s["xs"]) - min(s["xs"]),
                            max(s["ys"]) - min(s["ys"]))
        if travel > MAX_TRAVEL:                       # passing through, not working
            continue
        code, name = zone(s["tmin"])
        if code == "A":
            continue
        v = ["no_helmet", "no_vest"]
        if code == "E":
            v.append("no_mask")
        violators[str(tid)] = v
        registry.append((s["tmin"], s["tmax"], code, name, tid, v))

    d["violators"] = violators
    json.dump(d, open(DET, "w"), ensure_ascii=False)

    LBL = {"no_helmet": "без каски", "no_vest": "без жилета", "no_mask": "без маски"}
    print(f"violators: {len(violators)}")
    for tmin, tmax, code, name, tid, v in sorted(registry):
        print(f"  {mmss(tmin)}–{mmss(tmax)} | {code} {name} | id{tid} | {', '.join(LBL[x] for x in v)}")

if __name__ == "__main__":
    main()

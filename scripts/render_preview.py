#!/usr/bin/env python3
"""Burn the baked detections into a preview MP4 (demo artifact, gitignored).

Draws cyan boxes «Рабочий NN%» for compliant workers and red boxes with a
label per breach for ТБ violators, plus a «ЗАФИКСИРОВАНО НАРУШЕНИЕ ТБ»
banner whenever a violator is on screen — mirroring the in-app overlay.

Usage: python scripts/render_preview.py [camera-1|camera-2]  (default camera-1)
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAMERAS = {
    "camera-1": ("app/public/videos/camera-main.mp4",
                 "app/public/detections/camera-1.json",
                 "camera-1-detected-preview.mp4"),
    "camera-2": ("app/public/videos/camera-1.mp4",
                 "app/public/detections/camera-2.json",
                 "camera-2-detected-preview.mp4"),
}
VLAB = {"no_helmet": "Без каски", "no_vest": "Без жилета", "no_mask": "Без маски"}
CYAN, RED, DARK, WHITE = (0, 229, 255), (239, 68, 68), (11, 15, 20), (255, 255, 255)
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def chip(dr, x, y, txt, bg, fg, font):
    tb = dr.textbbox((0, 0), txt, font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    dr.rectangle([x, y, x + tw + 10, y + th + 8], fill=bg)
    dr.text((x + 5, y + 2), txt, fill=fg, font=font)


def main():
    cid = sys.argv[1] if len(sys.argv) > 1 else "camera-1"
    video, det, out = (os.path.join(ROOT, p) for p in CAMERAS[cid])
    track = json.load(open(det))
    frames, stride, vio = track["frames"], track["stride"], track.get("violators", {})
    cap = cv2.VideoCapture(video)
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    font = ImageFont.truetype(FONT, max(16, W // 74))
    bfont = ImageFont.truetype(FONT, max(24, W // 48))
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", f"{fps}", "-i", "-", "-an", "-c:v", "libx264", "-pix_fmt",
         "yuv420p", "-crf", "23", "-preset", "veryfast", out],
        stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    i = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        fb = frames[min(len(frames) - 1, round(i / stride))]["boxes"]
        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        dr = ImageDraw.Draw(img)
        any_vio = False
        for b in fb:
            x, y, w, h, c, tid = b
            breaches = vio.get(str(tid))
            x0, y0, x1, y1 = x * W, y * H, (x + w) * W, (y + h) * H
            if breaches:
                any_vio = True
                dr.rectangle([x0, y0, x1, y1], outline=RED, width=4)
                tb = dr.textbbox((0, 0), "Ag", font=font)
                lh = (tb[3] - tb[1]) + 8
                ly = y0 - 2
                for code in reversed(breaches):
                    ly -= lh + 2
                    chip(dr, x0, max(0, ly), VLAB.get(code, "Нарушение ТБ"), RED, WHITE, font)
            else:
                dr.rectangle([x0, y0, x1, y1], outline=CYAN, width=3)
                chip(dr, x0, max(0, y0 - 32), f"Рабочий {int(c * 100)}%", CYAN, DARK, font)
        if any_vio:
            txt = "  ЗАФИКСИРОВАНО НАРУШЕНИЕ ТБ  "
            tb = dr.textbbox((0, 0), txt, font=bfont)
            bx = (W - (tb[2] - tb[0])) // 2
            dr.rectangle([bx, 20, bx + (tb[2] - tb[0]), 20 + (tb[3] - tb[1]) + 14], fill=RED)
            dr.text((bx, 24), txt, fill=WHITE, font=bfont)
        ff.stdin.write(np.asarray(img).astype("uint8").tobytes())
        i += 1
    ff.stdin.close()
    ff.wait()
    cap.release()
    print(f"DONE {out} ({os.path.getsize(out) // 1024 // 1024} MB, {i} frames)")


if __name__ == "__main__":
    main()

"use client";

import { useRef, useState } from "react";
import type { Zone } from "@/lib/types";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const DEFAULT_ZONE: Zone = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };

function isInsideZone(x: number, y: number, zone: Zone): boolean {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
}

export default function ZoneEditor({
  zone,
  onChange,
}: {
  zone: Zone;
  onChange: (zone: Zone) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<
    | { mode: "draw"; startX: number; startY: number }
    | { mode: "move"; offsetX: number; offsetY: number }
    | null
  >(null);

  function toRelative(clientX: number, clientY: number): { x: number; y: number } {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const { x, y } = toRelative(e.clientX, e.clientY);
    if (isInsideZone(x, y, zone)) {
      setDrag({ mode: "move", offsetX: x - zone.x, offsetY: y - zone.y });
    } else {
      setDrag({ mode: "draw", startX: x, startY: y });
      onChange({ x, y, w: 0, h: 0 });
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!drag) {
      return;
    }
    const { x, y } = toRelative(e.clientX, e.clientY);
    if (drag.mode === "draw") {
      const nx = Math.min(drag.startX, x);
      const ny = Math.min(drag.startY, y);
      const nw = Math.abs(x - drag.startX);
      const nh = Math.abs(y - drag.startY);
      onChange({ x: nx, y: ny, w: nw, h: nh });
    } else {
      const nx = clamp01(Math.min(x - drag.offsetX, 1 - zone.w));
      const ny = clamp01(Math.min(y - drag.offsetY, 1 - zone.h));
      onChange({ ...zone, x: Math.max(0, nx), y: Math.max(0, ny) });
    }
  }

  function handleMouseUp() {
    setDrag(null);
  }

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute cursor-move border-2 border-[var(--accent)] bg-[var(--accent)]/10"
        style={{
          left: `${zone.x * 100}%`,
          top: `${zone.y * 100}%`,
          width: `${zone.w * 100}%`,
          height: `${zone.h * 100}%`,
        }}
      />
    </div>
  );
}

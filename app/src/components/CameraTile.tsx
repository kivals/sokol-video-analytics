"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ActionClass, Camera, Scenario } from "@/lib/types";
import { loadScenario } from "@/lib/clientScenarios";
import { scenarioDuration } from "@/lib/scenario";
import VideoPlayer from "./VideoPlayer";
import { useToasts } from "./Toasts";
import rawClasses from "@/data/classes.json";

const classes = rawClasses as ActionClass[];
const EVENT_WINDOW = 0.3;

export default function CameraTile({ camera }: { camera: Camera }) {
  const { push } = useToasts();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [dropped, setDropped] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(1200);
  const [fps, setFps] = useState(25);

  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const firedRef = useRef(new Set<number>());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadScenario(camera.id)
      .then((s) => {
        if (!cancelled) {
          setScenario(s);
          setVideoError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScenario(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [camera.id]);

  // Only toast point events from the scenario's `events` array — segment
  // transitions (derived events) fire too often to be worth a toast.
  const toastEvents = useMemo(() => scenario?.events ?? [], [scenario]);

  useEffect(() => {
    if (dropped || !scenario) {
      return;
    }
    const id = setInterval(() => {
      fetch(`/api/cameras/${camera.id}/state?t=${timeRef.current}`)
        .then((res) => res.json())
        .then((data) => {
          setLatencyMs(data.latencyMs);
          setFps(data.fps);
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, [dropped, scenario, camera.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleTime(rawT: number) {
    timeRef.current = rawT;
    if (!scenario) {
      return;
    }
    const duration = scenarioDuration(scenario);
    const t = duration > 0 ? rawT % duration : rawT;

    if (t < lastTimeRef.current - 1) {
      // scenario looped back to the start
      firedRef.current.clear();
    }
    lastTimeRef.current = t;

    for (const ev of toastEvents) {
      if (ev.type === "info") {
        continue;
      }
      if (Math.abs(t - ev.time) <= EVENT_WINDOW && !firedRef.current.has(ev.time)) {
        firedRef.current.add(ev.time);
        push({ type: ev.type, title: `⚠ ${camera.name}: ${ev.title}` });
      }
    }
  }

  function toggleMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen((v) => !v);
  }

  function toggleDropped(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDropped((v) => !v);
    setMenuOpen(false);
  }

  const latencySeconds = (latencyMs / 1000).toFixed(1);

  return (
    <Link
      href={`/camera/${camera.id}`}
      className="block rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 transition-colors hover:border-[var(--accent)]"
    >
      <div className="relative">
        {dropped || !scenario ? (
          <div
            className="relative aspect-video w-full overflow-hidden rounded-lg"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #1a2230 0, #1a2230 2px, #0b0f14 2px, #0b0f14 8px)",
              animation: "noise-shift 0.4s steps(4) infinite",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-[var(--danger)]">
              НЕТ СИГНАЛА
            </div>
          </div>
        ) : (
          <VideoPlayer
            scenario={scenario}
            classes={classes}
            showBadge
            detect
            sourceLabel={camera.name}
            onTime={handleTime}
            onError={() => setVideoError(true)}
          />
        )}

        <div ref={menuRef} className="absolute right-1 top-1 z-10">
          <button
            type="button"
            onClick={toggleMenu}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-[var(--muted)] opacity-70 hover:bg-black/60 hover:text-[var(--text)] hover:opacity-100"
            aria-label="Меню камеры"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 min-w-[190px] rounded-md border border-[var(--border)] bg-[var(--panel-2)] py-1 shadow-lg">
              <button
                type="button"
                onClick={toggleDropped}
                className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text)] hover:bg-[var(--panel)]"
              >
                {dropped ? "Восстановить поток" : "Симулировать обрыв"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2">
        <div className="text-sm font-medium text-[var(--text)]">{camera.name}</div>
        <div className="text-xs text-[var(--muted)]">{camera.area}</div>
        <div
          className={`mt-1 text-xs ${
            dropped || videoError ? "text-[var(--danger)]" : "text-[var(--muted)]"
          }`}
        >
          {dropped || videoError
            ? "Нет сигнала"
            : `LIVE • ${fps} fps • задержка ${latencySeconds} с`}
        </div>
      </div>
    </Link>
  );
}

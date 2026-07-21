"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ActionClass, Camera, Scenario } from "@/lib/types";
import { loadScenario } from "@/lib/clientScenarios";
import { deriveEvents, scenarioDuration } from "@/lib/scenario";
import VideoPlayer from "@/components/VideoPlayer";
import SegmentTimeline from "@/components/SegmentTimeline";
import EventFeed from "@/components/EventFeed";
import rawClasses from "@/data/classes.json";
import rawCameras from "@/data/cameras.json";

const classes = rawClasses as ActionClass[];
const cameras = rawCameras as Camera[];

export default function CameraDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const camera = cameras.find((c) => c.id === id) ?? null;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!camera) {
      return;
    }
    let cancelled = false;
    loadScenario(camera.id)
      .then((s) => {
        if (!cancelled) {
          setScenario(s);
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
  }, [camera]);

  const events = useMemo(
    () => (scenario ? deriveEvents(scenario, classes) : []),
    [scenario],
  );

  if (!camera) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6 text-center">
          <div className="text-sm text-[var(--muted)]">Камера не найдена</div>
          <Link href="/" className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  function handleSeek(t: number) {
    setCurrentTime(t);
    if (videoRef.current) {
      videoRef.current.currentTime = t;
    }
  }

  function handleExport() {
    if (!scenario) {
      return;
    }
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scenario.cameraId}-annotation.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-[var(--text)]">{camera.name}</h1>
            <span className="flex items-center gap-1 rounded-full border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-2 py-0.5 text-xs text-[var(--danger)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="text-sm text-[var(--muted)]">{camera.area}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!scenario}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Выгрузить разметку (JSON)
          </button>
          <Link
            href={`/annotation?camera=${camera.id}`}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--accent)]"
          >
            Открыть в редакторе
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-3">
          {scenario ? (
            <>
              <VideoPlayer
                scenario={scenario}
                classes={classes}
                detect
                sourceLabel={camera.name}
                onTime={setCurrentTime}
                videoRef={videoRef}
              />
              <SegmentTimeline
                scenario={scenario}
                classes={classes}
                currentTime={
                  scenarioDuration(scenario) > 0
                    ? currentTime % scenarioDuration(scenario)
                    : currentTime
                }
                onSeek={handleSeek}
              />
              <div className="flex flex-wrap gap-3">
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] text-sm text-[var(--muted)]">
              Загрузка…
            </div>
          )}
        </div>

        <div className="col-span-1">
          <EventFeed events={events} cameraName={camera.name} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ActionClass, Camera, Scenario } from "@/lib/types";
import { loadScenario, saveScenario } from "@/lib/clientScenarios";
import { useToasts } from "@/components/Toasts";
import VideoPlayer from "@/components/VideoPlayer";
import SegmentTimeline from "@/components/SegmentTimeline";
import ZoneEditor, { DEFAULT_ZONE } from "@/components/ZoneEditor";
import SegmentEditor from "@/components/SegmentEditor";
import rawClasses from "@/data/classes.json";
import rawCameras from "@/data/cameras.json";

const classes = rawClasses as ActionClass[];
const cameras = rawCameras as Camera[];

export default function AnnotationPage() {
  return (
    <Suspense>
      <AnnotationPicker />
    </Suspense>
  );
}

function AnnotationPicker() {
  const searchParams = useSearchParams();
  const initialCamera = searchParams.get("camera") ?? cameras[0]?.id ?? "";
  const [cameraId, setCameraId] = useState(initialCamera);

  return (
    <AnnotationEditor key={cameraId} cameraId={cameraId} onCameraChange={setCameraId} />
  );
}

function AnnotationEditor({
  cameraId,
  onCameraChange,
}: {
  cameraId: string;
  onCameraChange: (id: string) => void;
}) {
  const { push } = useToasts();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [dirty, setDirty] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadScenario(cameraId)
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
  }, [cameraId]);

  function updateScenario(patch: Partial<Scenario>) {
    setScenario((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  }

  function handleSeek(t: number) {
    setCurrentTime(t);
    if (videoRef.current) {
      videoRef.current.currentTime = t;
    }
  }

  function handleSave() {
    if (!scenario) {
      return;
    }
    const sorted = { ...scenario, segments: [...scenario.segments].sort((a, b) => a.start - b.start) };
    setScenario(sorted);
    saveScenario(sorted);
    setDirty(false);
    push({ type: "info", title: "Разметка сохранена" });
  }

  function handleExport() {
    if (!scenario) {
      return;
    }
    const sorted = { ...scenario, segments: [...scenario.segments].sort((a, b) => a.start - b.start) };
    const blob = new Blob([JSON.stringify(sorted, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scenario.cameraId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleResetToOriginal() {
    localStorage.removeItem(`sokol:scenario:${cameraId}`);
    setScenario(null);
    const res = await fetch(`/api/annotations/${cameraId}`);
    if (res.ok) {
      setScenario((await res.json()) as Scenario);
    }
    setDirty(false);
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-[var(--text)]">Редактор разметки</h1>
          <div className="text-sm text-[var(--muted)]">
            Подготовка демо-сценария: рабочая зона и сегменты действий
          </div>
        </div>
        <select
          value={cameraId}
          onChange={(e) => onCameraChange(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--text)]"
        >
          {cameras.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {scenario ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 flex flex-col gap-3">
            <div className="relative">
              <VideoPlayer
                scenario={scenario}
                classes={classes}
                onTime={setCurrentTime}
                videoRef={videoRef}
                showZone={false}
                showBadge={false}
              />
              <ZoneEditor zone={scenario.zone} onChange={(zone) => updateScenario({ zone })} />
            </div>

            <button
              onClick={() => updateScenario({ zone: DEFAULT_ZONE })}
              className="self-start rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--accent)]"
            >
              Сбросить зону
            </button>

            <SegmentTimeline
              scenario={scenario}
              classes={classes}
              currentTime={currentTime}
              onSeek={handleSeek}
            />

            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
              <SegmentEditor
                segments={scenario.segments}
                classes={classes}
                currentTime={currentTime}
                onChange={(segments) => updateScenario({ segments })}
              />
            </div>
          </div>

          <div className="col-span-1 flex flex-col gap-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSave}
                  className="rounded-md border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20"
                >
                  Сохранить
                </button>
                <button
                  onClick={handleExport}
                  className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--accent)]"
                >
                  Экспорт JSON
                </button>
                <button
                  onClick={handleResetToOriginal}
                  className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--danger)]"
                >
                  Сбросить к исходной
                </button>
                {dirty && (
                  <div className="text-xs text-[var(--warn)]">Есть несохранённые изменения</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] text-sm text-[var(--muted)]">
          Загрузка…
        </div>
      )}
    </div>
  );
}

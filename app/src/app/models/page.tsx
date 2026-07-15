"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ModelInfo, TrainRun } from "@/lib/types";
import TrainingPanel, { type TrainingResult } from "@/components/TrainingPanel";

function bumpVersion(version: string): string {
  const parts = version.split(".");
  const patch = Number(parts[2] ?? 0) + 1;
  return [parts[0], parts[1], patch].join(".");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU");
}

const TRAINING_STORAGE_KEY = "sokol:training";

export default function ModelsPage() {
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const [error, setError] = useState(false);
  const [activeTraining, setActiveTraining] = useState<{
    modelId: string;
    jobId: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => {
        if (!res.ok) {
          throw new Error("bad response");
        }
        return res.json();
      })
      .then((data: { models: ModelInfo[] }) => setModels(data.models))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(TRAINING_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const saved: { modelId: string; jobId: string } = JSON.parse(raw);
    fetch(`/api/train/${saved.jobId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { done: boolean } | null) => {
        if (!data || data.done) {
          sessionStorage.removeItem(TRAINING_STORAGE_KEY);
          return;
        }
        setActiveTraining(saved);
      })
      .catch(() => sessionStorage.removeItem(TRAINING_STORAGE_KEY));
  }, []);

  const handleStart = useCallback(async (modelId: string) => {
    const res = await fetch(`/api/models/${modelId}/train`, { method: "POST" });
    if (!res.ok) {
      return;
    }
    const data: { jobId: string } = await res.json();
    sessionStorage.setItem(
      TRAINING_STORAGE_KEY,
      JSON.stringify({ modelId, jobId: data.jobId }),
    );
    setActiveTraining({ modelId, jobId: data.jobId });
  }, []);

  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (doneTimeoutRef.current) {
        clearTimeout(doneTimeoutRef.current);
      }
    };
  }, []);

  const handleDone = useCallback(
    (modelId: string, result: TrainingResult) => {
      setModels((prev) =>
        prev
          ? prev.map((m) => {
              if (m.id !== modelId) {
                return m;
              }
              const bump = 0.002 + Math.random() * 0.002;
              const accuracy = Math.min(0.989, m.metrics.accuracy + bump);
              const run: TrainRun = {
                id: `run-${Date.now()}`,
                startedAt: new Date().toISOString(),
                epochs: 24,
                finalLoss: result.finalLoss,
                finalAccuracy: accuracy,
              };
              return {
                ...m,
                version: bumpVersion(m.version),
                metrics: { ...m.metrics, accuracy },
                history: [run, ...m.history],
              };
            })
          : prev,
      );
      sessionStorage.removeItem(TRAINING_STORAGE_KEY);
      // Keep the panel mounted for a bit so the "Обучение завершено" state
      // (final charts) is visible instead of disappearing instantly.
      doneTimeoutRef.current = setTimeout(() => setActiveTraining(null), 4000);
    },
    [],
  );

  if (error) {
    return (
      <div className="p-6 text-sm text-[var(--danger)]">
        Не удалось загрузить данные
      </div>
    );
  }

  if (!models) {
    return <div className="p-6 text-sm text-[var(--muted)]">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold">Модели</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {models.map((model) => {
          const isTraining = activeTraining?.modelId === model.id;
          const anyTraining = activeTraining !== null;

          return (
            <div
              key={model.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.name}</span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-2 py-0.5 text-xs text-[var(--muted)]">
                    v{model.version}
                  </span>
                </div>
                <button
                  onClick={() => handleStart(model.id)}
                  disabled={anyTraining}
                  className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Запустить обучение
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-md bg-[var(--panel-2)] p-3">
                  <div className="text-xs text-[var(--muted)]">Точность</div>
                  <div className="text-base font-semibold">
                    {(model.metrics.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="rounded-md bg-[var(--panel-2)] p-3">
                  <div className="text-xs text-[var(--muted)]">Задержка</div>
                  <div className="text-base font-semibold">
                    {model.metrics.latencyMs} мс
                  </div>
                </div>
                <div className="rounded-md bg-[var(--panel-2)] p-3">
                  <div className="text-xs text-[var(--muted)]">F1</div>
                  <div className="text-base font-semibold">
                    {model.metrics.f1.toFixed(3)}
                  </div>
                </div>
              </div>

              {isTraining && activeTraining && (
                <TrainingPanel
                  key={activeTraining.jobId}
                  jobId={activeTraining.jobId}
                  onDone={(result) => handleDone(model.id, result)}
                />
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="py-1.5 font-normal">Дата</th>
                    <th className="py-1.5 font-normal">Эпох</th>
                    <th className="py-1.5 font-normal">Loss</th>
                    <th className="py-1.5 font-normal">Точность</th>
                  </tr>
                </thead>
                <tbody>
                  {model.history.map((run) => (
                    <tr key={run.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-1.5">{formatDate(run.startedAt)}</td>
                      <td className="py-1.5">{run.epochs}</td>
                      <td className="py-1.5">{run.finalLoss.toFixed(3)}</td>
                      <td className="py-1.5">{(run.finalAccuracy * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

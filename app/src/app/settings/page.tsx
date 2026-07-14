"use client";

import { useEffect, useState } from "react";
import type { ActionClass, Camera, Severity } from "@/lib/types";
import { useToasts } from "@/components/Toasts";
import rawClasses from "@/data/classes.json";
import rawCameras from "@/data/cameras.json";

const defaultClasses = rawClasses as ActionClass[];
const cameras = rawCameras as Camera[];

const CLASSES_STORAGE_KEY = "sokol:classes";

const SEVERITY_LABELS: Record<Severity, string> = {
  normal: "Норма",
  warning: "Предупреждение",
  violation: "Нарушение",
};

async function loadStoredClasses(): Promise<ActionClass[] | null> {
  try {
    const raw = localStorage.getItem(CLASSES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActionClass[]) : null;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold">Настройки</h1>
      <ClassesPanel />
      <ModelParamsPanel />
      <SourcesPanel />
    </div>
  );
}

function ClassesPanel() {
  const { push } = useToasts();
  const [classes, setClasses] = useState<ActionClass[]>(defaultClasses);

  // Read the localStorage override after mount to avoid a hydration mismatch
  // with the statically prerendered HTML (which contains defaultClasses).
  useEffect(() => {
    let cancelled = false;
    loadStoredClasses().then((stored) => {
      if (stored && !cancelled) {
        setClasses(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateClass(id: string, patch: Partial<ActionClass>) {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addClass() {
    setClasses((prev) => [
      ...prev,
      {
        id: `class-${crypto.randomUUID().slice(0, 8)}`,
        name: "Новый класс",
        color: "#38bdf8",
        severity: "normal",
      },
    ]);
  }

  function removeClass(id: string) {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  }

  function handleSave() {
    localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
    push({ type: "info", title: "Классы сохранены" });
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 space-y-4">
      <h2 className="text-base font-medium">Классы действий</h2>

      {/* Known limitation (demo): monitoring/analytics pages read class defaults
          from classes.json on the server, not from this localStorage override.
          This panel only demonstrates configurability. */}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
            <th className="py-1.5 font-normal w-10">Цвет</th>
            <th className="py-1.5 font-normal">Название</th>
            <th className="py-1.5 font-normal w-48">Серьёзность</th>
            <th className="py-1.5 font-normal">Описание</th>
            <th className="py-1.5 font-normal w-10"></th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
              <td className="py-1.5">
                <input
                  type="color"
                  value={c.color}
                  onChange={(e) => updateClass(c.id, { color: e.target.value })}
                  className="h-7 w-9 cursor-pointer rounded border border-[var(--border)] bg-transparent"
                />
              </td>
              <td className="py-1.5 pr-2">
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => updateClass(c.id, { name: e.target.value })}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 text-sm text-[var(--text)]"
                />
              </td>
              <td className="py-1.5 pr-2">
                <select
                  value={c.severity}
                  onChange={(e) => updateClass(c.id, { severity: e.target.value as Severity })}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 text-sm text-[var(--text)]"
                >
                  {(Object.entries(SEVERITY_LABELS) as [Severity, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-1.5 pr-2">
                <input
                  type="text"
                  value={c.description ?? ""}
                  onChange={(e) => updateClass(c.id, { description: e.target.value })}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 text-sm text-[var(--text)]"
                />
              </td>
              <td className="py-1.5 text-right">
                <button
                  onClick={() => removeClass(c.id)}
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] hover:border-[var(--danger)] hover:text-[var(--danger)]"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2">
        <button
          onClick={addClass}
          className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--accent)]"
        >
          Добавить класс
        </button>
        <button
          onClick={handleSave}
          className="rounded-md border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20"
        >
          Сохранить
        </button>
      </div>
    </section>
  );
}

function ModelParamsPanel() {
  const { push } = useToasts();
  const [confidence, setConfidence] = useState(0.85);
  const [frameWindow, setFrameWindow] = useState(32);
  const [reactionInterval, setReactionInterval] = useState(12);

  function handleApply() {
    push({ type: "info", title: "Параметры применены" });
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 space-y-4">
      <h2 className="text-base font-medium">Параметры моделей</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Порог уверенности: {confidence.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.5}
            max={0.99}
            step={0.01}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Окно кадров</label>
          <input
            type="number"
            value={frameWindow}
            onChange={(e) => setFrameWindow(Number(e.target.value))}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1.5 text-sm text-[var(--text)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Интервал реакции, кадров</label>
          <input
            type="number"
            value={reactionInterval}
            onChange={(e) => setReactionInterval(Number(e.target.value))}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1.5 text-sm text-[var(--text)]"
          />
        </div>
      </div>

      <button
        onClick={handleApply}
        className="rounded-md border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20"
      >
        Применить
      </button>
    </section>
  );
}

function SourcesPanel() {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 space-y-4">
      <h2 className="text-base font-medium">Источники видеопотоков</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
            <th className="py-1.5 font-normal">ID</th>
            <th className="py-1.5 font-normal">RTSP</th>
            <th className="py-1.5 font-normal">Файл (fallback)</th>
            <th className="py-1.5 font-normal">Статус</th>
          </tr>
        </thead>
        <tbody>
          {cameras.map((c, i) => (
            <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
              <td className="py-1.5">{c.id}</td>
              <td className="py-1.5 font-mono text-xs text-[var(--muted)]">
                {`rtsp://10.0.12.1${i + 1}/stream1`}
              </td>
              <td className="py-1.5 font-mono text-xs text-[var(--muted)]">{c.video}</td>
              <td className="py-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--ok)]" />
                  активен
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

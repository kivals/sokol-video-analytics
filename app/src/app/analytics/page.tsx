"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "@/components/StatCard";
import type { ActionClass, Camera } from "@/lib/types";
import type { DerivedEvent } from "@/lib/scenario";
import classesData from "@/data/classes.json";
import camerasData from "@/data/cameras.json";

const classes = classesData as ActionClass[];
const cameras = camerasData as Camera[];
const classById = new Map(classes.map((c) => [c.id, c]));
const cameraById = new Map(cameras.map((c) => [c.id, c]));

const SHIFT_START_HOUR = 8;
const SHIFT_HOURS = 8;

function shiftBase(): number {
  const base = new Date();
  base.setHours(SHIFT_START_HOUR, 0, 0, 0);
  return base.getTime();
}

function formatTimestamp(baseMs: number, seconds: number): string {
  return new Date(baseMs + seconds * 1000).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function shortCameraName(camera: Camera): string {
  return camera.name.split(" — ")[0];
}

const TYPE_LABEL: Record<DerivedEvent["type"], string> = {
  violation: "Нарушение",
  warning: "Внимание",
  info: "Инфо",
};

interface TimeByClass {
  classId: string;
  seconds: number;
  share: number;
}

interface ViolationsByCamera {
  cameraId: string;
  violations: number;
  warnings: number;
}

interface AnalyticsEvent extends DerivedEvent {
  cameraId: string;
}

interface AnalyticsSummary {
  accuracy: number;
  latencySeconds: number;
  streams: { active: number; total: number };
  framesProcessed: number;
  timeByClass: TimeByClass[];
  violationsByCamera: ViolationsByCamera[];
  events: AnalyticsEvent[];
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState(false);
  const [frames, setFrames] = useState<number | null>(null);
  const [baseMs] = useState(shiftBase);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analytics/summary");
        if (!res.ok) {
          throw new Error("bad response");
        }
        const data: AnalyticsSummary = await res.json();
        if (cancelled) {
          return;
        }
        setSummary(data);
        setFrames(data.framesProcessed);
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrames((prev) => (prev === null ? prev : prev + 25));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const donutData = useMemo(() => {
    if (!summary) {
      return [];
    }
    return summary.timeByClass.map((t) => {
      const cls = classById.get(t.classId);
      return {
        classId: t.classId,
        name: cls?.name ?? t.classId,
        color: cls?.color ?? "#94a3b8",
        share: t.share,
      };
    });
  }, [summary]);

  const barData = useMemo(() => {
    if (!summary) {
      return [];
    }
    return summary.violationsByCamera.map((v) => {
      const camera = cameraById.get(v.cameraId);
      return {
        name: camera ? shortCameraName(camera) : v.cameraId,
        violations: v.violations,
        warnings: v.warnings,
      };
    });
  }, [summary]);

  const areaData = useMemo(() => {
    if (!summary) {
      return [];
    }
    const workShare = summary.timeByClass
      .filter((t) => classById.get(t.classId)?.severity === "normal")
      .reduce((acc, t) => acc + t.share, 0);
    return Array.from({ length: SHIFT_HOURS + 1 }, (_, i) => {
      const hour = SHIFT_START_HOUR + i;
      const value = Math.min(100, Math.max(0, workShare * 100 + Math.sin(i) * 6));
      return {
        hour: `${hour.toString().padStart(2, "0")}:00`,
        value: Number(value.toFixed(1)),
      };
    });
  }, [summary]);

  const topEvents = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [...summary.events].sort((a, b) => b.time - a.time).slice(0, 10);
  }, [summary]);

  const violationsTotal = summary
    ? summary.violationsByCamera.reduce((acc, v) => acc + v.violations, 0)
    : 0;
  const warningsTotal = summary
    ? summary.violationsByCamera.reduce((acc, v) => acc + v.warnings, 0)
    : 0;

  if (error) {
    return (
      <div className="p-6 text-sm text-[var(--danger)]">
        Не удалось загрузить данные
      </div>
    );
  }

  if (!summary) {
    return <div className="p-6 text-sm text-[var(--muted)]">Загрузка…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold">Аналитика</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Точность классификации"
          value={`${(summary.accuracy * 100).toFixed(1)}%`}
        />
        <StatCard label="Время отклика" value={`${summary.latencySeconds} с`} />
        <StatCard
          label="Активных потоков"
          value={`${summary.streams.active}/${summary.streams.total}`}
        />
        <StatCard
          label="Кадров обработано"
          value={(frames ?? summary.framesProcessed).toLocaleString("ru-RU")}
        />
        <StatCard
          label="Нарушений за смену"
          value={String(violationsTotal)}
          hint={`предупреждений: ${warningsTotal}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="mb-2 text-sm font-medium text-[var(--text)]">
            Распределение времени по действиям
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={donutData}
                dataKey="share"
                nameKey="name"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {donutData.map((d) => (
                  <Cell key={d.classId} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--panel-2)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
                formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, "Доля"]}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontSize: 12, color: "var(--muted)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="mb-2 text-sm font-medium text-[var(--text)]">
            Нарушения по камерам
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="var(--muted)" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="var(--muted)" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  background: "var(--panel-2)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
              <Bar dataKey="violations" name="Нарушения" fill="var(--danger)" />
              <Bar dataKey="warnings" name="Предупреждения" fill="var(--warn)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="mb-2 text-sm font-medium text-[var(--text)]">Активность за смену</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={areaData}>
            <defs>
              <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="hour" stroke="var(--muted)" fontSize={12} />
            <YAxis stroke="var(--muted)" fontSize={12} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                fontSize: 12,
              }}
              formatter={(value) => [`${value}%`, "Активность"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              fill="url(#activityFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="mb-2 text-sm font-medium text-[var(--text)]">Последние события</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--muted)]">
              <th className="py-1.5 pr-3 font-normal">Время</th>
              <th className="py-1.5 pr-3 font-normal">Камера</th>
              <th className="py-1.5 pr-3 font-normal">Событие</th>
              <th className="py-1.5 font-normal">Тип</th>
            </tr>
          </thead>
          <tbody>
            {topEvents.map((ev, i) => {
              const rowClass =
                ev.type === "violation"
                  ? "bg-[var(--danger)]/10"
                  : ev.type === "warning"
                    ? "bg-[var(--warn)]/10"
                    : "";
              return (
                <tr key={i} className={`border-t border-[var(--border)] ${rowClass}`}>
                  <td className="py-1.5 pr-3 text-[var(--muted)]">
                    {formatTimestamp(baseMs, ev.time)}
                  </td>
                  <td className="py-1.5 pr-3">
                    {cameraById.get(ev.cameraId)
                      ? shortCameraName(cameraById.get(ev.cameraId)!)
                      : ev.cameraId}
                  </td>
                  <td className="py-1.5 pr-3">{ev.title}</td>
                  <td className="py-1.5">{TYPE_LABEL[ev.type]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

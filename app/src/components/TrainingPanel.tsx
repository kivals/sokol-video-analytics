"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useToasts } from "@/components/Toasts";

interface TrainProgress {
  epoch: number;
  totalEpochs: number;
  progress: number;
  loss: number;
  accuracy: number;
  etaSeconds: number;
  done: boolean;
}

interface ChartPoint {
  epoch: number;
  loss: number;
  accuracy: number;
}

export interface TrainingResult {
  finalLoss: number;
  finalAccuracy: number;
}

function formatEta(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TrainingPanel({
  jobId,
  onDone,
}: {
  jobId: string;
  onDone: (result: TrainingResult) => void;
}) {
  const { push } = useToasts();
  const [progress, setProgress] = useState<TrainProgress | null>(null);
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let done = false;

    async function poll() {
      const res = await fetch(`/api/train/${jobId}`);
      if (!res.ok || cancelled) {
        return;
      }
      const data: TrainProgress = await res.json();
      if (cancelled) {
        return;
      }
      setProgress(data);
      setPoints((prev) => [
        ...prev,
        { epoch: data.epoch, loss: data.loss, accuracy: data.accuracy },
      ]);
      if (data.done) {
        done = true;
        setFinished(true);
        push({ type: "info", title: "Обучение завершено" });
        onDone({ finalLoss: data.loss, finalAccuracy: data.accuracy });
      }
    }

    poll();
    const interval = setInterval(() => {
      if (done) {
        clearInterval(interval);
        return;
      }
      poll();
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, onDone, push]);

  if (!progress) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-4 text-sm text-[var(--muted)]">
        Запуск обучения...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-4 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span>
          {finished
            ? "Обучение завершено"
            : `Эпоха ${progress.epoch}/${progress.totalEpochs}`}
        </span>
        {!finished && (
          <span className="text-[var(--muted)]">
            Осталось ~{formatEta(progress.etaSeconds)}
          </span>
        )}
      </div>

      <div className="h-2 rounded-full bg-[var(--panel)] overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] transition-[width] duration-300"
          style={{ width: `${Math.min(100, progress.progress * 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 text-xs text-[var(--muted)]">Loss</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={points}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="epoch" stroke="var(--muted)" fontSize={12} />
              <YAxis stroke="var(--muted)" fontSize={12} />
              <Line
                type="monotone"
                dataKey="loss"
                stroke="#f59e0b"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="mb-1 text-xs text-[var(--muted)]">Точность</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={points}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="epoch" stroke="var(--muted)" fontSize={12} />
              <YAxis stroke="var(--muted)" fontSize={12} domain={[0.5, 1]} />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="var(--ok)"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

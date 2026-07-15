"use client";

import { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import type { Camera } from "@/lib/types";
import camerasData from "@/data/cameras.json";

const cameras = camerasData as Camera[];

const BREADCRUMBS: Record<string, string> = {
  "/": "Мониторинг",
  "/annotation": "Разметка",
  "/models": "Модели",
  "/analytics": "Аналитика",
  "/settings": "Настройки",
};

function useBreadcrumb(): string {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();

  if (pathname.startsWith("/camera/") && params.id) {
    const camera = cameras.find((c) => c.id === params.id);
    return camera?.name ?? pathname;
  }

  return BREADCRUMBS[pathname] ?? pathname;
}

function randomGpu(): number {
  return Math.round(62 + Math.random() * (78 - 62));
}

function clampGpu(value: number): number {
  return Math.min(78, Math.max(62, value));
}

export default function Header() {
  const breadcrumb = useBreadcrumb();
  const [mounted, setMounted] = useState(false);
  const [gpu, setGpu] = useState(randomGpu);
  const [frames, setFrames] = useState(1284503);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setGpu((prev) => clampGpu(prev + (Math.random() * 6 - 3)));
      setFrames((prev) => prev + 150);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="col-start-2 row-start-1 flex items-center justify-between px-6 h-14 border-b border-[var(--border)] bg-[var(--panel)]">
      <div className="text-sm text-[var(--muted)]">{breadcrumb}</div>
      <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
        {mounted ? (
          <>
            <span>GPU: {Math.round(gpu)}%</span>
            <span>Кадров: {frames.toLocaleString("ru-RU")}</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--ok)] animate-pulse" />
              Система активна
            </span>
            <span>
              {now.toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </header>
  );
}

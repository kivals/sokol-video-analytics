"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

export interface Toast {
  type: "violation" | "warning";
  title: string;
}

interface ToastItem extends Toast {
  id: number;
}

interface ToastContextValue {
  push: (toast: Toast) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToasts(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToasts must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const push = useCallback((toast: Toast) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
              t.type === "violation"
                ? "border-[var(--danger)] bg-[var(--danger)]/15 text-[var(--text)]"
                : "border-[var(--warn)] bg-[var(--warn)]/15 text-[var(--text)]"
            }`}
          >
            {t.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

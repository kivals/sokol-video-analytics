"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Мониторинг" },
  { href: "/annotation", label: "Разметка" },
  { href: "/models", label: "Модели" },
  { href: "/analytics", label: "Аналитика" },
  { href: "/settings", label: "Настройки" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="col-start-1 row-span-2 flex flex-col border-r border-[var(--border)] bg-[var(--panel)]">
      <div className="px-4 py-5 border-b border-[var(--border)]">
        <div className="text-lg font-semibold tracking-wide">СОКОЛ</div>
        <div className="text-xs text-[var(--muted)]">видеоаналитика персонала</div>
      </div>

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-2.5 text-sm border-l-2 transition-colors ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--panel-2)] text-[var(--text)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--muted)]">
        v2.4.1 • сборка 8127
      </div>
    </aside>
  );
}

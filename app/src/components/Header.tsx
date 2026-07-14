export default function Header() {
  return (
    <header className="col-start-2 row-start-1 flex items-center justify-between px-6 h-14 border-b border-[var(--border)] bg-[var(--panel)]">
      <div className="text-sm text-[var(--muted)]">{/* breadcrumb slot */}</div>
      <div className="flex items-center gap-4">{/* live counters, Task 12 */}</div>
    </header>
  );
}

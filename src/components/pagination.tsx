interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const baseBtn =
  "inline-flex items-center justify-center h-10 min-w-[2.5rem] px-3 text-sm rounded-xl border border-border bg-card transition-all duration-200 hover:bg-secondary hover:border-[color-mix(in_oklch,var(--brand),transparent_60%)] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border";

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={dir === "left" ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  // Show at most 5 page buttons centered around current page
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const from = Math.max(1, start);
  const end = Math.min(totalPages, from + 4);
  const pages = Array.from({ length: end - from + 1 }, (_, i) => from + i);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 mt-8" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${baseBtn} gap-1.5 pl-2.5`}
        aria-label="Previous page"
      >
        <Arrow dir="left" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {from > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className={`${baseBtn} tabular-nums`}>
            1
          </button>
          {from > 2 && <span className="px-1 text-muted-foreground select-none">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={
            p === page
              ? "btn-brand inline-flex items-center justify-center h-10 min-w-[2.5rem] px-3 text-sm font-semibold rounded-xl tabular-nums"
              : `${baseBtn} tabular-nums`
          }
          aria-current={p === page ? "page" : undefined}
          aria-label={`Page ${p}`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted-foreground select-none">…</span>}
          <button onClick={() => onPageChange(totalPages)} className={`${baseBtn} tabular-nums`}>
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`${baseBtn} gap-1.5 pr-2.5`}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <Arrow dir="right" />
      </button>
    </nav>
  );
}

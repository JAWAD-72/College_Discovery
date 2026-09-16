interface EmptyStateProps {
  title: string;
  description?: string;
  /** The most restrictive filter to suggest removing */
  restrictiveFilter?: { label: string; onRemove: () => void };
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ title, description, restrictiveFilter, action }: EmptyStateProps) {
  return (
    <div
      className="animate-fade-up flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
    >
      {/* Empty telescope / search illustration */}
      <div
        className="relative flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
        style={{ background: "var(--brand-soft)" }}
        aria-hidden="true"
      >
        <svg
          width="36" height="36" viewBox="0 0 24 24" fill="none"
          stroke="var(--brand)" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21" />
          <path d="M8 10.5h5" opacity="0.5" />
        </svg>
        <span
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "var(--brand)" }}
        >
          0
        </span>
      </div>

      <h3 className="font-display text-lg font-semibold mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-5 leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {restrictiveFilter && (
          <button
            onClick={restrictiveFilter.onRemove}
            className="text-sm font-medium px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary hover:border-[color-mix(in_oklch,var(--brand),transparent_60%)] transition-all"
          >
            Remove &quot;{restrictiveFilter.label}&quot;
          </button>
        )}
        {action &&
          (action.href ? (
            <a
              href={action.href}
              className="btn-brand text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="btn-brand text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              {action.label}
            </button>
          ))}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <div
      className="animate-fade-up flex flex-col items-center justify-center py-16 px-4 text-center"
      role="alert"
    >
      <div
        className="flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
        style={{ background: "color-mix(in oklch, var(--destructive), transparent 92%)" }}
        aria-hidden="true"
      >
        <svg
          width="34" height="34" viewBox="0 0 24 24" fill="none"
          stroke="var(--destructive)" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <h3 className="font-display text-lg font-semibold mb-1.5">Something broke</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

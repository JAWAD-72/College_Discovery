import type { ReactNode } from "react";

export function formatINR(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toLocaleString("en-IN");
}

export function FeeRange({ min, max }: { min: number; max: number }) {
  return (
    <span className="tabular-nums">
      {min === max ? (
        <>₹{formatINR(min)}</>
      ) : (
        <>
          ₹{formatINR(min)}
          <span className="text-muted-foreground mx-0.5">–</span>₹{formatINR(max)}
        </>
      )}
    </span>
  );
}

/**
 * A single headline number. Renders as a tile so a row of them reads as a
 * dashboard rather than as loose text.
 */
export function StatBlock({
  label,
  value,
  sublabel,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon?: ReactNode;
  /** CSS color for the accent bar and icon, e.g. "var(--brand)" */
  tone?: string;
}) {
  return (
    <div className="surface relative px-3.5 py-3 overflow-hidden">
      {tone && (
        <span
          className="absolute left-0 inset-y-0 w-[3px]"
          style={{ background: tone }}
          aria-hidden="true"
        />
      )}
      <div className="flex items-center gap-1.5">
        {icon && (
          <span className="shrink-0 opacity-70" style={tone ? { color: tone } : undefined}>
            {icon}
          </span>
        )}
        <span className="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-display text-xl font-bold tabular-nums mt-1 leading-tight">
        {value}
      </p>
      {sublabel && (
        <p className="text-[0.7rem] text-muted-foreground mt-0.5">{sublabel}</p>
      )}
    </div>
  );
}

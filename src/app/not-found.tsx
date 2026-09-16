import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="hero-mesh" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center">
        <p className="brand-text font-display text-7xl sm:text-8xl font-extrabold tabular-nums leading-none animate-fade-up">
          404
        </p>
        <h1
          className="font-display text-xl font-bold mt-4 animate-fade-up stagger"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          This page went off the map
        </h1>
        <p
          className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed animate-fade-up stagger"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          The link you followed doesn&apos;t exist or has moved. Your search is
          still a click away.
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-2 mt-6 animate-fade-up stagger"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <Link href="/" className="btn-brand text-sm font-semibold px-5 py-2.5 rounded-xl">
            Go home
          </Link>
          <Link
            href="/colleges"
            className="text-sm font-medium px-5 py-2.5 rounded-xl bg-card border border-border hover:bg-secondary transition-colors"
          >
            Browse colleges
          </Link>
        </div>
      </div>
    </div>
  );
}

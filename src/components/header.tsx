"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare } from "@/lib/compare-context";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/colleges", label: "Colleges" },
  { href: "/predict", label: "Predict" },
  { href: "/saved", label: "Saved" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/colleges" ? pathname.startsWith("/colleges") : pathname === href;
}

export function Header() {
  const pathname = usePathname();
  const { colleges } = useCompare();

  return (
    <header className="glass border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Wordmark with a compass needle mark. The text drops below 420px so
            the nav and theme toggle always fit without horizontal scroll. */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 group"
          aria-label="CollegeCompass home"
        >
          <span className="brand-gradient flex items-center justify-center w-9 h-9 rounded-xl shadow-sm-t transition-transform duration-300 group-hover:rotate-[-8deg]">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.7" opacity="0.9" />
              <path
                d="M15.6 8.4 13.4 13.4 8.4 15.6 10.6 10.6z"
                fill="white"
              />
            </svg>
          </span>
          <span className="hidden min-[420px]:inline text-[1.0625rem] font-display font-bold tracking-tight">
            College<span className="brand-text">Compass</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nav pills */}
          <nav className="flex items-center gap-0.5 p-1 rounded-full bg-secondary/70 border border-border/60">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const showCount = item.href === "/saved" && colleges.length > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative px-2.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-[0.8125rem] font-medium transition-all duration-200 ${
                    active
                      ? "bg-card text-foreground shadow-sm-t"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {showCount && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--brand)] ring-2 ring-background" />
                  )}
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

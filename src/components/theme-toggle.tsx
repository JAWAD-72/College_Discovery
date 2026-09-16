"use client";

/**
 * Dark-mode switch.
 *
 * Deliberately stateless: the `dark` class on <html> is the single source of
 * truth (set pre-paint by the boot script in layout.tsx), and the two icons are
 * cross-faded with the `dark:` variant. No state means no hydration mismatch
 * and no flash on first render.
 */
export function ThemeToggle() {
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cc-theme", next ? "dark" : "light");
    } catch {
      /* storage blocked — the toggle still works for this session */
    }
  };

  return (
    <button
      onClick={toggle}
      className="relative flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {/* Sun — visible in light mode */}
      <svg
        width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
        className="absolute transition-all duration-300 opacity-100 rotate-0 scale-100 dark:opacity-0 dark:-rotate-90 dark:scale-50"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
      </svg>

      {/* Moon — visible in dark mode */}
      <svg
        width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className="absolute transition-all duration-300 opacity-0 rotate-90 scale-50 dark:opacity-100 dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      >
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}

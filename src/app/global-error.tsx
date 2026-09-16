"use client";

import { useEffect } from "react";

/**
 * Replaces the root layout when rendering fails, so globals.css is NOT loaded
 * here — everything must be inline or in this scoped <style> tag.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <style>{`
          .ge-wrap {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; min-height: 100vh; padding: 1.5rem;
            text-align: center; background: #fbfbfd; color: #1a1a24;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          }
          .ge-badge {
            display: flex; align-items: center; justify-content: center;
            width: 64px; height: 64px; border-radius: 20px; margin-bottom: 20px;
            background: linear-gradient(135deg, #7c5cff, #5b6cf0);
            box-shadow: 0 8px 24px rgba(92, 92, 255, 0.28);
          }
          .ge-title { font-size: 1.375rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 8px; }
          .ge-body { color: #61616e; margin: 0 0 24px; max-width: 24rem; line-height: 1.6; font-size: 0.9375rem; }
          .ge-btn {
            padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: 600;
            border: none; border-radius: 12px; cursor: pointer; color: white;
            background: linear-gradient(135deg, #7c5cff, #5b6cf0);
            box-shadow: 0 4px 14px rgba(92, 92, 255, 0.3);
            transition: filter 0.2s ease, transform 0.2s ease;
          }
          .ge-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
          .ge-digest { margin-top: 20px; font-size: 0.75rem; color: #9a9aa8; font-family: ui-monospace, monospace; }
          @media (prefers-color-scheme: dark) {
            .ge-wrap { background: #121219; color: #f2f2f7; }
            .ge-body { color: #a0a0b0; }
          }
        `}</style>
        <div className="ge-wrap">
          <div className="ge-badge" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </div>
          <h1 className="ge-title">Something went wrong</h1>
          <p className="ge-body">
            An unexpected error occurred while loading this page. Trying again
            usually fixes it.
          </p>
          <button className="ge-btn" onClick={() => reset()}>
            Try again
          </button>
          {error.digest && <p className="ge-digest">Ref: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}

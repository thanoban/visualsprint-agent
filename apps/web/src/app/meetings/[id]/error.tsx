"use client";

import { useEffect } from "react";

import { primaryButtonClassName } from "../../../components/ui/button-styles";

export default function MeetingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">Meeting error</p>
      <h1 className="text-3xl font-semibold tracking-tight">Could not load this meeting</h1>
      <p className="text-sm leading-7 text-foreground-muted">
        The meeting workspace failed to render. Retry or choose another session.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button className={primaryButtonClassName} onClick={reset} type="button">
          Try again
        </button>
        <a className={primaryButtonClassName} href="/meetings">
          All meetings
        </a>
      </div>
    </div>
  );
}

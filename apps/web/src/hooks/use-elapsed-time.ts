"use client";

import { useEffect, useState } from "react";

import { formatElapsedTime } from "../lib/format";

export function useElapsedTime(startedAt: string | null, active: boolean) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !startedAt) {
      return;
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [active, startedAt]);

  return formatElapsedTime(startedAt, nowMs);
}

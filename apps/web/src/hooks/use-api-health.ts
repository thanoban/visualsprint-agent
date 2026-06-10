"use client";

import { useEffect, useState } from "react";

import { listMeetings } from "../lib/api";

export type ApiHealth = "checking" | "online" | "offline";

export function useApiHealth() {
  const [health, setHealth] = useState<ApiHealth>("checking");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await listMeetings();
        if (!cancelled) {
          setHealth("online");
        }
      } catch {
        if (!cancelled) {
          setHealth("offline");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return health;
}

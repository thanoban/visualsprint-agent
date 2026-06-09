"use client";

import { useSyncExternalStore } from "react";

function subscribeToBrowserAvailability() {
  return () => {};
}

export type CaptureSupport = {
  mediaDevices: boolean;
  displayCapture: boolean;
  mediaRecorder: boolean;
};

export function useIsClient() {
  return useSyncExternalStore(
    subscribeToBrowserAvailability,
    () => true,
    () => false,
  );
}

export function useCaptureSupport(): CaptureSupport | null {
  const isClient = useIsClient();

  if (!isClient) {
    return null;
  }

  return {
    mediaDevices: typeof navigator.mediaDevices !== "undefined",
    displayCapture:
      typeof navigator.mediaDevices !== "undefined" &&
      typeof navigator.mediaDevices.getDisplayMedia === "function",
    mediaRecorder: typeof window.MediaRecorder !== "undefined",
  };
}

export type DisplaySurface = "browser" | "window" | "monitor" | "unknown";

export type CaptureResources = {
  stream: MediaStream;
  cleanup: () => void;
  hasDisplayVideo: boolean;
  hasDisplayAudio: boolean;
  hasMicrophoneAudio: boolean;
  displaySurface: DisplaySurface;
};

export function buildClientChunkId(captureSessionId: string, sequence: number) {
  return `${captureSessionId}_chunk_${String(sequence).padStart(4, "0")}`;
}

export function resolveRecorderMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
  ];

  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function detectDisplaySurface(videoTrack: MediaStreamTrack): DisplaySurface {
  if (typeof videoTrack.getSettings !== "function") {
    return "unknown";
  }
  const settings = videoTrack.getSettings() as { displaySurface?: string };
  const surface = settings.displaySurface;
  if (
    surface === "browser" ||
    surface === "window" ||
    surface === "monitor"
  ) {
    return surface;
  }
  return "unknown";
}

export async function buildCaptureResources(): Promise<CaptureResources> {
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

  const displayVideoTracks = displayStream.getVideoTracks();
  const displayAudioTracks = displayStream.getAudioTracks();

  const displaySurface =
    displayVideoTracks.length > 0
      ? detectDisplaySurface(displayVideoTracks[0])
      : "unknown";

  let microphoneStream: MediaStream | null = null;
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    microphoneStream = null;
  }

  const microphoneAudioTracks = microphoneStream?.getAudioTracks() ?? [];

  const composedStream = new MediaStream();
  const cleanupCallbacks: Array<() => void> = [];

  displayVideoTracks.forEach((track) => composedStream.addTrack(track));

  if (displayAudioTracks.length + microphoneAudioTracks.length > 1) {
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    const audioStreams: MediaStream[] = [];

    if (displayAudioTracks.length > 0) {
      audioStreams.push(new MediaStream(displayAudioTracks));
    }
    if (microphoneAudioTracks.length > 0) {
      audioStreams.push(new MediaStream(microphoneAudioTracks));
    }

    audioStreams.forEach((stream) => {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(destination);
    });

    destination.stream.getAudioTracks().forEach((track) => composedStream.addTrack(track));

    cleanupCallbacks.push(() => {
      void audioContext.close();
    });
  } else {
    [...displayAudioTracks, ...microphoneAudioTracks].forEach((track) =>
      composedStream.addTrack(track),
    );
  }

  cleanupCallbacks.push(() => {
    displayStream.getTracks().forEach((track) => track.stop());
    microphoneStream?.getTracks().forEach((track) => track.stop());
    composedStream.getTracks().forEach((track) => {
      if (track.readyState === "live") {
        track.stop();
      }
    });
  });

  return {
    stream: composedStream,
    cleanup: () => {
      cleanupCallbacks.forEach((callback) => callback());
    },
    hasDisplayVideo: displayVideoTracks.length > 0,
    hasDisplayAudio: displayAudioTracks.length > 0,
    hasMicrophoneAudio: microphoneAudioTracks.length > 0,
    displaySurface,
  };
}

export function hasAudioCoverageWarning(
  displaySurface: DisplaySurface,
  hasDisplayAudio: boolean,
  hasMicrophoneAudio: boolean,
): boolean {
  // When sharing only a window (e.g. a Zoom meeting window), the browser often
  // does not capture system audio. Warn the user unless microphone audio is present.
  return displaySurface === "window" && !hasDisplayAudio && !hasMicrophoneAudio;
}

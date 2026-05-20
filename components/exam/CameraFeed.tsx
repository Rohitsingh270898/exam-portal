"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff } from "lucide-react";

// ─── Camera Gate ──────────────────────────────────────────────────────────────
interface CameraGateProps {
  onStreamReady: (stream: MediaStream) => void;
}

export function CameraGate({ onStreamReady }: CameraGateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "requesting" | "denied">("idle");
  const [error, setError] = useState<string | null>(null);

  const requestAccess = useCallback(async () => {
    setStatus("requesting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      onStreamReady(stream);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access in your browser settings."
          : "Unable to access camera. Please check your device settings.";
      setError(message);
      setStatus("denied");
    }
  }, [onStreamReady]);

  if (status === "denied") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-10 shadow-sm text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-50">
            <CameraOff className="size-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Camera access denied</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{error}</p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to home
            </button>
            <button
              onClick={requestAccess}
              className="flex-1 rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-10 shadow-sm text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-indigo-50">
          <Camera className="size-8 text-indigo-700" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Camera & microphone required</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          This exam is proctored and fully recorded. Please enable your webcam to continue.
        </p>
        <button
          onClick={requestAccess}
          disabled={status === "requesting"}
          className="mt-8 w-full rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
        >
          {status === "requesting" ? "Requesting access…" : "Enable camera & mic"}
        </button>
      </div>
    </div>
  );
}

// ─── Camera Preview (PiP) ─────────────────────────────────────────────────────
interface CameraPreviewProps {
  stream: MediaStream;
}

export function CameraPreview({ stream }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  return (
    <div className="fixed bottom-4 right-4 z-50 overflow-hidden rounded-xl border-2 border-blue-600 shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="size-28 object-cover sm:size-36"
        aria-label="Proctoring camera feed"
      />
    </div>
  );
}

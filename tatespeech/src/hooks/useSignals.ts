import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { EyeModelState } from "../types";
import { averageIris, isLookingAtCamera, lookAwayScore, poseFromMatrix } from "../lib/gaze";
import { detectPitch, rmsOf } from "../lib/pitch";

export interface AudioFrame {
  rms: number;
  pitch: number | null;
  clipped: boolean;
  now: number;
}

function deviceError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "Permission denied.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No device found.";
  if (name === "NotReadableError" || name === "TrackStartError") return "Device is in use.";
  if (name === "SecurityError") return "Blocked. Use localhost or HTTPS.";
  if (!navigator.mediaDevices?.getUserMedia) return "This browser cannot open the camera here.";
  if (error instanceof Error && error.message) return error.message;
  return "Unavailable.";
}

export function useMedia() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [videoOn, setVideoOn] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const attach = useCallback((next: MediaStream | null) => {
    const node = videoRef.current;
    if (!node) return;
    node.srcObject = next;
    if (next) void node.play().catch(() => undefined);
  }, []);

  const setVideoNode = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      void node.play().catch(() => undefined);
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setVideoOn(false);
    setAudioOn(false);
    attach(null);
    const context = contextRef.current;
    contextRef.current = null;
    setAudioContext(null);
    if (context && context.state !== "closed") void context.close().catch(() => undefined);
  }, [attach]);

  const open = useCallback(async () => {
    setVideoError(null);
    setAudioError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      const message = "This browser cannot open the camera or mic here.";
      setVideoError(message);
      setAudioError(message);
      setOpened(true);
      return;
    }
    stop();
    let videoTrack: MediaStreamTrack | null = null;
    let audioTrack: MediaStreamTrack | null = null;
    try {
      const combined = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
      videoTrack = combined.getVideoTracks()[0] ?? null;
      audioTrack = combined.getAudioTracks()[0] ?? null;
    } catch (error) {
      const reason = deviceError(error);
      try {
        const video = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        videoTrack = video.getVideoTracks()[0] ?? null;
      } catch (videoFailure) {
        setVideoError(deviceError(videoFailure) || reason);
      }
      try {
        const audio = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
        });
        audioTrack = audio.getAudioTracks()[0] ?? null;
      } catch (audioFailure) {
        setAudioError(deviceError(audioFailure) || reason);
      }
      if (!videoTrack) setVideoError((current) => current ?? reason);
      if (!audioTrack) setAudioError((current) => current ?? reason);
    }

    const tracks = [videoTrack, audioTrack].filter((track): track is MediaStreamTrack => track != null);
    if (tracks.length > 0) {
      const next = new MediaStream(tracks);
      streamRef.current = next;
      setStream(next);
      setVideoOn(videoTrack != null);
      setAudioOn(audioTrack != null);
      attach(next);
      if (audioTrack) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const context = new Ctx();
        await context.resume();
        contextRef.current = context;
        setAudioContext(context);
      }
    }
    setOpened(true);
  }, [attach, stop]);

  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => () => stopRef.current(), []);

  return {
    videoRef,
    setVideoNode,
    stream,
    audioContext,
    videoOn,
    audioOn,
    videoError,
    audioError,
    opened,
    open,
    stop,
  };
}

export function useAudio(
  stream: MediaStream | null,
  context: AudioContext | null,
  active: boolean,
  onFrame: (frame: AudioFrame) => void,
) {
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!active || !stream || !context) return undefined;
    const tracks = stream.getAudioTracks();
    if (tracks.length === 0) return undefined;
    let raf = 0;
    let dead = false;
    const source = context.createMediaStreamSource(new MediaStream(tracks));
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);
    const buffer = new Float32Array(analyser.fftSize);
    let lastPitchAt = 0;
    const loop = () => {
      if (dead) return;
      analyser.getFloatTimeDomainData(buffer);
      const now = performance.now();
      const { rms, clipped } = rmsOf(buffer);
      let pitch: number | null = null;
      if (now - lastPitchAt > 120) {
        pitch = detectPitch(buffer, context.sampleRate);
        lastPitchAt = now;
      }
      onFrameRef.current({ rms, pitch, clipped, now });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      source.disconnect();
      analyser.disconnect();
    };
  }, [active, stream, context]);
}

export function speechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeech(active: boolean, onFinal: (text: string) => void) {
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const [interim, setInterim] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "unsupported" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const supported = speechCtor() != null;

  useEffect(() => {
    if (!active) {
      setInterim("");
      setStatus(speechCtor() ? "idle" : "unsupported");
      return undefined;
    }
    const Ctor = speechCtor();
    if (!Ctor) {
      setStatus("unsupported");
      setError("This browser has no speech recognition. Tap a filler when you hear one. No transcript will be written for you.");
      return undefined;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let want = true;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalText += ` ${text}`;
        else interimText += ` ${text}`;
      }
      if (finalText.trim()) onFinalRef.current(finalText.trim());
      setInterim(interimText.trim());
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      want = false;
      const message = event.error === "not-allowed"
        ? "Speech recognition was blocked."
        : event.error === "network"
          ? "Speech recognition in this browser needs a network connection. It stopped. Use the filler button."
          : `Speech recognition stopped (${event.error}). Use the filler button.`;
      setError(message);
      setStatus("error");
    };
    recognition.onend = () => {
      if (!want) return;
      try {
        recognition.start();
      } catch {
        want = false;
      }
    };
    try {
      recognition.start();
      setStatus("listening");
      setError(null);
    } catch {
      setStatus("error");
      setError("Speech recognition did not start.");
    }
    return () => {
      want = false;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* already stopped */
      }
    };
  }, [active]);

  return { supported, status, error, interim };
}

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export function useEyes(
  videoRef: RefObject<HTMLVideoElement | null>,
  active: boolean,
  onEye: (model: EyeModelState, face: boolean, looking: boolean | null) => void,
) {
  const onEyeRef = useRef(onEye);
  onEyeRef.current = onEye;
  const [model, setModel] = useState<EyeModelState>("idle");
  const [fallbackFace, setFallbackFace] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      setModel("idle");
      setFallbackFace(null);
      return undefined;
    }

    let dead = false;
    let timer = 0;
    let lastTs = 0;
    let landmarker: { detectForVideo: (video: HTMLVideoElement, timestamp: number) => {
      faceLandmarks: { x: number; y: number }[][];
      faceBlendshapes: { categories: { categoryName: string; score: number }[] }[];
      facialTransformationMatrixes: { data: number[] }[];
      close?: () => void;
    }; close: () => void } | null = null;

    setModel("loading");
    setError(null);
    setFallbackFace(null);

    const startFallback = () => {
      const FaceDetectorCtor = (window as unknown as {
        FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
          detect: (input: HTMLVideoElement) => Promise<unknown[]>;
        };
      }).FaceDetector;
      if (!FaceDetectorCtor) return;
      const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
      const poll = () => {
        if (dead) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          detector.detect(video).then((faces) => {
            if (!dead) setFallbackFace(faces.length > 0);
          }).catch(() => {
            if (!dead) setFallbackFace(null);
          });
        }
        timer = window.setTimeout(poll, 400);
      };
      poll();
    };

    const fail = (message: string) => {
      if (dead) return;
      setModel("unavailable");
      setError(message);
      onEyeRef.current("unavailable", false, null);
      startFallback();
    };

    const tick = () => {
      if (dead || !landmarker) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth >= 2) {
        let ts = performance.now();
        if (ts <= lastTs) ts = lastTs + 1;
        lastTs = ts;
        try {
          const result = landmarker.detectForVideo(video, ts);
          const landmarks = result.faceLandmarks?.[0];
          if (!landmarks || landmarks.length === 0) {
            onEyeRef.current("ready", false, false);
          } else {
            const matrix = result.facialTransformationMatrixes?.[0]?.data;
            const pose = matrix ? poseFromMatrix(matrix) : null;
            const iris = averageIris(landmarks);
            const away = lookAwayScore(result.faceBlendshapes?.[0]?.categories);
            const looking = isLookingAtCamera({
              yaw: pose?.yaw ?? null,
              pitch: pose?.pitch ?? null,
              irisH: iris?.h ?? null,
              irisV: iris?.v ?? null,
              lookAway: away,
            });
            onEyeRef.current("ready", true, looking);
          }
        } catch {
          /* skip a bad frame */
        }
      }
      timer = window.setTimeout(tick, 100);
    };

    const timeout = window.setTimeout(() => {
      if (!dead && !landmarker) fail("The eye-contact model did not load in time. No percentage will be shown.");
    }, 15000);

    void (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const files = await vision.FilesetResolver.forVisionTasks(WASM);
        const shared = {
          runningMode: "VIDEO" as const,
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        };
        try {
          landmarker = await vision.FaceLandmarker.createFromOptions(files, {
            ...shared,
            baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
          });
        } catch {
          landmarker = await vision.FaceLandmarker.createFromOptions(files, {
            ...shared,
            baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
          });
        }
        if (dead) {
          landmarker.close();
          return;
        }
        window.clearTimeout(timeout);
        setModel("ready");
        onEyeRef.current("ready", false, null);
        tick();
      } catch (err) {
        window.clearTimeout(timeout);
        const detail = err instanceof Error ? err.message : "The model file did not load.";
        fail(`Eye-contact model unavailable. ${detail}`);
      }
    })();

    return () => {
      dead = true;
      window.clearTimeout(timer);
      window.clearTimeout(timeout);
      landmarker?.close();
    };
  }, [active, videoRef]);

  return { model, fallbackFace, error };
}

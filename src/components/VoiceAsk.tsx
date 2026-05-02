"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Loader2, Volume2, AlertCircle } from "lucide-react";
import type { WeatherPayload } from "@/lib/types";

type Phase = "idle" | "listening" | "thinking" | "speaking" | "error";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = {
  weather: WeatherPayload | null;
};

export default function VoiceAsk({ weather }: Props) {
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<string>("");
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    const ok =
      !!getRecognitionCtor() &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window;
    setSupported(ok);
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      recogRef.current?.abort();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const askClaude = useCallback(
    async (q: string) => {
      if (!weather) {
        setError("Weather not loaded yet.");
        setPhase("error");
        return;
      }
      setPhase("thinking");
      setAnswer(null);
      try {
        const r = await fetch("/api/voice-ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, weather }),
        });
        const d = await r.json();
        if (!r.ok || !d.answer) {
          throw new Error(d.error ?? "request_failed");
        }
        setAnswer(d.answer as string);
        // speak it
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(d.answer as string);
        u.rate = 1.0;
        u.pitch = 1.05;
        u.onend = () => setPhase("idle");
        u.onerror = () => setPhase("idle");
        utterRef.current = u;
        setPhase("speaking");
        synth.speak(u);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setPhase("error");
      }
    },
    [weather]
  );

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    if (!weather) {
      setError("Weather not loaded yet.");
      setPhase("error");
      setPanelOpen(true);
      return;
    }
    // stop any current speech
    window.speechSynthesis?.cancel();

    const recog = new Ctor();
    recog.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";
    recog.interimResults = true;
    recog.continuous = false;

    finalRef.current = "";
    sentRef.current = false;
    setTranscript("");
    setAnswer(null);
    setError(null);
    setPanelOpen(true);
    setPhase("listening");

    recog.onresult = (e) => {
      let interim = "";
      let final = finalRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0].transcript;
        if (res.isFinal) final += text;
        else interim += text;
      }
      finalRef.current = final;
      setTranscript((final + interim).trim());
    };

    recog.onerror = (ev) => {
      if (ev.error === "no-speech" || ev.error === "aborted") {
        setPhase("idle");
        return;
      }
      setError(`Speech error: ${ev.error}`);
      setPhase("error");
    };

    recog.onend = () => {
      const q = finalRef.current.trim();
      if (sentRef.current) return;
      sentRef.current = true;
      if (!q) {
        setPhase("idle");
        return;
      }
      askClaude(q);
    };

    recogRef.current = recog;
    try {
      recog.start();
    } catch {
      // already started — ignore
    }
  }, [askClaude, weather]);

  const stopListening = useCallback(() => {
    const recog = recogRef.current;
    if (!recog) return;
    try {
      recog.stop();
    } catch {
      // ignore
    }
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      if (phase === "speaking") {
        window.speechSynthesis?.cancel();
        setPhase("idle");
      }
      if (phase === "thinking") return;
      startListening();
    },
    [phase, startListening]
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      if (phase === "listening") stopListening();
    },
    [phase, stopListening]
  );

  if (!supported) return null;

  const label =
    phase === "listening"
      ? "listening…"
      : phase === "thinking"
      ? "thinking…"
      : phase === "speaking"
      ? "speaking"
      : "hold to ask";

  return (
    <>
      <button
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={(e) => {
          if (phase === "listening") {
            (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
            stopListening();
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        disabled={!weather || phase === "thinking"}
        aria-label="Hold to ask a weather question"
        title="hold to ask"
        className={`glass px-3 py-2 text-sm flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition disabled:opacity-40 disabled:cursor-not-allowed select-none touch-none ${
          phase === "listening"
            ? "ring-accent voice-pulse"
            : phase === "speaking"
            ? "ring-accent"
            : ""
        }`}
      >
        {phase === "thinking" ? (
          <Loader2 size={14} className="animate-spin accent" />
        ) : phase === "speaking" ? (
          <Volume2 size={14} className="accent" />
        ) : (
          <Mic
            size={14}
            className={phase === "listening" ? "accent" : "text-white"}
          />
        )}
        <span className="hidden sm:inline">{label}</span>
      </button>

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,520px)] glass-strong p-4"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 accent">
                {phase === "listening" ? (
                  <Mic size={16} className="animate-pulse" />
                ) : phase === "thinking" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : phase === "speaking" ? (
                  <Volume2 size={16} />
                ) : phase === "error" ? (
                  <AlertCircle size={16} />
                ) : (
                  <Mic size={16} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {transcript && (
                  <div className="text-main text-sm leading-snug break-words">
                    “{transcript}”
                  </div>
                )}
                {answer && (
                  <div className="text-sub text-sm leading-snug mt-1 break-words">
                    {answer}
                  </div>
                )}
                {error && (
                  <div className="text-red-300 text-xs mt-1">{error}</div>
                )}
                {!transcript && !answer && !error && (
                  <div className="text-sub text-xs">
                    hold the mic and ask a weather question
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  recogRef.current?.abort();
                  setPanelOpen(false);
                  setTranscript("");
                  setAnswer(null);
                  setError(null);
                  setPhase("idle");
                }}
                className="text-sub hover:text-main text-xs px-2 py-1"
                aria-label="Close"
              >
                close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

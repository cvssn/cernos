"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Clock, Volume2, Square } from "lucide-react";

type Props = {
  narrative: string | null;
  loading: boolean;
  source: "claude" | "heuristic" | null;
  scrubbing: boolean;
};

export default function AIInsights({
  narrative,
  loading,
  source,
  scrubbing,
}: Props) {
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" && "speechSynthesis" in window
    );
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [narrative]);

  const handleSpeak = useCallback(() => {
    if (!narrative) return;
    const synth =
      typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(narrative);
    u.rate = 1.0;
    u.pitch = 1.05;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utterRef.current = u;
    synth.speak(u);
    setSpeaking(true);
  }, [narrative, speaking]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="glass-strong p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="accent shrink-0">
            {scrubbing ? <Clock size={16} /> : <Sparkles size={16} />}
          </span>
          <h2 className="text-main font-semibold truncate">
            {scrubbing ? "forecast brief" : "today's brief"}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sub text-xs uppercase tracking-wider">
            {scrubbing ? "live" : source === "claude" ? "claude" : "smart"}
          </span>
          {speechSupported && narrative && (
            <button
              onClick={handleSpeak}
              aria-label={speaking ? "Stop speaking" : "Speak narrative"}
              aria-pressed={speaking}
              className={`glass px-2.5 py-1.5 text-xs flex items-center gap-1.5 transition active:scale-[0.96] hover:scale-[1.04] ${
                speaking ? "ring-accent" : ""
              }`}
            >
              {speaking ? (
                <Square size={12} className="accent" />
              ) : (
                <Volume2 size={12} className="accent" />
              )}
              <span>{speaking ? "stop" : "speak"}</span>
            </button>
          )}
        </div>
      </div>
      {loading || !narrative ? (
        <div className="space-y-3">
          <div className="h-4 rounded-md shimmer w-[92%]" />
          <div className="h-4 rounded-md shimmer w-[78%]" />
          <div className="h-4 rounded-md shimmer w-[55%]" />
          {loading && (
            <div className="text-sub text-xs flex items-center gap-2 mt-2">
              <Loader2 size={12} className="animate-spin" /> composing…
            </div>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.p
            key={narrative}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-main text-[15px] md:text-base leading-relaxed"
          >
            {narrative}
          </motion.p>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

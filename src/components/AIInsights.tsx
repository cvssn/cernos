"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Clock } from "lucide-react";

type Props = {
  insights: string[] | null;
  loading: boolean;
  source: "claude" | "heuristic" | null;
  scrubbing: boolean;
};

export default function AIInsights({ insights, loading, source, scrubbing }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="glass-strong p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="accent">
            {scrubbing ? <Clock size={16} /> : <Sparkles size={16} />}
          </span>
          <h2 className="text-main font-semibold">
            {scrubbing ? "Forecast brief" : "Today's brief"}
          </h2>
        </div>
        <span className="text-sub text-xs uppercase tracking-wider">
          {scrubbing ? "Live" : source === "claude" ? "Claude" : "Smart"}
        </span>
      </div>
      {loading || !insights ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1.5 size-1.5 rounded-full bg-accent shrink-0" />
              <div className="flex-1 h-4 rounded-md shimmer" />
            </div>
          ))}
          {loading && (
            <div className="text-sub text-xs flex items-center gap-2 mt-2">
              <Loader2 size={12} className="animate-spin" /> Thinking…
            </div>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.ul
            key={insights.join("|")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-2.5"
          >
            {insights.map((line, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="flex items-start gap-3 text-main text-sm md:text-[15px] leading-snug"
              >
                <span className="mt-1.5 size-1.5 rounded-full bg-accent shrink-0" />
                <span>{line}</span>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

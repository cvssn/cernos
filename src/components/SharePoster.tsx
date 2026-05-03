"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Link2, Loader2 } from "lucide-react";
import type { Place } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  place: Place;
};

export default function SharePoster({ open, onClose, place }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"share" | "download" | null>(null);

  const posterUrl =
    `/api/poster?lat=${place.latitude}&lon=${place.longitude}` +
    `&name=${encodeURIComponent(place.name)}` +
    `&country=${encodeURIComponent(place.country)}`;

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
    }
  }, [open, place.id]);

  const fileName = `cernos-${place.name.toLowerCase().replace(/\s+/g, "-")}.png`;

  async function fetchBlob(): Promise<Blob> {
    const r = await fetch(posterUrl, { cache: "no-store" });
    if (!r.ok) throw new Error("poster_failed");
    return r.blob();
  }

  async function handleDownload() {
    setBusy("download");
    try {
      const blob = await fetchBlob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      setError("download failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    try {
      const blob = await fetchBlob();
      const file = new File([blob], fileName, { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({
          files: [file],
          title: `${place.name} sky · cernos`,
          text: `today's sky over ${place.name.toLowerCase()} — cernos.app`,
        });
      } else {
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
      }
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name !== "AbortError") setError("share failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleCopyLink() {
    try {
      const full = `${window.location.origin}${posterUrl}`;
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("clipboard blocked");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
            className="glass max-w-md w-full max-h-[92vh] overflow-y-auto rounded-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-base font-medium lowercase">
                  share today&apos;s sky
                </h2>
                <p className="text-xs text-white/60 lowercase">
                  poster of {place.name.toLowerCase()} right now
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="close"
                className="opacity-70 hover:opacity-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black/40 ring-1 ring-white/10 aspect-[4/5] flex items-center justify-center">
              {loading && !error && (
                <Loader2
                  size={28}
                  className="animate-spin text-white/60 absolute"
                />
              )}
              {error && (
                <div className="text-white/70 text-sm lowercase px-4 text-center">
                  {error}
                </div>
              )}
              {!error && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterUrl}
                  alt={`today's sky poster for ${place.name}`}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${
                    loading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError("poster failed to render");
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleShare}
                disabled={loading || !!error || busy !== null}
                className="glass py-3 flex flex-col items-center gap-1 text-xs lowercase hover:scale-[1.03] active:scale-[0.97] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy === "share" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Share2 size={16} />
                )}
                share
              </button>
              <button
                onClick={handleDownload}
                disabled={loading || !!error || busy !== null}
                className="glass py-3 flex flex-col items-center gap-1 text-xs lowercase hover:scale-[1.03] active:scale-[0.97] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy === "download" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                download
              </button>
              <button
                onClick={handleCopyLink}
                disabled={loading || !!error}
                className="glass py-3 flex flex-col items-center gap-1 text-xs lowercase hover:scale-[1.03] active:scale-[0.97] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Link2 size={16} />
                {copied ? "copied" : "copy link"}
              </button>
            </div>

            <p className="text-[11px] text-white/50 lowercase text-center">
              every shared poster carries cernos.app — that&apos;s the loop.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

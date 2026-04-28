"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, X, History } from "lucide-react";
import type { FavoriteRow, HistoryRow, Place } from "@/lib/types";

type Props = {
  favorites: FavoriteRow[];
  history: HistoryRow[];
  onSelect: (place: Place) => void;
  onRemove: (id: number) => void;
};

export default function Favorites({ favorites, history, onSelect, onRemove }: Props) {
  if (!favorites.length && !history.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="space-y-4"
    >
      {favorites.length > 0 && (
        <Section icon={<Star size={14} />} label="Favorites">
          <AnimatePresence>
            {favorites.map((f) => (
              <motion.button
                key={f.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() =>
                  onSelect({
                    id: f.id,
                    name: f.name,
                    country: f.country,
                    admin1: f.admin1 ?? undefined,
                    latitude: f.latitude,
                    longitude: f.longitude,
                  })
                }
                className="glass group flex items-center gap-2 px-3 py-2 hover:scale-[1.03] transition"
              >
                <span className="text-main text-sm font-medium">{f.name}</span>
                <span className="text-sub text-xs">{f.country}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(f.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove(f.id);
                    }
                  }}
                  className="ml-1 text-sub hover:text-main transition opacity-60 group-hover:opacity-100"
                  aria-label={`Remove ${f.name}`}
                >
                  <X size={12} />
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </Section>
      )}
      {history.length > 0 && (
        <Section icon={<History size={14} />} label="Recent">
          {history.slice(0, 6).map((h) => (
            <button
              key={`${h.id}-${h.latitude}`}
              onClick={() =>
                onSelect({
                  id: h.id,
                  name: h.name,
                  country: h.country,
                  admin1: h.admin1 ?? undefined,
                  latitude: h.latitude,
                  longitude: h.longitude,
                })
              }
              className="glass flex items-center gap-2 px-3 py-2 hover:scale-[1.03] transition"
            >
              <span className="text-main text-sm">{h.name}</span>
              <span className="text-sub text-xs">{h.country}</span>
            </button>
          ))}
        </Section>
      )}
    </motion.div>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sub text-xs uppercase tracking-wider mb-2">
        <span className="accent">{icon}</span>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

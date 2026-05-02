"use client";

import { useCallback, useEffect, useState } from "react";
import { CloudRain, BellOff, Loader2, AlertCircle } from "lucide-react";
import type { Place } from "@/lib/types";

type Props = {
  place: Place;
};

type Status = "idle" | "subscribing" | "subscribed" | "unsupported" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function RainAlarm({ place }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);

  // detect existing subscription on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setEndpoint(sub.endpoint);
        setStatus("subscribed");
      }
    });
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus("subscribing");
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("idle");
        setError("Notifications permission was not granted.");
        return;
      }

      const keyRes = await fetch("/api/rain-alarm/vapid-key");
      if (!keyRes.ok) {
        const d = await keyRes.json().catch(() => ({}));
        throw new Error(d.error ?? "vapid_unavailable");
      }
      const { publicKey } = (await keyRes.json()) as { publicKey: string };

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });

      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const r = await fetch("/api/rain-alarm/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: { endpoint: json.endpoint, keys: json.keys },
          place: {
            name: place.name,
            country: place.country,
            admin1: place.admin1 ?? null,
            latitude: place.latitude,
            longitude: place.longitude,
            timezone: place.timezone,
          },
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error ?? "subscribe_failed");
      }

      setEndpoint(json.endpoint);
      setStatus("subscribed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't enable rain alarm");
      setStatus("error");
    }
  }, [place]);

  const unsubscribe = useCallback(async () => {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe().catch(() => undefined);
        await fetch(
          `/api/rain-alarm/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`,
          { method: "DELETE" }
        ).catch(() => undefined);
      }
      setEndpoint(null);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't disable rain alarm");
      setStatus("error");
    }
  }, []);

  // when the pinned place changes, update the server-side place for this endpoint
  useEffect(() => {
    if (status !== "subscribed") return;
    let cancelled = false;
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (!sub || cancelled) return;
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await fetch("/api/rain-alarm/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: { endpoint: json.endpoint, keys: json.keys },
          place: {
            name: place.name,
            country: place.country,
            admin1: place.admin1 ?? null,
            latitude: place.latitude,
            longitude: place.longitude,
            timezone: place.timezone,
          },
        }),
      }).catch(() => undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [place, status]);

  if (status === "unsupported") return null;

  const subscribed = status === "subscribed";

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={status === "subscribing"}
      className={`glass px-3 py-2 text-sm flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition disabled:opacity-40 disabled:cursor-not-allowed ${
        subscribed ? "ring-accent" : ""
      }`}
      aria-pressed={subscribed}
      aria-label={subscribed ? "Disable rain alarm" : "Enable rain alarm"}
      title={
        subscribed
          ? `Rain alarm on for ${place.name}. Tap to disable.`
          : `Get a push 20 min before rain at ${place.name}.`
      }
    >
      {status === "subscribing" ? (
        <Loader2 size={14} className="animate-spin accent" />
      ) : status === "error" ? (
        <AlertCircle size={14} className="accent" />
      ) : subscribed ? (
        <CloudRain size={14} className="accent" />
      ) : (
        <BellOff size={14} className="text-white" />
      )}
      <span className="hidden sm:inline">
        {status === "subscribing"
          ? "enabling…"
          : subscribed
          ? "rain alarm on"
          : "rain alarm"}
      </span>
      {error && (
        <span className="sr-only">{error}</span>
      )}
    </button>
  );
}

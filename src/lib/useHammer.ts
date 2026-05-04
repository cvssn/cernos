"use client";

import { useEffect, useRef } from "react";

export type GestureHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
  onRotate?: (rotation: number) => void;
  onRotateEnd?: (rotation: number) => void;
};

export function useHammer<T extends HTMLElement>(handlers: GestureHandlers) {
  const ref = useRef<T | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    let mgr: HammerManager | null = null;
    let cancelled = false;

    (async () => {
      const Hammer = (await import("hammerjs")).default;
      if (cancelled || !ref.current) return;

      mgr = new Hammer.Manager(el, { touchAction: "pan-y" });

      const swipe = new Hammer.Swipe({
        direction: Hammer.DIRECTION_ALL,
        threshold: 30,
        velocity: 0.3,
      });
      const pinch = new Hammer.Pinch();
      const rotate = new Hammer.Rotate();
      pinch.recognizeWith(rotate);

      mgr.add([swipe, pinch, rotate]);

      mgr.on("swipeleft", () => handlersRef.current.onSwipeLeft?.());
      mgr.on("swiperight", () => handlersRef.current.onSwipeRight?.());
      mgr.on("swipeup", () => handlersRef.current.onSwipeUp?.());
      mgr.on("swipedown", () => handlersRef.current.onSwipeDown?.());
      mgr.on("pinch", (ev) => handlersRef.current.onPinch?.(ev.scale));
      mgr.on("pinchend pinchcancel", (ev) =>
        handlersRef.current.onPinchEnd?.(ev.scale)
      );
      mgr.on("rotate", (ev) => handlersRef.current.onRotate?.(ev.rotation));
      mgr.on("rotateend rotatecancel", (ev) =>
        handlersRef.current.onRotateEnd?.(ev.rotation)
      );
    })();

    return () => {
      cancelled = true;
      try {
        mgr?.destroy();
      } catch {
        // ignore
      }
    };
  }, []);

  return ref;
}

"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type RevealOptions = {
  y?: number;
  x?: number;
  scale?: number;
  opacity?: number;
  duration?: number;
  delay?: number;
  start?: string;
  ease?: string;
  once?: boolean;
};

export function useGsapReveal<T extends HTMLElement>(
  options: RevealOptions = {}
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      gsap.set(el, { opacity: 1, y: 0, x: 0, scale: 1 });
      return;
    }

    const {
      y = 24,
      x = 0,
      scale = 0.98,
      opacity = 0,
      duration = 0.7,
      delay = 0,
      start = "top 85%",
      ease = "power3.out",
      once = true,
    } = options;

    gsap.set(el, { opacity, y, x, scale });

    const tween = gsap.to(el, {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration,
      delay,
      ease,
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: once ? "play none none none" : "play none none reverse",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

export function useGsapNumber<T extends HTMLElement>(
  value: number,
  format: (n: number) => string = (n) => Math.round(n).toString()
) {
  const ref = useRef<T | null>(null);
  const proxy = useRef({ v: value });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      proxy.current.v = value;
      el.textContent = format(value);
      return;
    }

    const tween = gsap.to(proxy.current, {
      v: value,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = format(proxy.current.v);
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, format]);

  return ref;
}

export function useGsapEntrance<T extends HTMLElement>(
  options: { stagger?: number; childSelector?: string; delay?: number } = {}
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    const { stagger = 0.06, childSelector = ":scope > *", delay = 0 } = options;
    const targets = el.querySelectorAll(childSelector);
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger,
          delay,
        }
      );
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

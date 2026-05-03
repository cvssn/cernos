import { useEffect } from "react";
import type { ThemeName } from "./types";
import { faviconDataUrl } from "./favicon";

export function useDynamicFavicon(theme: ThemeName | null) {
  useEffect(() => {
    if (typeof document === "undefined" || !theme) return;
    const url = faviconDataUrl(theme);
    document
      .querySelectorAll<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']")
      .forEach((el) => el.parentNode?.removeChild(el));
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = url;
    document.head.appendChild(link);
  }, [theme]);
}

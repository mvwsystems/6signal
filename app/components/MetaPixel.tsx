"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _fbq: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plausible: ((...args: any[]) => void) & { q?: any[]; init?: (o?: any) => void; o?: any };
  }
}

// Meta Pixel, off the critical path. fbevents.js is ~107 KB compressed — the
// single heaviest thing the site loads, more than all of our own JavaScript.
//
// The trick is that the pixel's bootstrap is already a queue: `fbq()` is
// defined immediately as a stub that records calls, and the real library
// flushes that queue when it arrives. So we run the stub, `init`, and the
// `PageView` right away (nothing is lost — they are queued), and only defer
// the *network load* of fbevents.js until the visitor first interacts, or
// until the browser is idle, whichever comes first. Attribution is identical;
// the 107 KB just stops competing with the page for first paint.

const IDLE_FALLBACK_MS = 3500;
const INTERACTION_EVENTS: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart", "scroll"];

export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  useEffect(() => {
    if (!pixelId || typeof window === "undefined") return;
    if (typeof window.fbq === "function") return; // already bootstrapped (client-side navigation)

    // 1. Stub + queue, exactly as Meta's snippet defines it, minus the load.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n: any = (window.fbq = function () {
      // eslint-disable-next-line prefer-rest-params
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");

    // 2. Load the library once, on first interaction or when idle.
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      INTERACTION_EVENTS.forEach((ev) => window.removeEventListener(ev, load));
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    };
    INTERACTION_EVENTS.forEach((ev) => window.addEventListener(ev, load, { passive: true, once: true }));
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle: number = hasIdle
      ? window.requestIdleCallback(load, { timeout: IDLE_FALLBACK_MS })
      : window.setTimeout(load, IDLE_FALLBACK_MS);

    return () => {
      INTERACTION_EVENTS.forEach((ev) => window.removeEventListener(ev, load));
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [pixelId]);

  if (!pixelId) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}

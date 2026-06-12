export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  if (params) {
    window.fbq("track", name, params);
  } else {
    window.fbq("track", name);
  }
}

export const clampScore = (n: number): number => Math.min(100, Math.max(0, Math.round(n)));

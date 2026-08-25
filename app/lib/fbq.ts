// Conversion events, fanned out to both analytics destinations from one call
// site: the Meta pixel (ad optimization) and Plausible (goals, so the traffic
// report can say which channel actually produced the money). Either one being
// absent is fine — the other still records.
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    if (params) {
      window.fbq("track", name, params);
    } else {
      window.fbq("track", name);
    }
  }

  if (typeof window.plausible === "function") {
    // Meta wants { value, currency }; Plausible wants a revenue object, and
    // attaches it to the goal so revenue can be read per traffic source.
    const value = typeof params?.value === "number" ? params.value : null;
    const currency = typeof params?.currency === "string" ? params.currency : "USD";
    const options: Record<string, unknown> = {};
    if (params) options.props = params;
    if (value !== null) options.revenue = { currency, amount: value };
    window.plausible(name, Object.keys(options).length ? options : undefined);
  }
}

export const clampScore = (n: number): number => Math.min(100, Math.max(0, Math.round(n)));

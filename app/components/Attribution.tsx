"use client";
import { useEffect } from "react";
import { captureAttribution } from "../lib/attribution";

// Records the first touch on every entry to the site; no-ops after that.
export default function Attribution() {
  useEffect(() => { captureAttribution(); }, []);
  return null;
}

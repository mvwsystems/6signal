"use client";
import Script from "next/script";

// Plausible — the traffic analytics of record: how many visits, and where they
// came from (referrer, UTM, and the AI engines specifically). Cookie-free, so
// no consent banner, and ~6KB.
//
// This is Plausible's per-site script: outbound-link clicks, file downloads
// (the white paper PDFs), custom properties, and revenue are all baked in and
// switched on per site in Plausible's own settings — not encoded in the script
// filename the way the older tracker did it.
//
// NEXT_PUBLIC_PLAUSIBLE_SRC is the script URL Plausible issues for the site.
// Unset = the script never loads.
export default function Plausible() {
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;
  if (!src) return null;

  return (
    <>
      <Script id="plausible" strategy="afterInteractive" async src={src} />
      {/* Queue stub, so a conversion fired before the script loads still lands. */}
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
      </Script>
    </>
  );
}

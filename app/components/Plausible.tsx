"use client";
import Script from "next/script";

// Plausible — the traffic analytics of record: how many visits, and where they
// came from (referrer, UTM, and the AI engines specifically). Cookie-free, so
// no consent banner, and ~1KB.
//
// The script variant carries three extensions that matter here:
//   file-downloads  — every white paper PDF download, counted automatically
//   outbound-links  — Stripe checkout and Calendly clicks, counted automatically
//   tagged-events   — lets a CTA opt in to its own goal via a class
//
// Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to the site's Plausible domain; unset = off.
const SRC = "https://plausible.io/js/script.tagged-events.file-downloads.outbound-links.js";

export default function Plausible() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <>
      <Script id="plausible" strategy="afterInteractive" defer data-domain={domain} src={SRC} />
      {/* Queue stub so a conversion fired before the script loads still lands. */}
      <Script id="plausible-queue" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
      </Script>
    </>
  );
}

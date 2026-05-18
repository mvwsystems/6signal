"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuditPopupButton from "./AuditPopupButton";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        <Link href="/" className="logo" aria-label="6 Signal">
          <svg
            viewBox="0 0 220 32"
            style={{ height: "28px", width: "auto", display: "block" }}
            aria-hidden="true"
          >
            {/* Chevron 1 — yellow */}
            <rect x="0" y="13.5" width="20" height="5" fill="#E6FF00" transform="rotate(-40, 20, 16)" />
            <rect x="0" y="13.5" width="20" height="5" fill="#E6FF00" transform="rotate(40, 20, 16)" />
            {/* Chevron 2 — mid gray */}
            <rect x="8" y="13.5" width="20" height="5" fill="#888888" transform="rotate(-40, 28, 16)" />
            <rect x="8" y="13.5" width="20" height="5" fill="#888888" transform="rotate(40, 28, 16)" />
            {/* Chevron 3 — dark */}
            <rect x="16" y="13.5" width="20" height="5" fill="#484848" transform="rotate(-40, 36, 16)" />
            <rect x="16" y="13.5" width="20" height="5" fill="#484848" transform="rotate(40, 36, 16)" />
            {/* Wordmark */}
            <text
              x="48"
              y="16"
              fontFamily='"Chakra Petch", monospace'
              fontWeight="700"
              fontSize="19"
              dominantBaseline="middle"
              style={{ letterSpacing: "-0.01em" }}
            >
              <tspan fill="#888888">SIX</tspan>
              <tspan fill="#f5f5f3">SIGNAL</tspan>
            </text>
          </svg>
        </Link>
        <div className="nav-links">
          <Link href="/#framework">The Six</Link>
          <Link href="/#engagement">The Work</Link>
          <Link href="/#pricing">Retainer</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/research">Research</Link>
        </div>
        <AuditPopupButton className="nav-cta">
          Book the audit →
        </AuditPopupButton>
      </div>
    </nav>
  );
}

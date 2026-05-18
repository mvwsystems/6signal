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
          {/*
            Three chevrons: polyline strokes, back-to-front so yellow sits on top.
            Each ">" is: (tip_x−15, 3) → (tip_x, 16) → (tip_x−15, 29)
            Tips at x=16, 30, 44 — 14px spacing, 1px overlap keeps them distinct.
          */}
          <svg
            viewBox="0 0 220 32"
            style={{ height: "28px", width: "auto", display: "block" }}
            aria-hidden="true"
          >
            {/* Chevron 3 — dark (drawn first = behind) */}
            <polyline points="29,3 44,16 29,29" fill="none" stroke="#484848" strokeWidth="5" strokeLinejoin="miter" strokeLinecap="butt" />
            {/* Chevron 2 — mid gray */}
            <polyline points="15,3 30,16 15,29" fill="none" stroke="#888888" strokeWidth="5" strokeLinejoin="miter" strokeLinecap="butt" />
            {/* Chevron 1 — yellow (drawn last = on top) */}
            <polyline points="1,3 16,16 1,29" fill="none" stroke="#E6FF00" strokeWidth="5" strokeLinejoin="miter" strokeLinecap="butt" />
            {/* Wordmark */}
            <text
              x="52"
              y="16"
              fontFamily='"Chakra Petch", monospace'
              fontWeight="700"
              fontSize="18"
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

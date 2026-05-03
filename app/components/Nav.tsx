"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

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
          <img src="/6SIGNAL2.png" alt="6 Signal" className="logo-img" />
        </Link>
        <div className="nav-links">
          <Link href="/#framework">The Six</Link>
          <Link href="/#engagement">The Work</Link>
          <Link href="/#pricing">Retainer</Link>
          <Link href="/#faq">FAQ</Link>
        </div>
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="nav-cta">
          Book the audit →
        </a>
      </div>
    </nav>
  );
}

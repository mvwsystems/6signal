"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuditPopupButton from "./AuditPopupButton";

const NAV_LINKS = [
  { href: "/#framework", label: "The Six" },
  { href: "/capabilities", label: "The Climb" },
  { href: "/#pricing", label: "The Sprint" },
  { href: "/#faq", label: "FAQ" },
  { href: "/research", label: "Research" },
];

const OVERLAY_LINKS = [
  ...NAV_LINKS,
  { href: "/research/ai-visibility-tools", label: "AI Visibility Tools" },
  { href: "/capabilities", label: "The Climb" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  return (
    <>
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <Link href="/" className="logo" aria-label="6 Signal">
            <img src="/6SIGDashboardLogo.png" alt="6 Signal" className="logo-img" />
          </Link>
          <div className="nav-links">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </div>
          <AuditPopupButton className="nav-cta">
            Get the audit →
          </AuditPopupButton>
          <div className="nav-menu-wrap">
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <svg width="4" height="18" viewBox="0 0 4 18" fill="none">
                <circle cx="2" cy="2" r="2" fill="#E6FF00" />
                <circle cx="2" cy="9" r="2" fill="#E6FF00" />
                <circle cx="2" cy="16" r="2" fill="#E6FF00" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`nav-overlay${menuOpen ? " nav-overlay--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      >
        <div className="nav-overlay-inner" onClick={(e) => e.stopPropagation()}>
          <nav className="nav-overlay-links">
            {OVERLAY_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="nav-overlay-link"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-overlay-cta" onClick={() => setMenuOpen(false)}>
            <AuditPopupButton className="btn btn-primary">
              Get the audit →
            </AuditPopupButton>
          </div>
        </div>
      </div>
    </>
  );
}

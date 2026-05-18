"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuditPopupButton from "./AuditPopupButton";

const NAV_LINKS = [
  { href: "/#framework", label: "The Six" },
  { href: "/#engagement", label: "The Work" },
  { href: "/#pricing", label: "Retainer" },
  { href: "/#faq", label: "FAQ" },
  { href: "/research", label: "Research" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        <Link href="/" className="logo" aria-label="6 Signal">
          <img src="/6SIG_LOGO_FINAL_2.webp" alt="6 Signal" className="logo-img" />
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </div>
        <AuditPopupButton className="nav-cta">
          Book the audit →
        </AuditPopupButton>
        {/* Mobile hamburger + dropdown */}
        <div className="nav-menu-wrap" ref={menuRef}>
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="1" y1="1" x2="13" y2="13" stroke="#f5f5f3" strokeWidth="2" strokeLinecap="round" />
                <line x1="13" y1="1" x2="1" y2="13" stroke="#f5f5f3" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                <rect y="0" width="18" height="2" rx="1" fill="#f5f5f3" />
                <rect y="5" width="18" height="2" rx="1" fill="#f5f5f3" />
                <rect y="10" width="18" height="2" rx="1" fill="#f5f5f3" />
              </svg>
            )}
          </button>
          {menuOpen && (
            <div className="nav-dropdown">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="nav-dropdown-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

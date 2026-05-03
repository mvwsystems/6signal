"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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
          <Link href="/websites" className={pathname.startsWith("/websites") ? "active" : ""}>Websites</Link>
          <Link href="/care" className={pathname.startsWith("/care") ? "active" : ""}>Care</Link>
          <Link href="/visibility" className={pathname.startsWith("/visibility") ? "active" : ""}>Visibility</Link>
          <Link href="/follow-up" className={pathname.startsWith("/follow-up") ? "active" : ""}>Follow-Up</Link>
          <Link href="/work" className={pathname.startsWith("/work") ? "active" : ""}>Work</Link>
          <Link href="/contact" className={pathname.startsWith("/contact") ? "active" : ""}>Contact</Link>
        </div>
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="nav-cta">
          Get My Website Rebuilt
        </a>
      </div>
    </nav>
  );
}

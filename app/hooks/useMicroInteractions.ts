"use client";
import { useEffect } from "react";

export function useMicroInteractions() {
  // Reveals + FAQ toggle
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // In reduced-motion mode: show everything immediately, still wire FAQ
    if (reduced) {
      document.querySelectorAll<HTMLElement>(".reveal").forEach(el => el.classList.add("in"));
      return setupFaq();
    }

    // General IO for all non-hero reveal elements
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("in"), i * 55);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
      // Hero elements get their own timed sequence — skip them here
      if (!el.closest(".hero, .inner-hero")) io.observe(el);
    });

    // Hero sequence: deliberate stagger, faster than before
    document.querySelectorAll<HTMLElement>(".hero .reveal, .inner-hero .reveal")
      .forEach((el, i) => setTimeout(() => el.classList.add("in"), 80 + i * 100));

    const cleanFaq = setupFaq();

    return () => {
      io.disconnect();
      cleanFaq();
    };
  }, []);

  // Cursor, parallax, magnetic — desktop pointer only
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    // Skip all motion effects on touch/coarse devices or reduced-motion
    if (!fine || reduced) return;

    // Hero glow follows cursor — subtle parallax
    const hero = document.querySelector<HTMLElement>(".hero");
    const glow = document.querySelector<HTMLElement>(".hero-glow");
    const onHeroMove = (e: MouseEvent) => {
      if (!hero || !glow) return;
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      glow.style.transform = `translate(${x * -40}px,${y * -28}px)`;
    };
    const onHeroLeave = () => { if (glow) glow.style.transform = ""; };
    hero?.addEventListener("mousemove", onHeroMove);
    hero?.addEventListener("mouseleave", onHeroLeave);

    // Custom cursor — dot snaps, ring lerps
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    let mx = 0, my = 0, rx = 0, ry = 0, rafId = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dot) dot.style.transform = `translate(${mx}px,${my}px)`;
    };
    const animRing = () => {
      const dx = mx - rx, dy = my - ry;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        rx += dx * 0.12; ry += dy * 0.12;
        if (ring) ring.style.transform = `translate(${rx}px,${ry}px)`;
      }
      rafId = requestAnimationFrame(animRing);
    };
    rafId = requestAnimationFrame(animRing);
    document.addEventListener("mousemove", onMove);

    const onEnter = () => { dot?.classList.add("hovered"); ring?.classList.add("hovered"); };
    const onLeave = () => { dot?.classList.remove("hovered"); ring?.classList.remove("hovered"); };
    const targets = document.querySelectorAll("a, button");
    targets.forEach(el => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    // Magnetic pull on large primary CTAs — restrained factor
    const magnets = Array.from(document.querySelectorAll<HTMLElement>(".btn-primary.btn-lg"));
    const mHandlers: Array<[HTMLElement, (e: Event) => void, () => void]> = [];
    magnets.forEach(btn => {
      const move = (e: Event) => {
        const me = e as MouseEvent;
        const r = btn.getBoundingClientRect();
        const dx = (me.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (me.clientY - (r.top + r.height / 2)) * 0.18;
        btn.style.transform = `translate(${dx}px,${dy}px)`;
      };
      const leave = () => { btn.style.transform = ""; };
      btn.addEventListener("mousemove", move);
      btn.addEventListener("mouseleave", leave);
      mHandlers.push([btn, move, leave]);
    });

    return () => {
      hero?.removeEventListener("mousemove", onHeroMove);
      hero?.removeEventListener("mouseleave", onHeroLeave);
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      targets.forEach(el => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
      mHandlers.forEach(([btn, move, leave]) => {
        btn.removeEventListener("mousemove", move);
        btn.removeEventListener("mouseleave", leave);
      });
    };
  }, []);
}

function setupFaq(): () => void {
  const handlers: Array<[Element, () => void]> = [];
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    if (!q) return;
    const toggle = () => item.classList.toggle("open");
    q.addEventListener("click", toggle);
    handlers.push([q, toggle]);
  });
  return () => handlers.forEach(([q, fn]) => q.removeEventListener("click", fn));
}
